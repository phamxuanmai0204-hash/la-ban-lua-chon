export interface SchoolClassOption {
  id: string;
  label: string;
}

export const SCHOOL_CLASSES: SchoolClassOption[] = [
  { id: "9A1", label: "Lớp 9A1" },
  { id: "9A2", label: "Lớp 9A2" },
  { id: "9A3", label: "Lớp 9A3" },
  { id: "9A4", label: "Lớp 9A4" },
];

export const SCHOOL_CLASS_IDS = SCHOOL_CLASSES.map((c) => c.id);

export const DEFAULT_CLASS_ID = "9A1";

/** Mã PIN phụ huynh mặc định của toàn bộ học sinh mẫu / dữ liệu trải nghiệm. */
export const DEMO_PARENT_PIN = "1234";

export const MAX_CHILDREN_PER_PARENT = 3;

export function schoolClassLabel(id: string): string {
  return SCHOOL_CLASSES.find((c) => c.id === id)?.label ?? `Lớp ${id}`;
}

export function isValidClassId(id: string): boolean {
  return SCHOOL_CLASS_IDS.includes(id);
}

export interface RosterStudent {
  /** Mã hồ sơ dùng khi liên kết: id học sinh mẫu, hoặc "acc:<id tài khoản>" */
  id: string;
  displayName: string;
  source: "demo" | "account";
}

export interface RosterClass {
  id: string;
  label: string;
  students: RosterStudent[];
}

export interface SchoolRoster {
  classes: RosterClass[];
  demoPin: string;
}

export interface SchoolStats {
  teachers: number;
  students: number;
  parents: number;
  schoolAdmins: number;
  classCounts: Record<string, number>;
}
