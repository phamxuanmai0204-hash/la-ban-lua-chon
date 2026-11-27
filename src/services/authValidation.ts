import type { RegisterAccountInput, Role } from "../types";

export type AuthField =
  | "fullName"
  | "role"
  | "username"
  | "password"
  | "confirmPassword"
  | "parentPin"
  | "childStudentId"
  | "childPin"
  | "form";

export interface AuthValidationIssue {
  field: AuthField;
  message: string;
}

/** Vai trò được phép tự đăng ký. Tài khoản Giáo viên chủ nhiệm do nhà trường cấp sẵn. */
export const AUTH_ROLES: Role[] = ["student", "parent"];

export const HOMEROOM_TEACHER_USERNAME = "CoThuy912";

export const ROLE_LABELS: Record<Role, string> = {
  student: "Học sinh",
  parent: "Phụ huynh",
  teacher: "Giáo viên",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  student: "Tự soi chiếu bản thân, đi qua 5 bước; mã PIN kết nối phụ huynh được tạo tự động",
  parent: "Liên kết với con bằng mã PIN để đồng hành đúng dữ liệu con chia sẻ",
  teacher: "Theo dõi học sinh trong lớp 9, duyệt phản hồi AI và tổ chức họp ba bên",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;
const PIN_PATTERN = /^\d{4}$/;

export function normalizeUsername(value: string): string {
  return value.trim();
}

/** Bỏ khoảng trắng thừa hai đầu mật khẩu trước khi lưu/kiểm tra. */
export function normalizePassword(value: string): string {
  return value.trim();
}

export function usernameKey(value: string): string {
  return value.trim().toLowerCase();
}

export function formatUsernameError(value: string): string {
  if (!value.trim()) {
    return "Vui lòng nhập tên đăng nhập hoặc email.";
  }
  const normalized = normalizeUsername(value);
  if (normalized.length > 64) {
    return "Tên đăng nhập hoặc email quá dài (tối đa 64 kí tự).";
  }
  if (normalized.includes("@")) {
    return EMAIL_PATTERN.test(normalized)
      ? ""
      : "Email chưa đúng định dạng, ví dụ: tenban@truong.edu.vn.";
  }
  return USERNAME_PATTERN.test(normalized)
    ? ""
    : "Tên đăng nhập cần 3–32 kí tự: chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới.";
}

export function formatFullNameError(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return "Vui lòng nhập họ và tên.";
  }
  if (normalized.length < 2) {
    return "Họ và tên cần ít nhất 2 kí tự.";
  }
  if (normalized.length > 60) {
    return "Họ và tên dài quá 60 kí tự.";
  }
  if (!/[\p{L}]/u.test(normalized)) {
    return "Họ và tên cần chứa chữ cái.";
  }
  return "";
}

export function formatPasswordError(value: string): string {
  const normalized = normalizePassword(value);
  if (!normalized) {
    return "Vui lòng nhập mật khẩu.";
  }
  if (normalized.length < 6) {
    return "Mật khẩu cần ít nhất 6 kí tự.";
  }
  if (normalized.length > 72) {
    return "Mật khẩu dài quá 72 kí tự.";
  }
  return "";
}

export function formatConfirmPasswordError(
  password: string,
  confirmPassword: string
): string {
  if (!confirmPassword.trim()) {
    return "Vui lòng nhập lại mật khẩu để xác nhận.";
  }
  return normalizePassword(password) === normalizePassword(confirmPassword)
    ? ""
    : "Mật khẩu xác nhận chưa khớp. Vui lòng nhập lại.";
}

export function formatPinError(pin: string, subject = "mã PIN phụ huynh"): string {
  if (!pin.trim()) {
    return `Vui lòng nhập ${subject} gồm 4 chữ số.`;
  }
  return PIN_PATTERN.test(pin.trim())
    ? ""
    : `${subject.charAt(0).toUpperCase() + subject.slice(1)} phải gồm đúng 4 chữ số.`;
}

export function validateRegisterInput(
  input: RegisterAccountInput
): AuthValidationIssue | null {
  const fullNameError = formatFullNameError(input.fullName);
  if (fullNameError) return { field: "fullName", message: fullNameError };

  if (input.role === "teacher") {
    return {
      field: "role",
      message:
        "Tài khoản Giáo viên chủ nhiệm đã được nhà trường cấp sẵn. Vui lòng dùng mục Đăng nhập với tài khoản được cấp.",
    };
  }

  if (!AUTH_ROLES.includes(input.role)) {
    return { field: "role", message: "Vui lòng chọn vai trò của bạn." };
  }

  if (input.role === "parent") {
    if (!input.childStudentId) {
      return {
        field: "childStudentId",
        message: "Vui lòng chọn họ tên con trong danh sách học sinh đã đăng ký.",
      };
    }
    const pinError = formatPinError(input.childPin ?? "", "mã PIN của con");
    if (pinError) return { field: "childPin", message: pinError };
  }

  const usernameError = formatUsernameError(input.username);
  if (usernameError) return { field: "username", message: usernameError };

  const passwordError = formatPasswordError(input.password);
  if (passwordError) return { field: "password", message: passwordError };

  const confirmError = formatConfirmPasswordError(
    input.password,
    input.confirmPassword
  );
  if (confirmError) return { field: "confirmPassword", message: confirmError };

  return null;
}

export function validateLoginInput(input: {
  username: string;
  password: string;
}): AuthValidationIssue | null {
  if (!input.username.trim()) {
    return {
      field: "username",
      message: "Vui lòng nhập tên đăng nhập hoặc email.",
    };
  }
  if (!input.password.trim()) {
    return { field: "password", message: "Vui lòng nhập mật khẩu." };
  }
  return null;
}
