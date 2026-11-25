import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Calendar,
  MapPin,
  CheckCircle2,
  PenLine,
  Send,
  Sparkles,
  Mic,
  MicOff,
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

const ACTIVITY_TYPES = [
  "Tham quan xưởng thực hành",
  "Giao lưu người làm nghề",
  "Bài tập tình huống nghề",
  "Suy ngẫm cá nhân",
  "Trò chuyện cùng gia đình",
];

const SENTENCE_STARTERS = [
  "Hôm nay em nhận ra… ",
  "Điều làm em phân vân là… ",
  "Sau khi thử trải nghiệm, em thấy mình… ",
  "Điều khiến em yên tâm hơn về hướng đi này là… ",
];

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [idx: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
}

function getSpeechRecognitionConstructor():
  | (new () => BrowserSpeechRecognition)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

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

  // Journal & 3Q Reflection State
  const [composerMode, setComposerMode] = useState<"free" | "three_q">(
    "three_q"
  );
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
  const [journalPathwayId, setJournalPathwayId] = useState<string>(
    defaultScenarioPathwayId
  );
  const [journalContent, setJournalContent] = useState("");
  const [qSaw, setQSaw] = useState("");
  const [qFelt, setQFelt] = useState("");
  const [qChanged, setQChanged] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Timeline filters
  const [filterStep, setFilterStep] = useState<"ALL" | JourneyStep>("ALL");
  const [filterPathway, setFilterPathway] = useState<string>("ALL");

  // Voice Input (Web Speech API vi-VN)
  const speechSupported = useMemo(
    () => Boolean(getSpeechRecognitionConstructor()),
    []
  );
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const journalTextareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleToggleVoice = () => {
    const SpeechCtor = getSpeechRecognitionConstructor();
    if (!SpeechCtor) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechCtor();
    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + " ";
      }
      const cleanTranscript = transcript.trim();
      if (cleanTranscript) {
        setJournalContent((prev) =>
          prev.trim() ? `${prev.trim()} ${cleanTranscript}` : cleanTranscript
        );
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

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

    onUpdateStudent({
      ...student,
      currentStep:
        student.currentStep === "THU" || student.currentStep === "LỌC"
          ? "THỬ"
          : student.currentStep,
      scenarioReflections: nextReflections,
      journal: [journalEntry, ...student.journal],
    });

    setScenarioReflection("");
    setScenarioSavedMsg(
      "Đã lưu cảm nhận về tình huống nghề vào nhật ký của em."
    );
    onStepCompleted(
      "THỬ",
      "Em đã hoàn thành tình huống thử và tự nhận ra điểm hợp – chưa hợp với bản thân."
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

    if (!joined) {
      setActivityType(activity.activityType);
    }
  };

  const handleAddJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPw = pathways.find((p) => p.id === journalPathwayId);
    const today = new Date().toISOString().slice(0, 10);

    let finalContent = "";
    let reflection3Q: JournalEntry["reflection3Q"] | undefined = undefined;

    if (composerMode === "three_q") {
      if (!qSaw.trim() && !qFelt.trim() && !qChanged.trim()) return;
      reflection3Q = {
        saw: qSaw.trim(),
        felt: qFelt.trim(),
        changedMind: qChanged.trim(),
      };
      finalContent = [
        qSaw.trim() ? `Em thấy gì: ${qSaw.trim()}` : "",
        qFelt.trim() ? `Em cảm thấy thế nào: ${qFelt.trim()}` : "",
        qChanged.trim()
          ? `Có thay đổi suy nghĩ không: ${qChanged.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join(" | ");
    } else {
      if (!journalContent.trim()) return;
      finalContent = journalContent.trim();
    }

    setSubmitting(true);
    const newEntry: JournalEntry = {
      id: `j-${Date.now()}`,
      date: today,
      step: student.currentStep,
      pathwayId: selectedPw?.id,
      pathwayTitle: selectedPw?.title,
      activityType,
      content: finalContent,
      reflection3Q,
    };

    onUpdateStudent({
      ...student,
      currentStep:
        student.currentStep === "THU" || student.currentStep === "LỌC"
          ? "THỬ"
          : student.currentStep,
      journal: [newEntry, ...student.journal],
    });

    setJournalContent("");
    setQSaw("");
    setQFelt("");
    setQChanged("");

    await onJournalSubmittedWithAI(finalContent, activityType);
    setSubmitting(false);
    setSavedNotice(
      "Đã lưu nhật ký. Trợ lí cũng đã gửi một câu hỏi gợi mở ở mục Trò chuyện để em tự ngẫm thêm."
    );
    onStepCompleted(
      "THỬ",
      "Em đã ghi lại trải nghiệm thực tế bằng chính cảm nhận của mình."
    );
    setTimeout(() => setSavedNotice(null), 5000);
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
      </section>

      {/* 1.3B: "Người thật, việc thật" & School experiences */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF2D7] dark:bg-[#EAF2D7]/15 flex items-center justify-center text-[#223A1E] dark:text-[#EAF2D7]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              Người thật, việc thật &amp; Hoạt động trải nghiệm THỬ
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Xem chia sẻ từ cựu học sinh, chuẩn bị sẵn 2 câu hỏi khi gặp người làm nghề và đăng kí hoạt động thực tế.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold">
            Hoạt động thực tế do nhà trường tổ chức ({experiences.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {experiences.map((act) => {
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
                        <span>Đã đăng kí / tham gia</span>
                      </>
                    ) : (
                      <span>Đăng kí tham gia thử</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {storiesToShow.length > 0 && (
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
        )}
      </section>

      {/* 1.3C & 1.4: Smart Journal + 3-Question Post-Experience Form + Timeline */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFCFE3]/70 dark:bg-[#EFCFE3]/15 flex items-center justify-center text-[#4A1A2C] dark:text-[#EFCFE3]">
              <PenLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Nhật ký thông minh &amp; Phiếu cảm nhận 3 câu
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Ghi nhanh sau trải nghiệm bằng phiếu 3 câu ngắn hoặc viết tự do với gợi ý mở đầu.
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-label="Chọn mẫu viết nhật ký"
            className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 self-start sm:self-auto"
          >
            <button
              type="button"
              onClick={() => setComposerMode("three_q")}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                composerMode === "three_q"
                  ? "bg-white dark:bg-[#17222C] text-[#1D242B] dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Phiếu 3 câu sau trải nghiệm
            </button>
            <button
              type="button"
              onClick={() => setComposerMode("free")}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                composerMode === "free"
                  ? "bg-white dark:bg-[#17222C] text-[#1D242B] dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Viết tự do + Gợi ý
            </button>
          </div>
        </div>

        <form onSubmit={handleAddJournal} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="journal-type"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
              >
                Loại hoạt động
              </label>
              <select
                id="journal-type"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="journal-pathway"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
              >
                Gắn với phương án / lộ trình
              </label>
              <select
                id="journal-pathway"
                value={journalPathwayId}
                onChange={(e) => setJournalPathwayId(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
              >
                {pathways.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {composerMode === "three_q" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="q-saw"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
                >
                  1. Em thấy gì?
                </label>
                <textarea
                  id="q-saw"
                  rows={3}
                  value={qSaw}
                  onChange={(e) => setQSaw(e.target.value)}
                  placeholder="Ví dụ: Em thấy các anh chị thực hành lắp mạch điện ngay tại xưởng..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="q-felt"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
                >
                  2. Em cảm thấy thế nào?
                </label>
                <textarea
                  id="q-felt"
                  rows={3}
                  value={qFelt}
                  onChange={(e) => setQFelt(e.target.value)}
                  placeholder="Ví dụ: Em thấy đỡ căng thẳng và tự tin hơn khi được cầm tay chỉ việc..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="q-changed"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
                >
                  3. Điều đó có thay đổi suy nghĩ của em không?
                </label>
                <textarea
                  id="q-changed"
                  rows={3}
                  value={qChanged}
                  onChange={(e) => setQChanged(e.target.value)}
                  placeholder="Ví dụ: Em không còn nghĩ học nghề là hết đường học lên nữa..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Gợi ý câu mở đầu khi bí ý:
                </span>
                {SENTENCE_STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => {
                      setJournalContent((prev) =>
                        prev.trim() ? `${prev.trim()} ${starter}` : starter
                      );
                      journalTextareaRef.current?.focus();
                    }}
                    className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] hover:border-[#E27396] text-xs cursor-pointer"
                  >
                    + {starter.trim()}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="journal-content"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Cảm nhận thật của em
                  </label>

                  {speechSupported && (
                    <button
                      type="button"
                      onClick={handleToggleVoice}
                      aria-label={
                        isListening
                          ? "Dừng nhập bằng giọng nói"
                          : "Nhập nhật ký bằng giọng nói tiếng Việt"
                      }
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                        isListening
                          ? "bg-[#EFCFE3] border-[#E27396] text-[#4A1A2C]"
                          : "bg-white dark:bg-[#0F171E] border-slate-300 dark:border-slate-700 hover:border-[#E27396]"
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>Đang nghe... bấm để dừng</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>Nhập bằng giọng nói</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <textarea
                  ref={journalTextareaRef}
                  id="journal-content"
                  rows={3}
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="Ví dụ: Hôm nay đi xưởng về em thấy thích không khí thực hành..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#E27396]"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nhật ký của em được bảo mật, chỉ em và thầy/cô xem (trừ khi em bật chia sẻ với phụ huynh).
            </p>
            <button
              type="submit"
              disabled={
                submitting ||
                (composerMode === "free"
                  ? !journalContent.trim()
                  : !qSaw.trim() && !qFelt.trim() && !qChanged.trim())
              }
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-50 text-[#1D1519] text-sm font-semibold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? "Đang lưu..." : "Lưu vào nhật ký"}</span>
            </button>
          </div>
        </form>

        {savedNotice && (
          <div className="p-3.5 rounded-xl bg-[#EAF2D7] dark:bg-[#EAF2D7]/15 text-[#223A1E] dark:text-[#EAF2D7] text-sm font-medium">
            {savedNotice}
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
