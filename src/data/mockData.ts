import type {
  AIMessage,
  AppState,
  AssessmentLevelMap,
  BehaviorSignal,
  Experience,
  HollandGroupId,
  JourneyStep,
  Meeting,
  Pathway,
  QualitativeLevel,
  RubricCriterionKey,
  Student,
} from "../types";
import { SCHOOL_CLASS_IDS } from "./schoolClasses";

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
      "Khá rõ nét": "Hiểu các lộ trình chính, còn mơ hồ về liên thông.",
      "Vững vàng": "Giải thích được các lộ trình và cửa liên thông sau học nghề.",
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
    category: "THPT",
    title: "THPT công lập",
    shortSubtitle: "Học chương trình phổ thông 3 năm (lớp 10–12)",
    entryRequirements:
      "Tham gia kì tuyển sinh lớp 10 theo quy định của địa phương; phù hợp khi lực học văn hóa đều và theo kịp cường độ ôn thi.",
    learningContent:
      "Các môn văn hóa phổ thông, rèn nền tảng học thuật chuẩn bị cho kì thi tốt nghiệp THPT và xét tuyển bậc cao hơn.",
    careerOpportunities:
      "Tiếp tục học đại học, cao đẳng hoặc các trường nghề sau khi hoàn thành lớp 12.",
    articulationPath: "Tốt nghiệp THPT → Cao đẳng / Đại học / Trường nghề trình độ cao hơn",
    realSchoolNames: "",
    tuitionEstimate: "",
    admissionCutoff: "",
    employmentData: "",
    realStories: [],
    scenario: {
      title: "Một ngày học tập ở bậc THPT công lập",
      intro:
        "Thử hình dung một tuần học bình thường ở lớp 10 THPT với cường độ nhiều môn văn hóa và kiểm tra định kì.",
      startNodeId: "n1",
      reflectionPrompt: "Em thấy mình hợp / chưa hợp ở điểm nào?",
      nodes: [
        {
          id: "n1",
          prompt:
            "Buổi sáng em học 5 tiết Toán, Ngữ văn, Tiếng Anh và Vật lí liên tiếp. Buổi chiều có bài tập nhóm và đề cương ôn kiểm tra giữa kì. Em thường phản ứng thế nào?",
          choices: [
            {
              id: "c1",
              label: "Em thích đọc tài liệu, ghi chép hệ thống và làm bài tập từng bước",
              nextNodeId: "n2",
              outcomeNote:
                "Em cảm thấy nhịp học lí thuyết quen thuộc và có thể tự sắp xếp thời gian ôn bài.",
            },
            {
              id: "c2",
              label: "Em nhanh mệt khi ngồi nghe giảng nhiều giờ và thích làm sản phẩm bằng tay hơn",
              nextNodeId: "n2",
              outcomeNote:
                "Nhịp học nặng lí thuyết có thể khiến em tốn nhiều sức lực hơn để duy trì hứng thú.",
            },
          ],
        },
        {
          id: "n2",
          prompt:
            "Cuối học kì, thời gian chuẩn bị cho 8–9 môn kiểm tra dồn lại cùng lúc trong khi bạn bè xung quanh đặt mục tiêu điểm số rất cao.",
          choices: [
            {
              id: "c3",
              label: "Em giữ được nhịp học đều của riêng mình, không quá hoảng khi thấy bạn học nhanh",
              nextNodeId: null,
              outcomeNote:
                "Môi trường THPT đòi hỏi khả năng tự học ổn định và giữ bình tĩnh trước áp lực kiểm tra.",
            },
            {
              id: "c4",
              label: "Em dễ bị căng thẳng và mất tự tin khi phải ôn quá nhiều môn lí thuyết cùng lúc",
              nextNodeId: null,
              outcomeNote:
                "Đây là điểm quan trọng để em cân nhắc xem cường độ ôn thi phổ thông có vừa sức mình không.",
            },
          ],
        },
      ],
    },
  },
  {
    id: "pw-thpt-tu",
    category: "THPT",
    title: "THPT tư thục",
    shortSubtitle: "Học chương trình THPT tại cơ sở ngoài công lập",
    entryRequirements:
      "Xét tuyển học bạ THCS hoặc theo phương án tuyển sinh riêng của từng trường.",
    learningContent:
      "Chương trình THPT theo quy định của Bộ GD&ĐT; một số trường tăng cường hoạt động kĩ năng hoặc ngoại ngữ.",
    careerOpportunities:
      "Tốt nghiệp THPT để tiếp tục dự tuyển cao đẳng, đại học hoặc trung cấp.",
    articulationPath: "Tốt nghiệp THPT → Cao đẳng / Đại học / Đào tạo nghề",
    realSchoolNames: "",
    tuitionEstimate: "",
    admissionCutoff: "",
    employmentData: "",
    realStories: [],
    scenario: {
      title: "Một ngày cân đối giữa học tập và chi phí tại trường tư",
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
      "Đã tốt nghiệp THCS; xét tuyển hồ sơ, giảm áp lực thi tuyển đầu vào.",
    learningContent:
      "Các môn văn hóa cốt lõi của chương trình THPT; có thể kết hợp học thêm một nghề ngắn hạn song song.",
    careerOpportunities:
      "Thi tốt nghiệp THPT quốc gia như học sinh THPT hoặc chuyển tiếp học trung cấp, cao đẳng.",
    articulationPath: "Tốt nghiệp THPT hệ GDTX → Trung cấp / Cao đẳng / Đại học",
    realSchoolNames: "",
    tuitionEstimate: "",
    admissionCutoff: "",
    employmentData: "",
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
    shortSubtitle: "Vừa rèn tay nghề thực hành, vừa giữ cửa liên thông cao hơn",
    entryRequirements:
      "Tốt nghiệp THCS; xét tuyển học bạ hoặc phỏng vấn định hướng nghề, không nặng thi cử văn hóa.",
    learningContent:
      "Thực hành nghề chiếm phần lớn thời lượng (điện dân dụng – công nghiệp, may thời trang, cơ khí, bếp – làm bánh, tin học ứng dụng...) song song học văn hóa THPT.",
    careerOpportunities:
      "Có tay nghề sớm để đi làm phụ giúp gia đình sau khi tốt nghiệp trung cấp, hoặc học tiếp liên thông.",
    articulationPath:
      "Trung cấp nghề (+ văn hóa THPT) → Liên thông Cao đẳng → Liên thông Đại học",
    realSchoolNames: "",
    tuitionEstimate: "",
    admissionCutoff: "",
    employmentData: "",
    realStories: [
      {
        id: "rs-1",
        title: "Từ xưởng thực hành điện đến bậc Cao đẳng liên thông",
        personDesc: "Cựu học sinh khóa trước chia sẻ trải nghiệm 2 năm học nghề kết hợp văn hóa",
        url: "#story-demo-dien",
        suggestedQuestions: [
          "Lúc mới vào xưởng thực hành điện, phần nào anh thấy khó làm quen nhất?",
          "Việc học song song văn hóa THPT và thực hành nghề sắp xếp lịch thế nào để không bị quá tải?",
        ],
      },
      {
        id: "rs-2",
        title: "Chuyện học may thiết kế và sớm tự chủ thu nhập",
        personDesc: "Cựu học sinh ngành May & Thiết kế chia sẻ với phụ huynh và các em lớp 9",
        url: "#story-demo-may",
        suggestedQuestions: [
          "Chị bắt đầu nhận đơn hàng đầu tiên hoặc đi thực tập từ năm học thứ mấy?",
          "Gia đình ban đầu có lo lắng khi chị chọn học Trung cấp nghề không và chị đã giải thích thế nào?",
        ],
      },
    ],
    scenario: {
      title: "Một ngày tại xưởng thực hành Trung cấp nghề",
      intro:
        "Thử bước vào một buổi học nghề thực tế: 70% thời lượng cầm tay chỉ việc tại xưởng, phần còn lại học văn hóa THPT.",
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
            "Sau khi hoàn thành sản phẩm đầu tiên vào cuối buổi chiều, thầy nhận xét em có thể đi thực tập sớm vào năm thứ hai và học liên thông lên Cao đẳng sau đó.",
          choices: [
            {
              id: "c3",
              label: "Em thấy nhẹ nhõm vì có tay nghề sớm phụ giúp gia đình mà vẫn còn cửa học lên",
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
    title: "Sơ cấp nghề & đi làm tích lũy tay nghề",
    shortSubtitle: "Học nhanh kĩ năng nghề thiết thực, đi làm sớm và học tiếp khi sẵn sàng",
    entryRequirements:
      "Tốt nghiệp THCS; phù hợp với em cần sớm đi làm hoặc thích học trực tiếp qua thực hành ngắn hạn.",
    learningContent:
      "Tập trung trực tiếp vào kĩ năng thao tác nghề thực tế tại xưởng và cơ sở sản xuất.",
    careerOpportunities:
      "Sớm có việc làm phù hợp với tay nghề; vẫn có thể quay lại học bổ túc văn hóa hoặc trung cấp khi điều kiện thuận lợi.",
    articulationPath:
      "Đi làm, tích lũy tay nghề → Học tiếp Trung cấp / GDTX / Cao đẳng khi sẵn sàng",
    realSchoolNames: "",
    tuitionEstimate: "",
    admissionCutoff: "",
    employmentData: "",
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
      "Nghe chia sẻ chân thực về ngày đầu chọn học nghề, khó khăn gặp phải và đường học liên thông lên Cao đẳng.",
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

function createCaseStudies(): Student[] {
  const hsA: Student = {
    id: "hs-01",
    code: "HS A",
    anonymizedLabel: "HS 01",
    className: "9A1",
    isCaseStudy: true,
    caseStudySummary:
      "Học lực chưa ổn định, đã được giáo viên tư vấn hướng học nghề nhưng vẫn muốn thi thử lớp 10 để 'trượt thì tính tiếp'.",
    isFocusGroup: true,
    currentStep: "THU",
    completedSteps: [],
    shareWithParent: false,
    privacyConsentAccepted: true,
    privacyConsentAcceptedAt: "2026-11-05 08:30",
    profile: {
      abilitiesTeacherNote:
        "Em tiếp thu chậm ở các môn cần ghi nhớ nhiều công thức; tuy nhiên khi làm việc nhóm thực hành em kiên nhẫn và chịu khó hoàn thành phần việc.",
      abilitiesStudentSelf:
        "Em thấy mình học hơi đuối ở mấy môn lí thuyết dài, nhưng làm việc chân tay hoặc lắp ghép thì em thấy đỡ căng thẳng hơn.",
      hollandSelectedIds: ["h1", "h2"],
      hollandSummaryText: buildHollandSummary(["h1", "h2"]),
      conditions: {
        commuteDistance: "Ưu tiên đi lại gần nhà để tự đi xe đạp hoặc xe buýt ngắn.",
        familyFinance: "Gia đình thu nhập trung bình, cần cân nhắc chi phí vừa phải.",
        earlyIndependence: "Mong muốn có nghề sớm để phụ giúp bố mẹ khi cần.",
        healthNote: "Sức khỏe bình thường.",
      },
    },
    criteria: [
      { id: "c-a1", label: "vừa sức học của em" },
      { id: "c-a2", label: "chi phí vừa phải" },
      { id: "c-a3", label: "vẫn có đường học lên" },
    ],
    consideredOptions: [
      {
        id: "opt-a1",
        pathwayId: "pw-thpt-cong",
        title: "THPT công lập",
        status: "Đang cân nhắc",
        evaluations: {
          "c-a1": "Chưa rõ",
          "c-a2": "Đáp ứng",
          "c-a3": "Đáp ứng",
        },
      },
      {
        id: "opt-a2",
        pathwayId: "pw-trung-cap",
        title: "Trung cấp nghề (kết hợp học văn hóa THPT)",
        status: "Đang cân nhắc",
        evaluations: {
          "c-a1": "Đáp ứng",
          "c-a2": "Đáp ứng",
          "c-a3": "Chưa rõ",
        },
      },
    ],
    joinedExperienceIds: [],
    journal: [
      {
        id: "j-a1",
        date: "2026-11-12",
        step: "THU",
        pathwayId: "pw-thpt-cong",
        pathwayTitle: "THPT công lập",
        activityType: "Suy ngẫm cá nhân",
        content:
          "Em vẫn muốn thi lớp 10 thử, trượt thì tính tiếp. Nhưng biết đâu lúc thi em làm được bài tốt hơn bình thường thì sao.",
      },
    ],
    scenarioReflections: [],
    commitment: {
      studentDisplayCode: "HS A",
      studentNamePlaceholder: "Học sinh A (Ẩn danh)",
      className: "9A1",
      chosenOption: "",
      reasonInOwnWords: "",
      preMortemNote: "",
      actionPlan: [
        { id: "t-a1", title: "Xem kỹ thẻ Trung cấp nghề và đường liên thông trong mục Bản đồ lộ trình", dueDate: "2026-11-22", done: false },
        { id: "t-a2", title: "Đăng kí tham gia buổi tham quan xưởng thực hành", dueDate: "2026-11-25", done: false },
      ],
      deadlineDate: "2026-11-30",
      studentConfirmedAt: null,
      parentConfirmedAt: null,
      teacherConfirmedAt: null,
    },
    signals: {
      changeOptionCount: 2,
      addedAfterCommit: false,
      abandonedCommitStep: true,
      hesitancyPhrasesCount: 2,
      recentPhrases: ["nhưng biết đâu", "trượt thì tính tiếp"],
      hasSensitiveAlert: false,
    },
    assessment: {
      before: {
        understandingSelf: "Hạn chế",
        understandingPathways: "Hạn chế",
        narrowingOptions: "Hạn chế",
        decidingOnTime: "Hạn chế",
        committingAndActing: "Hạn chế",
        notes: "Trước khi tham gia hành trình, em còn giữ tâm lí chờ may rủi và ngại tìm hiểu hướng học nghề.",
        evidence: "Nhật ký đầu kì: chưa xác định được điểm mạnh, giữ tâm lí thi thử cho xong.",
        criterionEvidence: {
          understandingSelf: "Hồ sơ đầu kì: mới chỉ viết 'em học hơi đuối mấy môn lí thuyết'.",
          understandingPathways: "Chưa phân biệt được Trung cấp nghề kết hợp văn hóa và học nghề ngắn hạn.",
          narrowingOptions: "Nhật ký 12/11: giữ cả thi thử lớp 10 để 'trượt thì tính tiếp'.",
          decidingOnTime: "Từng mở mục Chốt quyết định nhưng tạm dừng giữa chừng.",
          committingAndActing: "Chưa có kế hoạch hành động hoàn chỉnh.",
        },
      },
      after: {
        understandingSelf: "Đang hình thành",
        understandingPathways: "Đang hình thành",
        narrowingOptions: "Đang hình thành",
        decidingOnTime: "Hạn chế",
        committingAndActing: "Đang hình thành",
        notes: "Đang ở giai đoạn đầu của hành trình; bắt đầu đặt câu hỏi về đường liên thông.",
        evidence: "Đã mở xem thẻ Trung cấp nghề và đặt 3 tiêu chí cá nhân.",
        criterionEvidence: {
          understandingSelf: "Hồ sơ tự soi: nhận ra làm việc chân tay hoặc lắp ghép đỡ căng thẳng hơn.",
          understandingPathways: "Đã xem thẻ Trung cấp nghề và đặt câu hỏi với AI về đường liên thông.",
          narrowingOptions: "Đã viết 3 tiêu chí cá nhân: vừa sức học, chi phí vừa phải, có đường học lên.",
          decidingOnTime: "Vẫn đang cân nhắc 2 phương án trước hạn chốt 30/11.",
          committingAndActing: "Đã thêm 2 việc dự định làm trong tuần tới.",
        },
      },
      studentSelf: createDefaultLevelMap("Đang hình thành"),
    },
  };

  const hsB: Student = {
    id: "hs-02",
    code: "HS B",
    anonymizedLabel: "HS 02",
    className: "9A1",
    isCaseStudy: true,
    caseStudySummary:
      "Khéo tay, hay sửa đồ điện ở nhà; từng định thi lớp 10 rồi trượt mới vào trường tư. Sau bước lọc và tham quan xưởng đã tự tin chốt Trung cấp nghề điện.",
    isFocusGroup: true,
    currentStep: "CAM KẾT",
    completedSteps: ["THU", "LỌC", "THỬ", "CHỐT", "CAM KẾT"],
    shareWithParent: true,
    privacyConsentAccepted: true,
    privacyConsentAcceptedAt: "2026-11-05 08:35",
    profile: {
      abilitiesTeacherNote:
        "Em làm tốt các việc cần đôi tay khéo léo, quan sát kĩ quy trình thực hành; các môn lí thuyết ở mức trung bình.",
      abilitiesStudentSelf:
        "Ở nhà em hay sửa quạt, thay công tắc đèn giúp bố. Em thấy mình học tốt nhất khi được cầm đồ thật để làm.",
      hollandSelectedIds: ["h1", "h2", "h3"],
      hollandSummaryText: buildHollandSummary(["h1", "h2", "h3"]),
      conditions: {
        commuteDistance: "Cách nhà khoảng 5–7km, đi xe buýt thuận tiện.",
        familyFinance: "Cần tiết kiệm, không muốn bố mẹ gánh học phí cao.",
        earlyIndependence: "Muốn đi làm được sớm để phụ giúp gia đình.",
        healthNote: "Thị lực và sức khỏe tốt.",
      },
    },
    criteria: [
      { id: "c-b1", label: "gần nhà" },
      { id: "c-b2", label: "có thể đi làm sớm để phụ giúp gia đình" },
      { id: "c-b3", label: "vẫn có đường học lên" },
    ],
    consideredOptions: [
      {
        id: "opt-b1",
        pathwayId: "pw-thpt-tu",
        title: "THPT tư thục",
        status: "Tạm gác lại",
        evaluations: {
          "c-b1": "Đáp ứng",
          "c-b2": "Chưa đáp ứng",
          "c-b3": "Đáp ứng",
        },
      },
      {
        id: "opt-b2",
        pathwayId: "pw-trung-cap",
        title: "Trung cấp nghề (kết hợp học văn hóa THPT)",
        status: "Đã chọn",
        evaluations: {
          "c-b1": "Đáp ứng",
          "c-b2": "Đáp ứng",
          "c-b3": "Đáp ứng",
        },
      },
    ],
    joinedExperienceIds: ["try-1", "try-2"],
    journal: [
      {
        id: "j-b1",
        date: "2026-11-10",
        step: "THỬ",
        pathwayId: "pw-trung-cap",
        pathwayTitle: "Trung cấp nghề (kết hợp học văn hóa THPT)",
        activityType: "Tham quan xưởng thực hành",
        content:
          "Hôm nay được vào xưởng điện, thấy các anh chị lắp tủ điện rất gọn. Thầy hướng dẫn giảng dễ hiểu, em cảm thấy học mà không sợ.",
      },
      {
        id: "j-b2",
        date: "2026-11-14",
        step: "THỬ",
        pathwayId: "pw-trung-cap",
        pathwayTitle: "Trung cấp nghề (kết hợp học văn hóa THPT)",
        activityType: "Giao lưu người làm nghề",
        content:
          "Anh cựu học sinh kể học xong Trung cấp đi làm rồi vẫn học liên thông lên Cao đẳng được, bố mẹ em cũng yên tâm hơn.",
      },
    ],
    scenarioReflections: [],
    commitment: {
      studentDisplayCode: "HS B",
      studentNamePlaceholder: "Học sinh B (Ẩn danh)",
      className: "9A1",
      chosenOption: "Trung cấp nghề Điện (kết hợp học văn hóa THPT)",
      reasonInOwnWords:
        "Gửi chính mình của vài tháng tới: Em thích sửa chữa và lắp đặt thiết bị điện từ nhỏ. Hướng đi này vừa gần nhà, chi phí nhẹ cho bố mẹ, em sớm có tay nghề đi làm và sau này vẫn học liên thông Cao đẳng được.",
      preMortemNote:
        "Nếu năm đầu thực hành gặp phần mạch điện khó hoặc thấy bạn bè vào cấp 3 rủ đi chơi nhiều, em sẽ hỏi thêm thầy hướng dẫn tại xưởng và nhắc lại lí do mình tự lập sớm.",
      actionPlan: [
        { id: "t-b1", title: "Hoàn thành kiểm tra môn Toán và Công nghệ học kì", dueDate: "2026-11-20", done: true },
        { id: "t-b2", title: "Cùng bố mẹ xem thông tin tuyển sinh do nhà trường cập nhật", dueDate: "2026-11-22", done: true },
        { id: "t-b3", title: "Chuẩn bị hồ sơ xét học bạ tốt nghiệp THCS", dueDate: "2026-11-28", done: false },
      ],
      deadlineDate: "2026-11-25",
      studentConfirmedAt: "2026-11-15 19:20",
      parentConfirmedAt: "2026-11-16 08:15",
      teacherConfirmedAt: "2026-11-16 14:00",
    },
    signals: {
      changeOptionCount: 1,
      addedAfterCommit: false,
      abandonedCommitStep: false,
      hesitancyPhrasesCount: 0,
      recentPhrases: [],
      hasSensitiveAlert: false,
    },
    assessment: {
      before: {
        understandingSelf: "Đang hình thành",
        understandingPathways: "Hạn chế",
        narrowingOptions: "Hạn chế",
        decidingOnTime: "Đang hình thành",
        committingAndActing: "Hạn chế",
        notes: "Ban đầu dự tính vào trường tư nếu trượt lớp 10.",
        evidence: "Chưa từng tìm hiểu mô hình Trung cấp nghề.",
        criterionEvidence: {
          understandingSelf: "Từng sửa quạt cho bố nhưng chưa liên hệ với nghề.",
          understandingPathways: "Quan sát GVCN: ban đầu nghĩ chỉ có THPT tư thục nếu không đậu công lập.",
          narrowingOptions: "Giữ phương án trường tư phòng hờ dù chi phí cao.",
          decidingOnTime: "Chần chừ chờ kì thi.",
          committingAndActing: "Chưa có kế hoạch chuẩn bị hồ sơ.",
        },
      },
      after: {
        understandingSelf: "Vững vàng",
        understandingPathways: "Vững vàng",
        narrowingOptions: "Vững vàng",
        decidingOnTime: "Vững vàng",
        committingAndActing: "Khá rõ nét",
        notes: "Chuyển biến rõ rệt sau khi trực tiếp tham quan xưởng thực hành và đối chiếu tiêu chí gia đình.",
        evidence: "2 bài nhật ký trải nghiệm xưởng + Phiếu cam kết có chữ kí 3 bên.",
        criterionEvidence: {
          understandingSelf: "Hồ sơ soi chiếu: nối sở thích sửa thiết bị điện với nhóm Kĩ thuật.",
          understandingPathways: "Nhật ký 14/11: giải thích được đường liên thông Trung cấp -> Cao đẳng cho bố mẹ.",
          narrowingOptions: "Bảng lọc: tự gác THPT tư thục vì không đáp ứng tiêu chí chi phí.",
          decidingOnTime: "Chốt trước hạn 10 ngày và viết lí do rõ bằng lời của em.",
          committingAndActing: "Hoàn thành 2/3 việc trong kế hoạch hành động và có chữ kí 3 bên.",
        },
      },
      studentSelf: {
        understandingSelf: "Vững vàng",
        understandingPathways: "Khá rõ nét",
        narrowingOptions: "Vững vàng",
        decidingOnTime: "Vững vàng",
        committingAndActing: "Khá rõ nét",
        criterionEvidence: {},
      },
    },
  };

  const hsC: Student = {
    id: "hs-03",
    code: "HS C",
    anonymizedLabel: "HS 03",
    className: "9A1",
    isCaseStudy: true,
    caseStudySummary:
      "Từng định vào trường tư ở thành phố theo lời bạn ('Em chưa hỏi, nhưng chắc là được'). Sau khi tìm hiểu chi phí cùng mẹ và thử nghề may thiết kế đã chốt trung cấp kết hợp văn hóa THPT.",
    isFocusGroup: true,
    currentStep: "CHỐT",
    shareWithParent: true,
    privacyConsentAccepted: true,
    privacyConsentAcceptedAt: "2026-11-05 08:40",
    profile: {
      abilitiesTeacherNote:
        "Em có mắt thẩm mĩ tốt, cẩn thận trong các sản phẩm thủ công; gặp khó khăn ở các môn tự nhiên.",
      abilitiesStudentSelf:
        "Em thích vẽ mẫu quần áo và phối màu. Em hay bị cuốn theo lời rủ rê của bạn bè nên lúc đầu chọn trường theo bạn.",
      hollandSelectedIds: ["h4", "h7"],
      hollandSummaryText: buildHollandSummary(["h4", "h7"]),
      conditions: {
        commuteDistance: "Nếu đi học xa tận trung tâm thành phố thì tốn thời gian và tiền đi lại.",
        familyFinance: "Mẹ bán hàng nhỏ, cần lựa chọn có chi phí vừa phải.",
        earlyIndependence: "Muốn làm thêm liên quan tới nghề để giảm gánh nặng cho mẹ.",
        healthNote: "Sức khỏe tốt.",
      },
    },
    criteria: [
      { id: "c-c1", label: "chi phí vừa phải" },
      { id: "c-c2", label: "đúng việc em thích" },
      { id: "c-c3", label: "vừa sức học của em" },
    ],
    consideredOptions: [
      {
        id: "opt-c1",
        pathwayId: "pw-thpt-tu",
        title: "THPT tư thục",
        status: "Tạm gác lại",
        evaluations: {
          "c-c1": "Chưa đáp ứng",
          "c-c2": "Chưa rõ",
          "c-c3": "Đáp ứng",
        },
      },
      {
        id: "opt-c2",
        pathwayId: "pw-trung-cap",
        title: "Trung cấp nghề (kết hợp học văn hóa THPT)",
        status: "Đã chọn",
        evaluations: {
          "c-c1": "Đáp ứng",
          "c-c2": "Đáp ứng",
          "c-c3": "Đáp ứng",
        },
      },
    ],
    joinedExperienceIds: ["try-2", "try-3"],
    journal: [
      {
        id: "j-c1",
        date: "2026-11-08",
        activityType: "Suy ngẫm cá nhân",
        content:
          "Bạn rủ em nộp vào trường tư trên thành phố. Em chưa hỏi kĩ mẹ, nhưng chắc là được thôi.",
      },
      {
        id: "j-c2",
        date: "2026-11-14",
        activityType: "Bài tập tình huống nghề",
        content:
          "Sau khi cùng mẹ ngồi tính chi phí đi lại và thử bài tập thiết kế mẫu may, em thấy Trung cấp nghề May kết hợp học văn hóa hợp với hoàn cảnh nhà mình hơn.",
      },
    ],
    commitment: {
      studentDisplayCode: "HS C",
      studentNamePlaceholder: "Học sinh C (Ẩn danh)",
      className: "9A1",
      chosenOption: "Trung cấp nghề May & Thiết kế (kết hợp văn hóa THPT)",
      reasonInOwnWords:
        "Em thích công việc thiết kế, cắt may và muốn giảm chi phí đi lại, học phí cho mẹ. Học trung cấp kết hợp văn hóa vẫn giữ được cơ hội học tiếp nếu sau này em muốn.",
      actionPlan: [
        { id: "t-c1", title: "Tham dự buổi họp ba bên cùng mẹ và cô chủ nhiệm", done: false },
        { id: "t-c2", title: "Luyện tập phác thảo mẫu và giữ điểm các môn văn hóa cơ bản", done: true },
      ],
      deadlineDate: "2026-11-24",
      studentConfirmedAt: "2026-11-17 20:10",
      parentConfirmedAt: null,
      teacherConfirmedAt: null,
    },
    signals: {
      changeOptionCount: 1,
      addedAfterCommit: false,
      abandonedCommitStep: false,
      hesitancyPhrasesCount: 1,
      recentPhrases: ["chắc là được"],
      hasSensitiveAlert: false,
    },
    assessment: {
      before: {
        understandingSelf: "Đang hình thành",
        understandingPathways: "Hạn chế",
        narrowingOptions: "Hạn chế",
        decidingOnTime: "Hạn chế",
        committingAndActing: "Hạn chế",
        notes: "Chọn trường theo bạn bè khi chưa hỏi gia đình.",
        evidence: "Nhật ký đầu kì ghi 'chắc là được thôi'.",
        criterionEvidence: {
          understandingSelf: "Biết mình thích vẽ nhưng chưa gắn với lựa chọn học nghề.",
          understandingPathways: "Chưa tìm hiểu học phí trường tư và mô hình Trung cấp nghề.",
          narrowingOptions: "Nhật ký 08/11: nộp trường tư theo lời rủ của bạn.",
          decidingOnTime: "Chưa đặt hạn tìm hiểu chi phí cùng mẹ.",
          committingAndActing: "Chưa có bước kiểm chứng thông tin.",
        },
      },
      after: {
        understandingSelf: "Khá rõ nét",
        understandingPathways: "Khá rõ nét",
        narrowingOptions: "Vững vàng",
        decidingOnTime: "Khá rõ nét",
        committingAndActing: "Khá rõ nét",
        notes: "Đã biết đối chiếu chi phí thực tế cùng mẹ thay vì chọn theo bạn.",
        evidence: "Bảng lọc tự loại THPT tư thục và bài nhật ký trao đổi cùng mẹ.",
        criterionEvidence: {
          understandingSelf: "Tự nhận rõ mắt thẩm mĩ và sở thích thiết kế mẫu.",
          understandingPathways: "Hiểu Trung cấp nghề May kết hợp văn hóa vẫn có đường học lên.",
          narrowingOptions: "Nhật ký 14/11: cùng mẹ tính chi phí đi lại và tự gác trường tư xa nhà.",
          decidingOnTime: "Đã xác nhận lựa chọn và hẹn họp ba bên cùng mẹ.",
          committingAndActing: "Đang thực hiện luyện phác thảo và chuẩn bị họp ba bên.",
        },
      },
      studentSelf: {
        understandingSelf: "Khá rõ nét",
        understandingPathways: "Khá rõ nét",
        narrowingOptions: "Vững vàng",
        decidingOnTime: "Khá rõ nét",
        committingAndActing: "Khá rõ nét",
        criterionEvidence: {},
      },
    },
  };

  const hsD: Student = {
    id: "hs-04",
    code: "HS D",
    anonymizedLabel: "HS 04",
    className: "9A1",
    isCaseStudy: true,
    caseStudySummary:
      "Học lực khá, từng băn khoăn giữa hai trường THPT công lập vì sợ chọn trường này xong lại thấy trường kia tốt hơn. Sau bước Lọc đã chốt dứt khoát trước hạn.",
    isFocusGroup: false,
    currentStep: "CAM KẾT",
    shareWithParent: true,
    privacyConsentAccepted: true,
    privacyConsentAcceptedAt: "2026-11-05 08:45",
    profile: {
      abilitiesTeacherNote:
        "Em học đều các môn, có khả năng tự học và lập kế hoạch khá tốt nhưng hay lo mình bỏ sót phương án tốt hơn.",
      abilitiesStudentSelf:
        "Em học ổn các môn văn hóa, nhưng cứ nghe bạn bè nói về trường khác là em lại phân vân không yên.",
      hollandSelectedIds: ["h3", "h5", "h6"],
      hollandSummaryText: buildHollandSummary(["h3", "h5", "h6"]),
      conditions: {
        commuteDistance: "Trường gần nhà đi xe đạp 10 phút; trường thứ hai cách nhà gần 40 phút đi xe.",
        familyFinance: "Gia đình đáp ứng được học phí THPT công lập.",
        earlyIndependence: "Dự định học hết THPT rồi xét tuyển Đại học.",
        healthNote: "Hay mệt nếu di chuyển xa giờ cao điểm.",
      },
    },
    criteria: [
      { id: "c-d1", label: "gần nhà" },
      { id: "c-d2", label: "vừa sức học của em" },
      { id: "c-d3", label: "vẫn có đường học lên" },
    ],
    consideredOptions: [
      {
        id: "opt-d1",
        pathwayId: "pw-thpt-cong",
        title: "THPT công lập (khu vực gần nhà)",
        status: "Đã chọn",
        evaluations: {
          "c-d1": "Đáp ứng",
          "c-d2": "Đáp ứng",
          "c-d3": "Đáp ứng",
        },
      },
      {
        id: "opt-d2",
        pathwayId: "pw-thpt-cong",
        title: "THPT công lập (khu vực xa hơn, bạn thân định thi)",
        status: "Tạm gác lại",
        evaluations: {
          "c-d1": "Chưa đáp ứng",
          "c-d2": "Đáp ứng",
          "c-d3": "Đáp ứng",
        },
      },
    ],
    joinedExperienceIds: ["try-2"],
    journal: [
      {
        id: "j-d1",
        date: "2026-11-09",
        activityType: "Suy ngẫm cá nhân",
        content:
          "Em sợ chọn trường này xong lại thấy trường kia tốt hơn, nên cứ giữ cả hai trong đầu mãi.",
      },
      {
        id: "j-d2",
        date: "2026-11-15",
        activityType: "Đối chiếu tiêu chí",
        content:
          "Viết ra bảng lọc rồi mới thấy trường kia em thích chỉ vì bạn thân học ở đó, chứ đi lại xa quá khiến em mệt.",
      },
    ],
    commitment: {
      studentDisplayCode: "HS D",
      studentNamePlaceholder: "Học sinh D (Ẩn danh)",
      className: "9A1",
      chosenOption: "THPT công lập gần nhà",
      reasonInOwnWords:
        "Trường đáp ứng đủ các tiêu chí gần nhà, vừa sức học và giữ sức khỏe ôn thi. Em nhận ra không cần cố tìm trường 'hoàn hảo nhất' mà chỉ cần nơi phù hợp nhất với nhịp sống của mình.",
      actionPlan: [
        { id: "t-d1", title: "Lập thời gian biểu ôn 3 môn thi tuyển sinh lớp 10", done: true },
        { id: "t-d2", title: "Ngừng so sánh danh sách trường trên mạng xã hội", done: true },
      ],
      deadlineDate: "2026-11-22",
      studentConfirmedAt: "2026-11-16 18:45",
      parentConfirmedAt: "2026-11-16 20:00",
      teacherConfirmedAt: "2026-11-17 09:00",
    },
    signals: {
      changeOptionCount: 2,
      addedAfterCommit: false,
      abandonedCommitStep: false,
      hesitancyPhrasesCount: 1,
      recentPhrases: ["trường kia tốt hơn"],
      hasSensitiveAlert: false,
    },
    assessment: {
      before: {
        understandingSelf: "Khá rõ nét",
        understandingPathways: "Khá rõ nét",
        narrowingOptions: "Hạn chế",
        decidingOnTime: "Đang hình thành",
        committingAndActing: "Đang hình thành",
        notes: "Phân vân kéo dài giữa hai trường THPT cùng mức.",
        evidence: "Nhật ký đầu kì: sợ chọn xong lại tiếc.",
        criterionEvidence: {
          understandingSelf: "Nhận biết học đều các môn nhưng dễ mệt khi đi xa.",
          understandingPathways: "Biết thông tin hai trường THPT công lập khu vực.",
          narrowingOptions: "Nhật ký 09/11: giữ cả 2 trường trong đầu vì sợ tiếc.",
          decidingOnTime: "Chần chừ chốt trước kì đăng kí.",
          committingAndActing: "Chưa dứt khỏi tâm lí so sánh trên mạng xã hội.",
        },
      },
      after: {
        understandingSelf: "Vững vàng",
        understandingPathways: "Vững vàng",
        narrowingOptions: "Vững vàng",
        decidingOnTime: "Vững vàng",
        committingAndActing: "Vững vàng",
        notes: "Vượt qua tâm lí so sánh với bạn bè nhờ bảng tiêu chí cá nhân.",
        evidence: "Tự loại trường xa nhà và chốt phiếu cam kết trước hạn.",
        criterionEvidence: {
          understandingSelf: "Nhận thức rõ giới hạn sức khỏe khi đi chuyển xa.",
          understandingPathways: "Đối chiếu đầy đủ điều kiện đi lại và học tập của hai trường.",
          narrowingOptions: "Nhật ký 15/11: gác trường xa nhà theo bạn.",
          decidingOnTime: "Chốt đúng hạn 22/11 với lí do rõ ràng.",
          committingAndActing: "Hoàn thành cả 2 việc trong kế hoạch hành động.",
        },
      },
      studentSelf: createDefaultLevelMap("Vững vàng"),
    },
  };

  return [hsA, hsB, hsC, hsD];
}

function createRemainingClassStudents(): Student[] {
  const steps: JourneyStep[] = ["THU", "LỌC", "THỬ", "CHỐT", "CAM KẾT"];
  const beforeLevels: QualitativeLevel[] = [
    "Hạn chế",
    "Đang hình thành",
    "Khá rõ nét",
  ];
  const afterLevels: QualitativeLevel[] = [
    "Đang hình thành",
    "Khá rõ nét",
    "Vững vàng",
  ];

  const list: Student[] = [];
  for (let i = 5; i <= 45; i++) {
    const numStr = i < 10 ? `0${i}` : `${i}`;
    const code = `HS ${numStr}`;
    const className = SCHOOL_CLASS_IDS[(i - 5) % SCHOOL_CLASS_IDS.length];
    const step = steps[i % steps.length];
    const isFocus = i % 6 === 0;
    const isCommitted = step === "CHỐT" || step === "CAM KẾT";
    const beforeLvl = beforeLevels[i % beforeLevels.length];
    const afterLvl = afterLevels[Math.min(2, (i % beforeLevels.length) + 1)];

    const pathwayChoices = [
      "THPT công lập",
      "Trung cấp nghề (kết hợp học văn hóa THPT)",
      "Giáo dục thường xuyên (học văn hóa THPT)",
      "THPT tư thục",
    ];
    const chosenTitle = pathwayChoices[i % pathwayChoices.length];

    list.push({
      id: `hs-${numStr}`,
      code,
      anonymizedLabel: code,
      className,
      isCaseStudy: false,
      isFocusGroup: isFocus,
      currentStep: step,
      shareWithParent: i % 2 === 0,
      privacyConsentAccepted: true,
      privacyConsentAcceptedAt: "2026-11-05 09:00",
      profile: {
        abilitiesTeacherNote: isFocus
          ? "Em cần được gợi mở thêm về điểm mạnh thực hành và lựa chọn lộ trình phù hợp sức học."
          : "Em có nền tảng học tập ổn định, tiếp thu tốt khi có kế hoạch rõ ràng.",
        abilitiesStudentSelf:
          "Em đang tiếp tục tự quan sát điểm mạnh của mình qua các hoạt động trên lớp.",
        hollandSelectedIds: i % 2 === 0 ? ["h1", "h7"] : ["h5", "h6"],
        hollandSummaryText: buildHollandSummary(
          i % 2 === 0 ? ["h1", "h7"] : ["h5", "h6"]
        ),
        conditions: {
          commuteDistance: "Ưu tiên đi lại trong phạm vi thuận tiện.",
          familyFinance: "Gia đình cân đối chi phí phù hợp điều kiện.",
          earlyIndependence: isFocus
            ? "Cân nhắc khả năng học nghề sớm."
            : "Học tiếp bậc THPT.",
          healthNote: "Bình thường.",
        },
      },
      criteria: [
        { id: `c-${numStr}-1`, label: "vừa sức học của em" },
        { id: `c-${numStr}-2`, label: "vẫn có đường học lên" },
      ],
      consideredOptions: [
        {
          id: `opt-${numStr}-1`,
          pathwayId: i % 3 === 0 ? "pw-trung-cap" : "pw-thpt-cong",
          title: chosenTitle,
          status: isCommitted ? "Đã chọn" : "Đang cân nhắc",
          evaluations: {
            [`c-${numStr}-1`]: "Đáp ứng",
            [`c-${numStr}-2`]: isCommitted ? "Đáp ứng" : "Chưa rõ",
          },
        },
      ],
      joinedExperienceIds: step === "THỬ" || isCommitted ? ["try-2"] : [],
      journal: [],
      commitment: {
        studentDisplayCode: code,
        studentNamePlaceholder: `Học sinh ${numStr} (Ẩn danh)`,
        className,
        chosenOption: isCommitted ? chosenTitle : "",
        reasonInOwnWords: isCommitted
          ? "Phương án phù hợp với sức học và điều kiện gia đình hiện tại của em."
          : "",
        actionPlan: [
          {
            id: `t-${numStr}-1`,
            title: "Trao đổi lại phương án với gia đình",
            done: isCommitted,
          },
          {
            id: `t-${numStr}-2`,
            title: "Chuẩn bị hồ sơ cần thiết theo lịch nhà trường",
            done: false,
          },
        ],
        deadlineDate:
          i % 9 === 0 ? "" : i === 5 || i === 11 ? "2026-11-10" : "2026-11-28",
        studentConfirmedAt: step === "CAM KẾT" ? "2026-11-16 17:00" : null,
        parentConfirmedAt:
          step === "CAM KẾT" && i % 2 === 0 ? "2026-11-17 09:30" : null,
        teacherConfirmedAt: step === "CAM KẾT" ? "2026-11-17 15:00" : null,
      },
      signals: {
        changeOptionCount: isFocus ? 2 : i % 4 === 0 ? 1 : 0,
        addedAfterCommit: i === 12,
        abandonedCommitStep: i === 18,
        hesitancyPhrasesCount: isFocus ? 1 : 0,
        recentPhrases: isFocus ? ["để em nghĩ thêm"] : [],
        hasSensitiveAlert: false,
      },
      assessment: {
        before: createDefaultLevelMap(beforeLvl),
        after: createDefaultLevelMap(afterLvl),
        studentSelf: createDefaultLevelMap(afterLvl),
      },
    });
  }
  return list;
}

export const INITIAL_AI_MESSAGES: AIMessage[] = [
  {
    id: "ai-m1",
    studentId: "hs-01",
    studentCode: "HS A",
    createdAt: "2026-11-18 19:45",
    triggerReason: "hesitancy_phrase",
    studentText:
      "Em vẫn muốn thi lớp 10 thử, trượt thì tính tiếp. Nhưng biết đâu tới lúc thi em làm được bài tốt hơn thì sao.",
    aiReply:
      "Mình nghe em chia sẻ mong muốn thử sức ở kì thi lớp 10. Vậy phương án dự phòng em đang nghĩ tới có đáp ứng tiêu chí 'vừa sức học của em' và 'chi phí vừa phải' mà em đã đặt chưa?",
    originalAiReply:
      "Mình nghe em chia sẻ mong muốn thử sức ở kì thi lớp 10. Vậy phương án dự phòng em đang nghĩ tới có đáp ứng tiêu chí 'vừa sức học của em' và 'chi phí vừa phải' mà em đã đặt chưa?",
    loaiCauHoi: "doi_chieu_tieu_chi",
    nhayCam: false,
    dauHieu: "Em giữ tâm lí thử may rủi và có cụm từ do dự ('nhưng biết đâu').",
    status: "chờ duyệt",
    visibleToStudent: true,
  },
  {
    id: "ai-m2",
    studentId: "hs-03",
    studentCode: "HS C",
    createdAt: "2026-11-15 20:12",
    triggerReason: "hesitancy_phrase",
    studentText:
      "Bạn rủ em nộp vào trường tư trên thành phố. Em chưa hỏi kĩ mẹ, nhưng chắc là được thôi.",
    aiReply:
      "Mình thấy em đang cân nhắc trường tư theo gợi ý của bạn. Em đã đối chiếu phương án này với tiêu chí 'chi phí vừa phải' và điều kiện đi lại của gia đình chưa?",
    originalAiReply:
      "Mình thấy em đang cân nhắc trường tư theo gợi ý của bạn. Em đã đối chiếu phương án này với tiêu chí 'chi phí vừa phải' và điều kiện đi lại của gia đình chưa?",
    loaiCauHoi: "doi_chieu_tieu_chi",
    teacherEncouragement:
      "Cô rất vui khi sau đó em đã chủ động ngồi nói chuyện thẳng thắn với mẹ để tìm hiểu chi phí thực tế.",
    nhayCam: false,
    dauHieu: "Em chọn phương án theo bạn bè khi chưa kiểm chứng thông tin.",
    status: "giữ nguyên",
    visibleToStudent: true,
  },
];

export const INITIAL_AI_MODERATION_LOGS: AppState["aiModerationLogs"] = [
  {
    id: "log-m1",
    messageId: "ai-m1",
    studentId: "hs-01",
    studentCode: "HS A",
    action: "tạo mới",
    actor: "Trợ lí AI (Gemini)",
    timestamp: "2026-11-18 19:45",
    studentText:
      "Em vẫn muốn thi lớp 10 thử, trượt thì tính tiếp. Nhưng biết đâu tới lúc thi em làm được bài tốt hơn thì sao.",
    originalReply:
      "Mình nghe em chia sẻ mong muốn thử sức ở kì thi lớp 10. Vậy phương án dự phòng em đang nghĩ tới có đáp ứng tiêu chí 'vừa sức học của em' và 'chi phí vừa phải' mà em đã đặt chưa?",
    reason: "Câu hỏi đối chiếu tiêu chí tự động theo ngữ cảnh do dự.",
  },
  {
    id: "log-m2",
    messageId: "ai-m2",
    studentId: "hs-03",
    studentCode: "HS C",
    action: "giữ nguyên",
    actor: "Giáo viên chủ nhiệm",
    timestamp: "2026-11-15 20:30",
    studentText:
      "Bạn rủ em nộp vào trường tư trên thành phố. Em chưa hỏi kĩ mẹ, nhưng chắc là được thôi.",
    originalReply:
      "Mình thấy em đang cân nhắc trường tư theo gợi ý của bạn. Em đã đối chiếu phương án này với tiêu chí 'chi phí vừa phải' và điều kiện đi lại của gia đình chưa?",
    editedReply:
      "Cô rất vui khi sau đó em đã chủ động ngồi nói chuyện thẳng thắn với mẹ để tìm hiểu chi phí thực tế.",
    reason: "Phù hợp tiêu chí gia đình, bổ sung lời động viên.",
  },
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: "meet-1",
    studentId: "hs-02",
    studentCode: "HS B",
    dateTime: "2026-11-16 15:30",
    locationOrChannel: "Phòng tư vấn trường THCS",
    parentInvited: true,
    status: "Đã họp",
    keyPoints:
      "Gia đình thống nhất tôn trọng sở thích sửa chữa điện của em. Cô giáo giải thích rõ đường liên thông từ Trung cấp lên Cao đẳng.",
    agreedChoice: "Trung cấp nghề Điện (kết hợp văn hóa THPT)",
    nextSteps:
      "HS B hoàn thành bài kiểm tra học kì; bố mẹ và em cùng theo dõi lịch tuyển sinh do nhà trường cập nhật.",
    confirmations: {
      student: true,
      parent: true,
      teacher: true,
    },
  },
  {
    id: "meet-2",
    studentId: "hs-03",
    studentCode: "HS C",
    dateTime: "2026-11-22 16:00",
    locationOrChannel: "Phòng họp lớp 9A1",
    parentInvited: true,
    status: "Đã lên lịch",
    keyPoints:
      "Trao đổi thêm với mẹ của HS C về lịch nộp hồ sơ và cơ hội thực hành nghề May.",
    agreedChoice: "",
    nextSteps:
      "Mẹ và HS C mang theo bảng ghi chú chi phí đi lại đã tính ở nhà để cùng cô giáo rà soát.",
    confirmations: {
      student: true,
      parent: false,
      teacher: true,
    },
  },
  {
    id: "meet-3",
    studentId: "hs-01",
    studentCode: "HS A",
    dateTime: "2026-11-24 15:00",
    locationOrChannel: "Phòng tư vấn trường THCS",
    parentInvited: true,
    status: "Đã lên lịch",
    keyPoints: "",
    agreedChoice: "",
    nextSteps:
      "Thống nhất ngày HS A tham quan xưởng thực hành và lắng nghe mong muốn của gia đình.",
    confirmations: {
      student: false,
      parent: false,
      teacher: true,
    },
  },
];

export function createInitialAppState(): AppState {
  return {
    schemaVersion: 2,
    students: [...createCaseStudies(), ...createRemainingClassStudents()],
    pathways: INITIAL_PATHWAYS,
    experiences: INITIAL_EXPERIENCES,
    aiMessages: INITIAL_AI_MESSAGES,
    aiModerationLogs: INITIAL_AI_MODERATION_LOGS,
    thematicCodes: [],
    meetings: INITIAL_MEETINGS,
    settings: {
      requireTeacherApprovalBeforeDisplay: false,
      darkMode: false,
      fontSize: "medium",
      googleFormSurveyUrl: "",
    },
  };
}
