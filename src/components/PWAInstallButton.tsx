import React, { useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={`inline-flex items-center gap-1.5 rounded-lg bg-[#133C42] hover:bg-[#1b5058] text-white font-semibold transition-colors cursor-pointer ${
          compact ? "px-3 py-1.5 text-xs" : "min-h-[38px] px-3.5 py-1.5 text-xs"
        }`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Cài lên màn hình</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>Cài trên iPhone/iPad</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3
                  id="ios-install-title"
                  className="text-base font-bold text-[#1D242B] dark:text-white"
                >
                  Cài La Bàn Lựa Chọn lên iPhone / iPad
                </h3>
                <button
                  type="button"
                  aria-label="Đóng hướng dẫn cài đặt"
                  onClick={() => setShowIOSGuide(false)}
                  className="min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-200 list-decimal list-inside leading-relaxed">
                <li>
                  Chạm vào nút <strong>Chia sẻ (Share)</strong> ở thanh công cụ dưới cùng của trình duyệt Safari.
                </li>
                <li>
                  Cuộn xuống và chọn <strong>Thêm vào Màn hình chính (Add to Home Screen)</strong>.
                </li>
                <li>
                  Chạm <strong>Thêm</strong> để dùng ứng dụng ngay cả khi mất mạng.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[42px] rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42] text-sm font-semibold cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
