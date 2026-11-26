import React, { useEffect, useState } from "react";
import {
  Map,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Info,
  Compass,
} from "lucide-react";
import type { Pathway, PathwayCategory, Student } from "../../types";

interface PathwayMapProps {
  pathways: Pathway[];
  student?: Student;
  focusedPathwayId?: string | null;
  onAddOptionToFilter?: (pathway: Pathway) => void;
  onTryScenarioForPathway?: (pathwayId: string) => void;
  readOnly?: boolean;
}

const DIRECTIONS: { category: PathwayCategory; label: string }[] = [
  { category: "THPT_CONG_LAP", label: "THPT công lập" },
  { category: "THPT_TU_THUC", label: "THPT tư thục" },
  { category: "GDTX", label: "Giáo dục thường xuyên" },
  { category: "TRUNG_CAP", label: "Trung cấp nghề" },
  { category: "SO_CAP", label: "Sơ cấp nghề & đi làm" },
];

function experienceButtonLabel(category: PathwayCategory): string {
  if (category === "TRUNG_CAP" || category === "SO_CAP") {
    return "Thử một ngày làm nghề";
  }
  if (category === "GDTX") {
    return "Tìm hiểu lịch học & mô hình GDTX";
  }
  return "Trải nghiệm một ngày học THPT";
}

export const PathwayMap: React.FC<PathwayMapProps> = ({
  pathways,
  student,
  focusedPathwayId,
  onAddOptionToFilter,
  onTryScenarioForPathway,
  readOnly = false,
}) => {
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>(
    focusedPathwayId || pathways[0]?.id || ""
  );
  useEffect(() => {
    if (focusedPathwayId) {
      setSelectedPathwayId(focusedPathwayId);
    }
  }, [focusedPathwayId]);

  const selectedPathway =
    pathways.find((p) => p.id === selectedPathwayId) || pathways[0];

  const isAlreadyAdded = (pathwayId: string) =>
    student?.consideredOptions.some(
      (opt) => opt.pathwayId === pathwayId && opt.status !== "Tạm gác lại"
    ) ?? false;

  const renderSchoolField = (val: string) => {
    if (!val || val.trim() === "") {
      return (
        <span className="italic text-slate-500 dark:text-slate-400">
          Nhà trường cập nhật
        </span>
      );
    }
    return (
      <span className="font-medium text-slate-900 dark:text-white whitespace-pre-line">
        {val}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#EAF2D7]/70 dark:bg-[#EAF2D7]/10 border border-[#EAF2D7] dark:border-slate-700 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#223A1E] dark:text-[#EAF2D7] shrink-0 mt-0.5" />
        <p className="text-sm sm:text-[15px] font-medium text-[#223A1E] dark:text-[#EAF2D7] leading-relaxed">
          Mỗi con đường đều có giá trị riêng – chọn đúng lộ trình phù hợp với
          năng lực và điều kiện của bạn.
        </p>
      </div>

      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF2D7]/70 dark:bg-[#EAF2D7]/15 flex items-center justify-center text-[#223A1E] dark:text-[#EAF2D7]">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">
              Bản đồ lộ trình sau THCS
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Từ tốt nghiệp THCS, các hướng học có thể nối tiếp lên cao đẳng,
              đại học hoặc vừa đi làm vừa học tiếp khi sẵn sàng.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[880px]">
            <p className="sm:hidden mb-2 text-[11px] italic text-slate-500 dark:text-slate-400">
              Vuốt ngang để xem đầy đủ sơ đồ.
            </p>
            <svg
              viewBox="0 0 1040 600"
              role="img"
              aria-label="Bản đồ lộ trình sau THCS: từ tốt nghiệp THCS có 4 hướng đi gồm THPT công lập hoặc tư thục, giáo dục thường xuyên, trung cấp nghề và sơ cấp nghề. Các hướng học văn hóa nối lên cao đẳng và đại học; trung cấp nghề liên thông lên cao đẳng hoặc đi làm tích lũy tay nghề; cao đẳng học tiếp lên đại học; sơ cấp nghề đi làm hoặc học tiếp trung cấp khi sẵn sàng."
              className="w-full h-auto"
            >
              <defs>
                <marker
                  id="route-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#E27396" />
                </marker>
                <marker
                  id="route-arrow-strong"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#9D2950" />
                </marker>
              </defs>

              {/* Điểm xuất phát toả ra 4 hướng */}
              <path
                d="M 190 282 C 240 282, 246 128, 300 128"
                fill="none"
                stroke="#E27396"
                strokeWidth="2.5"
                markerEnd="url(#route-arrow)"
              />
              <path
                d="M 190 294 C 244 294, 250 248, 300 248"
                fill="none"
                stroke="#E27396"
                strokeWidth="2.5"
                markerEnd="url(#route-arrow)"
              />
              <path
                d="M 190 306 C 244 306, 250 368, 300 368"
                fill="none"
                stroke="#E27396"
                strokeWidth="2.5"
                markerEnd="url(#route-arrow)"
              />
              <path
                d="M 190 320 C 240 320, 246 492, 300 492"
                fill="none"
                stroke="#E27396"
                strokeWidth="2.5"
                markerEnd="url(#route-arrow)"
              />

              {/* Nhóm nối lên Cao đẳng */}
              <path
                d="M 582 108 C 634 108, 650 76, 736 76"
                fill="none"
                stroke="#E27396"
                strokeWidth="2.5"
                markerEnd="url(#route-arrow)"
              />
              <path
                d="M 582 228 C 642 228, 654 94, 736 94"
                fill="none"
                stroke="#E27396"
                strokeWidth="2.5"
                markerEnd="url(#route-arrow)"
              />
              <path
                d="M 582 348 C 648 348, 662 112, 736 112"
                fill="none"
                stroke="#E27396"
                strokeWidth="2.5"
                markerEnd="url(#route-arrow)"
              />
              <text
                x="635"
                y="347"
                textAnchor="middle"
                transform="rotate(-57 635 347)"
                fill="#9D2950"
                className="dark:fill-[#F4B8CB]"
                fontSize="11.5"
                fontWeight="600"
                fontStyle="italic"
              >
                liên thông
              </text>

              {/* Nhóm nối xuống Đại học */}
              <path
                d="M 582 146 C 640 146, 652 248, 736 248"
                fill="none"
                stroke="#E27396"
                strokeWidth="2.5"
                markerEnd="url(#route-arrow)"
              />
              <path
                d="M 582 266 C 640 268, 656 266, 736 266"
                fill="none"
                stroke="#E27396"
                strokeWidth="2.5"
                markerEnd="url(#route-arrow)"
              />
              {/* Cao đẳng học tiếp lên đại học */}
              <path
                d="M 849 150 L 849 204"
                fill="none"
                stroke="#E27396"
                strokeWidth="2.5"
                markerEnd="url(#route-arrow)"
              />

              {/* Trung cấp, sơ cấp nghề đi làm; sơ cấp học tiếp trung cấp */}
              <path
                d="M 582 396 C 648 396, 700 460, 736 468"
                fill="none"
                stroke="#E27396"
                strokeWidth="2.5"
                markerEnd="url(#route-arrow)"
              />
              <path
                d="M 582 492 L 736 492"
                fill="none"
                stroke="#E27396"
                strokeWidth="2.5"
                markerEnd="url(#route-arrow)"
              />
              <path
                d="M 444 440 L 444 418"
                fill="none"
                stroke="#E27396"
                strokeWidth="2.5"
                markerEnd="url(#route-arrow)"
              />

              <foreignObject x="20" y="252" width="170" height="96">
                <div className="h-full w-full rounded-[16px] border-2 border-[#9D2950]/50 bg-[#E27396] px-2 py-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <p className="text-[15px] font-bold leading-tight text-[#2B111A]">
                    Tốt nghiệp THCS
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-[#2B111A]/70">
                    Lớp 9
                  </p>
                </div>
              </foreignObject>

              <foreignObject x="306" y="84" width="276" height="88">
                <div className="h-full w-full rounded-[16px] border-2 border-[#EA9AB2] bg-[#EFCFE3] dark:bg-[#EFCFE3]/15 dark:border-[#EA9AB2]/60 px-3 py-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <p className="text-[13.5px] font-bold leading-snug text-[#4A1A2C] dark:text-[#EFCFE3]">
                    THPT công lập / tư thục
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-medium leading-snug text-[#4A1A2C]/75 dark:text-[#EFCFE3]/80">
                    (học văn hóa THPT)
                  </p>
                </div>
              </foreignObject>

              <foreignObject x="306" y="204" width="276" height="88">
                <div className="h-full w-full rounded-[16px] border-2 border-[#9DBB7A] bg-[#EAF2D7] dark:bg-[#EAF2D7]/15 dark:border-[#EAF2D7]/50 px-3 py-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <p className="text-[13.5px] font-bold leading-snug text-[#223A1E] dark:text-[#EAF2D7]">
                    Giáo dục thường xuyên
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-medium leading-snug text-[#223A1E]/75 dark:text-[#EAF2D7]/80">
                    (học văn hóa THPT)
                  </p>
                </div>
              </foreignObject>

              <foreignObject x="306" y="324" width="276" height="88">
                <div className="h-full w-full rounded-[16px] border-2 border-[#B3DEE2] bg-[#B3DEE2]/75 dark:bg-[#B3DEE2]/15 dark:border-[#B3DEE2]/60 px-3 py-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <p className="text-[13.5px] font-bold leading-snug text-[#133C42] dark:text-[#B3DEE2]">
                    Trung cấp nghề
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-medium leading-snug text-[#133C42]/75 dark:text-[#B3DEE2]/80">
                    (có thể kết hợp học văn hóa THPT)
                  </p>
                </div>
              </foreignObject>

              <foreignObject x="306" y="444" width="276" height="96">
                <div className="h-full w-full rounded-[16px] border-2 border-[#E27396] bg-[#EA9AB2] dark:bg-[#EA9AB2]/25 dark:border-[#EA9AB2]/60 px-3 py-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <p className="text-[13.5px] font-bold leading-snug text-[#2B111A] dark:text-[#EFCFE3]">
                    Sơ cấp nghề
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-medium leading-snug text-[#2B111A]/75 dark:text-[#EFCFE3]/80">
                    (đào tạo nhanh kỹ năng)
                  </p>
                </div>
              </foreignObject>

              <foreignObject x="744" y="40" width="210" height="108">
                <div className="h-full w-full rounded-[16px] border-2 border-[#9DBB7A] bg-[#EAF2D7] dark:bg-[#EAF2D7]/20 dark:border-[#EAF2D7]/60 px-3 py-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <p className="text-[15px] font-bold leading-tight text-[#223A1E] dark:text-[#EAF2D7]">
                    Cao đẳng
                  </p>
                </div>
              </foreignObject>

              <foreignObject x="744" y="212" width="210" height="108">
                <div className="h-full w-full rounded-[16px] border-2 border-[#9DBB7A] bg-[#EAF2D7]/70 dark:bg-[#EAF2D7]/15 dark:border-[#EAF2D7]/50 px-3 py-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <p className="text-[15px] font-bold leading-tight text-[#223A1E] dark:text-[#EAF2D7]">
                    Đại học
                  </p>
                </div>
              </foreignObject>

              <foreignObject x="744" y="444" width="276" height="96">
                <div className="h-full w-full rounded-[16px] border-2 border-[#E27396] bg-[#EA9AB2] dark:bg-[#EA9AB2]/25 dark:border-[#EA9AB2]/60 px-3 py-2 flex items-center justify-center text-center shadow-sm">
                  <p className="text-[13px] font-semibold leading-snug text-[#2B111A] dark:text-[#EFCFE3]">
                    Đi làm, tích lũy tay nghề,
                    <br />
                    học tiếp khi sẵn sàng
                  </p>
                </div>
              </foreignObject>
            </svg>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B3DEE2]/50 dark:bg-[#B3DEE2]/15 flex items-center justify-center text-[#133C42] dark:text-[#B3DEE2]">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">
              Bản đồ 5 hướng đi sau THCS (Bước THU)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Năm hướng đi song song từ điểm xuất phát Tốt nghiệp THCS (Lớp 9).
              Chạm vào từng hướng để xem thông tin chi tiết.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#B3DEE2]/45 dark:bg-[#B3DEE2]/15 border border-[#B3DEE2] dark:border-[#B3DEE2]/40 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[#133C42] dark:text-[#B3DEE2]">
            Điểm xuất phát
          </p>
          <p className="text-base font-bold text-[#1D242B] dark:text-white">
            Tốt nghiệp THCS (Lớp 9)
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#133C42] dark:text-[#B3DEE2]">
            <ArrowRight className="w-3.5 h-3.5" />
            5 hướng đi song song
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {DIRECTIONS.map((direction, index) => {
            const items = pathways.filter(
              (p) => p.category === direction.category
            );
            if (items.length === 0) return null;
            return items.map((p) => {
              const active = selectedPathway?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPathwayId(p.id)}
                  className={`text-left p-3.5 rounded-xl border-2 transition-colors min-h-[44px] cursor-pointer flex flex-col gap-1 ${
                    active
                      ? "bg-[#EFCFE3]/45 dark:bg-[#E27396]/20 border-[#E27396]"
                      : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-200 dark:border-slate-800 hover:border-[#B3DEE2]"
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Hướng {index + 1}
                  </p>
                  <p className="text-sm font-bold leading-snug">{direction.label}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug line-clamp-3">
                    {p.shortSubtitle}
                  </p>
                </button>
              );
            });
          })}
        </div>
      </section>

      {selectedPathway && (
        <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
          {selectedPathway.imageUrl && (
            <figure className="space-y-1.5">
              <img
                src={selectedPathway.imageUrl}
                alt={
                  selectedPathway.imageCaption ??
                  `Hình minh họa môi trường học tập: ${selectedPathway.title}`
                }
                className="w-full h-44 sm:h-56 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                loading="lazy"
              />
              {selectedPathway.imageCaption && (
                <figcaption className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  {selectedPathway.imageCaption}
                </figcaption>
              )}
            </figure>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <p className="text-xs font-medium text-[#9D2950] dark:text-[#EA9AB2]">
                Thẻ thông tin lộ trình
              </p>
              <h3 className="text-xl font-bold mt-0.5">
                {selectedPathway.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {selectedPathway.shortSubtitle}
              </p>
            </div>

            {!readOnly && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {selectedPathway.scenario && onTryScenarioForPathway && (
                  <button
                    type="button"
                    onClick={() => onTryScenarioForPathway(selectedPathway.id)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42] font-semibold text-sm inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>{experienceButtonLabel(selectedPathway.category)}</span>
                  </button>
                )}

                {onAddOptionToFilter && (
                  <button
                    type="button"
                    disabled={isAlreadyAdded(selectedPathway.id)}
                    onClick={() => onAddOptionToFilter(selectedPathway)}
                    className={`min-h-[44px] px-4 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isAlreadyAdded(selectedPathway.id)
                        ? "bg-[#EAF2D7] dark:bg-[#EAF2D7]/20 text-[#223A1E] dark:text-[#EAF2D7] cursor-default"
                        : "bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519]"
                    }`}
                  >
                    {isAlreadyAdded(selectedPathway.id) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã có trong danh sách cân nhắc</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>Đưa vào danh sách cân nhắc</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-900 dark:text-white">
                Điều kiện đầu vào
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedPathway.entryRequirements}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-900 dark:text-white">
                Nội dung học
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedPathway.learningContent}
              </p>
            </div>
            {(selectedPathway.category === "TRUNG_CAP" ||
              selectedPathway.category === "SO_CAP") && (
              <div className="space-y-1.5">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Cơ hội việc làm &amp; hướng đi tiếp
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedPathway.careerOpportunities}
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-900 dark:text-white">
                Cơ hội học tiếp / chuyển tiếp trình độ cao hơn
              </p>
              <p className="text-[#133C42] dark:text-[#B3DEE2] font-medium leading-relaxed">
                {selectedPathway.articulationPath}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 text-sm sm:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trường tại TP. Đà Nẵng (sau sáp nhập)
              </p>
              <p className="mt-1 leading-relaxed">
                {renderSchoolField(selectedPathway.realSchoolNames)}
              </p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {renderSchoolField(selectedPathway.realSchoolAddresses)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 text-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chi phí / học phí ước tính
              </p>
              <p className="mt-1 leading-relaxed">
                {renderSchoolField(selectedPathway.tuitionEstimate)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 text-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tuyển sinh / điểm chuẩn
              </p>
              <p className="mt-1 leading-relaxed">
                {renderSchoolField(selectedPathway.admissionCutoff)}
              </p>
            </div>
          </div>

        </section>
      )}
    </div>
  );
};
