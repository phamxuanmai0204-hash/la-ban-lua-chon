import React, { useEffect, useState } from "react";
import {
  Map,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Info,
  Compass,
  GraduationCap,
  School,
  BookOpen,
  Wrench,
  Briefcase,
  Wallet,
  ClipboardList,
  MapPin,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

interface CategoryMeta {
  icon: LucideIcon;
  tile: string;
  chip: string;
  hero: string;
}

const CATEGORY_META: Record<PathwayCategory, CategoryMeta> = {
  THPT_CONG_LAP: {
    icon: GraduationCap,
    tile: "bg-[#EAF2D7] text-[#223A1E]",
    chip: "bg-[#EAF2D7] text-[#223A1E]",
    hero: "bg-gradient-to-br from-[#EAF2D7]/80 via-white to-[#B3DEE2]/30 dark:from-[#EAF2D7]/10 dark:via-[#17222C] dark:to-[#B3DEE2]/10 border-[#C9DDB8] dark:border-slate-700",
  },
  THPT_TU_THUC: {
    icon: School,
    tile: "bg-[#EFCFE3] text-[#4A1A2C]",
    chip: "bg-[#EFCFE3] text-[#4A1A2C]",
    hero: "bg-gradient-to-br from-[#EFCFE3]/70 via-white to-[#EA9AB2]/25 dark:from-[#EFCFE3]/10 dark:via-[#17222C] dark:to-[#EA9AB2]/10 border-[#EA9AB2] dark:border-slate-700",
  },
  GDTX: {
    icon: BookOpen,
    tile: "bg-[#B3DEE2] text-[#133C42]",
    chip: "bg-[#B3DEE2] text-[#133C42]",
    hero: "bg-gradient-to-br from-[#B3DEE2]/60 via-white to-[#EAF2D7]/40 dark:from-[#B3DEE2]/10 dark:via-[#17222C] dark:to-[#EAF2D7]/10 border-[#9FD3D8] dark:border-slate-700",
  },
  TRUNG_CAP: {
    icon: Wrench,
    tile: "bg-[#EA9AB2]/60 text-[#4A1A2C]",
    chip: "bg-[#EA9AB2]/60 text-[#4A1A2C]",
    hero: "bg-gradient-to-br from-[#EA9AB2]/35 via-white to-[#EFCFE3]/50 dark:from-[#EA9AB2]/10 dark:via-[#17222C] dark:to-[#EFCFE3]/10 border-[#EA9AB2] dark:border-slate-700",
  },
  SO_CAP: {
    icon: Briefcase,
    tile: "bg-[#E6EEF3] text-[#133C42]",
    chip: "bg-[#E6EEF3] text-[#133C42]",
    hero: "bg-gradient-to-br from-[#E6EEF3]/80 via-white to-[#EFCFE3]/30 dark:from-[#B3DEE2]/10 dark:via-[#17222C] dark:to-[#EFCFE3]/10 border-[#C7D7E0] dark:border-slate-700",
  },
};

interface InfoItem {
  name: string;
  detail?: string;
}

interface FieldSection {
  heading?: string;
  items: InfoItem[];
}

function parseInfoItem(raw: string): InfoItem {
  const text = raw.replace(/^[•-]\s*/, "").trim();
  const idx = text.indexOf(": ");
  if (idx === -1) return { name: text };
  return { name: text.slice(0, idx), detail: text.slice(idx + 2) };
}

function parseInfoField(raw: string): {
  intro: string[];
  sections: FieldSection[];
} {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const intro: string[] = [];
  const sections: FieldSection[] = [];
  let current: FieldSection | null = null;

  lines.forEach((line) => {
    if (line.startsWith("•") || line.startsWith("-")) {
      if (!current) {
        current = { items: [] };
        sections.push(current);
      }
      current.items.push(parseInfoItem(line));
      return;
    }
    if (line.endsWith(":") || /^\d+\.\s/.test(line)) {
      current = {
        heading: line.replace(/^\d+\.\s*/, "").replace(/:\s*$/, ""),
        items: [],
      };
      sections.push(current);
      return;
    }
    intro.push(line);
  });

  return { intro, sections };
}

const TONE_CLASSES = {
  blue: "bg-[#B3DEE2]/15 border-[#B3DEE2]/60 dark:bg-[#B3DEE2]/10 dark:border-slate-800",
  pink: "bg-[#EFCFE3]/25 border-[#EA9AB2]/50 dark:bg-[#EFCFE3]/10 dark:border-slate-800",
  mint: "bg-[#EAF2D7]/40 border-[#C9DDB8] dark:bg-[#EAF2D7]/10 dark:border-slate-800",
} as const;

const InfoItemGrid: React.FC<{
  items: InfoItem[];
  initialCount?: number;
  tone?: keyof typeof TONE_CLASSES;
}> = ({ items, initialCount = 8, tone = "mint" }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, initialCount);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {visible.map((item, idx) => {
          const isScore = Boolean(
            item.detail && /^[\d.,;–\-\s]+$/.test(item.detail)
          );
          return (
            <div
              key={`${item.name}-${idx}`}
              className={`rounded-xl border px-3 py-2.5 ${TONE_CLASSES[tone]}`}
            >
              <p className="text-[12.5px] font-semibold leading-snug text-slate-900 dark:text-white">
                {item.name}
              </p>
              {item.detail &&
                (isScore ? (
                  <span className="mt-1 inline-flex items-center rounded-md bg-white/80 dark:bg-[#0F171E] px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-[#9D2950] dark:text-[#EA9AB2]">
                    {item.detail}
                  </span>
                ) : (
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {item.detail}
                  </p>
                ))}
            </div>
          );
        })}
      </div>
      {items.length > initialCount && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="min-h-[34px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-[#E27396] cursor-pointer"
        >
          {expanded
            ? "Thu gọn danh sách"
            : `Xem thêm ${items.length - initialCount} mục`}
        </button>
      )}
    </div>
  );
};

const FactCard: React.FC<{
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  accent?: string;
}> = ({ icon: Icon, title, children, accent = "bg-[#B3DEE2]/25 text-[#133C42]" }) => (
  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#FAFBFD] dark:bg-[#0F171E] p-4 space-y-2">
    <div className="flex items-center gap-2">
      <span
        className={`w-8 h-8 rounded-lg inline-flex items-center justify-center shrink-0 ${accent}`}
      >
        <Icon className="w-4 h-4" />
      </span>
      <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
    </div>
    <div className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
      {children}
    </div>
  </div>
);

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

  const selectedMeta = selectedPathway
    ? CATEGORY_META[selectedPathway.category]
    : null;
  const SelectedIcon = selectedMeta?.icon ?? Compass;
  const schoolInfo = selectedPathway
    ? parseInfoField(selectedPathway.realSchoolNames)
    : { intro: [], sections: [] };
  const tuitionInfo = selectedPathway
    ? parseInfoField(selectedPathway.tuitionEstimate)
    : { intro: [], sections: [] };
  const admissionInfo = selectedPathway
    ? parseInfoField(selectedPathway.admissionCutoff)
    : { intro: [], sections: [] };
  const schoolItems = schoolInfo.sections.flatMap((section) => section.items);

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
              const meta = CATEGORY_META[p.category];
              const Icon = meta.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPathwayId(p.id)}
                  className={`text-left p-3.5 rounded-2xl border-2 transition-all min-h-[44px] cursor-pointer flex flex-col gap-2 ${
                    active
                      ? "bg-white dark:bg-[#17222C] border-[#E27396] ring-2 ring-[#E27396]/20 shadow-sm"
                      : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-200 dark:border-slate-800 hover:border-[#B3DEE2] hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`w-8 h-8 rounded-lg inline-flex items-center justify-center ${meta.tile}`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide ${
                        active
                          ? "text-[#9D2950] dark:text-[#EA9AB2]"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      Hướng {index + 1}
                    </span>
                  </div>
                  <p className="text-sm font-bold leading-snug">{direction.label}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug line-clamp-3">
                    {p.shortSubtitle}
                  </p>
                  {active && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#223A1E] dark:text-[#EAF2D7]">
                      <CheckCircle2 className="w-3 h-3" />
                      Đang xem
                    </span>
                  )}
                </button>
              );
            });
          })}
        </div>
      </section>

      {selectedPathway && selectedMeta && (
        <section className="space-y-4">
          <div className={`rounded-2xl border p-4 sm:p-5 ${selectedMeta.hero}`}>
            <div className="flex flex-col lg:flex-row gap-5">
              {selectedPathway.imageUrl && (
                <figure className="lg:w-80 shrink-0 space-y-1.5">
                  <img
                    src={selectedPathway.imageUrl}
                    alt={
                      selectedPathway.imageCaption ??
                      `Hình minh họa môi trường học tập: ${selectedPathway.title}`
                    }
                    className="w-full h-44 lg:h-52 object-cover rounded-xl border border-white/70 dark:border-slate-700 shadow-sm"
                    loading="lazy"
                  />
                  {selectedPathway.imageCaption && (
                    <figcaption className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                      {selectedPathway.imageCaption}
                    </figcaption>
                  )}
                </figure>
              )}

              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${selectedMeta.chip}`}
                  >
                    <SelectedIcon className="w-3.5 h-3.5" />
                    Thẻ thông tin lộ trình
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/75 dark:bg-[#0F171E]/70 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <Sparkles className="w-3 h-3" />
                    Hướng đi sau lớp 9
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-bold leading-tight">
                    {selectedPathway.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {selectedPathway.shortSubtitle}
                  </p>
                </div>

                {!readOnly && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {selectedPathway.scenario && onTryScenarioForPathway && (
                      <button
                        type="button"
                        onClick={() => onTryScenarioForPathway(selectedPathway.id)}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42] font-semibold text-sm inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Compass className="w-4 h-4" />
                        <span>
                          {experienceButtonLabel(selectedPathway.category)}
                        </span>
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FactCard icon={ClipboardList} title="Điều kiện đầu vào">
              {selectedPathway.entryRequirements}
            </FactCard>
            <FactCard
              icon={BookOpen}
              title="Nội dung học"
              accent="bg-[#EFCFE3] text-[#4A1A2C]"
            >
              {selectedPathway.learningContent}
            </FactCard>
            {(selectedPathway.category === "TRUNG_CAP" ||
              selectedPathway.category === "SO_CAP") && (
              <FactCard
                icon={Briefcase}
                title="Cơ hội việc làm & hướng đi tiếp"
                accent="bg-[#EA9AB2]/50 text-[#4A1A2C]"
              >
                {selectedPathway.careerOpportunities}
              </FactCard>
            )}
            <FactCard
              icon={TrendingUp}
              title="Lộ trình học tiếp"
              accent="bg-[#EAF2D7] text-[#223A1E]"
            >
              <span className="font-semibold text-[#133C42] dark:text-[#B3DEE2]">
                {selectedPathway.articulationPath}
              </span>
            </FactCard>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C] p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#B3DEE2]/40 text-[#133C42] dark:text-[#B3DEE2] inline-flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold">Trường tại TP. Đà Nẵng</h4>
            </div>
            {schoolItems.length === 0 ? (
              <p className="text-sm italic text-slate-500 dark:text-slate-400">
                Nhà trường cập nhật
              </p>
            ) : (
              <InfoItemGrid
                key={`schools-${selectedPathway.id}`}
                items={schoolItems}
                initialCount={8}
                tone="blue"
              />
            )}
            {selectedPathway.realSchoolAddresses.trim() !== "" && (
              <p className="text-[11px] italic leading-relaxed text-slate-500 dark:text-slate-400">
                {selectedPathway.realSchoolAddresses}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C] p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#EAF2D7] text-[#223A1E] inline-flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-bold">Chi phí / học phí ước tính</h4>
              </div>
              {tuitionInfo.intro.length === 0 &&
                tuitionInfo.sections.every(
                  (section) => section.items.length === 0
                ) && (
                  <p className="text-sm italic text-slate-500 dark:text-slate-400">
                    Nhà trường cập nhật
                  </p>
                )}
              {tuitionInfo.intro.map((paragraph, idx) => (
                <p
                  key={`tuition-intro-${idx}`}
                  className="rounded-xl border border-[#C9DDB8] bg-[#EAF2D7]/40 dark:bg-[#EAF2D7]/10 dark:border-slate-800 px-3.5 py-3 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200"
                >
                  {paragraph}
                </p>
              ))}
              {tuitionInfo.sections.map((section, idx) => (
                <div key={`tuition-section-${idx}`} className="space-y-2">
                  {section.heading && (
                    <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
                      {section.heading}
                    </p>
                  )}
                  {section.items.length > 0 && (
                    <InfoItemGrid
                      key={`tuition-${selectedPathway.id}-${idx}`}
                      items={section.items}
                      initialCount={6}
                      tone="mint"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C] p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#EFCFE3] text-[#4A1A2C] inline-flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-bold">Tuyển sinh / điểm chuẩn</h4>
              </div>
              {admissionInfo.intro.length === 0 &&
                admissionInfo.sections.every(
                  (section) => section.items.length === 0
                ) && (
                  <p className="text-sm italic text-slate-500 dark:text-slate-400">
                    Nhà trường cập nhật
                  </p>
                )}
              {admissionInfo.intro.map((paragraph, idx) => (
                <p
                  key={`admission-intro-${idx}`}
                  className="rounded-xl border border-[#EA9AB2]/60 bg-[#EFCFE3]/35 dark:bg-[#EFCFE3]/10 dark:border-slate-800 px-3.5 py-3 text-[13px] leading-relaxed text-slate-800 dark:text-slate-100"
                >
                  {paragraph}
                </p>
              ))}
              {admissionInfo.sections.map((section, idx) => (
                <div key={`admission-section-${idx}`} className="space-y-2">
                  {section.heading && (
                    <p className="inline-flex items-center rounded-full bg-[#EFCFE3]/70 dark:bg-[#EFCFE3]/15 px-2.5 py-1 text-[11px] font-bold text-[#4A1A2C] dark:text-[#EFCFE3]">
                      {section.heading}
                    </p>
                  )}
                  {section.items.length > 0 && (
                    <InfoItemGrid
                      key={`admission-${selectedPathway.id}-${idx}`}
                      items={section.items}
                      initialCount={6}
                      tone="pink"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
