import { createInitialAppState, createStudentProfile } from "../data/mockData";
import { sanitizeInterestQuiz } from "../data/interestQuiz";
import { DEFAULT_CLASS_ID } from "../data/schoolClasses";
import type {
  AIMessage,
  AIMessageStatus,
  AppState,
  AssessmentLevelMap,
  Student,
  StudentSummary,
} from "../types";

export const CURRENT_SCHEMA_VERSION = 6;
export const MAIN_STATE_KEY = "la_ban_app_state";
const LEGACY_V1_STORAGE_KEY = "la_ban_lua_chon_state_v1";

/**
 * Local cache interface. Dữ liệu dùng chung giữa các thiết bị được đồng bộ
 * qua API máy chủ (xem useWorkspaceSync), không dùng Firestore phía trình duyệt.
 */
export interface StorageService {
  readonly kind: "local";
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  list<T>(prefix: string): Promise<{ key: string; value: T }[]>;
  subscribe<T>(key: string, callback: (value: T | null) => void): () => void;
}

function mapLegacyAIMessageStatus(rawStatus: string): AIMessageStatus {
  switch (rawStatus) {
    case "pending":
    case "chờ duyệt":
      return "chờ duyệt";
    case "approved":
    case "giữ nguyên":
      return "giữ nguyên";
    case "edited":
    case "giáo viên đã sửa":
      return "giáo viên đã sửa";
    case "direct_counseling":
    case "chuyển tư vấn":
      return "chuyển tư vấn";
    default:
      return "chờ duyệt";
  }
}

const JOURNEY_STEPS: Student["currentStep"][] = [
  "THU",
  "LỌC",
  "THỬ",
  "CHỐT",
  "CAM KẾT",
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

/**
 * Bản ghi cũ (trước v5) chứa 45 học sinh mẫu "HS A/HS 01..." — nay xoá hoàn toàn.
 * Chỉ giữ hồ sơ gắn với tài khoản học sinh thật ("acc:<id tài khoản>").
 */
function isAccountStudentId(value: string): boolean {
  return value.startsWith("acc:");
}

function isCompleteStudentSummary(value: unknown): value is StudentSummary {
  const summary = asRecord(value);
  const identity = asRecord(summary.identity);
  const selfProfile = asRecord(summary.selfProfile);
  const steps = asRecord(summary.steps);

  const hasStrings = (record: Record<string, unknown>, keys: string[]) =>
    keys.every((key) => typeof record[key] === "string");

  if (
    !hasStrings(summary, ["generatedAt", "sentToTeacherAt", "aiInteraction", "readiness", "sendStatus"]) ||
    (summary.sentToParentAt !== null &&
      typeof summary.sentToParentAt !== "string") ||
    !hasStrings(identity, [
      "fullName",
      "className",
      "parentContact",
      "teacherContact",
      "completedAt",
    ]) ||
    !hasStrings(selfProfile, [
      "strengths",
      "teacherNote",
      "holland",
      "conditions",
      "fluctuation",
    ]) ||
    !hasStrings(steps, ["thu", "loc", "thuTry", "chot", "camKet"])
  ) {
    return false;
  }

  if (
    selfProfile.mbti !== undefined &&
    typeof selfProfile.mbti !== "string"
  ) {
    return false;
  }

  if (selfProfile.interestAnalysis !== undefined) {
    const analysis = asRecord(selfProfile.interestAnalysis);
    if (
      !hasStrings(analysis, ["personality", "interests", "environment", "completedAt"]) ||
      (analysis.source !== "ai" && analysis.source !== "fallback")
    ) {
      return false;
    }
  }

  if (steps.tryDetails !== undefined) {
    const details = asRecord(steps.tryDetails);
    if (
      !Array.isArray(details.scenarioReflections) ||
      !Array.isArray(details.activities) ||
      !Array.isArray(details.journalEntries) ||
      typeof details.crossCheck !== "string"
    ) {
      return false;
    }
    const validScenario = details.scenarioReflections.every((item) => {
      const record = asRecord(item);
      return (
        hasStrings(record, ["pathwayTitle", "reflection", "date"]) &&
        Array.isArray(record.chosenPathLabels)
      );
    });
    const validActivity = details.activities.every((item) =>
      hasStrings(asRecord(item), [
        "title",
        "activityType",
        "dateLabel",
        "location",
        "status",
      ])
    );
    const validJournal = details.journalEntries.every((item) => {
      const record = asRecord(item);
      if (!hasStrings(record, ["activityType", "date", "content"])) {
        return false;
      }
      if (record.reflection3Q === undefined) return true;
      return hasStrings(asRecord(record.reflection3Q), [
        "saw",
        "felt",
        "changedMind",
      ]);
    });
    if (!validScenario || !validActivity || !validJournal) return false;
  }

  return true;
}

function migrateStudent(item: unknown): Student {
  const s = asRecord(item);
  const id = asString(s.id);
  const fullName = asString(s.fullName, "Học sinh");
  const base = createStudentProfile(id, fullName, DEFAULT_CLASS_ID);

  const profile = asRecord(s.profile);
  const conditions = asRecord(profile.conditions ?? s.conditions);
  const commitment = asRecord(s.commitment);
  const rawAssessment = asRecord(s.assessment);
  const rawSignals = asRecord(s.signals);
  const behavior = asRecord(s.behaviorCounters);

  const currentStep = JOURNEY_STEPS.includes(
    s.currentStep as Student["currentStep"]
  )
    ? (s.currentStep as Student["currentStep"])
    : "THU";

  const before = (rawAssessment.before ??
    s.teacherBeforeRubric ??
    base.assessment.before) as AssessmentLevelMap;
  const after = (rawAssessment.after ??
    s.teacherAfterRubric ??
    base.assessment.after) as AssessmentLevelMap;
  const studentSelf = (rawAssessment.studentSelf ??
    s.studentSelfRubric ??
    base.assessment.studentSelf) as AssessmentLevelMap;

  const joinedIds = Array.isArray(s.joinedExperienceIds)
    ? (s.joinedExperienceIds as string[])
    : Array.isArray(s.joinedTryActivityIds)
    ? (s.joinedTryActivityIds as string[])
    : [];

  const legacyHollandIds = asStringArray(
    profile.hollandSelectedIds ?? s.selectedHollandAnswers
  );

  return {
    ...base,
    ...(s as unknown as Student),
    id,
    fullName,
    className: DEFAULT_CLASS_ID,
    currentStep,
    completedSteps: Array.isArray(s.completedSteps)
      ? (s.completedSteps as Student["completedSteps"])
      : [],
    shareWithParent: asBoolean(s.shareWithParent, base.shareWithParent),
    privacyConsentAccepted: asBoolean(
      s.privacyConsentAccepted,
      base.privacyConsentAccepted
    ),
    privacyConsentAcceptedAt:
      typeof s.privacyConsentAcceptedAt === "string"
        ? s.privacyConsentAcceptedAt
        : base.privacyConsentAcceptedAt,
    dataDeletionRequestedAt:
      typeof s.dataDeletionRequestedAt === "string"
        ? s.dataDeletionRequestedAt
        : undefined,
    profile: {
      ...base.profile,
      ...profile,
      abilitiesTeacherNote: asString(
        profile.abilitiesTeacherNote,
        asString(s.teacherAbilityNote, base.profile.abilitiesTeacherNote)
      ),
      abilitiesStudentSelf: asString(
        profile.abilitiesStudentSelf,
        asString(s.studentAbilityNote, base.profile.abilitiesStudentSelf)
      ),
      hollandSelectedIds: legacyHollandIds,
      hollandSummaryText: asString(
        profile.hollandSummaryText,
        base.profile.hollandSummaryText
      ),
      interestQuiz: sanitizeInterestQuiz(profile.interestQuiz),
      conditions: {
        commuteDistance: asString(conditions.commuteDistance),
        familyFinance: asString(conditions.familyFinance),
        healthNote: asString(conditions.healthNote),
        otherConditions: asString(conditions.otherConditions),
      },
    },
    criteria: Array.isArray(s.criteria)
      ? (s.criteria as Student["criteria"])
      : [],
    consideredOptions: Array.isArray(s.consideredOptions)
      ? (s.consideredOptions as Student["consideredOptions"])
      : [],
    joinedExperienceIds: joinedIds,
    journal: Array.isArray(s.journal)
      ? (s.journal as Student["journal"])
      : [],
    scenarioReflections: Array.isArray(s.scenarioReflections)
      ? (s.scenarioReflections as Student["scenarioReflections"])
      : [],
    commitment: {
      ...base.commitment,
      ...commitment,
      studentFullName: fullName,
      className: DEFAULT_CLASS_ID,
      chosenOption: asString(
        commitment.chosenOption,
        asString(
          commitment.chosenOptionLabel,
          base.commitment.chosenOption
        )
      ),
      reasonInOwnWords: asString(
        commitment.reasonInOwnWords,
        base.commitment.reasonInOwnWords
      ),
      actionPlan: Array.isArray(commitment.actionPlan)
        ? (commitment.actionPlan as Student["commitment"]["actionPlan"])
        : [],
    },
    signals: {
      ...base.signals,
      ...rawSignals,
      changeOptionCount: asNumber(
        rawSignals.changeOptionCount,
        asNumber(behavior.changeOptionCount, 0)
      ),
      addedAfterCommit: asBoolean(
        rawSignals.addedAfterCommit,
        asBoolean(behavior.addedAfterCommit, false)
      ),
      abandonedCommitStep: asBoolean(
        rawSignals.abandonedCommitStep,
        asBoolean(behavior.abandonedCommitStep, false)
      ),
      hesitancyPhrasesCount: asNumber(
        rawSignals.hesitancyPhrasesCount,
        asNumber(behavior.hesitancyPhrasesCount, 0)
      ),
      recentPhrases: asStringArray(
        rawSignals.recentPhrases ?? behavior.recentPhrases
      ),
      hasSensitiveAlert: asBoolean(
        rawSignals.hasSensitiveAlert,
        asBoolean(behavior.hasSensitiveAlert, false)
      ),
    },
    assessment: {
      before: {
        ...base.assessment.before,
        ...asRecord(before),
      } as AssessmentLevelMap,
      after: {
        ...base.assessment.after,
        ...asRecord(after),
      } as AssessmentLevelMap,
      studentSelf: {
        ...base.assessment.studentSelf,
        ...asRecord(studentSelf),
      } as AssessmentLevelMap,
    },
    summary: isCompleteStudentSummary(s.summary) ? s.summary : undefined,
  };
}

/**
 * Migrates any legacy/partial state to the current AppState without the old
 * demo roster. Hồ sơ không gắn tài khoản bị loại bỏ hoàn toàn.
 */
export function migrateAppState(raw: unknown): AppState {
  const baseline = createInitialAppState();
  if (!raw || typeof raw !== "object") {
    return baseline;
  }

  const record = raw as Record<string, unknown>;
  const version =
    typeof record.schemaVersion === "number" ? record.schemaVersion : 1;

  const rawStudents = Array.isArray(record.students) ? record.students : [];
  const migratedStudents: Student[] = rawStudents
    .map((item) => asRecord(item))
    .filter((item) => isAccountStudentId(asString(item.id)))
    .map((item) => migrateStudent(item));

  const keptStudentIds = new Set(migratedStudents.map((s) => s.id));
  const belongsToKeptStudent = (value: unknown) =>
    keptStudentIds.has(asString(value));

  const rawMessages = Array.isArray(record.aiMessages) ? record.aiMessages : [];
  const migratedMessages: AIMessage[] = rawMessages
    .map((msg) => msg as Record<string, unknown>)
    .filter((m) => belongsToKeptStudent(m.studentId))
    .map((m) => ({
      ...(m as unknown as AIMessage),
      status: mapLegacyAIMessageStatus(String(m.status || "chờ duyệt")),
    }));

  const rawExperiences = Array.isArray(record.experiences)
    ? record.experiences
    : Array.isArray(record.tryActivities)
    ? record.tryActivities
    : [];

  // Nội dung thẻ lộ trình là dữ liệu tham chiếu cố định: luôn lấy bản mới nhất
  // thay vì bản sao đã lưu trong localStorage của từng thiết bị.
  const migratedPathways = baseline.pathways;

  // Hoạt động trải nghiệm do nhà trường cung cấp cũng cần luôn được cập nhật;
  // giữ lại các hoạt động bổ sung (nếu có) không trùng mã với dữ liệu gốc.
  const baselineExperienceIds = new Set(
    baseline.experiences.map((item) => item.id)
  );
  const migratedExperiences: AppState["experiences"] = [
    ...baseline.experiences,
    ...(rawExperiences as AppState["experiences"]).filter(
      (item) => item && !baselineExperienceIds.has(item.id)
    ),
  ];

  const rawSettings =
    record.settings && typeof record.settings === "object"
      ? (record.settings as AppState["settings"])
      : baseline.settings;

  return {
    schemaVersion: Math.max(CURRENT_SCHEMA_VERSION, version),
    students: migratedStudents,
    pathways: migratedPathways,
    experiences: migratedExperiences,
    aiMessages: migratedMessages,
    aiModerationLogs: Array.isArray(record.aiModerationLogs)
      ? (record.aiModerationLogs as AppState["aiModerationLogs"]).filter((log) =>
          belongsToKeptStudent(log.studentId)
        )
      : baseline.aiModerationLogs,
    thematicCodes: Array.isArray(record.thematicCodes)
      ? (record.thematicCodes as AppState["thematicCodes"])
      : baseline.thematicCodes,
    meetings: Array.isArray(record.meetings)
      ? (record.meetings as AppState["meetings"]).filter((meeting) =>
          belongsToKeptStudent(meeting.studentId)
        )
      : baseline.meetings,
    settings: {
      ...baseline.settings,
      ...rawSettings,
      fontSize: rawSettings.fontSize || "medium",
    },
  };
}

/**
 * LocalStorage implementation of StorageService.
 */
export class LocalStorageAdapter implements StorageService {
  readonly kind = "local" as const;
  private prefix = "la_ban_v2:";
  private listeners = new Map<string, Set<(value: unknown) => void>>();

  private fullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(this.fullKey(key));
      if (raw) {
        return JSON.parse(raw) as T;
      }
      // Check legacy v1 key when reading the main app state
      if (key === MAIN_STATE_KEY) {
        const legacyRaw = localStorage.getItem(LEGACY_V1_STORAGE_KEY);
        if (legacyRaw) {
          const parsedLegacy = JSON.parse(legacyRaw);
          const migrated = migrateAppState(parsedLegacy);
          await this.set(key, migrated);
          return migrated as unknown as T;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.fullKey(key), JSON.stringify(value));
      const subs = this.listeners.get(key);
      if (subs) {
        subs.forEach((cb) => cb(value));
      }
    } catch {
      // Ignore quota errors in restricted environments
    }
  }

  async list<T>(prefix: string): Promise<{ key: string; value: T }[]> {
    const results: { key: string; value: T }[] = [];
    const targetPrefix = this.fullKey(prefix);
    for (let i = 0; i < localStorage.length; i++) {
      const full = localStorage.key(i);
      if (full && full.startsWith(targetPrefix)) {
        const shortKey = full.slice(this.prefix.length);
        const val = await this.get<T>(shortKey);
        if (val !== null) {
          results.push({ key: shortKey, value: val });
        }
      }
    }
    return results;
  }

  subscribe<T>(key: string, callback: (value: T | null) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    const set = this.listeners.get(key)!;
    const wrapped = (val: unknown) => callback(val as T | null);
    set.add(wrapped);

    const onStorage = (ev: StorageEvent) => {
      if (ev.key === this.fullKey(key)) {
        try {
          callback(ev.newValue ? (JSON.parse(ev.newValue) as T) : null);
        } catch {
          callback(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      set.delete(wrapped);
      window.removeEventListener("storage", onStorage);
    };
  }
}

export const localBackupStorage = new LocalStorageAdapter();
