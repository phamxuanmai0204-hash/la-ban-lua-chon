import React from "react";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#4A1A2C] text-[#FAFBFD] border border-[#E27396] px-3.5 py-2 text-xs font-medium shadow-lg max-w-[calc(100vw-2rem)]"
    >
      <WifiOff className="w-4 h-4 text-[#EA9AB2] shrink-0" />
      <span>
        Đang ngoại tuyến — Em vẫn đọc lộ trình và ghi nhật ký bình thường, dữ liệu sẽ tự đồng bộ khi có mạng lại.
      </span>
    </div>
  );
};
