import React, { useEffect, useState } from "react";
import {
  Map,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  ExternalLink,
  Info,
  PlayCircle,
  MessageSquareMore,
  Compass,
} from "lucide-react";
import { DEFAULT_PRACTITIONER_QUESTIONS } from "../../data/mockData";
import { getYouTubeThumbnailUrl } from "../../utils/youtube";
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
  const [failedThumbIds, setFailedThumbIds] = useState<Record<string, boolean>>(
    {}
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
                alt={`Hình minh họa môi trường học tập: ${selectedPathway.title}`}
                className="w-full h-44 sm:h-56 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                loading="lazy"
              />
              <figcaption className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                Hình minh họa môi trường học tập, không phải ảnh của một trường cụ thể.
              </figcaption>
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
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-900 dark:text-white">
                Cơ hội việc làm &amp; hướng đi tiếp
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedPathway.careerOpportunities}
              </p>
            </div>
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

          {/* Người thật, việc thật */}
          <div className="pt-2 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Người thật, việc thật (Chia sẻ của người làm nghề &amp; cựu học sinh)
            </h4>
            {selectedPathway.realStories.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                Nhà trường đang cập nhật thêm video hoặc bài chia sẻ cho lộ trình này.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPathway.realStories.map((story) => {
                  const thumb = getYouTubeThumbnailUrl(story.url);
                  const hasThumb = Boolean(thumb) && !failedThumbIds[story.id];
                  const questions =
                    story.suggestedQuestions &&
                    story.suggestedQuestions.length > 0
                      ? story.suggestedQuestions
                      : DEFAULT_PRACTITIONER_QUESTIONS;

                  return (
                    <div
                      key={story.id}
                      className="rounded-xl bg-[#EFCFE3]/25 dark:bg-[#EFCFE3]/10 border border-[#EA9AB2]/50 dark:border-slate-700 overflow-hidden flex flex-col justify-between"
                    >
                      {hasThumb && thumb ? (
                        <a
                          href={story.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block relative aspect-video bg-slate-900 overflow-hidden group"
                        >
                          <img
                            src={thumb}
                            alt={`Ảnh xem trước video: ${story.title}`}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedThumbIds((prev) => ({
                                ...prev,
                                [story.id]: true,
                              }))
                            }
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
                            <span className="text-xs font-semibold text-white inline-flex items-center gap-1.5">
                              <PlayCircle className="w-4 h-4" />
                              <span>Mở video YouTube trong tab mới</span>
                            </span>
                          </div>
                        </a>
                      ) : null}

                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold flex items-center gap-1.5">
                              <PlayCircle className="w-4 h-4 text-[#9D2950] dark:text-[#EA9AB2] shrink-0" />
                              <span>{story.title}</span>
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              {story.personDesc}
                            </p>
                          </div>
                          <a
                            href={story.url}
                            onClick={(e) => {
                              if (story.url.startsWith("#")) e.preventDefault();
                            }}
                            target={
                              story.url.startsWith("http")
                                ? "_blank"
                                : undefined
                            }
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2] inline-flex items-center gap-1 shrink-0 hover:underline"
                          >
                            <span>
                              {story.url.startsWith("http")
                                ? "Mở tab mới"
                                : "Xem minh họa"}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        <div className="p-3 rounded-lg bg-white/80 dark:bg-[#0F171E] border border-slate-200/70 dark:border-slate-800 space-y-1.5 text-xs">
                          <p className="font-semibold text-[#133C42] dark:text-[#B3DEE2] flex items-center gap-1.5">
                            <MessageSquareMore className="w-3.5 h-3.5" />
                            <span>
                              2 câu hỏi gợi ý khi em gặp người làm nghề:
                            </span>
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                            {questions.slice(0, 2).map((q, idx) => (
                              <li key={idx}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
