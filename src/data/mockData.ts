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
import thptCongLapImage from "../assets/images/pathway_thpt_cong_lap.png";
import thptTuThucImage from "../assets/images/pathway_thpt_tu_thuc.png";
import gdtxImage from "../assets/images/pathway_gdtx.png";
import trungCapImage from "../assets/images/pathway_trung_cap.png";
import soCapImage from "../assets/images/pathway_so_cap.png";

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

export const HOLLAND_GROUPS: Record<
  HollandGroupId,
  { name: string; descriptionText: string }
> = {
  ki_thuat: {
    name: "Kĩ thuật",
    descriptionText:
      "Em có vẻ thích công việc làm bằng tay, sử dụng dụng cụ hoặc thiết bị và tạo ra sản phẩm nhìn thấy được.",
  },
  nghien_cuu: {
    name: "Nghiên cứu",
    descriptionText:
      "Em thích tìm hiểu nguyên lí, quan sát, đặt câu hỏi vì sao và tự mình thử nghiệm để hiểu rõ vấn đề.",
  },
  nghe_thuat: {
    name: "Nghệ thuật",
    descriptionText:
      "Em thấy hứng thú khi được tự do sáng tạo, vẽ, thiết kế hoặc làm những sản phẩm mang dấu ấn riêng.",
  },
  xa_hoi: {
    name: "Xã hội",
    descriptionText:
      "Em cảm thấy thoải mái khi trò chuyện, lắng nghe, hỗ trợ hoặc làm việc trực tiếp cùng mọi người xung quanh.",
  },
  quan_li: {
    name: "Quản lí",
    descriptionText:
      "Em thích đứng ra tổ chức nhóm, sắp xếp công việc, thuyết phục bạn bè và chủ động dẫn dắt hoạt động.",
  },
  nghiep_vu: {
    name: "Nghiệp vụ",
    descriptionText:
      "Em làm tốt những công việc rõ ràng, ngăn nắp, theo quy trình cụ thể và chú ý đến từng chi tiết nhỏ.",
  },
};

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
      "Hạn chế": "Chỉ nói được \"em học yếu\", không nêu được điểm mạnh.",
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
      "Vững vàng": "Giải thích được các lộ trình và cơ hội học tiếp sau học nghề.",
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
      "• THPT Phan Châu Trinh – 154 Lê Lợi, P. Hải Châu (cơ sở mới: 01 Vũ Văn Dũng, P. An Hải)",
      "• THPT Hoàng Hoa Thám – 63 Phạm Cự Lượng, P. An Hải Đông",
      "• THPT Trần Phú – 11 Lê Thánh Tôn, P. Hải Châu",
      "• THPT Thái Phiên – 735 Trần Cao Vân, P. Thanh Khê",
      "• THPT Nguyễn Hiền – 61 Phan Đăng Lưu, P. Hòa Cường",
    ].join("\n"),
    realSchoolAddresses:
      "Địa chỉ các trường được cập nhật theo sắp xếp đơn vị hành chính của TP. Đà Nẵng (sau sáp nhập với Quảng Nam từ 01/7/2025). Học sinh kiểm tra lại với Sở GD&ĐT trước khi nộp hồ sơ.",
    tuitionEstimate:
      "Trường công lập thu học phí theo quy định hiện hành của TP. Đà Nẵng; mức thu cụ thể thay đổi theo năm học.",
    admissionCutoff: [
      "Điểm chuẩn lớp 10 năm học 2026–2027 (thang 30):",
      "• THPT Phan Châu Trinh: 35.5 (đã gồm điểm ưu tiên/khuyến khích)",
      "• THPT Hoàng Hoa Thám: 33.25",
      "• THPT Trần Phú: 31.75",
      "• THPT Thái Phiên: 31",
      "• THPT Nguyễn Hiền: 26.5",
      "• THPT Lê Quý Đôn: đang cập nhật",
    ].join("\n"),
    imageUrl: thptCongLapImage,
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
      "• THPT Nguyễn Khuyến – 02A Đặng Xuân Bảng, P. Cẩm Lệ",
      "• THPT Quang Trung – xét học bạ (địa chỉ đang cập nhật)",
      "• THPT Sky-Line – 42 Nguyễn Chí Thanh, P. Hải Châu",
      "• THPT FPT Đà Nẵng – Khu đô thị FPT City, P. Hòa Hải",
      "• APU (Mỹ – Úc – Việt) – P. Hòa Hải",
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
      "Trung tâm GDTX Đà Nẵng (sáp nhập các trung tâm GDTX số 1–4 từ 25/8/2026):",
      "• Cơ sở 1093 Ngô Quyền, P. An Hải",
      "• Cơ sở 725 Trần Cao Vân, P. Thanh Khê",
      "• Cơ sở 105 Lê Sát, P. Hòa Cường",
    ].join("\n"),
    realSchoolAddresses:
      "Các cơ sở giữ địa chỉ cũ sau sáp nhập; học sinh liên hệ trung tâm để biết địa điểm học lớp 10 gần nhà nhất.",
    tuitionEstimate:
      "Học phí GDTX theo quy định hiện hành; học sinh hệ 9+ liên kết với trường trung cấp, cao đẳng được miễn học phí nghề (theo thông tin năm 2026–2027).",
    admissionCutoff:
      "Xét học bạ THCS. Năm học 2026–2027: 1.215 học viên/27 lớp lớp 10; riêng cơ sở 105 Lê Sát 450 học sinh/10 lớp. Lịch học chi tiết liên hệ trung tâm.",
    imageUrl: gdtxImage,
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
    realSchoolNames: [
      "• Cao đẳng nghề Đà Nẵng – 99 Tô Hiến Thành, P. An Hải (27 nghề: cơ khí, điện, ô tô, du lịch…)",
      "• Trung cấp Việt Á – 105 Lê Sát, P. Hòa Cường; cơ sở 2: 295 Nguyễn Tất Thành, P. Hải Châu",
      "• Cao đẳng Việt – Úc Đà Nẵng – K476/8 Điện Biên Phủ, P. Thanh Khê",
      "• Cao đẳng nghề số 5 – 85 Ngũ Hành Sơn, P. Ngũ Hành Sơn",
      "• Cao đẳng Thương mại – đào tạo hệ 9+ (400 chỉ tiêu năm 2026–2027)",
    ].join("\n"),
    realSchoolAddresses:
      "Các trường đều xét tuyển học bạ; học sinh nên hỏi rõ ngành, thời gian thực hành và cách sắp xếp lịch học văn hóa.",
    tuitionEstimate:
      "Nhiều trường miễn học phí trung cấp cho học sinh tốt nghiệp THCS; mức thu cụ thể tùy trường và ngành nghề.",
    admissionCutoff:
      "Xét tuyển học bạ hoặc phỏng vấn định hướng nghề. Toàn TP. Đà Nẵng có 23 trường cao đẳng, 9 trường trung cấp, 16 trung tâm GDNN với 189 ngành nghề (2026–2027).",
    imageUrl: trungCapImage,
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
    realSchoolNames: [
      "• Trường Trung cấp Ý Việt – 478A1 Điện Biên Phủ, P. Thanh Khê (cơ sở 396 và 686 Điện Biên Phủ)",
      "• Trung tâm Dịch vụ việc làm Đà Nẵng – lớp ngắn hạn phối hợp với Cao đẳng Đà Nẵng, Ý Việt",
      "• Hướng Nghiệp Á Âu Đà Nẵng – đầu bếp, làm bánh, pha chế (địa chỉ đang cập nhật)",
    ].join("\n"),
    realSchoolAddresses:
      "Các cơ sở dạy nghề ngắn hạn tại TP. Đà Nẵng; học sinh liên hệ trực tiếp để biết lịch khai giảng và học phí từng khóa.",
    tuitionEstimate:
      "Sơ cấp nấu ăn khoảng 3 tháng, miễn phí cho diện chính sách (Ý Việt); lớp tại Trung tâm Dịch vụ việc làm học 2–2,5 tháng, ca tối 18:00–20:30 thứ Hai–thứ Sáu, cấp chứng chỉ.",
    admissionCutoff:
      "Xét tuyển, không thi; một số lớp ngắn hạn dành cho lao động thất nghiệp, lao động nông thôn và diện chính sách.",
    imageUrl: soCapImage,
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
      googleFormSurveyUrl: "",
    },
  };
}

