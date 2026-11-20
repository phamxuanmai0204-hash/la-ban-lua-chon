export type Role = "student" | "teacher" | "parent" | "school_admin";

export type JourneyStep = "THU" | "LỌC" | "THỬ" | "CHỐT" | "CAM KẾT";

export type QualitativeLevel =
  | "Hạn chế"
  | "Đang hình thành"
  | "Khá rõ nét"
  | "Vững vàng";

export type CriterionMatch = "Đáp ứng" | "Chưa đáp ứng" | "Chưa rõ";

export type HollandGroupId =
  | "ki_thuat"
  | "nghien_cuu"
  | "nghe_thuat"
  | "xa_hoi"
  | "quan_li"
  | "nghiep_vu";

export interface Profile {
  abilitiesTeacherNote: string;
  abilitiesStudentSelf: string;
  hollandSelectedIds: string[];
  hollandSummaryText: string;
  conditions: {
    commuteDistance: string;
    familyFinance: string;
    earlyIndependence: string;
    healthNote: string;
  };
}

export interface BehaviorSignal {
  changeOptionCount: number;
  addedAfterCommit: boolean;
  abandonedCommitStep: boolean;
  hesitancyPhrasesCount: number;
  recentPhrases: string[];
  hasSensitiveAlert: boolean;
}

export interface Criterion {
  id: string;
  label: string;
}

export interface OptionEvaluation {
  id: string;
  pathwayId: string;
  title: string;
  status: "Đang cân nhắc" | "Tạm gác lại" | "Đã chọn";
  evaluations: Record<string, CriterionMatch>;
}

export interface ActionTask {
  id: string;
  title: string;
  dueDate?: string;
  done: boolean;
}

export interface Commitment {
  studentDisplayCode: string;
  studentNamePlaceholder: string;
  className: string;
  chosenOption: string;
  reasonInOwnWords: string;
  preMortemNote?: string;
  actionPlan: ActionTask[];
  deadlineDate: string;
  studentConfirmedAt: string | null;
  parentConfirmedAt: string | null;
  teacherConfirmedAt: string | null;
}

export interface JournalReflection3Q {
  saw: string;
  felt: string;
  changedMind: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  step?: JourneyStep;
  pathwayId?: string;
  pathwayTitle?: string;
  activityType: string;
  content: string;
  reflection3Q?: JournalReflection3Q;
}

export interface ScenarioReflection {
  id: string;
  pathwayId: string;
  pathwayTitle: string;
  chosenPathLabels: string[];
  reflection: string;
  date: string;
}

export type RubricCriterionKey =
  | "understandingSelf"
  | "understandingPathways"
  | "narrowingOptions"
  | "decidingOnTime"
  | "committingAndActing";

export interface AssessmentLevelMap {
  understandingSelf: QualitativeLevel;
  understandingPathways: QualitativeLevel;
  narrowingOptions: QualitativeLevel;
  decidingOnTime: QualitativeLevel;
  committingAndActing: QualitativeLevel;
  notes?: string;
  evidence?: string;
  criterionEvidence?: Partial<Record<RubricCriterionKey, string>>;
}

export interface Assessment {
  before: AssessmentLevelMap;
  after: AssessmentLevelMap;
  studentSelf: AssessmentLevelMap;
}

export interface Student {
  id: string;
  code: string; // e.g., "HS A", "HS B", "HS 05"
  anonymizedLabel: string; // e.g., "HS 01"
  className: string;
  isCaseStudy?: boolean;
  caseStudySummary?: string;
  isFocusGroup: boolean;
  currentStep: JourneyStep;
  completedSteps?: JourneyStep[];
  shareWithParent: boolean;
  privacyConsentAccepted: boolean;
  privacyConsentAcceptedAt?: string;
  dataDeletionRequestedAt?: string;
  profile: Profile;
  criteria: Criterion[];
  consideredOptions: OptionEvaluation[];
  joinedExperienceIds: string[];
  journal: JournalEntry[];
  scenarioReflections?: ScenarioReflection[];
  commitment: Commitment;
  signals: BehaviorSignal;
  assessment: Assessment;
}

export interface RealStoryLink {
  id: string;
  title: string;
  personDesc: string;
  url: string;
  suggestedQuestions?: string[];
}

export interface CareerScenarioChoice {
  id: string;
  label: string;
  nextNodeId: string | null;
  outcomeNote: string;
}

export interface CareerScenarioNode {
  id: string;
  prompt: string;
  choices: CareerScenarioChoice[];
}

export interface CareerScenario {
  title: string;
  intro: string;
  startNodeId: string;
  nodes: CareerScenarioNode[];
  reflectionPrompt: string;
}

export interface Pathway {
  id: string;
  category:
    | "THPT"
    | "GDTX"
    | "TRUNG_CAP"
    | "SO_CAP"
    | "LIEN_THONG_CD_DH"
    | "DI_LAM";
  title: string;
  shortSubtitle: string;
  entryRequirements: string;
  learningContent: string;
  careerOpportunities: string;
  articulationPath: string;
  // Never fabricated: blank by default -> displays "Nhà trường cập nhật"
  realSchoolNames: string;
  tuitionEstimate: string;
  admissionCutoff: string;
  employmentData: string;
  realStories: RealStoryLink[];
  scenario?: CareerScenario;
}

export interface Experience {
  id: string;
  title: string;
  activityType: string;
  dateLabel: string;
  location: string;
  description: string;
  pathwayId?: string;
}

export type AIMessageStatus =
  | "chờ duyệt"
  | "giữ nguyên"
  | "giáo viên đã sửa"
  | "chuyển tư vấn";

export type AIQuestionType =
  | "doi_chieu_tieu_chi"
  | "phan_tu_cam_xuc"
  | "goi_mo_thong_tin"
  | "dong_vien";

export interface AIMessage {
  id: string;
  studentId: string;
  studentCode: string;
  createdAt: string;
  triggerReason: string;
  studentText: string;
  aiReply: string;
  originalAiReply?: string;
  teacherEditedReply?: string;
  teacherEncouragement?: string;
  nhayCam: boolean;
  dauHieu: string;
  loaiCauHoi?: AIQuestionType;
  layer1Triggered?: boolean;
  layer2Filtered?: boolean;
  layer2Reason?: string;
  status: AIMessageStatus;
  visibleToStudent: boolean;
}

export type AIModerationAction =
  | "tạo mới"
  | "giữ nguyên"
  | "giáo viên đã sửa"
  | "chuyển tư vấn"
  | "thêm lời động viên"
  | "lọc lớp 1"
  | "lọc lớp 2";

export interface AIModerationLog {
  id: string;
  messageId: string;
  studentId: string;
  studentCode: string;
  action: AIModerationAction;
  actor: string;
  timestamp: string;
  studentText: string;
  originalReply: string;
  editedReply?: string;
  reason?: string;
}

export type ThematicCodeStatus = "pending" | "accepted" | "rejected";

export interface ThematicCodeItem {
  id: string;
  theme: string;
  codeLabel: string;
  evidenceQuote: string;
  sourceLabel: string;
  journalId: string;
  studentCode: string;
  status: ThematicCodeStatus;
  aiGenerated: boolean;
}

export interface Meeting {
  id: string;
  studentId: string;
  studentCode: string;
  dateTime: string;
  locationOrChannel: string;
  parentInvited: boolean;
  status: "Đã lên lịch" | "Đã họp";
  keyPoints: string;
  agreedChoice: string;
  nextSteps?: string;
  confirmations?: {
    student?: boolean;
    parent?: boolean;
    teacher?: boolean;
  };
}

export type FontSizeScale = "small" | "medium" | "large";

export interface AppSettings {
  requireTeacherApprovalBeforeDisplay: boolean;
  darkMode: boolean;
  fontSize?: FontSizeScale;
  googleFormSurveyUrl?: string;
}

export interface LinkedChild {
  /** id học sinh mẫu (ví dụ "hs-02") hoặc "acc:<id tài khoản học sinh>" */
  studentId: string;
  className: string;
  displayName: string;
  linkedAt: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  role: Role;
  username: string;
  createdAt: string;
  /** Lớp của tài khoản Học sinh */
  className?: string;
  /** Mã PIN 4 số dành cho phụ huynh (chỉ trả về cho chính tài khoản Học sinh) */
  parentPin?: string;
  /** Danh sách con đã liên kết (chỉ có ở tài khoản Phụ huynh) */
  linkedChildren?: LinkedChild[];
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface RegisterAccountInput {
  fullName: string;
  role: Role;
  username: string;
  password: string;
  confirmPassword: string;
  /** Học sinh: lớp đang học */
  className?: string;
  /** Học sinh: mã PIN 4 số chia sẻ cho phụ huynh */
  parentPin?: string;
  /** Phụ huynh: liên kết con khi đăng ký */
  childClassName?: string;
  childStudentId?: string;
  childPin?: string;
}

export interface LoginAccountInput {
  username: string;
  password: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

export interface AppState {
  schemaVersion: number;
  students: Student[];
  pathways: Pathway[];
  experiences: Experience[];
  aiMessages: AIMessage[];
  aiModerationLogs: AIModerationLog[];
  thematicCodes: ThematicCodeItem[];
  meetings: Meeting[];
  settings: AppSettings;
}
