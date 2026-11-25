import React from "react";
import {
  ArrowLeft,
  Compass,
  ShieldCheck,
  Sparkles,
  Users,
  Layers,
} from "lucide-react";
import { CompassLogo } from "./CompassLogo";

interface ProjectIntroProps {
  onBack: () => void;
}

export const ProjectIntro: React.FC<ProjectIntroProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#FAFBFD] dark:bg-[#0F171E] text-[#1D242B] dark:text-[#EDF2F7] flex flex-col">
      {/* Clean 3-zone top bar */}
      <header className="sticky top-0 z-30 h-14 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#17222C]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CompassLogo size={26} />
            <span className="text-base font-bold tracking-tight">
              La Bàn Lựa Chọn
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#de-tai" className="hover:text-[#1D242B] dark:hover:text-white whitespace-nowrap shrink-0">
              Đề tài
            </a>
            <a href="#ba-giai-phap" className="hover:text-[#1D242B] dark:hover:text-white whitespace-nowrap shrink-0">
              Ba giải pháp
            </a>
            <a href="#nam-buoc" className="hover:text-[#1D242B] dark:hover:text-white whitespace-nowrap shrink-0">
              Quy trình 5 bước
            </a>
            <a href="#nguyen-tac-ai" className="hover:text-[#1D242B] dark:hover:text-white whitespace-nowrap shrink-0">
              Nguyên tắc AI
            </a>
          </nav>

          <button
            type="button"
            onClick={onBack}
            className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại màn hình chính</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Project Title & Context */}
        <section
          id="de-tai"
          className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4"
        >
          <p className="text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2]">
            Giới thiệu dự án nghiên cứu khoa học
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold leading-snug">
            Nghiên cứu hội chứng FOBO và giải pháp nâng cao năng lực ra quyết định ở học sinh cuối cấp THCS
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Nhiều học sinh lớp 9 đứng trước ngưỡng cửa sau THCS thường rơi vào trạng thái do dự kéo dài, ngại cam kết với một phương án đã phù hợp vì luôn nghĩ còn lựa chọn khác tốt hơn (FOBO – Fear Of Better Options). Dự án hướng tới việc trang bị cho các em một khung ra quyết định rõ ràng thay vì chỉ cung cấp thêm thông tin rời rạc.
          </p>
          <div className="p-4 rounded-xl bg-[#EAF2D7]/60 dark:bg-[#EAF2D7]/10 border border-[#EAF2D7] dark:border-slate-700 text-sm text-[#223A1E] dark:text-[#EAF2D7]">
            <span className="font-semibold">Cam kết giao diện học sinh &amp; phụ huynh: </span>
            Trong không gian sử dụng của học sinh và phụ huynh, ứng dụng tuyệt đối không dùng nhãn chẩn đoán tâm lí hay từ “FOBO”, không chấm điểm, không xếp hạng.
          </div>
        </section>

        {/* Three Solutions */}
        <section id="ba-giai-phap" className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#133C42] dark:text-[#B3DEE2]" />
            <h2 className="text-xl font-bold">Ba giải pháp trọng tâm</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <article className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
              <p className="text-xs font-bold text-[#133C42] dark:text-[#B3DEE2]">
                Giải pháp 1
              </p>
              <h3 className="text-lg font-bold">Soi chiếu bản thân</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Xây dựng hồ sơ 3 lớp bằng ngôn ngữ mô tả: Năng lực (nhận xét giáo viên + tự nhận của học sinh), Hứng thú theo 6 nhóm sở thích Holland, và Điều kiện thực tế của gia đình.
              </p>
            </article>

            <article className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
              <p className="text-xs font-bold text-[#9D2950] dark:text-[#EA9AB2]">
                Giải pháp 2
              </p>
              <h3 className="text-lg font-bold">Quy trình 5 bước &amp; Bộ lọc đủ tốt</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Vận dụng lí thuyết thỏa mãn vừa đủ (Satisficing): học sinh tự đặt tiêu chí cá nhân, trải nghiệm thực tế và tự chốt phương án phù hợp nhất với mình thay vì chạy theo lựa chọn hoàn hảo trong tưởng tượng.
              </p>
            </article>

            <article className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
              <p className="text-xs font-bold text-[#223A1E] dark:text-[#EAF2D7]">
                Giải pháp 3
              </p>
              <h3 className="text-lg font-bold">Vòng tròn đồng hành ba bên</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Kết nối Nhà trường – Gia đình – Cơ sở giáo dục nghề nghiệp qua lịch họp ba bên, câu chuyện “Người thật, việc thật” và minh bạch hóa cơ hội học tiếp lên trình độ cao hơn.
              </p>
            </article>
          </div>
        </section>

        {/* 5-step process */}
        <section
          id="nam-buoc"
          className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-[#E27396]" />
            <h2 className="text-xl font-bold">Quy trình 5 bước trên La Bàn Lựa Chọn</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {[
              {
                name: "1. THU",
                detail: "Tìm hiểu bản đồ lộ trình THPT công lập, THPT tư thục, GDTX, Trung cấp nghề, Sơ cấp nghề và cơ hội học tiếp.",
              },
              {
                name: "2. LỌC",
                detail: "Đặt tiêu chí đủ tốt của riêng em và đối chiếu từng phương án.",
              },
              {
                name: "3. THỬ",
                detail: "Tham quan xưởng, giao lưu người làm nghề và ghi nhật ký cảm nhận.",
              },
              {
                name: "4. CHỐT",
                detail: "Tự đặt hạn chốt và viết lí do lựa chọn bằng ngôn từ của chính em.",
              },
              {
                name: "5. CAM KẾT",
                detail: "Lập danh sách việc cần làm và kí xác nhận đồng hành ba bên.",
              },
            ].map((step) => (
              <div
                key={step.name}
                className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-1.5"
              >
                <p className="text-sm font-bold text-[#9D2950] dark:text-[#EA9AB2]">
                  {step.name}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* AI with Teacher Oversight Principles */}
        <section
          id="nguyen-tac-ai"
          className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#133C42] dark:text-[#B3DEE2]" />
            <h2 className="text-xl font-bold">
              Nguyên tắc Trợ lí AI có giáo viên giám sát
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-[#B3DEE2]/25 dark:bg-[#B3DEE2]/10 border border-[#B3DEE2]/70 dark:border-slate-700 space-y-1.5">
              <p className="font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#133C42] dark:text-[#B3DEE2]" />
                <span>Không quyết định thay học sinh</span>
              </p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                AI chỉ đóng vai người đặt câu hỏi gợi mở ngắn (tối đa 2 câu, kết thúc bằng 1 câu hỏi), nhắc lại đúng tiêu chí học sinh tự đặt. Không bao giờ khuyên chọn trường hay xếp hạng phương án.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#EFCFE3]/35 dark:bg-[#E27396]/15 border border-[#EA9AB2]/70 dark:border-slate-700 space-y-1.5">
              <p className="font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-[#9D2950] dark:text-[#EA9AB2]" />
                <span>Giáo viên kiểm soát &amp; bảo vệ an toàn tâm lí</span>
              </p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Mọi phản hồi AI đều đi qua hàng chờ của giáo viên để giữ nguyên, sửa lời hoặc thêm lời động viên. Khi phát hiện dấu hiệu căng thẳng hoặc áp lực gia đình, hệ thống gắn cờ nhạy cảm và mời trao đổi trực tiếp với thầy/cô.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
