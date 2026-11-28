export type Role = "student" | "teacher" | "parent";

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

export type InterestQuizOptionTag =
  | "R"
  | "I"
  | "A"
  | "S_holland"
  | "E_holland"
  | "C"
  | "E"
  | "I_mbti"
  | "S_mbti"
  | "N"
  | "T"
  | "F"
  | "J"
  | "P";

export type MbtiLetter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

export interface InterestQuizOption {
  key: "A" | "B";
  text: string;
  tag: InterestQuizOptionTag;
}

export interface InterestQuizQuestion {
  id: string;
  prompt: string;
  options: [InterestQuizOption, InterestQuizOption];
}

export interface InterestQuizAnswer {
  questionId: string;
  choice: "A" | "B";
  tag: InterestQuizOptionTag;
}

export interface InterestQuizScores {
  holland: Record<HollandGroupId, number>;
  mbti: Record<MbtiLetter, number>;
}

export interface InterestQuizAnalysis {
  personality: string;
  interests: string;
  environment: string;
  source: "ai" | "fallback";
  generatedAt: string;
}

export interface InterestQuizResult {
  version: 1;
  completedAt: string;
  answers: InterestQuizAnswer[];
  scores: InterestQuizScores;
  hollandTop: HollandGroupId[];
  mbtiType: string;
  mbtiDetail: {
    EI: MbtiLetter;
    SN: MbtiLetter;
    TF: MbtiLetter;
    JP: MbtiLetter;
  };
  summaryText: string;
  analysis: InterestQuizAnalysis;
}

export interface Profile {
  abilitiesTeacherNote: string;
  abilitiesStudentSelf: string;
  hollandSelectedIds: string[];
  hollandSummaryText: string;
  interestQuiz?: InterestQuizResult;
  conditions: {
    commuteDistance: string;
    familyFinance: string;
    healthNote: string;
    otherConditions: string;
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
  studentFullName: string;
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

export interface StudentSummaryTryScenario {
  pathwayTitle: string;
  chosenPathLabels: string[];
  reflection: string;
  date: string;
}

export interface StudentSummaryTryActivity {
  title: string;
  activityType: string;
  dateLabel: string;
  location: string;
  status: string;
}

export interface StudentSummaryTryJournal {
  date: string;
  activityType: string;
  pathwayTitle?: string;
  content: string;
  reflection3Q?: JournalReflection3Q;
}

export interface StudentSummaryTryDetails {
  scenarioReflections: StudentSummaryTryScenario[];
  activities: StudentSummaryTryActivity[];
  journalEntries: StudentSummaryTryJournal[];
  reflection3QCount: number;
  /** Đối chiếu dữ liệu THỬ với tiêu chí LỌC và lựa chọn CHỐT */
  crossCheck: string;
}

export interface StudentSummary {
  generatedAt: string;
  sentToTeacherAt: string;
  sentToParentAt: string | null;
  identity: {
    fullName: string;
    className: string;
    parentContact: string;
    teacherContact: string;
    completedAt: string;
  };
  selfProfile: {
    strengths: string;
    teacherNote: string;
    holland: string;
    mbti?: string;
    interestAnalysis?: {
      personality: string;
      interests: string;
      environment: string;
      source: "ai" | "fallback";
      completedAt: string;
    };
    conditions: string;
    fluctuation: string;
  };
  steps: {
    thu: string;
    loc: string;
    thuTry: string;
    tryDetails?: StudentSummaryTryDetails;
    chot: string;
    camKet: string;
  };
  aiInteraction: string;
  readiness: string;
  sendStatus: string;
}

export interface Student {
  id: string;
  fullName: string;
  className: string;
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
  /** Hồ sơ tổng hợp 6 phần do AI biên soạn khi hoàn thành 5 bước */
  summary?: StudentSummary;
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
  /** "shortAnswer" = học sinh tự viết câu trả lời thay vì chọn trắc nghiệm */
  responseMode?: "choices" | "shortAnswer";
  shortAnswerPrompt?: string;
  shortAnswerSuggestions?: string[];
}

export type PathwayCategory =
  | "THPT_CONG_LAP"
  | "THPT_TU_THUC"
  | "GDTX"
  | "TRUNG_CAP"
  | "SO_CAP";

export interface Pathway {
  id: string;
  category: PathwayCategory;
  title: string;
  shortSubtitle: string;
  entryRequirements: string;
  learningContent: string;
  careerOpportunities: string;
  articulationPath: string;
  // Never fabricated: blank by default -> displays "Nhà trường cập nhật"
  realSchoolNames: string;
  realSchoolAddresses: string;
  tuitionEstimate: string;
  admissionCutoff: string;
  imageUrl?: string;
  imageCaption?: string;
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
  /** Nhóm lộ trình được gợi ý hoạt động: THPT hoặc giáo dục nghề nghiệp */
  audience?: "thpt" | "vocational";
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
  studentName: string;
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
  studentName: string;
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
  studentName: string;
  status: ThematicCodeStatus;
  aiGenerated: boolean;
}

export interface Meeting {
  id: string;
  studentId: string;
  studentName: string;
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
}

export interface LinkedChild {
  /** Mã hồ sơ học sinh dạng "acc:<id tài khoản học sinh>" */
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
  /** Học sinh: lớp đang học (luôn là Lớp 9) */
  className?: string;
  /** Học sinh: mã PIN 4 số chia sẻ cho phụ huynh */
  parentPin?: string;
  /** Phụ huynh: liên kết con khi đăng ký */
  childStudentId?: string;
  childPin?: string;
}

export interface LoginAccountInput {
  username: string;
  password: string;
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
