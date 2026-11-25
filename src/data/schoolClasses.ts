export interface SchoolClassOption {
  id: string;
  label: string;
}

export const SCHOOL_CLASSES: SchoolClassOption[] = [
  { id: "9", label: "Lớp 9" },
];

export const SCHOOL_CLASS_IDS = SCHOOL_CLASSES.map((c) => c.id);

export const DEFAULT_CLASS_ID = "9";

export const MAX_CHILDREN_PER_PARENT = 3;

export function schoolClassLabel(id: string): string {
  return SCHOOL_CLASSES.find((c) => c.id === id)?.label ?? "Lớp 9";
}

/** Chỉ còn một khối lớp duy nhất; tài khoản cũ ghi 9A1/9A2... được quy về "9". */
export function normalizeClassId(): string {
  return DEFAULT_CLASS_ID;
}

export function isValidClassId(id: string): boolean {
  return SCHOOL_CLASS_IDS.includes(id);
}

export interface RosterStudent {
  /** id học sinh: "acc:<id tài khoản>" */
  id: string;
  fullName: string;
  source: "account";
}

export interface RosterClass {
  id: string;
  label: string;
  students: RosterStudent[];
}

export interface SchoolRoster {
  classes: RosterClass[];
}
