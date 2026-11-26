import React from "react";
import { AlertTriangle, LogOut, RotateCcw, Trash2 } from "lucide-react";
import { clearStoredSession } from "../services/auth";

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("La Bàn Lựa Chọn render error:", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleBackToLogin = () => {
    clearStoredSession();
    window.location.reload();
  };

  private handleClearCaches = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map((registration) => registration.unregister())
        );
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch {
      // Vẫn tải lại trang dù không xóa được bộ nhớ đệm
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#FAFBFD] dark:bg-[#0F171E] text-[#1D242B] dark:text-[#EDF2F7] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C] p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EFCFE3]/70 dark:bg-[#EFCFE3]/15 flex items-center justify-center text-[#9D2950] dark:text-[#EFCFE3] shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl font-bold">
                Không thể hiển thị giao diện
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Ứng dụng gặp lỗi khi đọc dữ liệu đã lưu trên trình duyệt. Bạn
                hãy tải lại trang; nếu vẫn còn lỗi, chọn về trang đăng nhập
                hoặc xóa bộ nhớ đệm ứng dụng.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Tải lại trang
            </button>
            <button
              type="button"
              onClick={this.handleBackToLogin}
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold inline-flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Về trang đăng nhập
            </button>
            <button
              type="button"
              onClick={this.handleClearCaches}
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#EA9AB2] text-[#9D2950] dark:text-[#EA9AB2] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#EFCFE3]/30 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Xóa bộ nhớ đệm &amp; tải lại
            </button>
          </div>

          {this.state.message && (
            <details className="rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-500 dark:text-slate-400">
              <summary className="cursor-pointer font-semibold">
                Chi tiết kỹ thuật
              </summary>
              <p className="mt-2 break-words font-mono">{this.state.message}</p>
            </details>
          )}
        </div>
      </div>
    );
  }
}
