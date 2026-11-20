import React, { useState } from "react";
import { PathwayItem, TryActivity } from "../types";
import { Plus, Save, PlayCircle } from "lucide-react";

interface ContentAdminProps {
  pathways: PathwayItem[];
  tryActivities: TryActivity[];
  onUpdatePathway: (updated: PathwayItem) => void;
  onAddTryActivity: (activity: TryActivity) => void;
}

export const ContentAdmin: React.FC<ContentAdminProps> = ({
  pathways,
  tryActivities,
  onUpdatePathway,
  onAddTryActivity,
}) => {
  const [selectedPathwayId, setSelectedPathwayId] = useState(pathways[0]?.id ?? "");
  const activePathway = pathways.find((p) => p.id === selectedPathwayId) ?? pathways[0];

  const [storyTitle, setStoryTitle] = useState("");
  const [storyRole, setStoryRole] = useState("");
  const [storySummary, setStorySummary] = useState("");
  const [storyUrl, setStoryUrl] = useState("");
  const [savedFeedback, setSavedFeedback] = useState("");

  // New Try Activity state
  const [actTitle, setActTitle] = useState("");
  const [actCategory, setActCategory] = useState("Tham quan xưởng thực hành");
  const [actDate, setActDate] = useState("");
  const [actLocation, setActLocation] = useState("");
  const [actDesc, setActDesc] = useState("");

  const handleAddStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePathway || !storyTitle.trim()) return;
    onUpdatePathway({
      ...activePathway,
      realStories: [
        ...activePathway.realStories,
        {
          id: `st-${Date.now()}`,
          title: storyTitle.trim(),
          alumniRole: storyRole.trim() || "Cựu học sinh",
          summary: storySummary.trim(),
          url: storyUrl.trim() || "#",
        },
      ],
    });
    setStoryTitle("");
    setStoryRole("");
    setStorySummary("");
    setStoryUrl("");
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle.trim() || !actDate.trim()) return;
    onAddTryActivity({
      id: `try-${Date.now()}`,
      title: actTitle.trim(),
      category: actCategory,
      date: actDate.trim(),
      location: actLocation.trim() || "Tại trường / Cơ sở liên kết",
      description: actDesc.trim() || "Hoạt động trải nghiệm thực tế dành cho học sinh lớp 9.",
    });
    setActTitle("");
    setActDate("");
    setActLocation("");
    setActDesc("");
  };

  return (
    <div className="space-y-6">
      {/* Pathway Editor */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
            Cập nhật thông tin thực tế cho Thẻ lộ trình
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Hệ thống không tự bịa tên trường, học phí hay điểm chuẩn. Thầy/cô tự nhập số liệu thực tế của địa phương tại đây để thay cho nhãn “Nhà trường cập nhật”.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {pathways.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPathwayId(p.id)}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                p.id === activePathway?.id
                  ? "bg-[#1F3A5F] text-white border-[#1F3A5F] dark:bg-[#2A7F7F] dark:border-[#2A7F7F]"
                  : "bg-[#F7F9FB] dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
              }`}
            >
              {p.shortTitle}
            </button>
          ))}
        </div>

        {activePathway && (
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Tên trường / cơ sở thực tế tại địa phương
                </label>
                <input
                  type="text"
                  value={activePathway.schoolNames}
                  onChange={(e) =>
                    onUpdatePathway({ ...activePathway, schoolNames: e.target.value })
                  }
                  placeholder="Để trống = Nhà trường cập nhật"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Chi phí / học phí ước tính
                </label>
                <input
                  type="text"
                  value={activePathway.estimatedCost}
                  onChange={(e) =>
                    onUpdatePathway({ ...activePathway, estimatedCost: e.target.value })
                  }
                  placeholder="Để trống = Nhà trường cập nhật"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Thông tin tuyển sinh / điểm tham khảo
                </label>
                <input
                  type="text"
                  value={activePathway.admissionReference}
                  onChange={(e) =>
                    onUpdatePathway({ ...activePathway, admissionReference: e.target.value })
                  }
                  placeholder="Để trống = Nhà trường cập nhật"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#2A7F7F] dark:text-[#6EE7E7]">{savedFeedback}</span>
              <button
                type="button"
                onClick={() => {
                  setSavedFeedback("Đã lưu thông tin thẻ lộ trình.");
                  setTimeout(() => setSavedFeedback(""), 2500);
                }}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2A7F7F] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu thông tin</span>
              </button>
            </div>

            {/* Add Real Story */}
            <form
              onSubmit={handleAddStory}
              className="rounded-xl bg-[#F7F9FB] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 space-y-3"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-[#1F3A5F] dark:text-slate-100">
                <PlayCircle className="w-4 h-4 text-[#E0A030]" />
                <span>Thêm câu chuyện “Người thật, việc thật” cho nhánh {activePathway.shortTitle}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="Tiêu đề bài chia sẻ / video..."
                  className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
                />
                <input
                  type="text"
                  value={storyRole}
                  onChange={(e) => setStoryRole(e.target.value)}
                  placeholder="Người chia sẻ (ví dụ: Cựu HS khóa 2023)..."
                  className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
                />
                <input
                  type="text"
                  value={storySummary}
                  onChange={(e) => setStorySummary(e.target.value)}
                  placeholder="Tóm tắt ngắn điều truyền cảm hứng..."
                  className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
                />
                <input
                  type="url"
                  value={storyUrl}
                  onChange={(e) => setStoryUrl(e.target.value)}
                  placeholder="Link video / bài viết (https://...)..."
                  className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!storyTitle.trim()}
                  className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#E0A030] hover:bg-[#d19225] disabled:opacity-50 text-[#14263E] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm bài chia sẻ</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* Add Try Activity */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
            Quản lí hoạt động “Trải nghiệm THỬ” ({tryActivities.length} hoạt động)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Thêm buổi tham quan xưởng thực hành, giao lưu người làm nghề hoặc bài tập tình huống để học sinh đăng kí ở Bước THỬ.
          </p>
        </div>

        <form onSubmit={handleCreateActivity} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F7F9FB] dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <input
            type="text"
            value={actTitle}
            onChange={(e) => setActTitle(e.target.value)}
            placeholder="Tên hoạt động trải nghiệm..."
            className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
          />
          <select
            value={actCategory}
            onChange={(e) => setActCategory(e.target.value)}
            className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
          >
            <option value="Tham quan xưởng thực hành">Tham quan xưởng thực hành</option>
            <option value="Giao lưu người làm nghề">Giao lưu người làm nghề</option>
            <option value="Bài tập tình huống nghề">Bài tập tình huống nghề</option>
          </select>
          <input
            type="text"
            value={actDate}
            onChange={(e) => setActDate(e.target.value)}
            placeholder="Thời gian (ví dụ: Thứ Bảy, 12/12)..."
            className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
          />
          <input
            type="text"
            value={actLocation}
            onChange={(e) => setActLocation(e.target.value)}
            placeholder="Địa điểm tổ chức..."
            className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
          />
          <textarea
            rows={2}
            value={actDesc}
            onChange={(e) => setActDesc(e.target.value)}
            placeholder="Mô tả ngắn những gì học sinh sẽ được trực tiếp làm thử..."
            className="sm:col-span-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-3 text-sm"
          />
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={!actTitle.trim() || !actDate.trim()}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-[#1F3A5F] dark:bg-[#2A7F7F] text-white disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm hoạt động trải nghiệm</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
