import React, { useRef, useState } from "react";
import {
  Settings2,
  Plus,
  Sparkles,
  Link as LinkIcon,
  Compass,
  Save,
  Trash2,
  Download,
  Upload,
} from "lucide-react";
import { exportContentJSON, parseContentJSON } from "../../services/export";
import type { CareerScenario, Experience, Pathway } from "../../types";

interface ContentAdminProps {
  pathways: Pathway[];
  experiences: Experience[];
  onUpdatePathway: (updated: Pathway) => void;
  onAddPathway: (created: Pathway) => void;
  onAddExperience: (activity: Experience) => void;
  onDeleteExperience: (id: string) => void;
  onImportContent: (payload: {
    pathways: Pathway[];
    experiences: Experience[];
  }) => void;
}

const PATHWAY_CATEGORIES: { value: Pathway["category"]; label: string }[] = [
  { value: "THPT", label: "THPT" },
  { value: "GDTX", label: "GDTX" },
  { value: "TRUNG_CAP", label: "Trung cấp nghề" },
  { value: "SO_CAP", label: "Sơ cấp nghề" },
  { value: "LIEN_THONG_CD_DH", label: "Liên thông CĐ – ĐH" },
  { value: "DI_LAM", label: "Đi làm tích lũy tay nghề" },
];

export const ContentAdmin: React.FC<ContentAdminProps> = ({
  pathways,
  experiences,
  onUpdatePathway,
  onAddPathway,
  onAddExperience,
  onDeleteExperience,
  onImportContent,
}) => {
  const [selectedPathwayId, setSelectedPathwayId] = useState(
    pathways[3]?.id || pathways[0]?.id || ""
  );
  const selectedPathway =
    pathways.find((p) => p.id === selectedPathwayId) || pathways[0];

  const [newPathwayTitle, setNewPathwayTitle] = useState("");
  const [newPathwayCategory, setNewPathwayCategory] =
    useState<Pathway["category"]>("TRUNG_CAP");
  const [newPathwaySubtitle, setNewPathwaySubtitle] = useState("");

  const [storyTitle, setStoryTitle] = useState("");
  const [storyDesc, setStoryDesc] = useState("");
  const [storyUrl, setStoryUrl] = useState("");
  const [storyQ1, setStoryQ1] = useState("");
  const [storyQ2, setStoryQ2] = useState("");

  const [actTitle, setActTitle] = useState("");
  const [actType, setActType] = useState("Tham quan xưởng thực hành");
  const [actDate, setActDate] = useState("");
  const [actLoc, setActLoc] = useState("");
  const [actDesc, setActDesc] = useState("");
  const [scenarioSavedBanner, setScenarioSavedBanner] = useState(false);

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreatePathway = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPathwayTitle.trim()) return;
    const createdId = `pw-${Date.now()}`;
    onAddPathway({
      id: createdId,
      category: newPathwayCategory,
      title: newPathwayTitle.trim(),
      shortSubtitle:
        newPathwaySubtitle.trim() || "Lộ trình mới do nhà trường bổ sung",
      entryRequirements: "Nhà trường cập nhật",
      learningContent: "Nhà trường cập nhật",
      careerOpportunities: "Nhà trường cập nhật",
      articulationPath: "Tiếp tục học tập suốt đời / Liên thông phù hợp",
      realSchoolNames: "",
      tuitionEstimate: "",
      admissionCutoff: "",
      employmentData: "",
      realStories: [],
    });
    setSelectedPathwayId(createdId);
    setNewPathwayTitle("");
    setNewPathwaySubtitle("");
  };

  const handleAddStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPathway || !storyTitle.trim()) return;
    const suggestedQuestions = [storyQ1.trim(), storyQ2.trim()].filter(Boolean);
    onUpdatePathway({
      ...selectedPathway,
      realStories: [
        ...selectedPathway.realStories,
        {
          id: `rs-${Date.now()}`,
          title: storyTitle.trim(),
          personDesc: storyDesc.trim() || "Cựu học sinh chia sẻ",
          url: storyUrl.trim() || "#",
          suggestedQuestions:
            suggestedQuestions.length > 0 ? suggestedQuestions : undefined,
        },
      ],
    });
    setStoryTitle("");
    setStoryDesc("");
    setStoryUrl("");
    setStoryQ1("");
    setStoryQ2("");
  };

  const handleDeleteStory = (storyId: string) => {
    if (!selectedPathway) return;
    onUpdatePathway({
      ...selectedPathway,
      realStories: selectedPathway.realStories.filter((s) => s.id !== storyId),
    });
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle.trim()) return;
    onAddExperience({
      id: `try-${Date.now()}`,
      title: actTitle.trim(),
      activityType: actType,
      dateLabel: actDate.trim() || "Nhà trường thông báo sau",
      location: actLoc.trim() || "Tại trường / cơ sở liên kết",
      description: actDesc.trim(),
      pathwayId: selectedPathway?.id,
    });
    setActTitle("");
    setActDate("");
    setActLoc("");
    setActDesc("");
  };

  const handleUpdateScenario = (nextScenario: CareerScenario) => {
    if (!selectedPathway) return;
    onUpdatePathway({
      ...selectedPathway,
      scenario: nextScenario,
    });
  };

  const handleCreateDefaultScenario = () => {
    if (!selectedPathway) return;
    handleUpdateScenario({
      title: `Một ngày trải nghiệm ${selectedPathway.title}`,
      intro:
        "Tình huống ngắn giúp học sinh hình dung nhịp học và làm việc thực tế.",
      startNodeId: "n1",
      reflectionPrompt: "Em thấy mình hợp / chưa hợp ở điểm nào?",
      nodes: [
        {
          id: "n1",
          prompt: `Trong buổi sáng đầu tiên theo lộ trình ${selectedPathway.title}, em thử bắt tay vào nhiệm vụ cốt lõi. Em cảm thấy thế nào?`,
          choices: [
            {
              id: "c1",
              label: "Em thấy hứng thú và muốn tìm hiểu sâu thêm",
              nextNodeId: null,
              outcomeNote:
                "Cảm giác hứng thú ban đầu là tín hiệu đáng ghi nhận.",
            },
            {
              id: "c2",
              label: "Em thấy hơi bỡ ngỡ nhưng muốn quan sát thêm người làm thật",
              nextNodeId: null,
              outcomeNote:
                "Em có thể xem thêm video Người thật, việc thật trước khi quyết định.",
            },
          ],
        },
      ],
    });
  };

  const handleAddScenarioNode = () => {
    if (!selectedPathway?.scenario) return;
    const newNodeId = `n-${Date.now()}`;
    const existingNodes = selectedPathway.scenario.nodes;
    const prevLast = existingNodes[existingNodes.length - 1];
    const updatedPrevNodes = existingNodes.map((n) =>
      n.id === prevLast?.id
        ? {
            ...n,
            choices: n.choices.map((ch) => ({
              ...ch,
              nextNodeId: ch.nextNodeId || newNodeId,
            })),
          }
        : n
    );
    handleUpdateScenario({
      ...selectedPathway.scenario,
      nodes: [
        ...updatedPrevNodes,
        {
          id: newNodeId,
          prompt: "Tình huống tiếp theo khi em trải nghiệm công việc này...",
          choices: [
            {
              id: `c-${Date.now()}-1`,
              label: "Lựa chọn A của học sinh",
              nextNodeId: null,
              outcomeNote: "Gợi ý suy ngẫm nhẹ nhàng cho lựa chọn A.",
            },
            {
              id: `c-${Date.now()}-2`,
              label: "Lựa chọn B của học sinh",
              nextNodeId: null,
              outcomeNote: "Gợi ý suy ngẫm nhẹ nhàng cho lựa chọn B.",
            },
          ],
        },
      ],
    });
  };

  const handleImportFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportStatus(null);
    try {
      const text = await file.text();
      const parsed = parseContentJSON(text);
      onImportContent(parsed);
      setImportStatus(
        `Đã nhập thành công ${parsed.pathways.length} thẻ lộ trình và ${parsed.experiences.length} hoạt động trải nghiệm từ tệp JSON.`
      );
      if (parsed.pathways[0]) {
        setSelectedPathwayId(parsed.pathways[0].id);
      }
    } catch (err) {
      setImportError(
        err instanceof Error
          ? err.message
          : "Không đọc được tệp JSON nội dung."
      );
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* JSON Backup / Reuse for next school year (3.5) */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              Lưu trữ &amp; Tái sử dụng nội dung qua các năm học (JSON)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Xuất toàn bộ thẻ lộ trình, kịch bản nghề, video và danh sách trải nghiệm thành tệp JSON để dùng lại hoặc chia sẻ giữa các lớp.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => exportContentJSON(pathways, experiences)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Xuất nội dung (JSON)</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Nhập nội dung (JSON)</span>
            </button>
          </div>
        </div>

        {importStatus && (
          <p className="p-3 rounded-xl bg-[#EAF2D7] text-[#223A1E] text-xs sm:text-sm font-medium">
            {importStatus}
          </p>
        )}
        {importError && (
          <p className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 text-rose-800 dark:text-rose-200 text-xs sm:text-sm">
            {importError}
          </p>
        )}
      </section>

      {/* Pathway Card Full Editor */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B3DEE2]/50 dark:bg-[#B3DEE2]/15 flex items-center justify-center text-[#133C42] dark:text-[#B3DEE2]">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Quản trị thẻ lộ trình, video &amp; kịch bản nghề
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Các trường thông tin địa phương để trống sẽ hiển thị nhãn &ldquo;Nhà trường cập nhật&rdquo; cho tới khi thầy/cô nhập dữ liệu chính thức.
              </p>
            </div>
          </div>

          <select
            aria-label="Chọn thẻ lộ trình"
            value={selectedPathway?.id || ""}
            onChange={(e) => setSelectedPathwayId(e.target.value)}
            className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm"
          >
            {pathways.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Create new Pathway Card */}
        <form
          onSubmit={handleCreatePathway}
          className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center"
        >
          <input
            type="text"
            value={newPathwayTitle}
            onChange={(e) => setNewPathwayTitle(e.target.value)}
            placeholder="Thêm thẻ lộ trình mới..."
            className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-3 py-1.5 text-sm"
          />
          <select
            aria-label="Nhóm lộ trình mới"
            value={newPathwayCategory}
            onChange={(e) =>
              setNewPathwayCategory(e.target.value as Pathway["category"])
            }
            className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-3 py-1.5 text-sm"
          >
            {PATHWAY_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newPathwaySubtitle}
            onChange={(e) => setNewPathwaySubtitle(e.target.value)}
            placeholder="Mô tả ngắn 1 dòng..."
            className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo thẻ lộ trình</span>
          </button>
        </form>

        {selectedPathway && (
          <div className="space-y-5">
            {/* Core description fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Tên thẻ lộ trình
                </label>
                <input
                  type="text"
                  value={selectedPathway.title}
                  onChange={(e) =>
                    onUpdatePathway({
                      ...selectedPathway,
                      title: e.target.value,
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Mô tả tóm tắt
                </label>
                <input
                  type="text"
                  value={selectedPathway.shortSubtitle}
                  onChange={(e) =>
                    onUpdatePathway({
                      ...selectedPathway,
                      shortSubtitle: e.target.value,
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Điều kiện đầu vào
                </label>
                <textarea
                  rows={2}
                  value={selectedPathway.entryRequirements}
                  onChange={(e) =>
                    onUpdatePathway({
                      ...selectedPathway,
                      entryRequirements: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Nội dung học / Thực hành
                </label>
                <textarea
                  rows={2}
                  value={selectedPathway.learningContent}
                  onChange={(e) =>
                    onUpdatePathway({
                      ...selectedPathway,
                      learningContent: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Cơ hội việc làm
                </label>
                <textarea
                  rows={2}
                  value={selectedPathway.careerOpportunities}
                  onChange={(e) =>
                    onUpdatePathway({
                      ...selectedPathway,
                      careerOpportunities: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Đường học liên thông
                </label>
                <textarea
                  rows={2}
                  value={selectedPathway.articulationPath}
                  onChange={(e) =>
                    onUpdatePathway({
                      ...selectedPathway,
                      articulationPath: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm"
                />
              </div>
            </div>

            {/* Local official fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Tên trường thật tại địa phương
                </label>
                <input
                  type="text"
                  value={selectedPathway.realSchoolNames}
                  onChange={(e) =>
                    onUpdatePathway({
                      ...selectedPathway,
                      realSchoolNames: e.target.value,
                    })
                  }
                  placeholder="Để trống nếu muốn hiện 'Nhà trường cập nhật'"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Học phí / chi phí ước tính chính thức
                </label>
                <input
                  type="text"
                  value={selectedPathway.tuitionEstimate}
                  onChange={(e) =>
                    onUpdatePathway({
                      ...selectedPathway,
                      tuitionEstimate: e.target.value,
                    })
                  }
                  placeholder="Để trống nếu muốn hiện 'Nhà trường cập nhật'"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Điểm chuẩn / phương thức xét tuyển của trường
                </label>
                <input
                  type="text"
                  value={selectedPathway.admissionCutoff}
                  onChange={(e) =>
                    onUpdatePathway({
                      ...selectedPathway,
                      admissionCutoff: e.target.value,
                    })
                  }
                  placeholder="Để trống nếu muốn hiện 'Nhà trường cập nhật'"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Thông tin việc làm thực tế tại địa phương
                </label>
                <input
                  type="text"
                  value={selectedPathway.employmentData}
                  onChange={(e) =>
                    onUpdatePathway({
                      ...selectedPathway,
                      employmentData: e.target.value,
                    })
                  }
                  placeholder="Để trống nếu muốn hiện 'Nhà trường cập nhật'"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            {/* Real Stories list & add form */}
            <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs font-bold flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-[#9D2950] dark:text-[#EA9AB2]" />
                <span>
                  Video &ldquo;Người thật, việc thật&rdquo; ({selectedPathway.realStories.length})
                </span>
              </p>

              {selectedPathway.realStories.length > 0 && (
                <ul className="space-y-2">
                  {selectedPathway.realStories.map((st) => (
                    <li
                      key={st.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs sm:text-sm"
                    >
                      <div>
                        <p className="font-semibold">{st.title}</p>
                        <p className="text-xs text-slate-500">
                          {st.personDesc} · {st.url}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteStory(st.id)}
                        aria-label={`Xóa chia sẻ ${st.title}`}
                        className="min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleAddStory} className="space-y-2.5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="Tiêu đề video / bài chia sẻ..."
                    className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={storyDesc}
                    onChange={(e) => setStoryDesc(e.target.value)}
                    placeholder="Mô tả ngắn người chia sẻ..."
                    className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={storyUrl}
                    onChange={(e) => setStoryUrl(e.target.value)}
                    placeholder="Dán link YouTube (https://youtube.com/watch?v=...)..."
                    className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={storyQ1}
                    onChange={(e) => setStoryQ1(e.target.value)}
                    placeholder="Câu hỏi gợi ý 1 học sinh có thể hỏi người làm nghề..."
                    className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-3 py-2 text-xs sm:text-sm"
                  />
                  <input
                    type="text"
                    value={storyQ2}
                    onChange={(e) => setStoryQ2(e.target.value)}
                    placeholder="Câu hỏi gợi ý 2 học sinh có thể hỏi người làm nghề..."
                    className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-3 py-2 text-xs sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm chia sẻ người làm nghề</span>
                </button>
              </form>
            </div>

            {/* Branching Scenario Editor ("Một ngày làm nghề") */}
            <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#133C42] dark:text-[#B3DEE2]" />
                  <span>
                    Soạn tình huống &ldquo;Một ngày làm nghề&rdquo; cho thẻ{" "}
                    {selectedPathway.title}
                  </span>
                </p>
                {scenarioSavedBanner && (
                  <span className="text-xs font-semibold text-[#223A1E] dark:text-[#EAF2D7]">
                    ✓ Đã cập nhật tình huống
                  </span>
                )}
              </div>

              {!selectedPathway.scenario ? (
                <button
                  type="button"
                  onClick={handleCreateDefaultScenario}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-xs font-semibold cursor-pointer"
                >
                  Tạo kịch bản tình huống cho lộ trình này
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Tên tình huống
                      </label>
                      <input
                        type="text"
                        value={selectedPathway.scenario.title}
                        onChange={(e) =>
                          handleUpdateScenario({
                            ...selectedPathway.scenario!,
                            title: e.target.value,
                          })
                        }
                        className="w-full min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Câu hỏi kết thúc (không chấm điểm)
                      </label>
                      <input
                        type="text"
                        value={selectedPathway.scenario.reflectionPrompt}
                        onChange={(e) =>
                          handleUpdateScenario({
                            ...selectedPathway.scenario!,
                            reflectionPrompt: e.target.value,
                          })
                        }
                        className="w-full min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Lời dẫn ngắn
                    </label>
                    <input
                      type="text"
                      value={selectedPathway.scenario.intro}
                      onChange={(e) =>
                        handleUpdateScenario({
                          ...selectedPathway.scenario!,
                          intro: e.target.value,
                        })
                      }
                      className="w-full min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-3 py-1.5 text-sm"
                    />
                  </div>

                  {selectedPathway.scenario.nodes.map((node, nIdx) => (
                    <div
                      key={node.id}
                      className="p-3 rounded-xl bg-white dark:bg-[#17222C] border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#9D2950] dark:text-[#EA9AB2]">
                          Chặng {nIdx + 1}
                        </p>
                        {selectedPathway.scenario!.nodes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextNodes = selectedPathway.scenario!.nodes.filter(
                                (item) => item.id !== node.id
                              );
                              handleUpdateScenario({
                                ...selectedPathway.scenario!,
                                nodes: nextNodes,
                              });
                            }}
                            className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
                          >
                            Xóa chặng
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={2}
                        value={node.prompt}
                        onChange={(e) => {
                          const nextNodes =
                            selectedPathway.scenario!.nodes.map((item) =>
                              item.id === node.id
                                ? { ...item, prompt: e.target.value }
                                : item
                            );
                          handleUpdateScenario({
                            ...selectedPathway.scenario!,
                            nodes: nextNodes,
                          });
                        }}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-2.5 text-xs sm:text-sm"
                      />

                      <div className="space-y-2">
                        {node.choices.map((ch, cIdx) => (
                          <div
                            key={ch.id}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                          >
                            <input
                              type="text"
                              aria-label={`Lựa chọn ${cIdx + 1}`}
                              value={ch.label}
                              onChange={(e) => {
                                const nextNodes =
                                  selectedPathway.scenario!.nodes.map((item) =>
                                    item.id === node.id
                                      ? {
                                          ...item,
                                          choices: item.choices.map((c) =>
                                            c.id === ch.id
                                              ? { ...c, label: e.target.value }
                                              : c
                                          ),
                                        }
                                      : item
                                  );
                                handleUpdateScenario({
                                  ...selectedPathway.scenario!,
                                  nodes: nextNodes,
                                });
                              }}
                              placeholder={`Lựa chọn ${cIdx + 1}`}
                              className="min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-2.5 py-1.5 text-xs"
                            />
                            <input
                              type="text"
                              aria-label={`Ghi chú phản hồi lựa chọn ${cIdx + 1}`}
                              value={ch.outcomeNote}
                              onChange={(e) => {
                                const nextNodes =
                                  selectedPathway.scenario!.nodes.map((item) =>
                                    item.id === node.id
                                      ? {
                                          ...item,
                                          choices: item.choices.map((c) =>
                                            c.id === ch.id
                                              ? {
                                                  ...c,
                                                  outcomeNote: e.target.value,
                                                }
                                              : c
                                          ),
                                        }
                                      : item
                                  );
                                handleUpdateScenario({
                                  ...selectedPathway.scenario!,
                                  nodes: nextNodes,
                                });
                              }}
                              placeholder="Lời gợi mở sau khi chọn..."
                              className="min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-2.5 py-1.5 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleAddScenarioNode}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm chặng tình huống</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setScenarioSavedBanner(true);
                        setTimeout(() => setScenarioSavedBanner(false), 2500);
                      }}
                      className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#EAF2D7] text-[#223A1E] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu nhanh kịch bản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Experiences editor & existing list */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF2D7] dark:bg-[#EAF2D7]/15 flex items-center justify-center text-[#223A1E] dark:text-[#EAF2D7]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              Quản lí hoạt động &ldquo;Trải nghiệm THỬ&rdquo; ({experiences.length})
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Thêm mới hoặc xóa hoạt động tham quan xưởng, giao lưu người làm nghề đang mở cho học sinh.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2"
            >
              <div className="space-y-0.5 text-xs sm:text-sm">
                <p className="font-bold">{exp.title}</p>
                <p className="text-xs text-slate-500">
                  {exp.activityType} · {exp.dateLabel} · {exp.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDeleteExperience(exp.id)}
                aria-label={`Xóa hoạt động ${exp.title}`}
                className="min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleCreateActivity} className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={actTitle}
              onChange={(e) => setActTitle(e.target.value)}
              placeholder="Tên hoạt động (ví dụ: Tham quan xưởng Chế biến món ăn)..."
              className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2 text-sm"
            />
            <select
              value={actType}
              onChange={(e) => setActType(e.target.value)}
              className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2 text-sm"
            >
              <option value="Tham quan xưởng thực hành">
                Tham quan xưởng thực hành
              </option>
              <option value="Giao lưu người làm nghề">
                Giao lưu người làm nghề
              </option>
              <option value="Bài tập tình huống nghề">
                Bài tập tình huống nghề
              </option>
            </select>
            <input
              type="text"
              value={actDate}
              onChange={(e) => setActDate(e.target.value)}
              placeholder="Thời gian (ví dụ: Sáng thứ Bảy)..."
              className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2 text-sm"
            />
            <input
              type="text"
              value={actLoc}
              onChange={(e) => setActLoc(e.target.value)}
              placeholder="Địa điểm tổ chức..."
              className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2 text-sm"
            />
          </div>
          <textarea
            rows={2}
            value={actDesc}
            onChange={(e) => setActDesc(e.target.value)}
            placeholder="Mô tả ngắn những gì học sinh sẽ trực tiếp trải nghiệm..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm"
          />
          <button
            type="submit"
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm hoạt động trải nghiệm</span>
          </button>
        </form>
      </section>
    </div>
  );
};

