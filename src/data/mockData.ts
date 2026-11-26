import type {
  AppState,
  AssessmentLevelMap,
  BehaviorSignal,
  Experience,
  HollandGroupId,
  JourneyStep,
  Pathway,
  QualitativeLevel,
  RubricCriterionKey,
  Student,
} from "../types";
import { DEFAULT_CLASS_ID } from "./schoolClasses";
import { HOLLAND_GROUPS } from "./hollandGroups";
import thptCongLapImage from "../assets/images/pathway_thpt_cong_lap.png";
import thptTuThucImage from "../assets/images/pathway_thpt_tu_thuc.png";
import gdtxImage from "../assets/images/pathway_gdtx.png";
import trungCapImage from "../assets/images/pathway_trung_cap.png";
import soCapImage from "../assets/images/pathway_so_cap.png";

export { HOLLAND_GROUPS };

export const JOURNEY_STEPS: { id: JourneyStep; label: string; shortDesc: string }[] = [
  { id: "THU", label: "THU", shortDesc: "Tìm hiểu các hướng đi mở" },
  { id: "LỌC", label: "LỌC", shortDesc: "Đặt tiêu chí đủ tốt của riêng em" },
  { id: "THỬ", label: "THỬ", shortDesc: "Trải nghiệm thực tế và ghi nhật ký" },
  { id: "CHỐT", label: "CHỐT", shortDesc: "Chọn phương án và viết lí do" },
  { id: "CAM KẾT", label: "CAM KẾT", shortDesc: "Lập việc cần làm và kí xác nhận" },
];

export const QUALITATIVE_LEVELS: QualitativeLevel[] = [
  "Hạn chế",
  "Đang hình thành",
  "Khá rõ nét",
  "Vững vàng",
];

export const STARTER_CRITERIA_SUGGESTIONS: string[] = [
  "vừa sức học của em",
  "gần nhà",
  "có thể đi làm sớm để phụ giúp gia đình",
  "vẫn có đường học lên",
  "chi phí vừa phải",
  "đúng việc em thích",
];

export const HOLLAND_PROMPTS: {
  id: string;
  group: HollandGroupId;
  prompt: string;
}[] = [
  {
    id: "h1",
    group: "ki_thuat",
    prompt: "Em thích tự tay tháo lắp, sửa chữa đồ dùng trong nhà hoặc làm sản phẩm thủ công.",
  },
  {
    id: "h2",
    group: "ki_thuat",
    prompt: "Em thích làm việc trong xưởng thực hành, phòng máy hoặc ngoài trời hơn là ngồi nghe giảng suốt buổi.",
  },
  {
    id: "h3",
    group: "nghien_cuu",
    prompt: "Khi gặp máy móc hay hiện tượng lạ, em tò mò muốn tìm hiểu xem bên trong hoạt động ra sao.",
  },
  {
    id: "h4",
    group: "nghe_thuat",
    prompt: "Em thích phối màu, cắt may, vẽ phác thảo hoặc làm cho đồ vật trở nên đẹp mắt hơn.",
  },
  {
    id: "h5",
    group: "xa_hoi",
    prompt: "Em thấy vui khi hướng dẫn được người khác hoặc cùng bạn bè hoàn thành một việc chung.",
  },
  {
    id: "h6",
    group: "quan_li",
    prompt: "Trong nhóm, em thường là người gợi ý chia việc và nhắc mọi người làm đúng hẹn.",
  },
  {
    id: "h7",
    group: "nghiep_vu",
    prompt: "Em thích ghi chép rõ ràng, làm theo từng bước hướng dẫn cụ thể và giữ mọi thứ gọn gàng.",
  },
];

export interface RubricCriterionMeta {
  key: RubricCriterionKey;
  title: string;
  levels: Record<QualitativeLevel, string>;
}

export const RUBRIC_CRITERIA: RubricCriterionMeta[] = [
  {
    key: "understandingSelf",
    title: "1. Hiểu bản thân",
    levels: {
      "Hạn chế": "Chưa nêu được điểm mạnh, chỉ nói chung chung hoặc dựa hoàn toàn vào nhận xét của người khác.",
      "Đang hình thành": "Nhận ra được một vài môn hoặc việc em làm đỡ ngại hơn, nhưng chưa gắn với sở thích.",
      "Khá rõ nét": "Nêu được điểm mạnh, sở thích nhưng còn chung chung.",
      "Vững vàng": "Nêu cụ thể điểm mạnh, hứng thú, điều kiện và liên hệ được với nghề.",
    },
  },
  {
    key: "understandingPathways",
    title: "2. Hiểu thông tin lộ trình",
    levels: {
      "Hạn chế": "Dựa vào lời đồn, không phân biệt các loại hình trường.",
      "Đang hình thành": "Biết tên vài hướng đi sau lớp 9 nhưng còn nhầm lẫn điều kiện đầu vào.",
      "Khá rõ nét": "Hiểu các lộ trình chính, còn mơ hồ về cơ hội học tiếp.",
      "Vững vàng": "Giải thích được các lộ trình sau lớp 9 (THPT công lập, THPT tư thục, GDTX, trung cấp nghề, sơ cấp nghề) và cơ hội học tiếp của từng hướng.",
    },
  },
  {
    key: "narrowingOptions",
    title: "3. Thu hẹp lựa chọn",
    levels: {
      "Hạn chế": "Giữ mọi phương án, liên tục thêm phương án mới.",
      "Đang hình thành": "Bắt đầu viết vài mong muốn cá nhân nhưng vẫn giữ nhiều cửa phòng hờ.",
      "Khá rõ nét": "Có tiêu chí nhưng chưa áp dụng nhất quán.",
      "Vững vàng": "Tự đặt tiêu chí \"đủ tốt\" và loại bỏ phương án không phù hợp.",
    },
  },
  {
    key: "decidingOnTime",
    title: "4. Chốt quyết định",
    levels: {
      "Hạn chế": "Trì hoãn, đẩy việc quyết định cho người khác.",
      "Đang hình thành": "Đã nghiêng về một hướng nhưng vẫn chần chừ trước hạn chốt.",
      "Khá rõ nét": "Chốt được nhưng cần nhắc nhiều lần.",
      "Vững vàng": "Chốt đúng hạn, nêu được lí do bằng lời của mình.",
    },
  },
  {
    key: "committingAndActing",
    title: "5. Cam kết và hành động",
    levels: {
      "Hạn chế": "Không có kế hoạch, dễ đổi ý.",
      "Đang hình thành": "Có dự định làm thử nhưng chưa sắp xếp thành việc cụ thể.",
      "Khá rõ nét": "Có kế hoạch nhưng thực hiện chưa đều.",
      "Vững vàng": "Có kế hoạch rõ, tự theo dõi và điều chỉnh.",
    },
  },
];

export function describeBehavioralSignals(signals: BehaviorSignal): string[] {
  const descriptions: string[] = [];
  if (signals.hasSensitiveAlert) {
    descriptions.push(
      "Cần quan tâm đặc biệt: em có chia sẻ dấu hiệu căng thẳng hoặc áp lực gia đình, nên trao đổi trực tiếp."
    );
  }
  if (signals.changeOptionCount >= 2) {
    descriptions.push("Em đã đổi nguyện vọng nhiều lần trong thời gian gần đây.");
  } else if (signals.changeOptionCount === 1) {
    descriptions.push("Em có một lần điều chỉnh lại lựa chọn đang cân nhắc.");
  }
  if (signals.addedAfterCommit) {
    descriptions.push("Em tiếp tục thêm phương án mới sau khi đã từng chốt hướng đi.");
  }
  if (signals.abandonedCommitStep) {
    descriptions.push("Em từng mở mục chốt quyết định nhưng tạm dừng giữa chừng.");
  }
  if (signals.hesitancyPhrasesCount > 0) {
    descriptions.push(
      "Trong nhật ký hoặc trò chuyện có xuất hiện câu băn khoăn kiểu \"nhưng biết đâu…\", \"chắc là được\"."
    );
  }
  return descriptions;
}

export function buildHollandSummary(selectedIds: string[]): string {
  if (selectedIds.length === 0) {
    return "Em hãy chọn vài gợi ý gần với mình nhất để hệ thống tóm tắt bằng lời nhé.";
  }
  const counts: Partial<Record<HollandGroupId, number>> = {};
  for (const id of selectedIds) {
    const item = HOLLAND_PROMPTS.find((p) => p.id === id);
    if (item) {
      counts[item.group] = (counts[item.group] || 0) + 1;
    }
  }
  const sortedGroups = (Object.keys(counts) as HollandGroupId[]).sort(
    (a, b) => (counts[b] || 0) - (counts[a] || 0)
  );
  const top = sortedGroups.slice(0, 2);
  return top.map((g) => HOLLAND_GROUPS[g].descriptionText).join(" ");
}

export const DEFAULT_PRACTITIONER_QUESTIONS: string[] = [
  "Một ngày làm việc hoặc học tập thực tế của anh/chị diễn ra như thế nào, phần nào mất nhiều công sức nhất?",
  "Khi mới bắt đầu chọn hướng đi này sau lớp 9, điều gì từng khiến anh/chị băn khoăn nhất và anh/chị đã vượt qua ra sao?",
];

const TRUNG_CAP_SO_CAP_SCHOOLS = [
  "1. Trường Trung cấp Chuyên nghiệp Ý Việt",
  "• Địa chỉ: 478A1 Điện Biên Phủ, Thanh Khê, Đà Nẵng (và các cơ sở tại Thanh Khê, Liên Chiểu)",
  "• Đào tạo: Hệ 9+ (song song văn hóa THPT và trung cấp nghề), trung cấp và sơ cấp nghề (CNTT, kế toán, quản trị nhà hàng - khách sạn, kỹ thuật chế biến món ăn, chăm sóc sắc đẹp...)",
  "2. Trường Trung cấp Việt Á",
  "• Địa chỉ: 105 Lê Sát, Hòa Cường, Đà Nẵng / 16 Lý Thường Kiệt, Hải Châu, Đà Nẵng",
  "• Đào tạo: Hệ 9+, trung cấp và sơ cấp nghề (y dược, kinh tế, du lịch, kỹ thuật...)",
  "3. Trường Trung cấp Đông Nam Á",
  "• Địa chỉ: 369 Phan Châu Trinh, Hòa Cường, Đà Nẵng / 80B Lê Duẩn, Hải Châu, Đà Nẵng",
  "• Đào tạo: Trung cấp nghề và sơ cấp nghề dành cho học sinh sau THCS (du lịch, dịch vụ, công nghệ, kinh tế...)",
  "4. Trường Trung cấp nghề Don Bosco Đà Nẵng",
  "• Địa chỉ: 241 Trần Nam Trung, Hòa Xuân, Đà Nẵng",
  "• Đào tạo: Hệ 9+, trung cấp và sơ cấp nghề (quản trị nhà hàng, công nghệ ô tô, kỹ thuật chế biến món ăn, điện công nghiệp và dân dụng)",
  "5. Trường Trung cấp nghề Giao thông Công chính Đà Nẵng",
  "• Địa chỉ: 96 Đỗ Thúc Tịnh / 162 Trịnh Đình Thảo, Cẩm Lệ, Đà Nẵng",
  "• Đào tạo: Hệ 9+, trung cấp và sơ cấp nghề (công nghệ ô tô, kế toán doanh nghiệp, điện, xây dựng...)",
  "6. Trường Cao đẳng Đà Nẵng",
  "• Địa chỉ: 99 Tô Hiến Thành, An Hải, Đà Nẵng (cùng các cơ sở tại Ngũ Hành Sơn)",
  "• Đào tạo: Hệ 9+ (vừa học văn hóa vừa học nghề), trung cấp và sơ cấp nghề (kỹ thuật, công nghệ, kinh tế, du lịch, văn hóa nghệ thuật)",
  "7. Trường Cao đẳng Nghề Nguyễn Văn Trỗi",
  "• Địa chỉ: 69 Đoàn Hữu Trưng, An Khê, Đà Nẵng",
  "• Đào tạo: Hệ 9+, trung cấp và sơ cấp nghề (cơ khí, điện - điện tử, công nghệ ô tô, may thời trang, CNTT)",
  "8. Trường Cao đẳng Bách khoa Đà Nẵng",
  "• Địa chỉ: 271 Tố Hữu, Cẩm Lệ, Đà Nẵng",
  "• Đào tạo: Hệ 9+, trung cấp và sơ cấp nghề (chăm sóc sắc đẹp, du lịch, CNTT, ngoại ngữ, kỹ thuật)",
  "9. Trường Cao đẳng Nghề Việt - Úc",
  "• Địa chỉ: K476/8 Điện Biên Phủ, Thanh Khê, Đà Nẵng",
  "• Đào tạo: Hệ 9+, trung cấp và sơ cấp nghề (quản trị khách sạn, nhà hàng, chế biến món ăn, hướng dẫn du lịch)",
  "10. Trường Cao đẳng Du lịch Đà Nẵng",
  "• Địa chỉ: Tổ 69 Nam Kỳ Khởi Nghĩa, Ngũ Hành Sơn, Đà Nẵng",
  "• Đào tạo: Hệ trung cấp và sơ cấp nghề cho học sinh tốt nghiệp THCS (lữ hành, khách sạn, nhà hàng, kỹ thuật chế biến món ăn)",
  "11. Trường Cao đẳng Giao thông vận tải Trung ương V",
  "• Địa chỉ: 28 Ngô Xuân Thu, Hải Vân, Đà Nẵng",
  "• Đào tạo: Hệ trung cấp và sơ cấp nghề cho học sinh sau THCS (xây dựng cầu đường, công nghệ ô tô, vận tải...)",
  "12. Trường Cao đẳng Phương Đông Đà Nẵng",
  "• Địa chỉ: 32 Phan Đăng Lưu, Hòa Cường, Hải Châu, Đà Nẵng",
  "• Đào tạo: Hệ trung cấp và sơ cấp nghề nhận học sinh tốt nghiệp THCS (y dược, kinh tế, du lịch, kỹ thuật - công nghệ)",
  "13. Trung tâm Giáo dục nghề nghiệp Đà Nẵng",
  "• Địa chỉ: 657 Trường Chinh, Cẩm Lệ, Đà Nẵng / 278 Âu Cơ, Liên Chiểu, Đà Nẵng",
  "• Đào tạo: Sơ cấp nghề ngắn hạn cho học sinh từ đủ 15 tuổi (không bao gồm học văn hóa THPT)",
  "14. Dạy nghề Netspace Đà Nẵng",
  "• Địa chỉ: 3 Phan Thành Tài, Hòa Cường, Đà Nẵng",
  "• Đào tạo: Sơ cấp nghề ngắn hạn (nấu ăn, làm bánh, pha chế) nhận học viên tốt nghiệp THCS, không dạy văn hóa",
  "15. Hướng Nghiệp Á Âu (Chi nhánh Đà Nẵng)",
  "• Địa chỉ: 304 Điện Biên Phủ, Thanh Khê, Đà Nẵng",
  "• Đào tạo: Sơ cấp nghề ngắn hạn (nghiệp vụ bếp, pha chế, làm bánh, nhà hàng - khách sạn) nhận học viên sau THCS, không dạy văn hóa",
  "16. Trung tâm Dạy nghề Thẩm mỹ Cẩm Anh",
  "• Địa chỉ: 50–52–54–56 Trần Tống và 57 Trần Tống, Thanh Khê, Đà Nẵng",
  "• Đào tạo: Sơ cấp nghề thẩm mỹ ngắn hạn (chăm sóc da, spa, nail, phun xăm, trang điểm, tóc) nhận học viên từ đủ 15 tuổi, không dạy văn hóa",
  "17. Trường Đào tạo Thẩm mỹ Seoul Academy",
  "• Địa chỉ: 268 Nguyễn Tri Phương, Thanh Khê, Đà Nẵng",
  "• Đào tạo: Sơ cấp nghề thẩm mỹ ngắn hạn (spa, phun xăm, trang điểm, nối mi, gội đầu dưỡng sinh) nhận học viên sau THCS, không dạy văn hóa",
].join("\n");

export const INITIAL_PATHWAYS: Pathway[] = [
  {
    id: "pw-thpt-cong",
    category: "THPT_CONG_LAP",
    title: "THPT công lập",
    shortSubtitle: "Học chương trình phổ thông 3 năm (lớp 10–12) tại trường công lập",
    entryRequirements:
      "Thi tuyển lớp 10 với 3 môn Ngữ văn, Toán, Ngoại ngữ (thang 30 điểm) theo quy định của Sở GD&ĐT TP. Đà Nẵng; phù hợp khi lực học văn hóa đều và theo kịp cường độ ôn thi.",
    learningContent:
      "Các môn văn hóa phổ thông theo Chương trình GDPT 2018, rèn nền tảng học thuật chuẩn bị cho kì thi tốt nghiệp THPT và xét tuyển bậc cao hơn.",
    careerOpportunities:
      "Tiếp tục học đại học, cao đẳng hoặc học nghề sau khi hoàn thành lớp 12.",
    articulationPath:
      "Tốt nghiệp THPT → Cao đẳng / Đại học / Học nghề trình độ cao hơn",
    realSchoolNames: [
      "• THPT chuyên Lê Quý Đôn: 01 Vũ Văn Dũng, An Hải, Đà Nẵng",
      "• THPT Chuyên Nguyễn Bỉnh Khiêm: HFHH+H2V, 2 Trần Đại Nghĩa, Bàn Thạch, Đà Nẵng",
      "• THPT Chuyên Lê Thánh Tông: 236 Trường Chinh, Hội An Tây, Đà Nẵng",
      "• Trường Phổ thông Dân tộc Nội trú Quảng Nam: 39 Nguyễn Tất Thành, Hội An, Đà Nẵng",
      "• Trường Phổ thông Dân tộc Nội trú Nam Trà My: 44WC+J7F, ĐT616, Nam Trà My, Đà Nẵng",
      "• Trường Phổ thông Dân tộc Nội trú THCS Đông Giang: WJ9W+HJ7, Đông Giang, Đà Nẵng",
      "• THCS, THPT Nguyễn Khuyến: 2A Đặng Xuân Bảng, Cẩm Lệ, Đà Nẵng",
      "• THPT Âu Cơ: XW5G+CVC, Sông Vàng, Đà Nẵng",
      "• THPT Bắc Trà My: 86P9+P7M, ĐT616, khối 2, Trà My, Đà Nẵng",
      "• THPT Cẩm Lệ: 2 Nguyễn Thế Lịch, Cẩm Lệ, Đà Nẵng",
      "• THPT Cao Bá Quát: Tam Anh, Đà Nẵng",
      "• THPT Chu Văn An: VX6R+22C, Hà Thanh, Hà Nha, Đà Nẵng",
      "• THPT Đỗ Đăng Tuyển: R3GG+R83, Phú Long, Phú Thuận, Đà Nẵng",
      "• THPT Duy Tân: JGJF+7GH, Quảng Phú, Đà Nẵng",
      "• THPT Hiệp Đức: Chu Huy Mân, tt. Nhà Bàng, Hiệp Đức, Đà Nẵng",
      "• THPT Hồ Nghinh: R8JG+FM9, Duy Nghĩa, Đà Nẵng",
      "• THPT Hòa Vang: 101 Ông Ích Đường, Cẩm Lệ, Đà Nẵng",
      "• THPT Hoàng Diệu: V5PH+WH2, Điện Bàn Tây, Đà Nẵng",
      "• THPT Hoàng Hoa Thám: 63 Phạm Cự Lượng, An Hải, Đà Nẵng",
      "• THPT Hùng Vương: QL1A, Thăng Điền, Đà Nẵng",
      "• THPT Huỳnh Ngọc Huệ: 161 Nguyễn Tất Thành, Đại Lộc, Đà Nẵng",
      "• THPT Huỳnh Thúc Kháng: 19 Đường Huỳnh Thúc Kháng, Tiên Phước, Đà Nẵng",
      "• THPT Khâm Đức: 14 Phan Châu Trinh, Khâm Đức, Đà Nẵng",
      "• THPT Lê Hồng Phong: R4PF+26X, thôn 3, Thu Bồn, Đà Nẵng",
      "• THPT Lê Quý Đôn: 01 Vũ Văn Dũng, An Hải, Đà Nẵng",
      "• THPT Liên Chiểu: 442M+V8W, Trần Tấn, Quan Nam, Hải Vân, Đà Nẵng",
      "• THPT Lương Thế Vinh: 738 Trần Thủ Độ, Điện Bàn Đông, Đà Nẵng",
      "• THPT Lương Thúc Kỳ: Đại Lộc, Đà Nẵng",
      "• THPT Lý Tự Trọng: M76M+JW9, Đồng Dương, Đà Nẵng",
      "• THPT Nam Trà My: 44V9+QPV, ĐT616, Nam Trà My, Đà Nẵng",
      "• THPT Ngô Quyền: 57 Phạm Cự Lượng, An Hải, Đà Nẵng",
      "• THPT Ngũ Hành Sơn: 2763+5V9, Bà Bang Nhãn, Ngũ Hành Sơn, Đà Nẵng",
      "• THPT Nguyễn Dục: QL40B, Phú Ninh, Đà Nẵng",
      "• THPT Nguyễn Duy Hiệu: V6WW+49R, Trần Nhân Tông, Điện Bàn, Đà Nẵng",
      "• THPT Nguyễn Hiền: 61 Phan Đăng Lưu, Hòa Cường, Đà Nẵng",
      "• THPT Nguyễn Hiền - Duy Xuyên: R6FQ+JVM, Duy Xuyên, Đà Nẵng",
      "• THPT Nguyễn Huệ: CJVP+447, Núi Thành, Đà Nẵng",
      "• THPT Nguyễn Khuyến: 2A Đặng Xuân Bảng, Cẩm Lệ, Đà Nẵng",
      "• THPT Nguyễn Thái Bình: QC63+F8F, TL 613, Thăng An, Đà Nẵng",
      "• THPT Nguyễn Thượng Hiền: 54 Thích Quảng Đức, Hòa Khánh, Đà Nẵng",
      "• THPT Nguyễn Trãi: 1 Phan Văn Định, Liên Chiểu, Đà Nẵng",
      "• THPT Nguyễn Trãi - Hội An: 58 Nguyễn Công Trứ, Hội An Tây, Đà Nẵng",
      "• THPT Nguyễn Văn Cừ: Q8V8+96P, Xuân Phú, Đà Nẵng",
      "• THPT Nguyễn Văn Thoại: 132 Đô Đốc Lân, Hòa Xuân, Đà Nẵng",
      "• THPT Nguyễn Văn Trỗi: HFXH+JP8, Thôn Đắc Rế, Xã La Dê, Huyện Nam Giang, Tỉnh Quảng Nam, La Dêê, Đà Nẵng",
      "• THPT Nông Sơn: P384+96X, ĐT610, Trung Phước, Nông Sơn, Đà Nẵng",
    ].join("\n"),
    realSchoolAddresses:
      "Địa chỉ các trường được cập nhật theo sắp xếp đơn vị hành chính của TP. Đà Nẵng (sau sáp nhập với Quảng Nam từ 01/7/2025). Học sinh kiểm tra lại với Sở GD&ĐT trước khi nộp hồ sơ.",
    tuitionEstimate:
      "Miễn 100% học phí cho học sinh từ lớp 10 đến lớp 12 tại các trường THPT công lập trên toàn quốc từ năm học 2025–2026, theo quyết định của Bộ Chính trị ngày 28/02/2025.",
    admissionCutoff: [
      "1. Các trường THPT chuyên:",
      "• Chuyên Hóa: THPT chuyên Lê Quý Đôn: 47,14 | THPT chuyên Nguyễn Bỉnh Khiêm: 37,25 | THPT chuyên Lê Thánh Tông: 36,00",
      "• Chuyên Lịch sử: THPT chuyên Lê Quý Đôn: 41,25 | THPT chuyên Nguyễn Bỉnh Khiêm: 34,50 | THPT chuyên Lê Thánh Tông: 34,14",
      "• Chuyên Ngữ văn: THPT chuyên Lê Quý Đôn: 44,00 (1) | THPT chuyên Nguyễn Bỉnh Khiêm: 39,25 | THPT chuyên Lê Thánh Tông: 40,25",
      "• Chuyên Sinh học: THPT chuyên Lê Quý Đôn: 46,50 | THPT chuyên Nguyễn Bỉnh Khiêm: 38,25 | THPT chuyên Lê Thánh Tông: 39,50",
      "• Chuyên Tiếng Anh: THPT chuyên Lê Quý Đôn: 42,95 | THPT chuyên Nguyễn Bỉnh Khiêm: 38,05 | THPT chuyên Lê Thánh Tông: 39,55",
      "• Chuyên Tiếng Nhật: THPT chuyên Lê Quý Đôn: 43,68 | THPT chuyên Nguyễn Bỉnh Khiêm: Không có | THPT chuyên Lê Thánh Tông: Không có",
      "• Chuyên Tiếng Pháp: THPT chuyên Lê Quý Đôn: 41,50 | THPT chuyên Nguyễn Bỉnh Khiêm: Không có | THPT chuyên Lê Thánh Tông: Không có",
      "• Chuyên Tin học: THPT chuyên Lê Quý Đôn: 39,00 | THPT chuyên Nguyễn Bỉnh Khiêm: 25,35 | THPT chuyên Lê Thánh Tông: 31,48",
      "• Chuyên Toán: THPT chuyên Lê Quý Đôn: 43,75 | THPT chuyên Nguyễn Bỉnh Khiêm: 37,00 | THPT chuyên Lê Thánh Tông: 38,50 (2)",
      "• Chuyên Vật lí: THPT chuyên Lê Quý Đôn: 43,39 | THPT chuyên Nguyễn Bỉnh Khiêm: 38,25 | THPT chuyên Lê Thánh Tông: 37,75",
      "• Chuyên Địa lí: THPT chuyên Lê Quý Đôn: 44,64 | THPT chuyên Nguyễn Bỉnh Khiêm: 37,64 | THPT chuyên Lê Thánh Tông: 35,50",
      "2. Các trường THPT công lập:",
      "• THCS, THPT Nguyễn Khuyến: 32,50",
      "• THPT Âu Cơ: 8,00",
      "• THPT Bắc Trà My: 11,00",
      "• THPT Cẩm Lệ: 25,00",
      "• THPT Cao Bá Quát: 10,25",
      "• THPT Chu Văn An: 12,25",
      "• THPT Đỗ Đăng Tuyển: 11,75",
      "• THPT Duy Tân: 9,00",
      "• THPT Hiệp Đức: 14,50",
      "• THPT Hồ Nghinh: 22,50",
      "• THPT Hòa Vang: 33,75",
      "• THPT Hoàng Diệu: 18,75",
      "• THPT Hoàng Hoa Thám: 33,25",
      "• THPT Hùng Vương: 12,75",
      "• THPT Huỳnh Ngọc Huệ: 12,75",
      "• THPT Huỳnh Thúc Kháng: 8,75",
      "• THPT Khâm Đức: 11,50",
      "• THPT Lê Hồng Phong: 13,50",
      "• THPT Lê Quý Đôn: 21,75",
      "• THPT Liên Chiểu: 23,00",
      "• THPT Lương Thế Vinh: 18,25",
      "• THPT Lương Thúc Kỳ: 17,50",
      "• THPT Lý Tự Trọng: 10,75",
      "• THPT Nam Trà My: 7,75",
      "• THPT Ngô Quyền: 24,00",
      "• THPT Ngũ Hành Sơn: 24,00",
      "• THPT Nguyễn Dục: 7,50",
      "• THPT Nguyễn Duy Hiệu: 20,00",
      "• THPT Nguyễn Hiền: 26,50",
      "• THPT Nguyễn Hiền - Duy Xuyên: 10,75",
      "• THPT Nguyễn Huệ: 13,50",
      "• THPT Nguyễn Khuyến: 19,00",
      "• THPT Nguyễn Thái Bình: 10,25",
      "• THPT Nguyễn Thượng Hiền: 26,00",
      "• THPT Nguyễn Trãi: 29,00",
      "• THPT Nguyễn Trãi - Hội An: 20,25",
      "• THPT Nguyễn Văn Cừ: 9,00",
      "• THPT Nguyễn Văn Thoại: 29,25",
      "• THPT Nguyễn Văn Trỗi: 9,00",
      "• THPT Nông Sơn: 10,00",
      "• THPT Núi Thành: 16,00",
      "• THPT Ông Ích Khiêm: 20,75",
      "• THPT Phạm Phú Thứ: 22,50",
      "• THPT Phạm Phú Thứ - Gò Nổi: 16,75",
      "• THPT Phan Bội Châu: 16,75",
      "• THPT Phan Châu Trinh: 35,50",
      "• THPT Phan Châu Trinh - Tiên Phước: 8,50",
      "• THPT Phan Thành Tài: 22,50",
      "• THPT Quang Trung - Đông Giang: 8,50",
      "• THPT Quế Sơn: 8,75",
      "• THPT Sào Nam: 9,00",
      "• THPT Sơn Trà: 27,00",
      "• THPT Tây Giang: 9,25",
      "• THPT Thái Phiên: 31,00",
      "• THPT Thái Phiên - Thăng Bình: 9,25",
      "• THPT Thanh Khê: 26,75",
      "• THPT Tiểu La: 8,00",
      "• THPT Tố Hữu: 11,00",
      "• THPT Tôn Thất Tùng: 20,75",
      "• THPT Trần Cao Vân: 29,50",
      "• THPT Trần Đại Nghĩa: 8,25",
      "• THPT Trần Hưng Đạo: 20,25",
      "• THPT Trần Phú: 31,75",
      "• THPT Trần Phú - Việt An: 9,50",
      "• THPT Trần Quý Cáp: 25,25",
      "• THPT Trần Văn Dư: 15,75",
      "• THPT Võ Chí Công: 21,75",
      "• THPT Võ Chí Công - Hùng Sơn: 9,75",
      "• THPT Võ Nguyên Giáp: 14,00",
    ].join("\n"),
    imageUrl: thptCongLapImage,
    imageCaption: "Hình ảnh tại trường THPT Phan Châu Trinh (Đà Nẵng).",
    realStories: [],
    scenario: {
      title: "Một ngày học tập ở bậc THPT công lập",
      intro:
        "Thử hình dung một tuần học bình thường ở lớp 10 THPT công lập với cường độ nhiều môn văn hóa và kiểm tra định kì.",
      startNodeId: "short-answer",
      responseMode: "shortAnswer",
      shortAnswerPrompt:
        "Buổi sáng em học 5 tiết Toán, Ngữ văn, Tiếng Anh và Vật lí liên tiếp; buổi chiều có bài tập nhóm và đề cương ôn kiểm tra giữa kì. Em thường phản ứng thế nào và em sẽ sắp xếp việc học ra sao?",
      shortAnswerSuggestions: [
        "Em thấy hào hứng vì được học nhiều môn và sẽ lập thời gian biểu ôn bài mỗi tối.",
        "Em hơi mệt khi phải ngồi nghe giảng nhiều, nên em cần chia nhỏ thời gian học và nghỉ ngắn.",
        "Em sẽ ưu tiên môn còn yếu, nhờ bạn hoặc thầy cô giải thích thêm.",
        "Em muốn thử một ngày học thật ở trường THPT để biết mình có theo được nhịp này không.",
      ],
      nodes: [],
      reflectionPrompt: "Em thấy mình hợp / chưa hợp ở điểm nào với nhịp học THPT công lập?",
    },
  },
  {
    id: "pw-thpt-tu",
    category: "THPT_TU_THUC",
    title: "THPT tư thục",
    shortSubtitle: "Học chương trình THPT tại cơ sở ngoài công lập",
    entryRequirements:
      "Xét tuyển học bạ THCS hoặc theo phương án tuyển sinh riêng của từng trường (một số trường kết hợp thi đánh giá năng lực/phỏng vấn).",
    learningContent:
      "Chương trình THPT theo quy định của Bộ GD&ĐT; nhiều trường tăng cường kĩ năng, ngoại ngữ và hoạt động trải nghiệm.",
    careerOpportunities:
      "Tốt nghiệp THPT để dự tuyển đại học, cao đẳng hoặc học nghề.",
    articulationPath: "Tốt nghiệp THPT → Cao đẳng / Đại học / Học nghề",
    realSchoolNames: [
      "• Trường THPT Quang Trung: 68 Đỗ Quang, Thanh Khê, Đà Nẵng.",
      "• Trường THPT Khai Trí: 116 Nguyễn Huy Tưởng, Hòa Khánh, Đà Nẵng.",
      "• Trường THCS & THPT Hiển Nhân: 271 Tố Hữu, Cẩm Lệ, Đà Nẵng.",
      "• Trường THPT FPT Đà Nẵng: Khu đô thị FPT City, Hòa Hải, Ngũ Hành Sơn, Đà Nẵng.",
      "• Trường TH, THCS & THPT Việt Nhật: 365 Phan Châu Trinh, Hòa Cường, Đà Nẵng.",
      "• Hệ thống Giáo dục Sky-Line (Cơ sở Riverside): Lô A2.4 Trần Đăng Ninh, Hòa Cường, Đà Nẵng.",
      "• Hệ thống Giáo dục Sky-Line (Cơ sở Global): Lô A2 Trần Đăng Ninh, Hòa Cường, Đà Nẵng.",
      "• The St. Nicholas School: Lô A2-15, Khu E2 mở rộng, đường Trần Nam Trung, Hòa Xuân, Đà Nẵng.",
      "• Hệ thống trường Sakura – Olympia: 63 Lê Văn Long, Hải Châu, Đà Nẵng.",
      "• Trường Quốc tế Hoa Kỳ APU Đà Nẵng: 299 Trần Đại Nghĩa, Ngũ Hành Sơn, Đà Nẵng.",
      "• Trường TH, THCS và THPT Anh Quốc (UKA Đà Nẵng): K01/02B Tôn Thất Đạm, Phường Thanh Khê, TP. Đà Nẵng.",
      "• Trường Liên cấp Quốc tế Singapore (SIS Đà Nẵng): Đường Vùng Trung 3, Khu đô thị mới Phú Mỹ An, Phường Ngũ Hành Sơn, TP. Đà Nẵng.",
      "• Trường TH, THCS và THPT Hoàng Sa: Đường Dũng Sĩ Điện Ngọc, Phường Điện Bàn Đông, TP. Đà Nẵng.",
      "• Trường THPT Hà Huy Tập: 190 Lý Thường Kiệt, Phường Tam Kỳ, TP. Đà Nẵng.",
    ].join("\n"),
    realSchoolAddresses:
      "Danh sách trường tư thục tiêu biểu tại TP. Đà Nẵng; địa chỉ một số trường đang được cập nhật sau sắp xếp đơn vị hành chính.",
    tuitionEstimate: [
      "Học phí tham khảo (mức thu thay đổi theo chương trình và năm học):",
      "• THPT Nguyễn Khuyến: đang cập nhật",
      "• THPT Quang Trung: khoảng 1,7 triệu đồng/tháng (2024)",
      "• THPT Sky-Line: 50–219 triệu đồng/năm tùy chương trình (2024)",
      "• THPT FPT Đà Nẵng: 30,15 triệu đồng/kỳ (lớp 10, 2026–2027)",
      "• APU: 521–568 triệu đồng/năm (2024)",
    ].join("\n"),
    admissionCutoff:
      "Xét học bạ THCS hoặc kết hợp thi đánh giá năng lực/phỏng vấn tùy trường. Chỉ tiêu lớp 10 tư thục năm 2026–2027: hơn 4.100 học sinh.",
    imageUrl: thptTuThucImage,
    imageCaption: "Hình ảnh tại Hệ thống Giáo dục Việt Nhật (Đà Nẵng).",
    realStories: [],
    scenario: {
      title: "Một ngày học tập và cân đối chi phí tại trường THPT tư thục",
      intro:
        "Thử hình dung hoàn cảnh học tập, quãng đường đi lại và chi phí hàng tháng khi theo học một trường THPT tư thục.",
      startNodeId: "n1",
      reflectionPrompt: "Em thấy mình hợp / chưa hợp ở điểm nào?",
      nodes: [
        {
          id: "n1",
          prompt:
            "Bạn bè rủ em nộp hồ sơ vào trường tư cách nhà 35 phút đi xe vì không phải thi căng. Trước khi quyết định, em làm gì?",
          choices: [
            {
              id: "c1",
              label: "Ngồi cùng bố mẹ tính rõ học phí 3 năm, tiền xe buýt và thời gian đi lại mỗi ngày",
              nextNodeId: "n2",
              outcomeNote:
                "Em đã kiểm tra điều kiện thực tế của gia đình thay vì chọn theo lời rủ rê.",
            },
            {
              id: "c2",
              label: "Nghĩ rằng 'chắc bố mẹ sẽ lo được' và chưa hỏi kĩ chi phí hàng tháng",
              nextNodeId: "n2",
              outcomeNote:
                "Nếu chưa hỏi kĩ gia đình, em dễ gặp áp lực tài chính hoặc mệt mỏi khi đi học xa giữa chừng.",
            },
          ],
        },
        {
          id: "n2",
          prompt:
            "Sau 3 năm học văn hóa THPT ở trường tư, em dự định làm gì tiếp theo?",
          choices: [
            {
              id: "c3",
              label: "Em đã có mục tiêu rõ về ngành học tiếp theo và gia đình hoàn toàn chủ động được học phí",
              nextNodeId: null,
              outcomeNote:
                "Khi mục tiêu và tài chính rõ ràng, em sẽ đi học nhẹ nhàng và vững tâm hơn.",
            },
            {
              id: "c4",
              label: "Em chỉ chọn tạm để 'vẫn đi học cấp 3 cho giống bạn', chưa rõ sau lớp 12 làm gì",
              nextNodeId: null,
              outcomeNote:
                "Thử đối chiếu thêm mô hình Trung cấp nghề hoặc GDTX để xem hướng nào thiết thực hơn với em.",
            },
          ],
        },
      ],
    },
  },
  {
    id: "pw-gdtx",
    category: "GDTX",
    title: "Giáo dục thường xuyên (học văn hóa THPT)",
    shortSubtitle: "Học chương trình văn hóa THPT với nhịp độ phù hợp",
    entryRequirements:
      "Đã tốt nghiệp THCS; xét học bạ, không thi tuyển đầu vào.",
    learningContent:
      "Các môn văn hóa cốt lõi của chương trình THPT; có thể học song song một nghề ngắn hạn hoặc hệ trung cấp 9+.",
    careerOpportunities:
      "Thi tốt nghiệp THPT như học sinh phổ thông hoặc chuyển tiếp học trung cấp nghề, cao đẳng nghề.",
    articulationPath:
      "Tốt nghiệp THPT hệ GDTX → Trung cấp nghề / Cao đẳng nghề / Đại học",
    realSchoolNames: [
      "• Trung tâm GDTX Đà Nẵng – Cơ sở 1: 1093 Ngô Quyền, phường An Hải, TP. Đà Nẵng.",
      "• Trung tâm GDTX Đà Nẵng – Điểm đào tạo Nguyễn Công Trứ: 196 Nguyễn Công Trứ, phường An Hải, TP. Đà Nẵng.",
      "• Trung tâm GDTX Đà Nẵng – Cơ sở 2: 725 Trần Cao Vân, phường Thanh Khê, TP. Đà Nẵng.",
      "• Trung tâm GDTX Đà Nẵng – Điểm đào tạo Lê Sát: 105 Lê Sát, phường Hòa Cường, TP. Đà Nẵng.",
      "• Trung tâm GDTX Đà Nẵng – Cơ sở 3: 815 Trường Chinh, phường Cẩm Lệ, TP. Đà Nẵng.",
      "• Trung tâm GDTX Đà Nẵng – Cơ sở 4: 02 Trần Trung Tri, phường Bàn Thạch, TP. Đà Nẵng (điểm cũ tại 124B Trần Quý Cáp, phường Tam Kỳ).",
      "• Trung tâm GDNN - GDTX Hội An: 13 Trần Hưng Đạo, phường Hội An, TP. Đà Nẵng.",
      "• Trung tâm GDNN - GDTX Điện Bàn: Phường Điện Bàn, TP. Đà Nẵng.",
      "• Trung tâm GDNN - GDTX Duy Xuyên: Xã Duy Xuyên (xã Duy Phước cũ), TP. Đà Nẵng.",
      "• Trung tâm GDNN - GDTX Đại Lộc: Xã Đại Lộc, TP. Đà Nẵng.",
      "• Trung tâm GDNN - GDTX Quế Sơn: Xã Quế Sơn, TP. Đà Nẵng.",
      "• Trung tâm GDNN - GDTX Thăng Bình: Xã Thăng Bình, TP. Đà Nẵng.",
      "• Trung tâm GDNN - GDTX Phú Ninh: Xã Phú Ninh, TP. Đà Nẵng.",
      "• Trung tâm GDNN - GDTX Núi Thành: Xã Núi Thành, TP. Đà Nẵng.",
      "• Trung tâm GDNN - GDTX Tiên Phước: Xã Tiên Phước, TP. Đà Nẵng.",
      "• Trung tâm GDNN - GDTX Hiệp Đức: Xã Hiệp Đức, TP. Đà Nẵng.",
      "• Trung tâm GDNN - GDTX Bắc Trà My: Xã Bắc Trà My, TP. Đà Nẵng.",
      "• Trung tâm GDNN - GDTX Nam Trà My: Xã Nam Trà My, TP. Đà Nẵng.",
      "• Trung tâm GDNN - GDTX Phước Sơn: Xã Phước Sơn, TP. Đà Nẵng.",
      "• Trung tâm GDNN - GDTX Nam Giang: Xã Nam Giang, TP. Đà Nẵng.",
    ].join("\n"),
    realSchoolAddresses:
      "Các cơ sở giữ địa chỉ cũ sau sáp nhập; học sinh liên hệ trung tâm để biết địa điểm học lớp 10 gần nhà nhất.",
    tuitionEstimate:
      "Học phí GDTX theo quy định hiện hành; học sinh hệ 9+ liên kết với trường trung cấp, cao đẳng được miễn học phí nghề (theo thông tin năm 2026–2027).",
    admissionCutoff:
      "Xét học bạ THCS. Năm học 2026–2027: 1.215 học viên/27 lớp lớp 10; riêng cơ sở 105 Lê Sát 450 học sinh/10 lớp. Lịch học chi tiết liên hệ trung tâm.",
    imageUrl: gdtxImage,
    imageCaption: "Hình ảnh tại Trung tâm Giáo dục thường xuyên Đà Nẵng",
    realStories: [],
    scenario: {
      title: "Một ngày học văn hóa GDTX kết hợp rèn nghề",
      intro:
        "Thử hình dung lịch học giảm số môn áp lực và dành nửa ngày để học thêm kĩ năng thực tế hoặc phụ giúp gia đình.",
      startNodeId: "n1",
      reflectionPrompt: "Em thấy mình hợp / chưa hợp ở điểm nào?",
      nodes: [
        {
          id: "n1",
          prompt:
            "Buổi sáng em học các môn văn hóa cốt lõi tại trung tâm GDTX. Buổi chiều em có khoảng thời gian trống linh hoạt. Em muốn dùng buổi chiều thế nào?",
          choices: [
            {
              id: "c1",
              label: "Học thêm một lớp nghề ngắn hạn hoặc phụ giúp gia đình có thêm thu nhập",
              nextNodeId: "n2",
              outcomeNote:
                "Sự linh hoạt thời gian giúp em vừa giữ bằng tốt nghiệp THPT vừa rèn kĩ năng thực tế.",
            },
            {
              id: "c2",
              label: "Dành thời gian tự ôn lại kiến thức nền để chuẩn bị thi tốt nghiệp THPT",
              nextNodeId: "n2",
              outcomeNote:
                "Nhịp học nhẹ hơn giúp em có khoảng thở để củng cố lại các môn mình từng mất gốc.",
            },
          ],
        },
        {
          id: "n2",
          prompt:
            "Một vài người xung quanh có thể hỏi vì sao em không học trường THPT bình thường. Em nghĩ sao về điều đó?",
          choices: [
            {
              id: "c3",
              label: "Em hiểu rõ đây là lựa chọn vừa sức mình và vẫn thi tốt nghiệp, học lên bình thường",
              nextNodeId: null,
              outcomeNote:
                "Sự vững vàng đến từ việc em chọn điều hợp với mình chứ không chạy theo lời đồn.",
            },
            {
              id: "c4",
              label: "Em vẫn hơi ngại ánh nhìn của bạn bè dù thấy nhịp học này rất vừa sức",
              nextNodeId: null,
              outcomeNote:
                "Em có thể chia sẻ thẳng điều này với thầy/cô hoặc gia đình để tìm điểm tựa tâm lí.",
            },
          ],
        },
      ],
    },
  },
  {
    id: "pw-trung-cap",
    category: "TRUNG_CAP",
    title: "Trung cấp nghề (kết hợp học văn hóa THPT)",
    shortSubtitle: "Vừa rèn tay nghề thực hành, vừa giữ cơ hội học tiếp lên cao hơn",
    entryRequirements:
      "Tốt nghiệp THCS; xét tuyển học bạ hoặc phỏng vấn định hướng nghề, không nặng thi cử văn hóa.",
    learningContent:
      "Thực hành nghề chiếm phần lớn thời lượng (điện, cơ khí, ô tô, du lịch, nấu ăn, dược, điều dưỡng, CNTT...) song song học văn hóa THPT.",
    careerOpportunities:
      "Có tay nghề sớm để đi làm phụ giúp gia đình sau khi tốt nghiệp trung cấp nghề, hoặc học tiếp lên cao đẳng nghề.",
    articulationPath:
      "Trung cấp nghề (+ văn hóa THPT) → Cao đẳng nghề → Đại học (theo quy định)",
    realSchoolNames: TRUNG_CAP_SO_CAP_SCHOOLS,
    realSchoolAddresses:
      "Các trường đều xét tuyển học bạ; học sinh nên hỏi rõ ngành, thời gian thực hành và cách sắp xếp lịch học văn hóa.",
    tuitionEstimate:
      "Nhiều trường miễn học phí trung cấp cho học sinh tốt nghiệp THCS; mức thu cụ thể tùy trường và ngành nghề.",
    admissionCutoff:
      "Xét tuyển học bạ hoặc phỏng vấn định hướng nghề. Toàn TP. Đà Nẵng có 23 trường cao đẳng, 9 trường trung cấp, 16 trung tâm GDNN với 189 ngành nghề (2026–2027).",
    imageUrl: trungCapImage,
    imageCaption: "Hình ảnh tại Trường Trung Cấp Ý Việt (Đà Nẵng).",
    realStories: [],
    scenario: {
      title: "Một ngày tại xưởng thực hành Trung cấp nghề",
      intro:
        "Thử bước vào một buổi học nghề thực tế: phần lớn thời lượng cầm tay chỉ việc tại xưởng, phần còn lại học văn hóa THPT.",
      startNodeId: "n1",
      reflectionPrompt: "Em thấy mình hợp / chưa hợp ở điểm nào?",
      nodes: [
        {
          id: "n1",
          prompt:
            "8 giờ sáng tại xưởng thực hành: thầy giáo giao nhiệm vụ lắp mạch điện chiếu sáng / cắt mẫu sản phẩm theo bản vẽ mẫu. Em tiếp cận việc này ra sao?",
          choices: [
            {
              id: "c1",
              label: "Em thích cầm dụng cụ làm thử, sai thì tháo ra kiểm tra lại từng bước",
              nextNodeId: "n2",
              outcomeNote:
                "Sự kiên nhẫn khi thao tác trực tiếp là lợi thế rất lớn trong môi trường học nghề.",
            },
            {
              id: "c2",
              label: "Em hơi ngại đứng xưởng lâu hoặc làm việc cần sự tỉ mỉ bằng tay",
              nextNodeId: "n2",
              outcomeNote:
                "Ghi nhận cảm giác này giúp em phân biệt nghề cần đôi tay khéo với các nhóm nghề khác.",
            },
          ],
        },
        {
          id: "n2",
          prompt:
            "Sau khi hoàn thành sản phẩm đầu tiên vào cuối buổi chiều, thầy nhận xét em có thể đi thực tập sớm vào năm thứ hai và học tiếp lên cao đẳng nghề sau đó.",
          choices: [
            {
              id: "c3",
              label: "Em thấy nhẹ nhõm vì có tay nghề sớm phụ giúp gia đình mà vẫn còn cơ hội học tiếp",
              nextNodeId: null,
              outcomeNote:
                "Con đường này đáp ứng cả nhu cầu tự lập sớm lẫn cơ hội phát triển dài hạn.",
            },
            {
              id: "c4",
              label: "Em muốn hỏi thêm người thật việc thật hoặc tham quan xưởng thật để chắc chắn hơn",
              nextNodeId: null,
              outcomeNote:
                "Hãy đặt 1–2 câu hỏi cho cựu học sinh hoặc đăng kí buổi tham quan xưởng ở ngay mục dưới nhé.",
            },
          ],
        },
      ],
    },
  },
  {
    id: "pw-so-cap",
    category: "SO_CAP",
    title: "Sơ cấp nghề & đi làm tích lũy kinh nghiệm",
    shortSubtitle:
      "Học nhanh kĩ năng nghề thiết thực, đi làm sớm và học tiếp khi sẵn sàng",
    entryRequirements:
      "Tốt nghiệp THCS; phù hợp với em cần sớm đi làm hoặc thích học trực tiếp qua thực hành ngắn hạn.",
    learningContent:
      "Khóa sơ cấp nghề ngắn hạn (khoảng 2–3 tháng) tập trung kĩ năng thực hành: nấu ăn, làm bánh, pha chế, phục vụ, buồng phòng, lễ tân, tóc, spa, trang điểm, bán hàng…",
    careerOpportunities:
      "Sớm có việc làm phù hợp với tay nghề; vẫn có thể quay lại học văn hóa hoặc trung cấp nghề khi điều kiện thuận lợi.",
    articulationPath:
      "Đi làm, tích lũy tay nghề → Học tiếp Trung cấp nghề / GDTX / Cao đẳng nghề khi sẵn sàng",
    realSchoolNames: TRUNG_CAP_SO_CAP_SCHOOLS,
    realSchoolAddresses:
      "Các cơ sở dạy nghề ngắn hạn tại TP. Đà Nẵng; học sinh liên hệ trực tiếp để biết lịch khai giảng và học phí từng khóa.",
    tuitionEstimate:
      "Sơ cấp nấu ăn khoảng 3 tháng, miễn phí cho diện chính sách (Ý Việt); lớp tại Trung tâm Dịch vụ việc làm học 2–2,5 tháng, ca tối 18:00–20:30 thứ Hai–thứ Sáu, cấp chứng chỉ.",
    admissionCutoff:
      "Xét tuyển, không thi; một số lớp ngắn hạn dành cho lao động thất nghiệp, lao động nông thôn và diện chính sách.",
    imageUrl: soCapImage,
    imageCaption: "Hình ảnh tại Trường Trung Cấp Ý Việt (Đà Nẵng).",
    realStories: [],
    scenario: {
      title: "Một ngày học nghề ngắn hạn và làm quen môi trường làm việc",
      intro:
        "Thử hình dung nhịp học thực hành tập trung trong vài tháng để sớm tự lập thu nhập.",
      startNodeId: "n1",
      reflectionPrompt: "Em thấy mình hợp / chưa hợp ở điểm nào?",
      nodes: [
        {
          id: "n1",
          prompt:
            "Trong khóa sơ cấp nghề, gần như toàn bộ thời gian là học quy trình làm việc tại xưởng và làm quen kỉ luật giờ giấc như người đi làm.",
          choices: [
            {
              id: "c1",
              label: "Em muốn sớm có kĩ năng cụ thể để đi làm phụ gia đình ngay trong năm tới",
              nextNodeId: "n2",
              outcomeNote:
                "Sơ cấp nghề giúp rút ngắn thời gian chuẩn bị để em sớm đứng vững bằng công việc thực tế.",
            },
            {
              id: "c2",
              label: "Em vẫn muốn có thêm bằng văn hóa THPT song song thay vì chỉ học nghề ngắn hạn",
              nextNodeId: "n2",
              outcomeNote:
                "Nếu muốn giữ bằng văn hóa THPT, em có thể đối chiếu thêm lộ trình Trung cấp nghề kết hợp văn hóa.",
            },
          ],
        },
        {
          id: "n2",
          prompt:
            "Sau 1–2 năm đi làm ổn định, nếu muốn học tiếp lên Trung cấp hoặc GDTX vào buổi tối thì em nghĩ sao?",
          choices: [
            {
              id: "c3",
              label: "Em thấy yên tâm vì đi làm trước không có nghĩa là đóng cửa việc học mãi mãi",
              nextNodeId: null,
              outcomeNote:
                "Học tập suốt đời cho phép em quay lại nâng bậc tay nghề bất cứ khi nào điều kiện cho phép.",
            },
          ],
        },
      ],
    },
  },
];

export const INITIAL_EXPERIENCES: Experience[] = [
  {
    id: "try-1",
    title: "Tham quan xưởng thực hành Điện – Cơ khí",
    activityType: "Tham quan xưởng thực hành",
    dateLabel: "Thứ Bảy tuần tới",
    location: "Cơ sở giáo dục nghề nghiệp liên kết",
    description:
      "Quan sát học viên thực hành lắp mạch điện dân dụng, trò chuyện trực tiếp với giảng viên hướng dẫn thực hành.",
  },
  {
    id: "try-2",
    title: "Giao lưu cùng anh chị cựu học sinh làm nghề",
    activityType: "Giao lưu người làm nghề",
    dateLabel: "Chiều thứ Năm",
    location: "Phòng sinh hoạt lớp 9",
    description:
      "Nghe chia sẻ chân thực về ngày đầu chọn học nghề, khó khăn gặp phải và cơ hội học tiếp lên cao đẳng nghề.",
  },
  {
    id: "try-3",
    title: "Bài tập tình huống nghề: Một ngày tại xưởng May & Thiết kế",
    activityType: "Bài tập tình huống nghề",
    dateLabel: "Tự chọn trong tuần",
    location: "Phòng thực hành / tại nhà",
    description:
      "Thử đọc bản vẽ sản phẩm đơn giản, ước lượng vật liệu và tưởng tượng một ngày làm việc thực tế.",
  },
];

function createDefaultLevelMap(level: QualitativeLevel): AssessmentLevelMap {
  return {
    understandingSelf: level,
    understandingPathways: level,
    narrowingOptions: level,
    decidingOnTime: level,
    committingAndActing: level,
    notes: "",
    evidence: "",
    criterionEvidence: {},
  };
}

function createEmptySignals(): BehaviorSignal {
  return {
    changeOptionCount: 0,
    addedAfterCommit: false,
    abandonedCommitStep: false,
    hesitancyPhrasesCount: 0,
    recentPhrases: [],
    hasSensitiveAlert: false,
  };
}

/**
 * Hồ sơ hành trình trống cho một tài khoản Học sinh vừa đăng ký.
 * Không có dữ liệu mẫu: mọi nội dung do chính học sinh tạo ra.
 */
export function createStudentProfile(
  id: string,
  fullName: string,
  className: string = DEFAULT_CLASS_ID
): Student {
  return {
    id,
    fullName,
    className,
    currentStep: "THU",
    completedSteps: [],
    shareWithParent: false,
    privacyConsentAccepted: true,
    privacyConsentAcceptedAt: new Date().toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    profile: {
      abilitiesTeacherNote: "",
      abilitiesStudentSelf: "",
      hollandSelectedIds: [],
      hollandSummaryText: "",
      conditions: {
        commuteDistance: "",
        familyFinance: "",
        earlyIndependence: "",
        healthNote: "",
      },
    },
    criteria: [],
    consideredOptions: [],
    joinedExperienceIds: [],
    journal: [],
    scenarioReflections: [],
    commitment: {
      studentFullName: fullName,
      className,
      chosenOption: "",
      reasonInOwnWords: "",
      actionPlan: [],
      deadlineDate: "",
      studentConfirmedAt: null,
      parentConfirmedAt: null,
      teacherConfirmedAt: null,
    },
    signals: createEmptySignals(),
    assessment: {
      before: createDefaultLevelMap("Đang hình thành"),
      after: createDefaultLevelMap("Đang hình thành"),
      studentSelf: createDefaultLevelMap("Đang hình thành"),
    },
  };
}

export function createInitialAppState(): AppState {
  return {
    schemaVersion: 6,
    students: [],
    pathways: INITIAL_PATHWAYS,
    experiences: INITIAL_EXPERIENCES,
    aiMessages: [],
    aiModerationLogs: [],
    thematicCodes: [],
    meetings: [],
    settings: {
      requireTeacherApprovalBeforeDisplay: false,
      darkMode: false,
      fontSize: "medium",
    },
  };
}

