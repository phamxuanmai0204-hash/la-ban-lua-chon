import React, { useEffect, useRef, useState } from "react";
import {
  Database,
  CheckCircle2,
  X,
  Cloud,
  HardDrive,
  ShieldCheck,
  RotateCcw,
  Download,
  Upload,
} from "lucide-react";
import {
  CURRENT_SCHEMA_VERSION,
  loadSavedFirebaseSettings,
} from "../services/storage";
import {
  exportFullAppStateJSON,
  parseFullAppStateJSON,
} from "../services/export";
import type { AppState, FirebaseConfig } from "../types";

interface SettingsModalProps {
  open: boolean;
  appState: AppState;
  activeStorageKind: "local" | "firebase";
  schemaVersion: number;
  requireTeacherApprovalBeforeDisplay: boolean;
  onToggleRequireApproval: () => void;
  onResetSampleData: () => void;
  onImportFullAppState: (nextState: AppState) => void;
  onClose: () => void;
  onApplyFirebaseConfig: (
    enabled: boolean,
    config: FirebaseConfig | null
  ) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  appState,
  activeStorageKind,
  schemaVersion,
  requireTeacherApprovalBeforeDisplay,
  onToggleRequireApproval,
  onResetSampleData,
  onImportFullAppState,
  onClose,
  onApplyFirebaseConfig,
}) => {
  const saved = loadSavedFirebaseSettings();
  const [configJson, setConfigJson] = useState<string>(
    saved.config ? JSON.stringify(saved.config, null, 2) : ""
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [saving, setSaving] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setConfirmReset(false);
  }, [open]);

  if (!open) return null;

  const handleEnableFirebase = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const parsed = JSON.parse(configJson) as Partial<FirebaseConfig>;
      if (
        !parsed.apiKey ||
        !parsed.projectId ||
        !parsed.appId ||
        !parsed.authDomain
      ) {
        setErrorMessage(
          "Cấu hình cần đủ các trường: apiKey, authDomain, projectId, appId."
        );
        return;
      }
      setSaving(true);
      await onApplyFirebaseConfig(true, parsed as FirebaseConfig);
      setStatusMessage(
        "Đã kích hoạt bộ chuyển đổi FirebaseStorage (Firestore) và đồng bộ dữ liệu hiện tại."
      );
    } catch {
      setErrorMessage(
        "Chuỗi cấu hình chưa đúng định dạng JSON hợp lệ. Hãy kiểm tra lại dấu ngoặc kép."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUseLocalStorage = async () => {
    setErrorMessage(null);
    setSaving(true);
    await onApplyFirebaseConfig(false, null);
    setStatusMessage("Đã chuyển về lưu trữ cục bộ (localStorage).");
    setSaving(false);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const text = await file.text();
      const migrated = parseFullAppStateJSON(text);
      onImportFullAppState(migrated);
      setStatusMessage(
        `Đã nhập toàn bộ dữ liệu (${migrated.students.length} học sinh, ${migrated.pathways.length} lộ trình).`
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Không đọc được tệp JSON sao lưu. Hãy kiểm tra lại định dạng tệp."
      );
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  };

  const handleConfirmReset = () => {
    onResetSampleData();
    setConfirmReset(false);
    setErrorMessage(null);
    setStatusMessage(
      "Đã khôi phục dữ liệu mặc định (danh sách học sinh được tạo từ tài khoản đăng ký)."
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-xl bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#133C42] dark:text-[#B3DEE2]" />
            <h2 id="settings-modal-title" className="text-lg font-bold">
              Cài đặt hệ thống &amp; Dữ liệu
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ cài đặt"
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage & Schema Version Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bộ lưu trữ đang dùng
            </p>
            <p className="font-bold mt-1 flex items-center gap-1.5">
              {activeStorageKind === "firebase" ? (
                <>
                  <Cloud className="w-4 h-4 text-[#133C42] dark:text-[#B3DEE2]" />
                  <span>FirebaseStorage (Firestore)</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4 text-[#223A1E] dark:text-[#EAF2D7]" />
                  <span>LocalStorage (Mặc định)</span>
                </>
              )}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Phiên bản dữ liệu
            </p>
            <p className="font-bold mt-1 tabular-nums">
              v{schemaVersion} (Chuẩn hiện hành: v{CURRENT_SCHEMA_VERSION})
            </p>
          </div>
        </div>

        {/* 4.4 Item 3: Công tắc "Duyệt AI trước khi hiển thị" */}
        <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#133C42] dark:text-[#B3DEE2]" />
              <span>Duyệt AI trước khi hiển thị</span>
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Khi bật, phản hồi của Trợ lí AI sẽ vào hàng chờ để giáo viên xem hoặc sửa trước khi học sinh nhìn thấy.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={requireTeacherApprovalBeforeDisplay}
            aria-label="Duyệt AI trước khi hiển thị"
            onClick={() => {
              onToggleRequireApproval();
              setStatusMessage(
                !requireTeacherApprovalBeforeDisplay
                  ? "Đã bật chế độ: Duyệt AI trước khi hiển thị cho học sinh."
                  : "Đã tắt chế độ duyệt trước: Phản hồi AI an toàn hiển thị trực tiếp (GV vẫn theo dõi được)."
              );
            }}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-colors cursor-pointer ${
              requireTeacherApprovalBeforeDisplay
                ? "bg-[#EAF2D7] border-[#8FB37C] text-[#223A1E]"
                : "bg-white dark:bg-[#17222C] border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            {requireTeacherApprovalBeforeDisplay ? "Đang bật" : "Đang tắt"}
          </button>
        </div>

        {/* 4.4 Item 4 & 5: Xuất / nhập toàn bộ dữ liệu + Khôi phục dữ liệu mẫu */}
        <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-sm font-semibold">
            Sao lưu, khôi phục &amp; dữ liệu mẫu
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                exportFullAppStateJSON(appState);
                setStatusMessage("Đã xuất tệp JSON toàn bộ dữ liệu của ứng dụng.");
              }}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#17222C] border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất toàn bộ dữ liệu (JSON)</span>
            </button>

            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              onChange={(e) => void handleImportFile(e)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#17222C] border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Nhập toàn bộ dữ liệu</span>
            </button>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#EA9AB2] bg-[#EFCFE3]/40 hover:bg-[#EFCFE3]/70 text-[#4A1A2C] dark:text-[#EFCFE3] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục dữ liệu ban đầu</span>
              </button>
            ) : (
              <div className="w-full p-3 rounded-xl bg-[#EFCFE3]/45 dark:bg-[#4A1A2C]/40 border border-[#E27396] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium text-[#4A1A2C] dark:text-[#EFCFE3]">
                  Xác nhận xóa toàn bộ dữ liệu hiện tại và đưa ứng dụng về trạng thái ban đầu?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[34px] px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#17222C] font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    className="min-h-[34px] px-3 py-1 rounded-lg bg-[#E27396] text-[#1D1519] font-semibold cursor-pointer"
                  >
                    Đồng ý khôi phục
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4.4 Item 1: Firebase Opt-In Config */}
        <div className="space-y-2.5">
          <label
            htmlFor="firebase-config-textarea"
            className="block text-sm font-semibold"
          >
            Cấu hình Firebase (tùy chọn – chỉ bật khi dán cấu hình)
          </label>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Mặc định ứng dụng lưu cục bộ trên trình duyệt để dùng thử ngay. Khi triển khai đồng bộ nhiều máy qua Firestore, dán đối tượng JSON cấu hình Firebase Web vào ô bên dưới:
          </p>
          <textarea
            id="firebase-config-textarea"
            rows={5}
            value={configJson}
            onChange={(e) => setConfigJson(e.target.value)}
            placeholder={`{\n  "apiKey": "...",\n  "authDomain": "...",\n  "projectId": "...",\n  "appId": "..."\n}`}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#E27396]"
          />
        </div>

        {errorMessage && (
          <p className="p-3 rounded-xl bg-[#EFCFE3]/50 border border-[#E27396] text-xs sm:text-sm text-[#4A1A2C] dark:text-[#EFCFE3]">
            {errorMessage}
          </p>
        )}

        {statusMessage && (
          <p className="p-3 rounded-xl bg-[#EAF2D7] text-xs sm:text-sm text-[#223A1E] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleUseLocalStorage}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Dùng LocalStorage
          </button>

          <button
            type="button"
            disabled={saving || !configJson.trim()}
            onClick={handleEnableFirebase}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-50 text-[#1D1519] text-xs sm:text-sm font-semibold cursor-pointer"
          >
            {saving ? "Đang kết nối..." : "Kích hoạt FirebaseStorage"}
          </button>
        </div>
      </div>
    </div>
  );
};
