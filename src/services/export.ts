import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { QUALITATIVE_LEVELS, RUBRIC_CRITERIA } from "../data/mockData";
import { migrateAppState } from "./storage";
import type {
  AIMessage,
  AIModerationLog,
  AppState,
  Experience,
  Meeting,
  Pathway,
  QualitativeLevel,
  Student,
  ThematicCodeItem,
} from "../types";

function buildCSVContent(headers: string[], rows: unknown[][]): string {
  return (
    "\uFEFF" +
    [headers, ...rows]
      .map((r) =>
        r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n")
  );
}

function triggerBlobDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadCSV(filename: string, headers: string[], rows: unknown[][]): void {
  const csvContent = buildCSVContent(headers, rows);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerBlobDownload(filename, blob);
}

export function buildQualitativeAssessmentCSVData(students: Student[]): string {
  const headers = [
    "Ho_ten_hoc_sinh",
    "Buoc_hien_tai",
    "Truoc_Hieu_ban_than",
    "Sau_Hieu_ban_than",
    "Truoc_Hieu_lo_trinh",
    "Sau_Hieu_lo_trinh",
    "Truoc_Thu_hep_lua_chon",
    "Sau_Thu_hep_lua_chon",
    "Truoc_Chot_quyet_dinh",
    "Sau_Chot_quyet_dinh",
    "Truoc_Cam_ket_hanh_dong",
    "Sau_Cam_ket_hanh_dong",
    "Ghi_chu_sau_tac_dong",
    "Minh_chung_tong_hop",
    "Minh_chung_tung_tieu_chi",
  ];

  const rows = students.map((s) => {
    const perCriterionAfter = RUBRIC_CRITERIA.map(
      (c) =>
        `${c.title}: ${s.assessment.after.criterionEvidence?.[c.key] || "Chưa ghi"}`
    ).join(" | ");
    return [
      s.fullName,
      s.currentStep,
      s.assessment.before.understandingSelf,
      s.assessment.after.understandingSelf,
      s.assessment.before.understandingPathways,
      s.assessment.after.understandingPathways,
      s.assessment.before.narrowingOptions,
      s.assessment.after.narrowingOptions,
      s.assessment.before.decidingOnTime,
      s.assessment.after.decidingOnTime,
      s.assessment.before.committingAndActing,
      s.assessment.after.committingAndActing,
      s.assessment.after.notes || "",
      s.assessment.after.evidence || "",
      perCriterionAfter,
    ];
  });

  return buildCSVContent(headers, rows);
}

export function exportQualitativeAssessmentCSV(students: Student[]): void {
  const content = buildQualitativeAssessmentCSVData(students);
  triggerBlobDownload(
    "la-ban-lua-chon-danh-gia-dinh-tinh.csv",
    new Blob([content], { type: "text/csv;charset=utf-8;" })
  );
}

export function buildThematicCodesCSVData(items: ThematicCodeItem[]): string {
  const accepted = items.filter((item) => item.status === "accepted");
  const headers = [
    "Ho_ten_hoc_sinh",
    "Chu_de",
    "Ma_hoa",
    "Minh_chung",
    "Nguon",
  ];
  const rows = accepted.map((item) => [
    item.studentName,
    item.theme,
    item.codeLabel,
    item.evidenceQuote,
    item.sourceLabel,
  ]);
  return buildCSVContent(headers, rows);
}

/**
 * Exports ONLY teacher-accepted thematic codes (Braun & Clarke, 2006).
 */
export function exportThematicCodesCSV(items: ThematicCodeItem[]): void {
  const content = buildThematicCodesCSVData(items);
  triggerBlobDownload(
    "la-ban-ma-hoa-chu-de-braun-clarke.csv",
    new Blob([content], { type: "text/csv;charset=utf-8;" })
  );
}

export function buildAIModerationLogsCSVData(logs: AIModerationLog[]): string {
  const headers = [
    "Ho_ten_hoc_sinh",
    "Thoi_diem",
    "Hanh_dong",
    "Nguoi_thuc_hien",
    "Noi_dung_hoc_sinh_viet",
    "Ban_goc_AI",
    "Ban_sau_chinh_sua_hoac_loc",
    "Li_do",
  ];
  const rows = logs.map((l) => [
    l.studentName,
    l.timestamp,
    l.action,
    l.actor,
    l.studentText,
    l.originalReply,
    l.editedReply || "",
    l.reason || "",
  ]);
  return buildCSVContent(headers, rows);
}

export function exportAIModerationLogsCSV(logs: AIModerationLog[]): void {
  downloadCSV(
    "la-ban-lich-su-kiem-duyet-ai.csv",
    [
      "Ho_ten_hoc_sinh",
      "Thoi_diem",
      "Hanh_dong",
      "Nguoi_thuc_hien",
      "Noi_dung_hoc_sinh_viet",
      "Ban_goc_AI",
      "Ban_sau_chinh_sua_hoac_loc",
      "Li_do",
    ],
    logs.map((l) => [
      l.studentName,
      l.timestamp,
      l.action,
      l.actor,
      l.studentText,
      l.originalReply,
      l.editedReply || "",
      l.reason || "",
    ])
  );
}

function drawWrappedCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(/\s+/);
  let line = "";
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

/**
 * Generates a clean 1-page A4 Vietnamese PDF summary using an offscreen Canvas
 * so all Vietnamese UTF-8 diacritics render crisply inside jsPDF.
 */
export async function generateResearchSummaryPDFBytes(
  state: AppState
): Promise<ArrayBuffer> {
  const width = 1240;
  const height = 1754;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const fallbackDoc = new jsPDF("p", "mm", "a4");
    fallbackDoc.text("La Ban Lua Chon - Tom tat nghien cuu", 20, 20);
    return fallbackDoc.output("arraybuffer");
  }

  // White A4 background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Header band
  ctx.fillStyle = "#B3DEE2";
  ctx.fillRect(0, 0, width, 165);
  ctx.fillStyle = "#133C42";
  ctx.font = 'bold 34px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText("LA BÀN LỰA CHỌN – TÓM TẮT DỮ LIỆU NGHIÊN CỨU", 64, 72);
  ctx.font = '500 20px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText(
    "Hỗ trợ nâng cao năng lực ra quyết định nghề nghiệp cho học sinh lớp 9",
    64,
    114
  );
  ctx.font = '400 17px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText(
    `Ngày xuất gói dữ liệu: ${new Date().toLocaleDateString("vi-VN")}  ·  Tổng mẫu: ${state.students.length} học sinh`,
    64,
    144
  );

  let y = 215;

  // Section 1: Sample overview
  const committedAll = state.students.filter((s) =>
    Boolean(s.commitment.studentConfirmedAt)
  ).length;
  const parentSigned = state.students.filter((s) =>
    Boolean(s.commitment.parentConfirmedAt)
  ).length;

  ctx.fillStyle = "#1D242B";
  ctx.font = 'bold 24px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText("1. Tổng quan tiến trình & mẫu nghiên cứu", 64, y);
  y += 38;

  ctx.fillStyle = "#334155";
  ctx.font = '400 19px "Be Vietnam Pro", system-ui, sans-serif';
  y = drawWrappedCanvasText(
    ctx,
    `• Cả lớp: ${state.students.length} học sinh (${committedAll} em đã xác nhận cam kết, ${parentSigned} phụ huynh đã kí đồng hành).`,
    72,
    y,
    1100,
    30
  );

  // Step counts
  const stepSummary = (["THU", "LỌC", "THỬ", "CHỐT", "CAM KẾT"] as const)
    .map(
      (st) =>
        `${st}: ${state.students.filter((s) => s.currentStep === st).length} HS`
    )
    .join("   |   ");
  y = drawWrappedCanvasText(
    ctx,
    `• Phân bố bước hiện tại: ${stepSummary}`,
    72,
    y + 4,
    1100,
    30
  );

  // Section 2: Before - After Qualitative Rubric Summary (verbal levels only)
  y += 36;
  ctx.fillStyle = "#1D242B";
  ctx.font = 'bold 24px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText(
    "2. Đối chiếu Trước – Sau theo 4 mức mô tả định tính (Cả lớp)",
    64,
    y
  );
  y += 30;

  // Table header
  ctx.fillStyle = "#EAF2D7";
  ctx.fillRect(64, y, 1112, 46);
  ctx.fillStyle = "#223A1E";
  ctx.font = 'bold 17px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText("Tiêu chí năng lực", 80, y + 29);
  ctx.fillText("Mức phổ biến (Trước -> Sau)", 440, y + 29);
  ctx.fillText("Số HS ở mức Khá rõ nét / Vững vàng", 815, y + 29);
  y += 46;

  const countHigh = (list: Student[], period: "before" | "after", key: (typeof RUBRIC_CRITERIA)[number]["key"]) =>
    list.filter(
      (s) =>
        s.assessment[period][key] === "Khá rõ nét" ||
        s.assessment[period][key] === "Vững vàng"
    ).length;

  const modeLevel = (
    list: Student[],
    period: "before" | "after",
    key: (typeof RUBRIC_CRITERIA)[number]["key"]
  ): QualitativeLevel => {
    const counts: Record<QualitativeLevel, number> = {
      "Hạn chế": 0,
      "Đang hình thành": 0,
      "Khá rõ nét": 0,
      "Vững vàng": 0,
    };
    list.forEach((s) => {
      const lvl = s.assessment[period][key];
      counts[lvl] = (counts[lvl] || 0) + 1;
    });
    let best: QualitativeLevel = "Hạn chế";
    for (const lvl of QUALITATIVE_LEVELS) {
      if (counts[lvl] >= counts[best]) best = lvl;
    }
    return best;
  };

  RUBRIC_CRITERIA.forEach((c, idx) => {
    const rowH = 54;
    ctx.fillStyle = idx % 2 === 0 ? "#FAFBFD" : "#FFFFFF";
    ctx.fillRect(64, y, 1112, rowH);
    ctx.strokeStyle = "#E2E8F0";
    ctx.strokeRect(64, y, 1112, rowH);

    ctx.fillStyle = "#1D242B";
    ctx.font = '600 17px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.fillText(c.title, 80, y + 33);

    const fBefore = modeLevel(state.students, "before", c.key);
    const fAfter = modeLevel(state.students, "after", c.key);
    ctx.font = '400 17px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.fillText(`${fBefore}  →  ${fAfter}`, 440, y + 33);

    const cBefore = countHigh(state.students, "before", c.key);
    const cAfter = countHigh(state.students, "after", c.key);
    ctx.fillText(
      `Trước: ${cBefore} HS   →   Sau: ${cAfter} HS`,
      815,
      y + 33
    );

    y += rowH;
  });

  // Section 3: Thematic Coding & AI Moderation
  y += 48;
  ctx.fillStyle = "#1D242B";
  ctx.font = 'bold 24px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText("3. Mã hóa chủ đề định tính & Kiểm duyệt an toàn AI", 64, y);
  y += 38;

  const acceptedCodes = (state.thematicCodes || []).filter(
    (c) => c.status === "accepted"
  );
  const uniqueThemes = Array.from(new Set(acceptedCodes.map((c) => c.theme)));
  const logs = state.aiModerationLogs || [];
  const layer1Count = logs.filter((l) => l.action === "lọc lớp 1").length;
  const layer2Count = logs.filter((l) => l.action === "lọc lớp 2").length;
  const editedCount = logs.filter((l) => l.action === "giáo viên đã sửa").length;

  ctx.fillStyle = "#334155";
  ctx.font = '400 19px "Be Vietnam Pro", system-ui, sans-serif';
  y = drawWrappedCanvasText(
    ctx,
    `• Mã hóa chủ đề (Braun & Clarke): ${acceptedCodes.length} đoạn mã đã được giáo viên chấp nhận, thuộc ${uniqueThemes.length} chủ đề${uniqueThemes.length > 0 ? ` (${uniqueThemes.slice(0, 4).join(", ")})` : ""}.`,
    72,
    y,
    1100,
    30
  );
  y = drawWrappedCanvasText(
    ctx,
    `• Nhật ký kiểm duyệt AI: Tổng ${logs.length} lượt ghi nhận (Lọc lớp 1 an toàn: ${layer1Count}; Lọc lớp 2 chuẩn sư phạm: ${layer2Count}; Giáo viên chỉnh sửa: ${editedCount}).`,
    72,
    y + 6,
    1100,
    30
  );
  y = drawWrappedCanvasText(
    ctx,
    `• Họp ba bên: ${state.meetings.length} cuộc họp đã tạo (${state.meetings.filter((m) => m.status === "Đã họp").length} buổi đã hoàn thành biên bản thống nhất).`,
    72,
    y + 6,
    1100,
    30
  );

  // Footer note
  ctx.fillStyle = "#64748B";
  ctx.font = 'italic 16px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText(
    "Lưu ý: Dữ liệu xuất sử dụng thang mô tả 4 mức bằng lời, không chấm điểm và không xếp hạng học sinh.",
    64,
    height - 70
  );

  const imgDataUrl = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  pdf.addImage(imgDataUrl, "PNG", 0, 0, 210, 297);
  return pdf.output("arraybuffer");
}

/**
 * Bundles 3 CSVs + 1-page Vietnamese PDF summary into a single .zip package.
 */
export async function exportResearchZipPackage(state: AppState): Promise<void> {
  const zip = new JSZip();
  zip.file(
    "01-danh-gia-truoc-sau-an-danh.csv",
    buildQualitativeAssessmentCSVData(state.students)
  );
  zip.file(
    "02-ma-hoa-chu-de-an-danh.csv",
    buildThematicCodesCSVData(state.thematicCodes || [])
  );
  zip.file(
    "03-nhat-ky-kiem-duyet-ai.csv",
    buildAIModerationLogsCSVData(state.aiModerationLogs || [])
  );

  const pdfBytes = await generateResearchSummaryPDFBytes(state);
  zip.file("04-tom-tat-nghien-cuu.pdf", pdfBytes);

  const zipBlob = await zip.generateAsync({ type: "blob" });
  triggerBlobDownload("la-ban-lua-chon-goi-du-lieu-nghien-cuu.zip", zipBlob);
}

export interface ContentPackagePayload {
  version: number;
  exportedAt: string;
  pathways: Pathway[];
  experiences: Experience[];
}

export function exportContentJSON(
  pathways: Pathway[],
  experiences: Experience[]
): void {
  const payload: ContentPackagePayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    pathways,
    experiences,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  triggerBlobDownload("la-ban-noi-dung-huong-nghiep.json", blob);
}

export function parseContentJSON(rawJson: string): {
  pathways: Pathway[];
  experiences: Experience[];
} {
  const parsed = JSON.parse(rawJson) as Partial<ContentPackagePayload>;
  if (
    !parsed ||
    !Array.isArray(parsed.pathways) ||
    !Array.isArray(parsed.experiences)
  ) {
    throw new Error(
      "Tệp JSON chưa đúng cấu trúc nội dung (cần có danh sách pathways và experiences)."
    );
  }
  return {
    pathways: parsed.pathways,
    experiences: parsed.experiences,
  };
}

/**
 * Exports ONLY the requesting student's personal journey data.
 */
export function exportStudentPersonalDataJSON(
  student: Student,
  aiMessages: AIMessage[],
  meetings: Meeting[]
): void {
  const safeCode = student.fullName;
  const studentMsgs = aiMessages
    .filter((m) => m.studentId === student.id && m.visibleToStudent)
    .map((m) => ({
      createdAt: m.createdAt,
      studentText: m.studentText,
      reply:
        m.status === "giáo viên đã sửa" && m.teacherEditedReply
          ? m.teacherEditedReply
          : m.aiReply,
      teacherEncouragement: m.teacherEncouragement || null,
    }));

  const studentMeetings = meetings
    .filter((mt) => mt.studentId === student.id)
    .map((mt) => ({
      dateTime: mt.dateTime,
      locationOrChannel: mt.locationOrChannel,
      status: mt.status,
      keyPoints: mt.keyPoints,
      agreedChoice: mt.agreedChoice,
      nextSteps: mt.nextSteps || "",
    }));

  const payload = {
    fullName: student.fullName,
    className: student.className,
    exportedAt: new Date().toISOString(),
    privacyConsentAccepted: student.privacyConsentAccepted,
    privacyConsentAcceptedAt: student.privacyConsentAcceptedAt || null,
    dataDeletionRequestedAt: student.dataDeletionRequestedAt || null,
    shareWithParent: student.shareWithParent,
    currentStep: student.currentStep,
    completedSteps: student.completedSteps || [],
    profile: student.profile,
    criteria: student.criteria,
    consideredOptions: student.consideredOptions,
    journal: student.journal,
    scenarioReflections: student.scenarioReflections || [],
    commitment: student.commitment,
    aiConversations: studentMsgs,
    meetings: studentMeetings,
  };

  const slug = safeCode.toLowerCase().replace(/\s+/g, "-");
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  triggerBlobDownload(`la-ban-du-lieu-${slug}.json`, blob);
}

export function exportFullAppStateJSON(state: AppState): void {
  const payload = {
    app: "La Ban Lua Chon",
    exportedAt: new Date().toISOString(),
    data: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  triggerBlobDownload(
    `la-ban-sao-luu-toan-bo-${new Date().toISOString().slice(0, 10)}.json`,
    blob
  );
}

export function parseFullAppStateJSON(rawJson: string): AppState {
  const parsed = JSON.parse(rawJson) as { data?: unknown } | unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Tệp JSON không hợp lệ.");
  }
  const candidate =
    "data" in parsed && (parsed as { data?: unknown }).data
      ? (parsed as { data: unknown }).data
      : parsed;

  if (
    !candidate ||
    typeof candidate !== "object" ||
    !Array.isArray((candidate as Record<string, unknown>).students)
  ) {
    throw new Error(
      "Tệp sao lưu chưa đúng định dạng dữ liệu của La Bàn Lựa Chọn."
    );
  }
  return migrateAppState(candidate);
}


