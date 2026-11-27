import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  AuthError,
  createStudentAccount,
  deleteStudentAccount,
  updateStudentAccount,
  type StudentAccountSummary,
} from "../../services/auth";
import { HOMEROOM_TEACHER_USERNAME } from "../../services/authValidation";
import { allStepsCompleted } from "../../utils/studentSummary";
import type { AuthSession, Student } from "../../types";

interface StudentAccountsManagerProps {
  session: AuthSession | null;
  students: Student[];
  accounts: StudentAccountSummary[];
  loading: boolean;
  loadError: string | null;
  onReload: () => void;
  onStudentCreated: (account: StudentAccountSummary) => void;
  onStudentUpdated: (account: StudentAccountSummary) => void;
  onStudentDeleted: (account: StudentAccountSummary) => void;
}

interface AccountFormState {
  fullName: string;
  username: string;
  password: string;
  parentPin: string;
}

const EMPTY_FORM: AccountFormState = {
  fullName: "",
  username: "",
  password: "",
  parentPin: "",
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_ACCENTS = [
  "bg-[#B3DEE2]/70 text-[#133C42]",
  "bg-[#EAF2D7] text-[#223A1E]",
  "bg-[#EFCFE3] text-[#4A1A2C]",
  "bg-[#EA9AB2]/50 text-[#4A1A2C]",
  "bg-[#E27396]/25 text-[#9D2950]",
];

export const StudentAccountsManager: React.FC<
  StudentAccountsManagerProps
> = ({
  session,
  students,
  accounts,
  loading,
  loadError,
  onReload,
  onStudentCreated,
  onStudentUpdated,
  onStudentDeleted,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StudentAccountSummary | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] =
    useState<StudentAccountSummary | null>(null);
  const [notice, setNotice] = useState<{
    tone: "success" | "warning";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  const profileByStudentId = useMemo(() => {
    const map = new Map<string, Student>();
    for (const student of students) map.set(student.id, student);
    return map;
  }, [students]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredAccounts = accounts.filter(
    (account) =>
      !normalizedQuery ||
      account.fullName.toLowerCase().includes(normalizedQuery) ||
      account.username.toLowerCase().includes(normalizedQuery)
  );

  const progressOf = (account: StudentAccountSummary) => {
    const profile = profileByStudentId.get(`acc:${account.id}`);
    if (!profile) {
      return {
        label: "Chưa bắt đầu",
        detail: "Em chưa đăng nhập",
        className:
          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        icon: Clock3,
      };
    }
    if (profile.summary || allStepsCompleted(profile)) {
      return {
        label: "Đã hoàn thành",
        detail: "Đủ 5 bước hành trình",
        className: "bg-[#EAF2D7] text-[#223A1E]",
        icon: CheckCircle2,
      };
    }
    return {
      label: "Đang thực hiện",
      detail: `Đang ở bước ${profile.currentStep}`,
      className: "bg-[#B3DEE2]/70 text-[#133C42]",
      icon: Loader2,
    };
  };

  const completedCount = accounts.filter((account) => {
    const profile = profileByStudentId.get(`acc:${account.id}`);
    return Boolean(profile && (profile.summary || allStepsCompleted(profile)));
  }).length;
  const inProgressCount = accounts.filter((account) => {
    const profile = profileByStudentId.get(`acc:${account.id}`);
    return Boolean(profile && !profile.summary && !allStepsCompleted(profile));
  }).length;

  const handleCopyPin = async (pin: string) => {
    if (!pin) return;
    try {
      await navigator.clipboard.writeText(pin);
      setNotice({ tone: "success", text: `Đã sao chép mã PIN ${pin}.` });
    } catch {
      setNotice({
        tone: "warning",
        text: `Không sao chép được tự động. Mã PIN là ${pin}.`,
      });
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C] overflow-hidden">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#EFCFE3]/55 via-white to-[#B3DEE2]/45 dark:from-[#17222C] dark:via-[#17222C] dark:to-[#17222C] border-b border-slate-200/70 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/80 dark:bg-[#0F171E] border border-[#EA9AB2] flex items-center justify-center text-[#9D2950] dark:text-[#EA9AB2] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">
                Danh sách tài khoản học sinh · Lớp 9
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 max-w-2xl">
                Quản lý tài khoản học sinh do nhà trường cấp: xem tiến độ, mã
                PIN liên kết phụ huynh, tạo mới, chỉnh sửa hoặc xóa tài khoản.
              </p>
              <p className="text-[11px] font-medium text-[#223A1E] dark:text-[#EAF2D7] mt-1">
                Mọi học sinh của lớp tự động liên kết và gửi hồ sơ về giáo viên
                chủ nhiệm {HOMEROOM_TEACHER_USERNAME}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full lg:w-auto shrink-0">
            <div className="rounded-xl bg-white/85 dark:bg-[#0F171E] border border-slate-200 dark:border-slate-700 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Tổng
              </p>
              <p className="text-lg font-bold tabular-nums leading-tight">
                {accounts.length}
              </p>
            </div>
            <div className="rounded-xl bg-[#EAF2D7]/70 border border-[#8FB37C]/50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#223A1E]/80">
                Hoàn thành
              </p>
              <p className="text-lg font-bold tabular-nums leading-tight text-[#223A1E]">
                {completedCount}
              </p>
            </div>
            <div className="rounded-xl bg-[#B3DEE2]/50 border border-[#B3DEE2] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#133C42]/80">
                Đang làm
              </p>
              <p className="text-lg font-bold tabular-nums leading-tight text-[#133C42]">
                {inProgressCount}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo họ tên hoặc tên đăng nhập..."
              aria-label="Tìm tài khoản học sinh"
              className="w-full min-h-[40px] rounded-full border border-slate-200 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] pl-10 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396] focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="min-h-[42px] px-4 py-2 rounded-full bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-sm font-semibold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm tài khoản học sinh</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm font-medium flex items-start gap-2 ${
            notice.tone === "success"
              ? "bg-[#EAF2D7]/70 border-[#8FB37C] text-[#223A1E] dark:bg-[#EAF2D7]/10 dark:border-[#8FB37C]/60 dark:text-[#EAF2D7]"
              : "bg-[#EFCFE3]/60 border-[#EA9AB2] text-[#4A1A2C] dark:bg-[#EFCFE3]/10 dark:border-[#EA9AB2]/60 dark:text-[#EFCFE3]"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{notice.text}</span>
        </div>
      )}

      {loadError && (
        <div className="rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-800 dark:text-rose-200 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {loadError}
          </span>
          <button
            type="button"
            onClick={onReload}
            className="min-h-[34px] px-3 py-1 rounded-full border border-rose-300 dark:border-rose-600 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
          >
            Tải lại
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-[#9D2950] dark:text-[#EA9AB2]" />
            Đang tải danh sách tài khoản...
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#EFCFE3]/60 text-[#9D2950] dark:text-[#EFCFE3] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold">
              Chưa có tài khoản học sinh nào
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Bấm &ldquo;Thêm tài khoản học sinh&rdquo; để cấp tài khoản Lớp 9.
              Hệ thống không tự sinh dữ liệu mẫu.
            </p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-10 text-center space-y-1">
            <p className="text-sm font-semibold">Không tìm thấy tài khoản</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Thầy/cô thử xóa từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 bg-[#FAFBFD] dark:bg-[#0F171E] border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 font-semibold">Học sinh</th>
                  <th className="px-4 py-3 font-semibold">
                    Tên đăng nhập / mã định danh
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    PIN phụ huynh
                  </th>
                  <th className="px-4 py-3 font-semibold">Tiến độ</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAccounts.map((account, index) => {
                  const progress = progressOf(account);
                  const ProgressIcon = progress.icon;
                  return (
                    <tr
                      key={account.id}
                      className="hover:bg-[#FAFBFD] dark:hover:bg-[#0F171E]/60 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 ${
                              AVATAR_ACCENTS[index % AVATAR_ACCENTS.length]
                            }`}
                          >
                            {initialsOf(account.fullName)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1D242B] dark:text-white truncate">
                              {account.fullName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Lớp 9 · Tạo ngày{" "}
                              {new Date(account.createdAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-lg bg-[#B3DEE2]/30 border border-[#B3DEE2] px-2.5 py-1 text-xs font-semibold text-[#133C42] dark:bg-[#B3DEE2]/10 dark:text-[#B3DEE2]">
                          {account.username}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EFCFE3]/50 border border-[#EA9AB2]/60 px-2.5 py-1 text-xs font-bold tabular-nums text-[#4A1A2C] dark:bg-[#EFCFE3]/10 dark:text-[#EFCFE3]">
                            <KeyRound className="w-3.5 h-3.5" />
                            {account.parentPin || "Chưa tạo"}
                          </span>
                          {account.parentPin && (
                            <button
                              type="button"
                              onClick={() => void handleCopyPin(account.parentPin)}
                              aria-label={`Sao chép mã PIN của ${account.fullName}`}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#EA9AB2] hover:text-[#9D2950] cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {account.linkedParents.length > 0
                            ? `Đã liên kết: ${account.linkedParents
                                .map((parent) => parent.fullName)
                                .join(", ")}`
                            : "Chưa có phụ huynh liên kết"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${progress.className}`}
                        >
                          <ProgressIcon
                            className={`w-3.5 h-3.5 ${
                              progress.label === "Đang thực hiện"
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                          {progress.label}
                        </span>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {progress.detail}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditTarget(account)}
                            className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#EA9AB2] hover:text-[#9D2950] cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(account)}
                            className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[#E27396]/50 text-xs font-semibold inline-flex items-center gap-1.5 text-[#9D2950] hover:bg-[#E27396]/10 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Mã PIN chỉ dùng để phụ huynh liên kết đúng hồ sơ của con. Thầy/cô trao
        PIN trực tiếp cho phụ huynh, không đăng công khai.
      </p>

      {createOpen && session && (
        <AccountFormDialog
          mode="create"
          session={session}
          onClose={() => setCreateOpen(false)}
          onSaved={(account, savedOffline) => {
            onStudentCreated(account);
            setCreateOpen(false);
            setNotice({
              tone: savedOffline ? "warning" : "success",
              text: savedOffline
                ? `Đã lưu tài khoản ${account.fullName} trên thiết bị này (chưa đồng bộ máy chủ). Mã PIN phụ huynh: ${account.parentPin}.`
                : `Đã tạo tài khoản ${account.fullName}. Mã PIN phụ huynh: ${account.parentPin}.`,
            });
          }}
        />
      )}

      {editTarget && session && (
        <AccountFormDialog
          mode="edit"
          session={session}
          account={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(account, savedOffline) => {
            onStudentUpdated(account);
            setEditTarget(null);
            setNotice({
              tone: savedOffline ? "warning" : "success",
              text: savedOffline
                ? `Đã cập nhật ${account.fullName} trên thiết bị này. Khi có mạng, thầy/cô cập nhật lại để đồng bộ máy chủ.`
                : `Đã cập nhật tài khoản ${account.fullName}.`,
            });
          }}
        />
      )}

      {deleteTarget && session && (
        <DeleteAccountDialog
          session={session}
          account={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            const removed = deleteTarget;
            setDeleteTarget(null);
            onStudentDeleted(removed);
            setNotice({
              tone: "success",
              text: `Đã xóa tài khoản ${removed.fullName} (${removed.username}).`,
            });
          }}
        />
      )}
    </section>
  );
};

interface AccountFormDialogProps {
  mode: "create" | "edit";
  session: AuthSession;
  account?: StudentAccountSummary;
  onClose: () => void;
  onSaved: (account: StudentAccountSummary, savedOffline: boolean) => void;
}

const AccountFormDialog: React.FC<AccountFormDialogProps> = ({
  mode,
  session,
  account,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState<AccountFormState>(
    account
      ? {
          fullName: account.fullName,
          username: account.username,
          password: "",
          parentPin: account.parentPin,
        }
      : EMPTY_FORM
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setField = (key: keyof AccountFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleGeneratePin = () => {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    setField("parentPin", String(1000 + (value[0] % 9000)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "create") {
        const result = await createStudentAccount(session, {
          fullName: form.fullName,
          username: form.username,
          password: form.password,
          parentPin: form.parentPin,
        });
        onSaved(result.account, result.savedOffline);
      } else if (account) {
        const result = await updateStudentAccount(session, account.id, {
          fullName: form.fullName,
          username: form.username,
          parentPin: form.parentPin,
          newPassword: form.password,
        });
        onSaved(result.account, result.savedOffline);
      }
    } catch (err) {
      setError(
        err instanceof AuthError || err instanceof Error
          ? err.message
          : "Không lưu được tài khoản."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        mode === "create"
          ? "Thêm tài khoản học sinh"
          : `Chỉnh sửa tài khoản ${account?.fullName ?? ""}`
      }
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm px-4 py-6 overflow-y-auto flex items-start sm:items-center justify-center"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white dark:bg-[#17222C] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-[#EFCFE3]/50 to-[#B3DEE2]/35 dark:from-[#17222C] dark:to-[#17222C] flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              {mode === "create"
                ? "Thêm tài khoản học sinh"
                : "Chỉnh sửa tài khoản học sinh"}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {mode === "create"
                ? "Tài khoản được cấp cho học sinh Lớp 9, không kèm dữ liệu mẫu."
                : "Cập nhật thông tin đăng nhập và liên kết phụ huynh của em."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="w-8 h-8 rounded-full inline-flex items-center justify-center text-slate-500 hover:bg-white/70 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF2D7] text-[#223A1E] px-3 py-1 text-[11px] font-bold">
            <Users className="w-3.5 h-3.5" />
            Lớp 9 (cố định)
          </div>

          {error && (
            <div className="rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs sm:text-sm text-rose-800 dark:text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="account-full-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
            >
              Họ và tên
            </label>
            <input
              id="account-full-name"
              value={form.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              placeholder="Ví dụ: Nguyễn Minh Anh"
              autoComplete="off"
              className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
            />
          </div>

          <div>
            <label
              htmlFor="account-username"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
            >
              Tên đăng nhập / mã định danh
            </label>
            <input
              id="account-username"
              value={form.username}
              onChange={(e) => setField("username", e.target.value)}
              placeholder="Ví dụ: minhanh.9a hoặc email"
              autoComplete="off"
              className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
            />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              3–32 kí tự: chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới.
            </p>
          </div>

          <div>
            <label
              htmlFor="account-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
            >
              {mode === "create" ? "Mật khẩu ban đầu" : "Đặt lại mật khẩu"}
            </label>
            <div className="relative">
              <input
                id="account-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                placeholder={
                  mode === "create"
                    ? "Ít nhất 6 kí tự"
                    : "Để trống nếu không đổi mật khẩu"
                }
                autoComplete="new-password"
                className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 pr-16 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[30px] px-2 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
            {mode === "edit" && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Đổi mật khẩu sẽ đăng xuất các thiết bị đang dùng tài khoản này.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="account-parent-pin"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
            >
              Mã PIN liên kết phụ huynh
            </label>
            <div className="flex gap-2">
              <input
                id="account-parent-pin"
                inputMode="numeric"
                maxLength={4}
                value={form.parentPin}
                onChange={(e) =>
                  setField("parentPin", e.target.value.replace(/\D/g, ""))
                }
                placeholder="4 chữ số"
                className="w-32 min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm font-semibold tabular-nums tracking-widest focus:outline-none focus:ring-2 focus:ring-[#E27396]"
              />
              <button
                type="button"
                onClick={handleGeneratePin}
                className="min-h-[42px] px-3 py-2 rounded-xl border border-[#EA9AB2] bg-[#EFCFE3]/50 text-[#4A1A2C] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#EFCFE3] dark:bg-[#EFCFE3]/10 dark:text-[#EFCFE3] cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Tạo PIN mới
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {mode === "create"
                ? "Để trống để hệ thống tự tạo PIN 4 số."
                : "Để trống để giữ nguyên PIN hiện tại."}
            </p>
          </div>

          {mode === "edit" && account && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Liên kết phụ huynh hiện tại
              </p>
              {account.linkedParents.length > 0 ? (
                <ul className="mt-1.5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {account.linkedParents.map((parent) => (
                    <li key={parent.id}>
                      {parent.fullName}{" "}
                      <span className="text-slate-400">({parent.username})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Chưa có phụ huynh nào liên kết bằng PIN này.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={busy}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-50 text-[#1D1519] text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "create" ? (
              <Plus className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {busy
                ? "Đang lưu..."
                : mode === "create"
                ? "Tạo tài khoản"
                : "Lưu thay đổi"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

interface DeleteAccountDialogProps {
  session: AuthSession;
  account: StudentAccountSummary;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  session,
  account,
  onClose,
  onDeleted,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteStudentAccount(session, account.id);
      onDeleted();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không xóa được tài khoản."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Xác nhận xóa tài khoản ${account.fullName}`}
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm px-4 py-6 overflow-y-auto flex items-start sm:items-center justify-center"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#17222C] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-[#E27396]/10 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E27396]/25 text-[#9D2950] dark:text-[#EA9AB2] flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Xóa tài khoản học sinh?</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="w-8 h-8 rounded-full inline-flex items-center justify-center text-slate-500 hover:bg-white/70 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-sm">
          {error && (
            <div className="rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
            Thầy/cô sắp xóa tài khoản của{" "}
            <strong>{account.fullName}</strong>{" "}
            <span className="text-slate-500 dark:text-slate-400">
              ({account.username})
            </span>
            . Hồ sơ hành trình, nhật ký và liên kết phụ huynh của em trên tài
            khoản này sẽ bị gỡ khỏi hệ thống.
          </p>
          <div className="rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-300">
            Nếu chỉ muốn khóa để em tạm dừng, hãy đổi mật khẩu thay vì xóa tài
            khoản.
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            Giữ lại tài khoản
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={busy}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-[#9D2950] hover:bg-[#7F1F3F] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{busy ? "Đang xóa..." : "Xóa tài khoản"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
