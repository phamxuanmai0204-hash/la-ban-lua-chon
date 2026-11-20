export type UserRole = "student" | "teacher" | "parent";

export type JourneyStep = "THU" | "LỌC" | "THỬ" | "CHỐT" | "CAM KẾT";

export type QualitativeLevel = "Hạn chế" | "Đang hình thành" | "Khá rõ nét" | "Vững vàng";

export type HollandGroup =
  | "Kĩ thuật"
  | "Nghiên cứu"
  | "Nghệ thuật"
  | "Xã hội"
  | "Quản lí"
  | "Nghiệp vụ";

export type FilterCellStatus = "Đáp ứng" | "Chưa đáp ứng" | "Chưa rõ";

export interface RealStoryLink {
  id: string;
  title: string;
  alumniRole: string;
  summary: string;
  url: string;
}

export interface PathwayItem {
  id: string;
  title: string;
  shortTitle: string;
  branchType: "thpt" | "gdtx" | "nghe" | "dilam";
  entryCondition: string;
  studyContent: string;
  careerOpportunity: string;
  articulationNote: string;
  schoolNames: string; // Empty/placeholder "Nhà trường cập nhật" by default
  estimatedCost: string; // Empty/placeholder "Nhà trường cập nhật" by default
  admissionReference: string; // Empty/placeholder "Nhà trường cập nhật" by default
  realStories: RealStoryLink[];
}

export interface JournalEntry {
  id: string;
  date: string;
  activityType: string;
  reflection: string;
  aiPromptId?: string;
}

export interface TryActivity {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  description: string;
}

export interface StudentTryRegistration {
  activityId: string;
  status: "Đã đăng kí" | "Đã tham gia";
  reflection?: string;
}

export interface AIReviewItem {
  id: string;
  studentId: string;
  createdAt: string;
  triggerReason: string;
  studentInput: string;
  aiReply: string;
  teacherEditedReply?: string;
  teacherEncouragement?: string;
  nhayCam: boolean;
  dauHieu: string;
  status: "Chờ duyệt" | "Đã giữ nguyên" | "Đã sửa" | "Chuyển tư vấn trực tiếp";
  visibleToStudent: boolean;
  reviewedAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: "student" | "ai";
  text: string;
  createdAt: string;
  reviewId?: string;
  nhayCam?: boolean;
}

export interface ActionTask {
  id: string;
  text: string;
  done: boolean;
}

export interface CommitmentData {
  studentDisplayName: string;
  className: string;
  chosenPathwayId: string;
  chosenOptionLabel: string;
  reasonInOwnWords: string;
  deadlineDate: string;
  actionPlan: ActionTask[];
  studentConfirmedAt?: string;
  parentConfirmedAt?: string;
  teacherConfirmedAt?: string;
}

export interface RubricCriterionScores {
  hieuBanThan: QualitativeLevel;
  hieuLoTrinh: QualitativeLevel;
  thuHepLuaChon: QualitativeLevel;
  chotQuyetDinh: QualitativeLevel;
  camKetHanhDong: QualitativeLevel;
}

export interface StudentRubricRecord {
  beforeTeacher: RubricCriterionScores;
  afterTeacher: RubricCriterionScores;
  teacherNote: string;
  studentSelf?: RubricCriterionScores;
}

export interface StudentProfileData {
  id: string; // Anonymous ID: HS A, HS B, HS C, HS D, HS 05 ... HS 45
  className: string;
  isFocusGroup: boolean; // Nhóm trọng tâm (teacher marked)
  currentStep: JourneyStep;
  hasLockedChoice: boolean;
  shareWithParent: boolean;
  parentReadOnlyNotice?: string;
  storyTag?: string; // e.g., "Trường hợp minh họa chi tiết"
  // Layer 1: Năng lực (verbal only)
  teacherAbilityNote: string;
  studentAbilityNote: string;
  // Layer 2: Hứng thú Holland
  selectedHollandAnswers: string[];
  // Layer 3: Điều kiện
  conditions: {
    travelDistance: string;
    familyFinance: string;
    earlyIndependence: string;
    healthNote: string;
  };
  // Step THU -> Saved options
  consideredOptionIds: string[];
  // Step LỌC -> Criteria & Matrix
  criteria: string[];
  filterMatrix: Record<string, Record<string, FilterCellStatus>>;
  // Step THỬ -> Journal & Try activities
  journal: JournalEntry[];
  tryRegistrations: StudentTryRegistration[];
  // AI Chat history
  chatMessages: ChatMessage[];
  // Step CHỐT & CAM KẾT
  commitment: CommitmentData;
  // Behavioral tracking (for teacher view only, displayed as verbal descriptions)
  behaviorCounters: {
    optionChangesCount: number;
    addedAfterLockCount: number;
    abandonedLockCount: number;
    hesitantPhrasesCount: number;
    sensitiveAlert: boolean;
    customNotes: string[];
  };
  // Qualitative Rubric Assessment
  rubric: StudentRubricRecord;
}

export interface MeetingRecord {
  id: string;
  studentId: string;
  dateTime: string;
  locationOrChannel: string;
  participants: string;
  parentInvited: boolean;
  parentAcknowledged: boolean;
  summaryPoints: string;
  agreedChoice: string;
  nextNotes: string;
}

export interface AppState {
  students: StudentProfileData[];
  pathways: PathwayItem[];
  tryActivities: TryActivity[];
  aiQueue: AIReviewItem[];
  meetings: MeetingRecord[];
  requireTeacherPreApproval: boolean; // Default OFF
  consentAccepted: boolean;
}
