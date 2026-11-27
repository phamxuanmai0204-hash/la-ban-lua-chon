import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  MapPin,
  CheckCircle2,
  PenLine,
  Send,
  Sparkles,
  Compass,
  PlayCircle,
  ExternalLink,
  MessageSquareMore,
  RotateCcw,
} from "lucide-react";
import {
  DEFAULT_PRACTITIONER_QUESTIONS,
  JOURNEY_STEPS,
} from "../../data/mockData";
import { getYouTubeThumbnailUrl } from "../../utils/youtube";
import type {
  CareerScenarioChoice,
  Experience,
  JournalReflection3Q,
  JournalEntry,
  JourneyStep,
  Pathway,
  Student,
} from "../../types";

interface TryAndJournalProps {
  student: Student;
  pathways: Pathway[];
  experiences: Experience[];
  focusedPathwayId?: string | null;
  onUpdateStudent: (updated: Student) => void;
  onJournalSubmittedWithAI: (
    entryText: string,
    activityType: string
  ) => Promise<void>;
  onStepCompleted: (step: JourneyStep, message: string) => void;
}

const FEEDBACK_SUGGESTIONS = {
  saw: [
    "Em thấy hoạt động diễn ra sôi nổi, mọi người phối hợp nhịp nhàng.",
    "Em thấy cách hướng dẫn và chuẩn bị dụng cụ khá rõ ràng.",
    "Em thấy không khí sinh hoạt khác với giờ học trên lớp.",
  ],
  felt: [
    "Em thấy khá tự tin và hào hứng khi được thử.",
    "Em hơi lo vì chưa quen, nhưng muốn thử thêm.",
    "Em thấy thoải mái vì được làm theo nhịp của mình.",
  ],
  changedMind: [
    "Em muốn tìm hiểu thêm về hoạt động này.",
    "Em cân nhắc lại mức độ phù hợp của lộ trình đang chọn.",
    "Em thấy yên tâm hơn vì biết mình cần chuẩn bị gì.",
  ],
};

const isThptCategory = (category: Pathway["category"]) =>
  category === "THPT_CONG_LAP" || category === "THPT_TU_THUC";

interface ActivityFeedbackFormProps {
  activity: Experience;
  onSave: (activity: Experience, reflection: JournalReflection3Q) => Promise<void>;
}

const ActivityFeedbackForm: React.FC<ActivityFeedbackFormProps> = ({
  activity,
  onSave,
}) => {
  const [saw, setSaw] = useState("");
  const [felt, setFelt] = useState("");
  const [changedMind, setChangedMind] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateField = (
    field: "saw" | "felt" | "changedMind",
    value: string
  ) => {
    if (field === "saw") setSaw(value);
    else if (field === "felt") setFelt(value);
    else setChangedMind(value);
    setSaved(false);
  };

  const appendSuggestion = (
    field: "saw" | "felt" | "changedMind",
    suggestion: string
  ) => {
    const current = field === "saw" ? saw : field === "felt" ? felt : changedMind;
    updateField(field, current.trim() ? `${current.trim()} ${suggestion}` : suggestion);
  };

  const canSave = Boolean(saw.trim() || felt.trim() || changedMind.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave(activity, {
        saw: saw.trim(),
        felt: felt.trim(),
        changedMind: changedMind.trim(),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const renderQuestion = (
    field: "saw" | "felt" | "changedMind",
    label: string,
    value: string,
    placeholder: string
  ) => (
    <div className="space-y-1.5">
      <label
        htmlFor={`feedback-${activity.id}-${field}`}
        className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
      >
        {label}
      </label>
      <textarea
        id={`feedback-${activity.id}-${field}`}
        rows={3}
        value={value}
        onChange={(e) => updateField(field, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F171E] p-3 text-sm"
      />
      <div className="flex flex-wrap gap-1.5">
        {FEEDBACK_SUGGESTIONS[field].map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => appendSuggestion(field, suggestion)}
            className="min-h-[32px] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:border-[#E27396] text-[11px] leading-snug text-left cursor-pointer"
          >
            + {suggestion}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-[#9D2950] dark:text-[#EA9AB2]">
            {activity.activityType}
          </p>
          <h4 className="text-sm sm:text-base font-bold leading-snug">
            {activity.title}
          </h4>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF2D7] text-[#223A1E] px-2 py-0.5 text-[10px] font-bold">
          <CheckCircle2 className="w-3 h-3" />
          Đã đăng kí
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {renderQuestion(
          "saw",
          "1. Em thấy gì?",
          saw,
          "Ví dụ: Em thấy các anh chị thực hành ngay tại xưởng..."
        )}
        {renderQuestion(
          "felt",
          "2. Em cảm thấy thế nào?",
          felt,
          "Ví dụ: Em thấy tự tin hơn khi được cầm tay chỉ việc..."
        )}
        {renderQuestion(
          "changedMind",
          "3. Điều đó làm thay đổi suy nghĩ của em như thế nào?",
          changedMind,
          "Ví dụ: Em không còn nghĩ phải chọn ngôi trường 'tốt nhất' ngay từ đầu..."
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Phiếu này được lưu vào nhật ký và tổng hợp vào Hồ sơ AI.
        </span>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs font-semibold text-[#223A1E] dark:text-[#EAF2D7]">
              ✓ Đã lưu phiếu cảm nhận
            </span>
          )}
          <button
            type="submit"
            disabled={saving || !canSave}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-50 text-[#1D1519] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{saving ? "Đang lưu..." : "Lưu phiếu cảm nhận"}</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export const TryAndJournal: React.FC<TryAndJournalProps> = ({
  student,
  pathways,
  experiences,
  focusedPathwayId,
  onUpdateStudent,
  onJournalSubmittedWithAI,
  onStepCompleted,
}) => {
  const pathwaysWithScenario = useMemo(
    () => pathways.filter((p) => Boolean(p.scenario)),
    [pathways]
  );

  const defaultScenarioPathwayId = useMemo(() => {
    if (
      focusedPathwayId &&
      pathwaysWithScenario.some((p) => p.id === focusedPathwayId)
    ) {
      return focusedPathwayId;
    }
    const chosenOpt = student.consideredOptions.find(
      (o) => o.status === "Đã chọn" && o.pathwayId !== "custom"
    );
    if (
      chosenOpt &&
      pathwaysWithScenario.some((p) => p.id === chosenOpt.pathwayId)
    ) {
      return chosenOpt.pathwayId;
    }
    return pathwaysWithScenario[0]?.id || pathways[0]?.id || "";
  }, [focusedPathwayId, pathwaysWithScenario, pathways, student.consideredOptions]);

  // Interactive Scenario State
  const [scenarioPathwayId, setScenarioPathwayId] = useState<string>(
    defaultScenarioPathwayId
  );
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [scenarioHistory, setScenarioHistory] = useState<
    { nodePrompt: string; choice: CareerScenarioChoice }[]
  >([]);
  const [scenarioDone, setScenarioDone] = useState(false);
  const [scenarioReflection, setScenarioReflection] = useState("");
  const [scenarioSavedMsg, setScenarioSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (focusedPathwayId) {
      setScenarioPathwayId(focusedPathwayId);
    }
  }, [focusedPathwayId]);

  const activeScenarioPathway = pathways.find((p) => p.id === scenarioPathwayId);
  const activeScenario = activeScenarioPathway?.scenario;
  const isShortAnswer = activeScenario?.responseMode === "shortAnswer";
  const activeAudience: Experience["audience"] = activeScenarioPathway
    ? isThptCategory(activeScenarioPathway.category)
      ? "thpt"
      : "vocational"
    : undefined;

  const scenarioActivities = useMemo(
    () =>
      activeAudience
        ? experiences.filter((item) => item.audience === activeAudience)
        : [],
    [experiences, activeAudience]
  );

  const registeredActivities = useMemo(
    () =>
      experiences.filter((item) =>
        student.joinedExperienceIds.includes(item.id)
      ),
    [experiences, student.joinedExperienceIds]
  );

  useEffect(() => {
    if (activeScenario) {
      setCurrentNodeId(activeScenario.startNodeId);
      setScenarioHistory([]);
      setScenarioDone(false);
      setScenarioReflection("");
      setScenarioSavedMsg(null);
    }
  }, [scenarioPathwayId, activeScenario]);

  const currentNode = activeScenario?.nodes.find(
    (n) => n.id === currentNodeId
  );

  // Timeline filters
  const [filterStep, setFilterStep] = useState<"ALL" | JourneyStep>("ALL");
  const [filterPathway, setFilterPathway] = useState<string>("ALL");

  // Real stories thumbnails
  const [failedThumbIds, setFailedThumbIds] = useState<Record<string, boolean>>(
    {}
  );

  const storiesToShow = useMemo(() => {
    const allStories = pathways.flatMap((p) =>
      p.realStories.map((story) => ({
        pathwayId: p.id,
        pathwayTitle: p.title,
        story,
      }))
    );
    return allStories;
  }, [pathways]);

  const handlePickScenarioChoice = (choice: CareerScenarioChoice) => {
    if (!currentNode) return;
    setScenarioHistory((prev) => [
      ...prev,
      { nodePrompt: currentNode.prompt, choice },
    ]);
    if (choice.nextNodeId) {
      setCurrentNodeId(choice.nextNodeId);
    } else {
      setCurrentNodeId(null);
      setScenarioDone(true);
    }
  };

  const handleRestartScenario = () => {
    if (!activeScenario) return;
    setCurrentNodeId(activeScenario.startNodeId);
    setScenarioHistory([]);
    setScenarioDone(false);
    setScenarioReflection("");
    setScenarioSavedMsg(null);
  };

  const handleSaveScenarioReflection = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = scenarioReflection.trim();
    if (!clean || !activeScenarioPathway) return;

    const today = new Date().toISOString().slice(0, 10);
    const nextReflections = [
      {
        id: `sr-${Date.now()}`,
        pathwayId: activeScenarioPathway.id,
        pathwayTitle: activeScenarioPathway.title,
        chosenPathLabels: scenarioHistory.map((h) => h.choice.label),
        reflection: clean,
        date: today,
      },
      ...(student.scenarioReflections || []),
    ];

    const journalEntry: JournalEntry = {
      id: `j-sc-${Date.now()}`,
      date: today,
      step: "THỬ",
      pathwayId: activeScenarioPathway.id,
      pathwayTitle: activeScenarioPathway.title,
      activityType: "Bài tập tình huống nghề",
      content: `[Thử một ngày theo lộ trình – ${activeScenarioPathway.title}] ${clean}`,
    };

    // Gọi trước để phần cập nhật bên dưới (dựa trên bản student mới nhất)
    // không bị ghi đè bởi snapshot cũ mà onStepCompleted đang giữ.
    onStepCompleted(
      "THỬ",
      "Em đã hoàn thành tình huống thử và tự nhận ra điểm hợp – chưa hợp với bản thân."
    );
    onUpdateStudent({
      ...student,
      currentStep:
        student.currentStep === "THU" || student.currentStep === "LỌC"
          ? "THỬ"
          : student.currentStep,
      completedSteps: Array.from(
        new Set([...(student.completedSteps || []), "THỬ"])
      ),
      scenarioReflections: nextReflections,
      journal: [journalEntry, ...student.journal],
    });

    setScenarioReflection("");
    setScenarioSavedMsg(
      "Đã lưu cảm nhận về tình huống nghề vào nhật ký của em."
    );
  };

  const handleToggleJoinActivity = (activity: Experience) => {
    const joined = student.joinedExperienceIds.includes(activity.id);
    const nextIds = joined
      ? student.joinedExperienceIds.filter((id) => id !== activity.id)
      : [...student.joinedExperienceIds, activity.id];

    onUpdateStudent({
      ...student,
      currentStep:
        student.currentStep === "THU" || student.currentStep === "LỌC"
          ? "THỬ"
          : student.currentStep,
      joinedExperienceIds: nextIds,
    });
  };

  const handleSaveActivityFeedback = async (
    activity: Experience,
    reflection: JournalReflection3Q
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const content = [
      reflection.saw ? `Em thấy gì: ${reflection.saw}` : "",
      reflection.felt ? `Em cảm thấy thế nào: ${reflection.felt}` : "",
      reflection.changedMind
        ? `Điều đó làm thay đổi suy nghĩ của em như thế nào: ${reflection.changedMind}`
        : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const newEntry: JournalEntry = {
      id: `j-${Date.now()}`,
      date: today,
      step: "THỬ",
      activityType: activity.title,
      content,
      reflection3Q: reflection,
    };

    onStepCompleted(
      "THỬ",
      "Em đã ghi lại cảm nhận sau hoạt động trải nghiệm vào nhật ký."
    );
    onUpdateStudent({
      ...student,
      currentStep:
        student.currentStep === "THU" || student.currentStep === "LỌC"
          ? "THỬ"
          : student.currentStep,
      completedSteps: Array.from(
        new Set([...(student.completedSteps || []), "THỬ"])
      ),
      journal: [newEntry, ...student.journal],
    });

    try {
      await onJournalSubmittedWithAI(content, activity.title);
    } catch {
      // Việc lưu phiếu không phụ thuộc vào phản hồi của trợ lí.
    }
  };

  const filteredJournal = useMemo(() => {
    return student.journal.filter((entry) => {
      const entryStep = entry.step || "THỬ";
      if (filterStep !== "ALL" && entryStep !== filterStep) return false;
      if (filterPathway !== "ALL" && entry.pathwayId !== filterPathway) {
        return false;
      }
      return true;
    });
  }, [student.journal, filterStep, filterPathway]);

  return (
    <div className="space-y-6">
      {/* 1.3A: Thử một ngày theo lộ trình (tình huống tương tác) */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B3DEE2]/50 dark:bg-[#B3DEE2]/15 flex items-center justify-center text-[#133C42] dark:text-[#B3DEE2]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Thử một ngày theo lộ trình
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Thử đặt mình vào nhịp học và làm việc thực tế của từng lộ trình — không chấm điểm đúng sai.
              </p>
            </div>
          </div>

          <select
            aria-label="Chọn lộ trình để thử một ngày theo lộ trình"
            value={scenarioPathwayId}
            onChange={(e) => setScenarioPathwayId(e.target.value)}
            className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm"
          >
            {pathwaysWithScenario.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {activeScenario ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#1D242B] dark:text-white">
                  {activeScenario.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  {activeScenario.intro}
                </p>
              </div>
              {scenarioHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleRestartScenario}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Thử lại từ đầu</span>
                </button>
              )}
            </div>

            {scenarioHistory.length > 0 && (
              <div className="space-y-2.5">
                {scenarioHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#17222C] border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-sm"
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Lựa chọn bước {idx + 1}: {item.choice.label}
                    </p>
                    <p className="text-[#133C42] dark:text-[#B3DEE2] font-medium">
                      {item.choice.outcomeNote}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {isShortAnswer && activeScenario ? (
              <form
                onSubmit={handleSaveScenarioReflection}
                className="p-4 rounded-xl bg-[#EAF2D7]/55 dark:bg-[#EAF2D7]/10 border border-[#8FB37C] space-y-3"
              >
                <p className="text-sm sm:text-[15px] font-semibold leading-relaxed text-[#1D242B] dark:text-white">
                  {activeScenario.shortAnswerPrompt}
                </p>

                {activeScenario.shortAnswerSuggestions &&
                  activeScenario.shortAnswerSuggestions.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Gợi ý ý tưởng — chạm để chèn vào câu trả lời của em:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {activeScenario.shortAnswerSuggestions.map((sg) => (
                          <button
                            key={sg}
                            type="button"
                            onClick={() =>
                              setScenarioReflection((prev) =>
                                prev.trim() ? `${prev.trim()} ${sg}` : sg
                              )
                            }
                            className="text-left min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:border-[#E27396] text-xs leading-relaxed cursor-pointer"
                          >
                            {sg}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                <label
                  htmlFor="scenario-short-answer"
                  className="block text-xs sm:text-sm font-semibold text-[#223A1E] dark:text-[#EAF2D7]"
                >
                  Câu trả lời của em
                </label>
                <textarea
                  id="scenario-short-answer"
                  rows={4}
                  value={scenarioReflection}
                  onChange={(e) => setScenarioReflection(e.target.value)}
                  placeholder="Em viết ngắn gọn theo cách hiểu của mình..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F171E] p-3 text-sm"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    Không chấm điểm — điều em viết giúp em hiểu rõ cảm giác thật của mình.
                  </span>
                  <button
                    type="submit"
                    disabled={!scenarioReflection.trim()}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-50 text-[#1D1519] text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    Lưu cảm nhận
                  </button>
                </div>
              </form>
            ) : (
              <>
                {currentNode && !scenarioDone && (
                  <div className="space-y-3 pt-1">
                    <p className="text-sm sm:text-[15px] font-semibold leading-relaxed text-[#1D242B] dark:text-white">
                      {currentNode.prompt}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentNode.choices.map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => handlePickScenarioChoice(ch)}
                          className="text-left p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:border-[#E27396] hover:bg-[#EFCFE3]/20 text-sm leading-relaxed transition-colors min-h-[44px] cursor-pointer"
                        >
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {scenarioDone && (
                  <form
                    onSubmit={handleSaveScenarioReflection}
                    className="p-4 rounded-xl bg-[#EAF2D7]/55 dark:bg-[#EAF2D7]/10 border border-[#8FB37C] space-y-3"
                  >
                    <label
                      htmlFor="scenario-reflection-input"
                      className="block text-sm font-bold text-[#223A1E] dark:text-[#EAF2D7]"
                    >
                      {activeScenario.reflectionPrompt}
                    </label>
                    <textarea
                      id="scenario-reflection-input"
                      rows={2}
                      value={scenarioReflection}
                      onChange={(e) => setScenarioReflection(e.target.value)}
                      placeholder="Ví dụ: Em thấy mình hợp với phần làm thực hành theo nhóm, nhưng còn ngại phần đứng xưởng lâu..."
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F171E] p-3 text-sm"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        Không chấm điểm — câu trả lời giúp em hiểu rõ cảm giác thật của mình.
                      </span>
                      <button
                        type="submit"
                        disabled={!scenarioReflection.trim()}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-50 text-[#1D1519] text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        Lưu cảm nhận
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {scenarioSavedMsg && (
              <p className="text-xs sm:text-sm font-medium text-[#223A1E] dark:text-[#EAF2D7]">
                ✓ {scenarioSavedMsg}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">
            Giáo viên chưa tạo tình huống cho lộ trình này.
          </p>
        )}

        {/* Hoạt động trải nghiệm THỬ — thay đổi theo lộ trình đang chọn */}
        <div id="try-activities" className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B3DEE2]/50 dark:bg-[#B3DEE2]/15 flex items-center justify-center text-[#133C42] dark:text-[#B3DEE2]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Hoạt động trải nghiệm THỬ
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Danh sách thay đổi theo lộ trình đang chọn — em có thể đăng kí một hoặc nhiều hoạt động để thử.
              </p>
            </div>
          </div>
          {activeScenarioPathway && (
            <span className="self-start inline-flex items-center rounded-full bg-[#B3DEE2]/40 dark:bg-[#B3DEE2]/15 text-[#133C42] dark:text-[#B3DEE2] px-3 py-1 text-[11px] font-semibold">
              {activeScenarioPathway.title}
            </span>
          )}
        </div>

        {scenarioActivities.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            Chưa có hoạt động trải nghiệm nào cho lộ trình này.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenarioActivities.map((act) => {
              const joined = student.joinedExperienceIds.includes(act.id);
              return (
                <div
                  key={act.id}
                  className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#9D2950] dark:text-[#EA9AB2]">
                      {act.activityType}
                    </p>
                    <h4 className="text-sm sm:text-base font-bold leading-snug">
                      {act.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {act.description}
                    </p>
                    <div className="pt-1 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{act.dateLabel}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{act.location}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleJoinActivity(act)}
                    className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      joined
                        ? "bg-[#EAF2D7] dark:bg-[#EAF2D7]/20 text-[#223A1E] dark:text-[#EAF2D7]"
                        : "bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42]"
                    }`}
                  >
                    {joined ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã đăng kí tham gia thử</span>
                      </>
                    ) : (
                      <span>Đăng kí tham gia thử</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        </div>

        {activeScenarioPathway &&
          (activeScenarioPathway.category === "TRUNG_CAP" ||
            activeScenarioPathway.category === "SO_CAP") && (
            <div id="try-real-stories" className="pt-5 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-[#EAF2D7] dark:bg-[#EAF2D7]/15 flex items-center justify-center text-[#223A1E] dark:text-[#EAF2D7] shrink-0">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Người thật, việc thật</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    Lắng nghe video và câu chuyện chia sẻ từ những cựu học sinh
                    trưởng thành, vững vàng từ lộ trình Trung cấp nghề hoặc Sơ
                    cấp nghề.
                  </p>
                </div>
              </div>
            </div>
          )}
      </section>

      {/* Danh sách video & câu chuyện (chỉ hiện khi có dữ liệu) */}
      {storiesToShow.length > 0 && (
        <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-bold">
              Video &amp; Câu chuyện người làm nghề ({storiesToShow.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {storiesToShow.map(({ pathwayTitle, story }) => {
                const thumb = getYouTubeThumbnailUrl(story.url);
                const hasThumb = Boolean(thumb) && !failedThumbIds[story.id];
                const questions =
                  story.suggestedQuestions && story.suggestedQuestions.length > 0
                    ? story.suggestedQuestions
                    : DEFAULT_PRACTITIONER_QUESTIONS;

                return (
                  <div
                    key={story.id}
                    className="rounded-xl bg-[#EFCFE3]/25 dark:bg-[#EFCFE3]/10 border border-[#EA9AB2]/50 dark:border-slate-700 overflow-hidden flex flex-col justify-between"
                  >
                    {hasThumb && thumb && (
                      <a
                        href={story.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative aspect-video bg-slate-900 overflow-hidden"
                      >
                        <img
                          src={thumb}
                          alt={`Xem trước video ${story.title}`}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedThumbIds((prev) => ({
                              ...prev,
                              [story.id]: true,
                            }))
                          }
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-3">
                          <span className="text-xs font-semibold text-white inline-flex items-center gap-1.5">
                            <PlayCircle className="w-4 h-4" />
                            <span>Mở video trong tab mới</span>
                          </span>
                        </div>
                      </a>
                    )}

                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-[#9D2950] dark:text-[#EA9AB2] font-medium">
                            {pathwayTitle}
                          </p>
                          <p className="text-sm font-bold mt-0.5">
                            {story.title}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                            {story.personDesc}
                          </p>
                        </div>
                        <a
                          href={story.url}
                          onClick={(e) => {
                            if (story.url.startsWith("#")) e.preventDefault();
                          }}
                          target={
                            story.url.startsWith("http") ? "_blank" : undefined
                          }
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2] inline-flex items-center gap-1 shrink-0 hover:underline"
                        >
                          <span>
                            {story.url.startsWith("http")
                              ? "Mở tab mới"
                              : "Minh họa"}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="p-3 rounded-lg bg-white/85 dark:bg-[#0F171E] border border-slate-200/70 dark:border-slate-800 space-y-1.5 text-xs">
                        <p className="font-semibold text-[#133C42] dark:text-[#B3DEE2] flex items-center gap-1.5">
                          <MessageSquareMore className="w-3.5 h-3.5" />
                          <span>
                            2 câu hỏi gợi ý em có thể hỏi người làm nghề:
                          </span>
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
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
          </div>
        </section>
      )}

      {/* 1.3C & 1.4: Nhật ký thông minh + Phiếu cảm nhận + Timeline */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFCFE3]/70 dark:bg-[#EFCFE3]/15 flex items-center justify-center text-[#4A1A2C] dark:text-[#EFCFE3]">
            <PenLine className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              Nhật ký thông minh &amp; Phiếu cảm nhận
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Mỗi hoạt động em đã đăng kí có một phiếu cảm nhận 3 câu riêng. Câu trả lời được lưu vào nhật ký và tổng hợp vào Hồ sơ AI gửi giáo viên, phụ huynh.
            </p>
          </div>
        </div>

        {registeredActivities.length === 0 ? (
          <div className="p-5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
            <Sparkles className="w-7 h-7 mx-auto text-slate-400" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Em chưa đăng kí hoạt động trải nghiệm nào nên chưa có phiếu cảm nhận.
            </p>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("try-activities")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42] text-xs sm:text-sm font-semibold cursor-pointer"
            >
              Quay lại đăng kí hoạt động
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Đã đăng kí {registeredActivities.length} hoạt động — em hoàn thành phiếu cảm nhận cho từng hoạt động đã tham gia.
            </p>
            {registeredActivities.map((activity) => (
              <ActivityFeedbackForm
                key={activity.id}
                activity={activity}
                onSave={handleSaveActivityFeedback}
              />
            ))}
          </div>
        )}

        {/* Timeline & Filters */}
        <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Dòng thời gian nhật ký ({filteredJournal.length}/
              {student.journal.length})
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Lọc nhật ký theo bước"
                value={filterStep}
                onChange={(e) =>
                  setFilterStep(e.target.value as "ALL" | JourneyStep)
                }
                className="min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-2.5 py-1 text-xs font-medium"
              >
                <option value="ALL">Tất cả các bước</option>
                {JOURNEY_STEPS.map((st) => (
                  <option key={st.id} value={st.id}>
                    Bước {st.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Lọc nhật ký theo phương án"
                value={filterPathway}
                onChange={(e) => setFilterPathway(e.target.value)}
                className="min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-2.5 py-1 text-xs font-medium"
              >
                <option value="ALL">Tất cả phương án</option>
                {pathways.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredJournal.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-dashed border-slate-300 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
              <BookOpen className="w-7 h-7 mx-auto mb-2 text-slate-400" />
              {student.journal.length === 0
                ? "Em chưa viết mục nhật ký nào. Hãy ghi lại cảm nhận đầu tiên sau khi thử trải nghiệm nhé."
                : "Không có mục nhật ký nào khớp bộ lọc bước / phương án đang chọn."}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJournal.map((j) => (
                <article
                  key={j.id}
                  className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-[#9D2950] dark:text-[#EA9AB2]">
                      Bước {j.step || "THỬ"}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {j.activityType}
                    </span>
                    {j.pathwayTitle && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#133C42] dark:text-[#B3DEE2] font-medium">
                          {j.pathwayTitle}
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{j.date}</span>
                  </div>

                  {j.reflection3Q ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs sm:text-sm pt-1">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#17222C] border border-slate-200/60 dark:border-slate-800">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Em thấy gì
                        </p>
                        <p className="mt-0.5 leading-relaxed">
                          {j.reflection3Q.saw || "—"}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#17222C] border border-slate-200/60 dark:border-slate-800">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Em cảm thấy thế nào
                        </p>
                        <p className="mt-0.5 leading-relaxed">
                          {j.reflection3Q.felt || "—"}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#17222C] border border-slate-200/60 dark:border-slate-800">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Thay đổi suy nghĩ?
                        </p>
                        <p className="mt-0.5 leading-relaxed">
                          {j.reflection3Q.changedMind || "—"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm sm:text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">
                      {j.content}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
