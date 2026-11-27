import React from "react";
import { Sparkles, ShieldCheck, UserCheck, Lock, X, MessageSquare } from "lucide-react";

interface HowAIWorksModalProps {
  open: boolean;
  onClose: () => void;
}

export const HowAIWorksModal: React.FC<HowAIWorksModalProps> = ({
  open,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-ai-works-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B3DEE2]/50 dark:bg-[#B3DEE2]/20 flex items-center justify-center text-[#133C42] dark:text-[#B3DEE2] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="how-ai-works-title"
                className="text-lg sm:text-xl font-bold text-[#1D242B] dark:text-white"
              >
                Cách ứng dụng dùng Trợ lí AI
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Giải thích minh bạch dành cho học sinh và phụ huynh
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng trang giải thích cách ứng dụng sử dụng AI"
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          <div className="p-4 rounded-xl bg-[#EAF2D7]/60 dark:bg-[#EAF2D7]/10 border border-[#8FB37C]/50 space-y-1.5">
            <p className="font-bold text-[#223A1E] dark:text-[#EAF2D7] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>1. Chỉ đặt câu hỏi gợi mở — không chọn thay em</span>
            </p>
            <p>
              Trợ lí AI không bao giờ khuyên em &ldquo;nên vào trường nào&rdquo;, không chấm điểm và không xếp hạng các phương án. Khi em chia sẻ băn khoăn, trợ lí chỉ phản hồi ngắn gọn (tối đa 2 câu) và kết thúc bằng đúng 1 câu hỏi mở để em tự đối chiếu lại với tiêu chí của mình.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#B3DEE2]/35 dark:bg-[#B3DEE2]/10 border border-[#B3DEE2] dark:border-slate-700 space-y-1.5">
            <p className="font-bold text-[#133C42] dark:text-[#B3DEE2] flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>2. Thông tin cá nhân được bảo vệ trước khi gửi</span>
            </p>
            <p>
              Trước khi kết nối tới máy chủ AI, ứng dụng tự động thay họ tên, số điện thoại và địa chỉ (nếu em vô tình gõ vào) bằng kí hiệu chung. Máy chủ AI chỉ nhận ngữ cảnh cần thiết gồm tiêu chí tự đặt, bước đang đi và tóm tắt nhật ký gần nhất.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#EFCFE3]/40 dark:bg-[#EFCFE3]/10 border border-[#EA9AB2]/60 dark:border-slate-700 space-y-1.5">
            <p className="font-bold text-[#4A1A2C] dark:text-[#EFCFE3] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>3. Bộ lọc an toàn 2 lớp</span>
            </p>
            <p>
              <strong>Lớp 1 (Trước khi hỏi AI):</strong> Nếu em viết về chuyện buồn kéo dài, bị ép buộc hoặc áp lực nặng nề, ứng dụng không gửi cho AI mà hiển thị ngay lời động viên an toàn và nhắc em trao đổi trực tiếp với thầy/cô chủ nhiệm.
              <br />
              <strong>Lớp 2 (Sau khi AI trả lời):</strong> Nếu câu trả lời có dấu hiệu ép chọn, phán xét hay bịa đặt con số trường lớp, hệ thống tự động giữ lại và thay bằng câu hỏi trung lập.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 space-y-1.5">
            <p className="font-bold text-[#1D242B] dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 shrink-0 text-[#9D2950] dark:text-[#EA9AB2]" />
              <span>4. Thầy/cô luôn kiểm soát và có thể xem trước</span>
            </p>
            <p>
              Giáo viên chủ nhiệm có quyền bật chế độ &ldquo;Duyệt phản hồi AI trước khi hiển thị cho học sinh&rdquo;, chỉnh sửa câu chữ cho phù hợp với từng em, hoặc chuyển sang gặp mặt tư vấn trực tiếp khi cần. Khi không có mạng (ngoại tuyến), phần Trợ lí AI tạm nghỉ nhưng em vẫn đọc lộ trình và viết nhật ký bình thường.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-sm font-semibold cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
