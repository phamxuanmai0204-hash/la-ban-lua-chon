import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Briefcase,
  CheckCircle2,
  Compass,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  INTEREST_QUIZ_QUESTIONS,
  buildFallbackInterestAnalysis,
  buildInterestQuizResult,
  evaluateInterestQuiz,
  formatMbtiDetail,
  hollandGroupNames,
  sanitizeInterestQuiz,
} from "../../data/interestQuiz";
import { HOLLAND_GROUPS } from "../../data/hollandGroups";
import { requestInterestProfileAnalysis } from "../../services/ai";
import type {
  HollandGroupId,
  InterestQuizAnswer,
  InterestQuizResult,
  Student,
} from "../../types";

interface InterestQuizProps {
  student: Student;
  onUpdateStudent: (updated: Student) => void;
}

const MBTI_ROWS: {
  key: keyof InterestQuizResult["mbtiDetail"];
  label: string;
  pair: string;
}[] = [
  { key: "EI", label: "Hướng năng lượng", pair: "E / I" },
  { key: "SN", label: "Cách tiếp nhận thông tin", pair: "S / N" },
  { key: "TF", label: "Cách ra quyết định", pair: "T / F" },
  { key: "JP", label: "Cách sắp xếp công việc", pair: "J / P" },
];

const ANALYSIS_BLOCKS: {
  key: "personality" | "interests" | "environment";
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}[] = [
  {
    key: "personality",
    title: "Đặc điểm tính cách & cách tư duy nổi bật (MBTI)",
    icon: Brain,
    accent: "bg-[#B3DEE2]/45 text-[#133C42]",
  },
  {
    key: "interests",
    title: "Nhóm sở thích & hứng thú nghề nghiệp nổi trội (Holland)",
    icon: Briefcase,
    accent: "bg-[#EFCFE3]/70 text-[#4A1A2C]",
  },
  {
    key: "environment",
    title: "Gợi mở môi trường học tập & hướng khám phá tiếp theo",
    icon: Compass,
    accent: "bg-[#EAF2D7] text-[#223A1E]",
  },
];

export const InterestQuiz: React.FC<InterestQuizProps> = ({
  student,
  onUpdateStudent,
}) => {
  const savedResult = sanitizeInterestQuiz(student.profile.interestQuiz);
  const [mode, setMode] = useState<"overview" | "quiz" | "analyzing">(
    "overview"
  );
  const [answers, setAnswers] = useState<Record<string, "A" | "B">>({});
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState("");

  const question = INTEREST_QUIZ_QUESTIONS[index];
  const selected = question ? answers[question.id] : undefined;
  const answeredCount = INTEREST_QUIZ_QUESTIONS.filter(
    (item) => answers[item.id]
  ).length;

  const startQuiz = () => {
    setAnswers({});
    setIndex(0);
    setNotice("");
    setMode("quiz");
  };

  const selectOption = (choice: "A" | "B") => {
    setAnswers((prev) => ({ ...prev, [question.id]: choice }));
  };

  const collectAnswers = (): InterestQuizAnswer[] =>
    INTEREST_QUIZ_QUESTIONS.flatMap((item) => {
      const choice = answers[item.id];
      const option = item.options.find((candidate) => candidate.key === choice);
      if (!choice || !option) return [];
      return [{ questionId: item.id, choice, tag: option.tag }];
    });

  const finishQuiz = async () => {
    const answerList = collectAnswers();
    if (answerList.length < INTEREST_QUIZ_QUESTIONS.length) {
      setNotice("Em cần trả lời đủ 20 câu trước khi xem phân tích.");
      return;
    }

    setNotice("");
    setMode("analyzing");
    const evaluation = evaluateInterestQuiz(answerList);
    let analysis;
    try {
      const aiAnalysis = await requestInterestProfileAnalysis({
        studentCode: student.fullName,
        mbtiType: evaluation.mbtiType,
        mbtiDetail: evaluation.mbtiDetail,
        hollandTop: evaluation.hollandTop.map((id) => ({
          name: requireHollandName(id),
          score: evaluation.scores.holland[id],
        })),
      });
      analysis = {
        ...aiAnalysis,
        source: "ai" as const,
        generatedAt: new Date().toLocaleString("vi-VN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch {
      analysis = buildFallbackInterestAnalysis(evaluation);
    }

    const result = buildInterestQuizResult(answerList, analysis);
    onUpdateStudent({
      ...student,
      profile: {
        ...student.profile,
        interestQuiz: result,
        hollandSelectedIds: result.hollandTop,
        hollandSummaryText: result.summaryText,
      },
    });
    setMode("overview");
  };

  if (mode === "analyzing") {
    return (
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EFCFE3]/70 dark:bg-[#EFCFE3]/15 flex items-center justify-center text-[#9D2950]">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <h3 className="text-lg font-bold">Đang tổng hợp kết quả khám phá bản thân</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Hệ thống đang tính điểm Holland, so sánh 4 cặp xu hướng MBTI và nhờ AI
            diễn giải thành 3 khối nhận định gợi mở. Nếu AI tạm mất kết nối, hệ
            thống sẽ tự dùng bản phân tích dự phòng để em vẫn có kết quả.
          </p>
        </div>
      </section>
    );
  }

  if (mode === "quiz") {
    return (
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFCFE3]/70 dark:bg-[#EFCFE3]/15 flex items-center justify-center text-[#4A1A2C] dark:text-[#EFCFE3]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                Lớp 2. Hứng thú nghề nghiệp
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Chọn phương án giống em nhất ở từng câu. Không có đáp án đúng/sai.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMode("overview")}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Thoát bài làm
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Câu {index + 1}/20</span>
            <span>Đã trả lời {answeredCount}/20</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#E27396] transition-all"
              style={{
                width: `${((index + 1) / INTEREST_QUIZ_QUESTIONS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#EFCFE3] dark:border-slate-700 bg-[#FDF7FA] dark:bg-[#0F171E] p-4 sm:p-5 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9D2950] dark:text-[#EA9AB2]">
            Câu hỏi {index + 1}
          </p>
          <p className="text-base sm:text-lg font-semibold leading-relaxed text-[#1D242B] dark:text-white">
            {question.prompt}
          </p>
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((option) => {
              const isSelected = selected === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => selectOption(option.key)}
                  className={`text-left p-4 rounded-xl border flex items-start gap-3 transition-colors min-h-[56px] ${
                    isSelected
                      ? "bg-[#EFCFE3]/55 dark:bg-[#E27396]/15 border-[#E27396]"
                      : "bg-white dark:bg-[#17222C] border-slate-200 dark:border-slate-700 hover:border-[#EA9AB2]"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 text-xs font-bold ${
                      isSelected
                        ? "bg-[#E27396] border-[#E27396] text-[#1D1519]"
                        : "border-slate-400 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {option.key}
                  </span>
                  <span className="text-sm leading-relaxed">{option.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {notice && (
          <p className="text-sm font-medium text-[#9D2950] dark:text-[#EA9AB2]">
            {notice}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>

          {index < INTEREST_QUIZ_QUESTIONS.length - 1 ? (
            <button
              type="button"
              disabled={!selected}
              onClick={() => setIndex((prev) => prev + 1)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Tiếp theo
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!selected}
              onClick={finishQuiz}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              Xem phân tích khám phá bản thân
            </button>
          )}
        </div>
      </section>
    );
  }

  if (savedResult) {
    return (
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFCFE3]/70 dark:bg-[#EFCFE3]/15 flex items-center justify-center text-[#4A1A2C] dark:text-[#EFCFE3]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                Lớp 2. Hứng thú nghề nghiệp
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Kết quả 20 câu đan xen Holland & MBTI · {savedResult.completedAt}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={startQuiz}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#E27396] text-[#9D2950] dark:text-[#EA9AB2] text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#EFCFE3]/30"
          >
            <RotateCcw className="w-4 h-4" />
            Làm lại trắc nghiệm
          </button>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#EFCFE3]/60 via-[#EA9AB2]/25 to-[#B3DEE2]/35 dark:from-[#E27396]/15 dark:via-[#17222C] dark:to-[#B3DEE2]/10 border border-[#EA9AB2]/50 dark:border-slate-700 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-[#0F171E] text-sm font-bold text-[#9D2950] dark:text-[#EA9AB2]">
              Xu hướng MBTI: {savedResult.mbtiType}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#EAF2D7] text-sm font-semibold text-[#223A1E]">
              Holland nổi trội: {hollandGroupNames(savedResult.hollandTop)}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/70 dark:bg-[#0F171E] text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {savedResult.analysis.source === "ai"
                ? "Phân tích bởi AI"
                : "Phân tích dự phòng khi AI chưa kết nối"}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {formatMbtiDetail(savedResult.mbtiDetail)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Điểm Holland
            </p>
            {savedResult.hollandTop.map((id) => (
              <div key={id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{requireHollandName(id)}</span>
                  <span className="tabular-nums text-slate-500 dark:text-slate-400">
                    {savedResult.scores.holland[id]} điểm
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#E27396]"
                    style={{
                      width: `${(savedResult.scores.holland[id] / 4) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              4 cặp xu hướng MBTI
            </p>
            {MBTI_ROWS.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-600 dark:text-slate-300">{row.label}</span>
                <span className="font-bold text-[#9D2950] dark:text-[#EA9AB2]">
                  {savedResult.mbtiDetail[row.key]}{" "}
                  <span className="font-normal text-slate-400">
                    trong cặp {row.pair}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {ANALYSIS_BLOCKS.map((block) => {
            const Icon = block.icon;
            return (
              <div
                key={block.key}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-4 space-y-2"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${block.accent}`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <p className="text-sm font-bold leading-snug">{block.title}</p>
                </div>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {savedResult.analysis[block.key]}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-[#EAF2D7]/70 dark:bg-[#EAF2D7]/10 border border-[#EAF2D7] dark:border-slate-700 p-3.5 text-xs leading-relaxed text-[#223A1E] dark:text-[#EAF2D7]">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Kết quả này đã được lưu vào hồ sơ và sẽ xuất hiện trong Hồ sơ tổng hợp
            AI gửi tới giáo viên và phụ huynh. Đây là gợi ý để em tự quan sát thêm,
            không phải nhãn cố định hay quyết định thay em.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#EFCFE3]/70 dark:bg-[#EFCFE3]/15 flex items-center justify-center text-[#4A1A2C] dark:text-[#EFCFE3]">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold">
            Lớp 2. Hứng thú nghề nghiệp
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Trắc nghiệm tương tác 20 câu, đan xen Holland (RIASEC) và MBTI.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#FDF7FA] dark:bg-[#0F171E] border border-[#EFCFE3] dark:border-slate-700 p-4 sm:p-5 space-y-3">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          Mỗi câu có hai phương án A và B. Em chọn phương án giống mình nhất, không
          có đáp án đúng hay sai. Khoảng 5–7 phút cho 20 câu.
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
          <li className="rounded-lg bg-white/80 dark:bg-[#17222C] border border-slate-200 dark:border-slate-700 p-3">
            Holland gợi ý 2–3 nhóm hứng thú nổi trội.
          </li>
          <li className="rounded-lg bg-white/80 dark:bg-[#17222C] border border-slate-200 dark:border-slate-700 p-3">
            MBTI so sánh 4 cặp xu hướng E–I, S–N, T–F, J–P.
          </li>
          <li className="rounded-lg bg-white/80 dark:bg-[#17222C] border border-slate-200 dark:border-slate-700 p-3">
            AI diễn giải thành 3 khối nhận định gợi mở.
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={startQuiz}
        className="min-h-[48px] px-5 py-3 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-sm font-bold inline-flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Bắt đầu 20 câu
      </button>
    </section>
  );
};

function requireHollandName(id: HollandGroupId): string {
  return HOLLAND_GROUPS[id].name;
}
