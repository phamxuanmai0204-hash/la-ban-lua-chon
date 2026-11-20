import React from "react";
import { LogOut, WifiOff } from "lucide-react";
import { ROLE_LABELS } from "../services/authValidation";
import type { AuthUser, Role } from "../types";

interface AccountMenuProps {
  user: AuthUser;
  offline?: boolean;
  onLogout: () => void;
}

const ROLE_CHIP_STYLES: Record<Role, string> = {
  student: "bg-[#B3DEE2]/50 text-[#133C42] dark:bg-[#B3DEE2]/20 dark:text-[#B3DEE2]",
  teacher: "bg-[#EAF2D7] text-[#223A1E] dark:bg-[#EAF2D7]/20 dark:text-[#EAF2D7]",
  parent: "bg-[#EFCFE3] text-[#4A1A2C] dark:bg-[#EFCFE3]/20 dark:text-[#EFCFE3]",
  school_admin:
    "bg-[#F3E7C9] text-[#5A3A0E] dark:bg-[#F3E7C9]/20 dark:text-[#F3E7C9]",
};

function initialOf(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() || "?";
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  user,
  offline = false,
  onLogout,
}) => {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="flex items-center gap-2 min-h-[40px] max-w-[230px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] pl-1.5 pr-2.5 py-1">
        <span
          aria-hidden="true"
          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs font-bold shrink-0 ${ROLE_CHIP_STYLES[user.role]}`}
        >
          {initialOf(user.fullName)}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-xs font-semibold truncate">
            {user.fullName}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="truncate">{ROLE_LABELS[user.role]}</span>
            {offline && (
              <>
                <span aria-hidden="true">·</span>
                <WifiOff className="w-3 h-3 shrink-0" />
                <span className="sr-only">Phiên ngoại tuyến</span>
              </>
            )}
          </span>
        </span>
      </div>

      <button
        type="button"
        onClick={onLogout}
        aria-label={`Đăng xuất khỏi tài khoản ${user.fullName}`}
        title="Đăng xuất"
        className="min-h-[40px] px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-300 dark:hover:border-rose-500/50 hover:text-rose-700 dark:hover:text-rose-200 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Đăng xuất</span>
      </button>
    </div>
  );
};
