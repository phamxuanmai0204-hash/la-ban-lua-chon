import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Map,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { CompassLogo } from "./CompassLogo";
import { PWAInstallButton } from "./PWAInstallButton";
import {
  loginAccount,
  registerAccount,
  AuthError,
  buildLocalRoster,
} from "../services/auth";
import {
  AUTH_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  formatConfirmPasswordError,
  formatFullNameError,
  formatPasswordError,
  formatPinError,
  formatUsernameError,
  validateLoginInput,
  type AuthField,
} from "../services/authValidation";
import {
  DEMO_PARENT_PIN,
  MAX_CHILDREN_PER_PARENT,
  SCHOOL_CLASSES,
  schoolClassLabel,
  type SchoolRoster,
} from "../data/schoolClasses";
import type { AuthSession, Role, Student } from "../types";

type AuthMode = "login" | "register";

interface AuthScreenProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onAuthenticated: (session: AuthSession, savedOffline: boolean) => void;
  onQuickDemo: () => void;
  onOpenProjectIntro: () => void;
  students: Student[];
  roster: SchoolRoster | null;
}

const ROLE_ICONS: Record<Role, React.FC<{ className?: string }>> = {
  student: GraduationCap,
  teacher: UserCheck,
  parent: Users,
  school_admin: Building2,
};

const ROLE_ACTIVE_STYLES: Record<Role, string> = {
  student:
    "border-[#133C42] bg-[#B3DEE2]/45 dark:bg-[#B3DEE2]/15 dark:border-[#B3DEE2]",
  teacher:
    "border-[#223A1E] bg-[#EAF2D7]/80 dark:bg-[#EAF2D7]/15 dark:border-[#EAF2D7]",
  parent:
    "border-[#4A1A2C] bg-[#EFCFE3]/60 dark:bg-[#EFCFE3]/15 dark:border-[#EFCFE3]",
  school_admin:
    "border-[#7A5C1E] bg-[#F3E7C9]/70 dark:bg-[#F3E7C9]/10 dark:border-[#F3E7C9]",
};

const INPUT_CLASS =
  "w-full min-h-[46px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] py-2.5 text-sm text-[#1D242B] dark:text-[#EDF2F7] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E27396] focus:border-transparent transition-shadow";

export const AuthScreen: React.FC<AuthScreenProps> = ({
  darkMode,
  onToggleDarkMode,
  onAuthenticated,
  onQuickDemo,
  onOpenProjectIntro,
  students,
  roster,
}) => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [busy, setBusy] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [studentClass, setStudentClass] = useState(SCHOOL_CLASSES[0].id);
  const [childClass, setChildClass] = useState(SCHOOL_CLASSES[0].id);
  const [childStudentId, setChildStudentId] = useState("");
  const [childPin, setChildPin] = useState("");

  const effectiveRoster = roster ?? buildLocalRoster(students);
  const childClassOptions = effectiveRoster.classes;
  const childCandidates =
    childClassOptions.find((item) => item.id === childClass)?.students ?? [];

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<AuthField, string>>
  >({});
  const [formError, setFormError] = useState("");

  const clearError = (field: AuthField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (formError) setFormError("");
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setFieldErrors({});
    setFormError("");
  };

  const handleAuthFailure = (err: unknown) => {
    if (err instanceof AuthError) {
      setFormError(err.message);
      if (err.field && err.field !== "form") {
        setFieldErrors((prev) => ({ ...prev, [err.field!]: err.message }));
      }
      return;
    }
    setFormError(
      "Có lỗi không mong muốn khi kết nối. Vui lòng thử lại sau ít phút."
    );
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const issue = validateLoginInput({
      username: loginUsername,
      password: loginPassword,
    });
    if (issue) {
      setFieldErrors({ [issue.field]: issue.message });
      setFormError("");
      return;
    }

    setBusy(true);
    setFormError("");
    setFieldErrors({});
    try {
      const result = await loginAccount({
        username: loginUsername,
        password: loginPassword,
      });
      onAuthenticated(result.session, result.savedOffline);
    } catch (err) {
      handleAuthFailure(err);
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const nextErrors: Partial<Record<AuthField, string>> = {};
    const fullNameError = formatFullNameError(fullName);
    if (fullNameError) nextErrors.fullName = fullNameError;
    if (role === "parent") {
      if (!childStudentId) {
        nextErrors.childStudentId = "Vui lòng chọn họ tên con trong lớp đã chọn.";
      }
      const childPinError = formatPinError(childPin, "mã PIN của con");
      if (childPinError) nextErrors.childPin = childPinError;
    }
    const usernameError = formatUsernameError(registerUsername);
    if (usernameError) nextErrors.username = usernameError;
    const passwordError = formatPasswordError(registerPassword);
    if (passwordError) nextErrors.password = passwordError;
    const confirmError = formatConfirmPasswordError(
      registerPassword,
      confirmPassword
    );
    if (confirmError) nextErrors.confirmPassword = confirmError;

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError("Vui lòng kiểm tra lại các thông tin được đánh dấu.");
      return;
    }

    setBusy(true);
    setFormError("");
    setFieldErrors({});
    try {
      const result = await registerAccount({
        fullName,
        role,
        username: registerUsername,
        password: registerPassword,
        confirmPassword,
        className: role === "student" ? studentClass : undefined,
        childClassName: role === "parent" ? childClass : undefined,
        childStudentId: role === "parent" ? childStudentId : undefined,
        childPin: role === "parent" ? childPin : undefined,
      });
      onAuthenticated(result.session, result.savedOffline);
    } catch (err) {
      handleAuthFailure(err);
    } finally {
      setBusy(false);
    }
  };

  const renderFieldError = (field: AuthField) =>
    fieldErrors[field] ? (
      <p
        id={`${field}-error`}
        className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-300"
      >
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>{fieldErrors[field]}</span>
      </p>
    ) : null;

  return (
    <div className="min-h-screen bg-[#FAFBFD] dark:bg-[#0F171E] text-[#1D242B] dark:text-[#EDF2F7] flex flex-col">
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#17222C]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <CompassLogo size={28} />
            <span className="text-base sm:text-lg font-bold tracking-tight">
              La Bàn Lựa Chọn
            </span>
          </div>
          <div className="flex items-center gap-2">
            <PWAInstallButton compact />
            <button
              type="button"
              onClick={onOpenProjectIntro}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Giới thiệu dự án</span>
            </button>
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={
                darkMode
                  ? "Chuyển sang giao diện sáng"
                  : "Chuyển sang giao diện tối"
              }
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <section className="lg:col-span-5 space-y-6">
          <p className="text-xs sm:text-sm font-medium text-[#9D2950] dark:text-[#EA9AB2]">
            Hệ thống hỗ trợ ra quyết định hướng nghiệp cho học sinh lớp 9
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Mỗi hành trình bắt đầu từ một tài khoản của riêng em
          </h1>
          <blockquote className="font-editorial italic text-base sm:text-lg text-slate-700 dark:text-slate-200 bg-[#EAF2D7]/65 dark:bg-[#EAF2D7]/10 border border-[#EAF2D7] dark:border-slate-700 rounded-2xl p-5">
            &ldquo;La bàn không đi thay người đi đường. Nó giúp em biết mình đang
            ở đâu và nên hướng về phía nào.&rdquo;
          </blockquote>

          <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-[#133C42] dark:text-[#B3DEE2]" />
              <span>
                Không chấm điểm, không xếp hạng. Hồ sơ học sinh luôn được ẩn
                danh.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Compass className="w-4 h-4 mt-0.5 shrink-0 text-[#9D2950] dark:text-[#EA9AB2]" />
              <span>
                Đồng hành qua 5 bước Thu – Lọc – Thử – Chốt – Cam kết, đúng vai
                trò của em.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-[#4A1A2C] dark:text-[#EFCFE3]" />
              <span>
                Trợ lí AI chỉ đặt câu hỏi gợi mở, giúp em tự viết nên lựa chọn
                của mình.
              </span>
            </li>
          </ul>

          <div className="hidden lg:block rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#EFCFE3]/30 dark:bg-[#17222C]">
            {!imageFailed ? (
              <img
                src="/src/assets/images/hero_compass_journey_1795160462582.jpg"
                alt="Minh họa chiếc la bàn và bản đồ hành trình hướng nghiệp sau lớp 9"
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
                className="w-full h-44 object-cover"
              />
            ) : (
              <div className="h-44 flex flex-col items-center justify-center gap-2 text-center p-6">
                <Compass className="w-10 h-10 text-[#E27396]" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Hành trình 5 bước: Thu – Lọc – Thử – Chốt – Cam kết
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-7">
          <div className="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C] shadow-sm p-5 sm:p-8">
            <div
              role="tablist"
              aria-label="Chọn hình thức truy cập"
              className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#F1F4F8] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                onClick={() => switchMode("login")}
                className={`min-h-[44px] rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  mode === "login"
                    ? "bg-white dark:bg-[#17222C] text-[#1D242B] dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-[#1D242B] dark:hover:text-white"
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "register"}
                onClick={() => switchMode("register")}
                className={`min-h-[44px] rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  mode === "register"
                    ? "bg-white dark:bg-[#17222C] text-[#1D242B] dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-[#1D242B] dark:hover:text-white"
                }`}
              >
                Đăng ký tài khoản mới
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4" noValidate>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    Chào mừng em quay lại
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Đăng nhập để tiếp tục đúng hành trình của vai trò em đã chọn.
                  </p>
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-200"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="login-username"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Tên đăng nhập hoặc email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="login-username"
                      type="text"
                      autoComplete="username"
                      value={loginUsername}
                      onChange={(e) => {
                        setLoginUsername(e.target.value);
                        clearError("username");
                      }}
                      aria-invalid={Boolean(fieldErrors.username)}
                      aria-describedby={
                        fieldErrors.username ? "username-error" : undefined
                      }
                      placeholder="Ví dụ: mai.nguyen hoặc mai@truong.edu.vn"
                      className={`${INPUT_CLASS} pl-10 pr-3.5 ${
                        fieldErrors.username
                          ? "border-rose-400 dark:border-rose-500"
                          : ""
                      }`}
                    />
                  </div>
                  {renderFieldError("username")}
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        clearError("password");
                      }}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={
                        fieldErrors.password ? "password-error" : undefined
                      }
                      placeholder="Nhập mật khẩu của em"
                      className={`${INPUT_CLASS} pl-10 pr-12 ${
                        fieldErrors.password
                          ? "border-rose-400 dark:border-rose-500"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      aria-label={
                        showLoginPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                      aria-pressed={showLoginPassword}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-[#1D242B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {renderFieldError("password")}
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full min-h-[48px] rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-60 disabled:cursor-not-allowed text-[#1D1519] font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>{busy ? "Đang kiểm tra..." : "Đăng nhập"}</span>
                </button>

                <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                  Chưa có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="font-semibold text-[#9D2950] dark:text-[#EA9AB2] hover:underline cursor-pointer"
                  >
                    Đăng ký tài khoản mới
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-4" noValidate>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    Tạo tài khoản đồng hành
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Chọn đúng vai trò để ứng dụng mở thẳng không gian làm việc
                    phù hợp với em.
                  </p>
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-200"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="register-fullname"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Họ và tên
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="register-fullname"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        clearError("fullName");
                      }}
                      aria-invalid={Boolean(fieldErrors.fullName)}
                      placeholder="Ví dụ: Nguyễn Thu Mai"
                      className={`${INPUT_CLASS} pl-10 pr-3.5 ${
                        fieldErrors.fullName
                          ? "border-rose-400 dark:border-rose-500"
                          : ""
                      }`}
                    />
                  </div>
                  {renderFieldError("fullName")}
                </div>

                <fieldset>
                  <legend className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Chọn vai trò
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AUTH_ROLES.map((option) => {
                      const Icon = ROLE_ICONS[option];
                      const active = role === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setRole(option);
                            clearError("className");
                            clearError("parentPin");
                            clearError("childClassName");
                            clearError("childStudentId");
                            clearError("childPin");
                          }}
                          className={`relative text-left rounded-xl border px-3 py-2.5 transition-colors cursor-pointer ${
                            active
                              ? ROLE_ACTIVE_STYLES[option]
                              : "border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] hover:border-slate-400 dark:hover:border-slate-600"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold">
                            <Icon className="w-4 h-4" />
                            {ROLE_LABELS[option]}
                            {active && (
                              <CheckCircle2 className="w-4 h-4 ml-auto text-[#133C42] dark:text-[#B3DEE2]" />
                            )}
                          </span>
                          <span className="mt-1 block text-[11px] leading-snug text-slate-600 dark:text-slate-300">
                            {ROLE_DESCRIPTIONS[option]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {role === "student" && (
                  <div className="rounded-2xl border border-[#B3DEE2] dark:border-[#133C42] bg-[#B3DEE2]/20 dark:bg-[#B3DEE2]/5 p-4 space-y-3">
                    <div>
                      <label
                        htmlFor="register-class"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Lớp của em
                      </label>
                      <select
                        id="register-class"
                        value={studentClass}
                        onChange={(e) => {
                          setStudentClass(e.target.value);
                          clearError("className");
                        }}
                        className={`${INPUT_CLASS} px-3.5`}
                      >
                        {SCHOOL_CLASSES.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      {renderFieldError("className")}
                    </div>
                    <p className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <KeyRound className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#133C42] dark:text-[#B3DEE2]" />
                      <span>
                        Hệ thống tự tạo mã PIN 4 số để kết nối với ba mẹ sau khi
                        em đăng ký. Em xem và đổi mã bất cứ lúc nào trong hồ sơ
                        của mình.
                      </span>
                    </p>
                  </div>
                )}

                {role === "parent" && (
                  <fieldset className="rounded-2xl border border-[#EFCFE3] dark:border-[#4A1A2C] bg-[#EFCFE3]/20 dark:bg-[#EFCFE3]/5 p-4 space-y-4">
                    <legend className="px-1.5 text-xs font-semibold text-[#4A1A2C] dark:text-[#EFCFE3]">
                      Liên kết với con
                    </legend>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="register-child-class"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                        >
                          Lớp của con
                        </label>
                        <select
                          id="register-child-class"
                          value={childClass}
                          onChange={(e) => {
                            setChildClass(e.target.value);
                            setChildStudentId("");
                            clearError("childClassName");
                            clearError("childStudentId");
                          }}
                          className={`${INPUT_CLASS} px-3.5`}
                        >
                          {childClassOptions.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                        {renderFieldError("childClassName")}
                      </div>

                      <div>
                        <label
                          htmlFor="register-child"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                        >
                          Họ tên con
                        </label>
                        <select
                          id="register-child"
                          value={childStudentId}
                          onChange={(e) => {
                            setChildStudentId(e.target.value);
                            clearError("childStudentId");
                          }}
                          aria-invalid={Boolean(fieldErrors.childStudentId)}
                          className={`${INPUT_CLASS} px-3.5 ${
                            fieldErrors.childStudentId
                              ? "border-rose-400 dark:border-rose-500"
                              : ""
                          }`}
                        >
                          <option value="">— Chọn họ tên con —</option>
                          {childCandidates.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.displayName}
                              {item.source === "account"
                                ? " (Tài khoản mới)"
                                : ""}
                            </option>
                          ))}
                        </select>
                        {renderFieldError("childStudentId")}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="register-child-pin"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Mã PIN của con
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          id="register-child-pin"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={4}
                          value={childPin}
                          onChange={(e) => {
                            setChildPin(
                              e.target.value.replace(/\D/g, "").slice(0, 4)
                            );
                            clearError("childPin");
                          }}
                          aria-invalid={Boolean(fieldErrors.childPin)}
                          placeholder="4 chữ số do con chia sẻ"
                          className={`${INPUT_CLASS} pl-10 pr-3.5 tracking-[0.3em] ${
                            fieldErrors.childPin
                              ? "border-rose-400 dark:border-rose-500"
                              : ""
                          }`}
                        />
                      </div>
                      {renderFieldError("childPin")}
                    </div>

                    <p className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#9D2950] dark:text-[#EA9AB2]" />
                      <span>
                        Nhập đúng mã PIN của con mới liên kết được hồ sơ; sai
                        mã sẽ bị từ chối. Mỗi tài khoản phụ huynh có thể liên
                        kết tối đa {MAX_CHILDREN_PER_PARENT} con và chuyển đổi
                        nhanh bằng mục &ldquo;Chọn con&rdquo; sau khi đăng nhập.
                        {schoolClassLabel(childClass)} hiện có{" "}
                        {childCandidates.length} học sinh để chọn.
                      </span>
                    </p>
                  </fieldset>
                )}

                <div>
                  <label
                    htmlFor="register-username"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Tên đăng nhập hoặc email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="register-username"
                      type="text"
                      autoComplete="username"
                      value={registerUsername}
                      onChange={(e) => {
                        setRegisterUsername(e.target.value);
                        clearError("username");
                      }}
                      aria-invalid={Boolean(fieldErrors.username)}
                      placeholder="Tên viết liền không dấu hoặc email"
                      className={`${INPUT_CLASS} pl-10 pr-3.5 ${
                        fieldErrors.username
                          ? "border-rose-400 dark:border-rose-500"
                          : ""
                      }`}
                    />
                  </div>
                  {renderFieldError("username")}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="register-password"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        id="register-password"
                        type={showRegisterPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={registerPassword}
                        onChange={(e) => {
                          setRegisterPassword(e.target.value);
                          clearError("password");
                          clearError("confirmPassword");
                        }}
                        aria-invalid={Boolean(fieldErrors.password)}
                        placeholder="Ít nhất 6 kí tự"
                        className={`${INPUT_CLASS} pl-10 pr-12 ${
                          fieldErrors.password
                            ? "border-rose-400 dark:border-rose-500"
                            : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword((v) => !v)}
                        aria-label={
                          showRegisterPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                        }
                        aria-pressed={showRegisterPassword}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-[#1D242B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {renderFieldError("password")}
                  </div>

                  <div>
                    <label
                      htmlFor="register-confirm-password"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        id="register-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          clearError("confirmPassword");
                        }}
                        aria-invalid={Boolean(fieldErrors.confirmPassword)}
                        placeholder="Nhập lại mật khẩu"
                        className={`${INPUT_CLASS} pl-10 pr-12 ${
                          fieldErrors.confirmPassword
                            ? "border-rose-400 dark:border-rose-500"
                            : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={
                          showConfirmPassword
                            ? "Ẩn mật khẩu xác nhận"
                            : "Hiện mật khẩu xác nhận"
                        }
                        aria-pressed={showConfirmPassword}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-[#1D242B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {renderFieldError("confirmPassword")}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full min-h-[48px] rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-60 disabled:cursor-not-allowed text-[#1D1519] font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {busy ? "Đang tạo tài khoản..." : "Tạo tài khoản và bắt đầu"}
                  </span>
                </button>

                <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                  Đã có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-semibold text-[#9D2950] dark:text-[#EA9AB2] hover:underline cursor-pointer"
                  >
                    Đăng nhập
                  </button>
                </p>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Map className="w-4 h-4 shrink-0" />
                <span>
                  Tài khoản được lưu trên máy chủ của trường; khi mất mạng, ứng
                  dụng tiếp tục dùng bản lưu trên thiết bị.
                </span>
              </div>
              <button
                type="button"
                onClick={onQuickDemo}
                className="w-full min-h-[52px] rounded-xl border border-[#133C42]/25 dark:border-[#B3DEE2]/40 bg-[#B3DEE2]/25 dark:bg-[#B3DEE2]/10 hover:bg-[#B3DEE2]/40 dark:hover:bg-[#B3DEE2]/20 px-4 py-3 text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-[#133C42] dark:text-[#B3DEE2]">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  Trải nghiệm nhanh với dữ liệu mẫu (45 học sinh)
                </span>
                <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">
                  Không cần tài khoản: mở ngay cả 4 không gian Học sinh – Phụ
                  huynh – Giáo viên – Quản lý nhà trường với dữ liệu mẫu.
                </span>
                <span className="mt-2 flex items-start gap-1.5 text-xs text-[#9D2950] dark:text-[#EA9AB2]">
                  <KeyRound className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    Học sinh mẫu có mã PIN phụ huynh mặc định{" "}
                    <strong>{DEMO_PARENT_PIN}</strong> — dùng thử liên kết con ở
                    vai Phụ huynh ngay trên màn hình trải nghiệm.
                  </span>
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/70 dark:border-slate-800 py-4">
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 px-4">
          La Bàn Lựa Chọn · Dữ liệu học sinh được ẩn danh · Không chấm điểm,
          không xếp hạng
        </p>
      </footer>
    </div>
  );
};
