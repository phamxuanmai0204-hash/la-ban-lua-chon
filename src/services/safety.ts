/**
 * Shared anonymization and 2-layer safety filters for La Bàn Lựa Chọn.
 * Runs identically before sending context to Gemini and after Gemini responds.
 */

const VIETNAMESE_SURNAMES =
  "Nguyễn|Trần|Lê|Phạm|Hoàng|Huỳnh|Phan|Vũ|Võ|Đặng|Bùi|Đỗ|Hồ|Ngô|Dương|Lý|Đinh|Đoàn|Trương|Bạch|Mai|Tô|Lưu|Chu|Vương|Tạ|Quách|Tăng|Châu|Lâm|Thái|Kiều|Phùng";

/**
 * Strips proper personal names, phone numbers, email addresses, and street addresses
 * before sending any student/journal text to Gemini.
 */
export function anDanhHoa(
  text: string,
  anonymizedCode = "Học sinh"
): string {
  if (!text) return "";
  let out = text;

  // 1. Replace email addresses
  out = out.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "[Email đã ẩn]"
  );

  // 2. Replace Vietnamese phone numbers (+84 / 0xxxxxxxx)
  out = out.replace(
    /(?:\+84|84|0)(?:[\s.-]*\d){8,10}\b/g,
    "[SĐT đã ẩn]"
  );

  // 3. Replace street / residential address fragments
  out = out.replace(
    /\b(?:số nhà|địa chỉ|ngõ|ngách|hẻm|tổ dân phố|khu phố|thôn|xóm|ấp)\s+[A-ZÀ-Ỹ0-9][^\n,.;]{1,38}/gi,
    "[Địa chỉ đã ẩn]"
  );
  out = out.replace(
    /\b(?:đường|phố|phường|xã|thị trấn|quận|huyện|thị xã|tỉnh)\s+(?:[A-ZÀ-Ỹ0-9][\p{L}0-9]+(?:\s+[A-ZÀ-Ỹ0-9][\p{L}0-9]+){0,3})/gu,
    "[Địa chỉ đã ẩn]"
  );

  // 4. Replace self-introduced names ("em tên là ...", "tên em là ...")
  out = out.replace(
    /(em tên là|tên em là|em tên|mình tên là|mình tên|tên là|tên thật là|họ và tên|họ tên)\s*:?\s*[A-ZÀ-Ỹ][\p{L}]+(?:\s+[A-ZÀ-Ỹ][\p{L}]+){0,3}/giu,
    `$1 [${anonymizedCode}]`
  );

  // 5. Replace Vietnamese full names starting with common surnames (2 to 4 capitalized words)
  const fullNameRegex = new RegExp(
    `\\b(?:${VIETNAMESE_SURNAMES})\\s+[A-ZÀ-Ỹ][\\p{L}]+(?:\\s+[A-ZÀ-Ỹ][\\p{L}]+){0,2}\\b`,
    "gu"
  );
  out = out.replace(fullNameRegex, `[${anonymizedCode}]`);

  return out;
}

export const LAYER1_SENSITIVE_KEYWORDS = [
  "bị đánh",
  "đánh đập",
  "bạo lực",
  "muốn bỏ học",
  "bỏ học",
  "nghỉ học luôn",
  "buồn kéo dài",
  "buồn lắm",
  "tự làm đau",
  "tự làm hại",
  "tự hại",
  "rạch tay",
  "không muốn sống",
  "chết cho xong",
  "tự tử",
  "bị la mắng",
  "la mắng",
  "áp lực quá",
  "áp lực nặng",
  "cãi nhau",
  "tuyệt vọng",
  "bắt ép",
  "khóc suốt",
  "chán sống",
];

export interface Layer1CheckResult {
  triggered: boolean;
  matchedKeyword?: string;
  reply?: string;
  dauHieu?: string;
}

export function checkLayer1Sensitive(text: string): Layer1CheckResult {
  const lower = (text || "").toLowerCase();
  for (const kw of LAYER1_SENSITIVE_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        triggered: true,
        matchedKeyword: kw,
        reply:
          "Mình nghe thấy em đang trải qua nhiều áp lực và cảm xúc nặng lòng lúc này. Em có thể nói chuyện với thầy/cô chủ nhiệm để được lắng nghe và cùng tháo gỡ nhé.",
        dauHieu: `Lớp 1 phát hiện từ khóa nhạy cảm ("${kw}"). Không gọi AI tư vấn nghề; đã gửi cảnh báo đỏ tới giáo viên.`,
      };
    }
  }
  return { triggered: false };
}

export interface Layer2CheckResult {
  blocked: boolean;
  reasons: string[];
  safeReply: string;
}

const LAYER2_ADVICE_PATTERNS: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /em nên chọn/i,
    reason: 'Chứa cụm từ chỉ định "em nên chọn"',
  },
  {
    pattern: /tốt nhất là/i,
    reason: 'Chứa cụm từ xếp hạng/khẳng định "tốt nhất là"',
  },
  {
    pattern: /lựa chọn tốt nhất/i,
    reason: 'Chứa cụm từ xếp hạng "lựa chọn tốt nhất"',
  },
  {
    pattern: /khuyên em nên|khuyên em chọn/i,
    reason: "Chứa lời khuyên chọn phương án thay học sinh",
  },
  {
    pattern: /\bfobo\b/i,
    reason: 'Xuất hiện nhãn "FOBO" trong phản hồi gửi học sinh',
  },
  {
    pattern: /\d[\d.,]*\s*(?:triệu|tr\b|nghìn|ngàn|đồng|vnđ|vnd|k\/tháng|tr\/tháng)/i,
    reason: "Chứa con số học phí / chi phí chưa kiểm chứng",
  },
  {
    pattern: /(?:học phí|điểm chuẩn|mức điểm|lương|thu nhập)\s*(?:là|khoảng|tầm|từ|:)?\s*\d/i,
    reason: "Chứa số liệu học phí / điểm chuẩn / thu nhập",
  },
  {
    pattern: /\d+(?:[.,]\d+)?\s*điểm\b/i,
    reason: "Chứa con số điểm chuẩn cụ thể",
  },
];

export function checkLayer2OutputSafety(
  aiReply: string,
  criteria: string[] = []
): Layer2CheckResult {
  const reasons: string[] = [];
  for (const rule of LAYER2_ADVICE_PATTERNS) {
    if (rule.pattern.test(aiReply)) {
      reasons.push(rule.reason);
    }
  }

  const firstCriterion = criteria.find((c) => c.trim().length > 0);
  const safeReply = firstCriterion
    ? `Mình đã đọc điều em vừa chia sẻ. Phương án em đang nghĩ tới đáp ứng tiêu chí '${firstCriterion}' mà em tự đặt ở điểm nào?`
    : "Mình đã đọc điều em vừa chia sẻ. Điều gì ở lựa chọn này khiến em thấy yên tâm nhất và điều gì vẫn cần kiểm chứng thêm cùng thầy/cô?";

  return {
    blocked: reasons.length > 0,
    reasons,
    safeReply,
  };
}
