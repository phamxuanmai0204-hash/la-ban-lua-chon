import React, { useState } from "react";
import { PathwayItem, StudentProfileData } from "../types";
import { ArrowRight, Plus, Check, PlayCircle, Info } from "lucide-react";

interface PathwayMapProps {
  pathways: PathwayItem[];
  student?: StudentProfileData;
  onAddOption?: (pathwayId: string) => void;
  onRemoveOption?: (pathwayId: string) => void;
  onGoToFilter?: () => void;
}

export const PathwayMap: React.FC<PathwayMapProps> = ({
  pathways,
  student,
  onAddOption,
  onRemoveOption,
  onGoToFilter,
}) => {
  const [selectedId, setSelectedId] = useState<string>(pathways[2]?.id ?? pathways[0]?.id ?? "");
  const activePathway = pathways.find((p) => p.id === selectedId) ?? pathways[0];

  const isConsidered = (id: string) =>
    student ? student.consideredOptionIds.includes(id) : false;

  return (
    <div className="space-y-6">
      {/* Always-visible message */}
      <div className="bg-[#2A7F7F]/10 dark:bg-[#2A7F7F]/20 border border-[#2A7F7F]/35 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#2A7F7F] dark:text-[#6EE7E7] shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-[#1F3A5F] dark:text-slate-100 leading-relaxed">
          “Học nghề không phải đường cụt: người học vẫn có cửa liên thông lên các bậc cao hơn theo quy định hiện hành.”
        </p>
      </div>

      {/* Visual Pathway Map */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
              Bản đồ 4 nhánh lộ trình sau Tốt nghiệp THCS
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Chạm vào từng nhánh để xem chi tiết điều kiện, nội dung học và đường liên thông mở.
            </p>
          </div>
          {student && (
            <span className="text-xs font-medium text-[#2A7F7F] dark:text-[#6EE7E7]">
              Đang cân nhắc: {student.consideredOptionIds.length} phương án
            </span>
          )}
        </div>

        {/* Diagram Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Root Node */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center">
            <div className="w-full rounded-2xl bg-[#1F3A5F] text-white p-4 text-center">
              <p className="text-xs text-[#F0B44A] font-medium">Điểm xuất phát</p>
              <p className="text-base font-bold mt-1">Tốt nghiệp THCS</p>
              <p className="text-xs text-slate-200 mt-1">Cuối năm lớp 9</p>
            </div>
          </div>

          {/* 4 Branch Pathways */}
          <div className="lg:col-span-6 space-y-2.5">
            {pathways.map((p) => {
              const active = p.id === activePathway?.id;
              const isVocational = p.branchType === "nghe";
              const added = isConsidered(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    active
                      ? "bg-[#1F3A5F]/8 border-[#1F3A5F] dark:bg-[#2A7F7F]/25 dark:border-[#6EE7E7]"
                      : isVocational
                      ? "bg-[#2A7F7F]/5 border-[#2A7F7F]/40 hover:bg-[#2A7F7F]/10 dark:bg-slate-800/70 dark:border-[#2A7F7F]/50"
                      : "bg-[#F7F9FB] border-slate-200 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#1F3A5F] dark:text-slate-100">
                        {p.title}
                      </span>
                      {isVocational && (
                        <span className="text-xs font-semibold text-[#2A7F7F] dark:text-[#6EE7E7]">
                          · Liên thông mở
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      {p.articulationNote}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {added && (
                      <span className="text-xs font-medium text-[#2A7F7F] dark:text-[#6EE7E7]">
                        Đã lưu
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Articulation Highlight Column */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border-2 border-[#2A7F7F] bg-[#2A7F7F]/8 dark:bg-[#2A7F7F]/20 p-4 space-y-3">
              <p className="text-xs font-bold text-[#2A7F7F] dark:text-[#6EE7E7]">
                Đường liên thông mở
              </p>
              <div className="space-y-2 text-xs sm:text-sm text-[#14263E] dark:text-slate-100">
                <div className="rounded-lg bg-white dark:bg-slate-800 px-3 py-2 border border-[#2A7F7F]/30 font-medium">
                  Trung cấp / Sơ cấp nghề (kèm văn hóa THPT)
                </div>
                <div className="flex justify-center text-[#2A7F7F] dark:text-[#6EE7E7] font-bold">
                  ↓
                </div>
                <div className="rounded-lg bg-white dark:bg-slate-800 px-3 py-2 border border-[#2A7F7F]/30 font-medium">
                  Cao đẳng (liên thông cùng ngành)
                </div>
                <div className="flex justify-center text-[#2A7F7F] dark:text-[#6EE7E7] font-bold">
                  ↓
                </div>
                <div className="rounded-lg bg-white dark:bg-slate-800 px-3 py-2 border border-[#2A7F7F]/30 font-medium">
                  Đại học (khi em sẵn sàng học tiếp)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Pathway Details Card */}
      {activePathway && (
        <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
            <div>
              <p className="text-xs font-medium text-[#2A7F7F] dark:text-[#6EE7E7]">
                Thông tin chi tiết lộ trình
              </p>
              <h3 className="text-xl font-bold text-[#1F3A5F] dark:text-slate-100 mt-0.5">
                {activePathway.title}
              </h3>
            </div>

            {student && onAddOption && onRemoveOption && (
              <div>
                {isConsidered(activePathway.id) ? (
                  <button
                    type="button"
                    onClick={() => onRemoveOption(activePathway.id)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-[#2A7F7F] text-[#2A7F7F] dark:text-[#6EE7E7] text-sm font-semibold flex items-center gap-2 hover:bg-[#2A7F7F]/10 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Đã trong danh sách cân nhắc (Bấm để bỏ)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAddOption(activePathway.id)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#E0A030] hover:bg-[#d19225] text-[#14263E] text-sm font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Đưa vào danh sách cân nhắc</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-[#1F3A5F] dark:text-slate-100">Điều kiện đầu vào</p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {activePathway.entryCondition}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-[#1F3A5F] dark:text-slate-100">Nội dung học tập</p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {activePathway.studyContent}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-[#1F3A5F] dark:text-slate-100">Cơ hội việc làm & học tiếp</p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {activePathway.careerOpportunity}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-[#1F3A5F] dark:text-slate-100">Ghi chú liên thông</p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {activePathway.articulationNote}
              </p>
            </div>
          </div>

          {/* School-updated fields (NEVER fabricated) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl bg-[#F7F9FB] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Tên trường / cơ sở tại địa phương
              </p>
              <p className="mt-1 font-medium text-[#1F3A5F] dark:text-slate-100">
                {activePathway.schoolNames.trim() || "Nhà trường cập nhật"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Chi phí ước tính
              </p>
              <p className="mt-1 font-medium text-[#1F3A5F] dark:text-slate-100">
                {activePathway.estimatedCost.trim() || "Nhà trường cập nhật"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Thông tin tuyển sinh / điểm chuẩn năm trước
              </p>
              <p className="mt-1 font-medium text-[#1F3A5F] dark:text-slate-100">
                {activePathway.admissionReference.trim() || "Nhà trường cập nhật"}
              </p>
            </div>
          </div>

          {/* Người thật, việc thật */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#1F3A5F] dark:text-slate-100">
              Người thật, việc thật (cựu học sinh chia sẻ)
            </h4>
            {activePathway.realStories.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Chưa có bài chia sẻ cho nhánh này — thầy cô có thể bổ sung trong mục Quản trị nội dung.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activePathway.realStories.map((story) => (
                  <div
                    key={story.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-[#F7F9FB] dark:bg-slate-800/50 space-y-1.5"
                  >
                    <div className="flex items-start gap-2">
                      <PlayCircle className="w-4 h-4 text-[#E0A030] shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold text-[#1F3A5F] dark:text-slate-100">
                        {story.title}
                      </p>
                    </div>
                    <p className="text-xs text-[#2A7F7F] dark:text-[#6EE7E7]">{story.alumniRole}</p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {story.summary}
                    </p>
                    {story.url && !story.url.startsWith("#") && (
                      <a
                        href={story.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-xs font-semibold text-[#1F3A5F] dark:text-[#F0B44A] underline underline-offset-4 pt-1"
                      >
                        Xem video / bài chia sẻ
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {onGoToFilter && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onGoToFilter}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1F3A5F] hover:bg-[#162b47] dark:bg-[#2A7F7F] text-white font-semibold text-sm cursor-pointer"
              >
                Sang Bước LỌC: Đặt tiêu chí đủ tốt
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
