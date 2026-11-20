import {
  AppState,
  HollandGroup,
  JourneyStep,
  MeetingRecord,
  PathwayItem,
  QualitativeLevel,
  RubricCriterionScores,
  StudentProfileData,
  StudentRubricRecord,
  TryActivity,
} from "../types";

export const QUALITATIVE_LEVELS: QualitativeLevel[] = [
  "Hạn chế",
  "Đang hình thành",
  "Khá rõ nét",
  "Vững vàng",
];

export interface HollandPromptOption {
  id: string;
  group: HollandGroup;
  prompt: string;
  narrativeResult: string;
}

export const HOLLAND_OPTIONS: HollandPromptOption[] = [
  {
    id: "h-r-1",
    group: "Kĩ thuật",
    prompt: "Tháo lắp, sửa chữa đồ điện, xe đạp hoặc làm ra món đồ cầm nắm được",
    narrativeResult: "Em có vẻ thích công việc làm bằng tay, tạo ra sản phẩm nhìn thấy được và xử lí các thiết bị cụ thể.",
  },
  {
    id: "h-r-2",
    group: "Kĩ thuật",
    prompt: "Thực hành ở xưởng, vận hành máy móc, dụng cụ hơn là ngồi nghe lí thuyết dài",
    narrativeResult: "Em dễ hứng thú hơn khi được trực tiếp thực hành và nhìn thấy kết quả ngay trên vật thật.",
  },
  {
    id: "h-i-1",
    group: "Nghiên cứu",
    prompt: "Tìm hiểu nguyên lí hoạt động của một sự vật hoặc giải các bài toán đố",
    narrativeResult: "Em có xu hướng tò mò, thích đặt câu hỏi 'tại sao' và tự mày mò tìm quy luật.",
  },
  {
    id: "h-a-1",
    group: "Nghệ thuật",
    prompt: "Vẽ phác thảo, phối màu, thiết kế trang phục, chụp ảnh hoặc sáng tạo nội dung",
    narrativeResult: "Em có cảm nhận thẩm mĩ tốt, thích tạo dấu ấn riêng qua hình ảnh, đường nét hoặc thiết kế.",
  },
  {
    id: "h-s-1",
    group: "Xã hội",
    prompt: "Lắng nghe, hướng dẫn bạn bè, chăm sóc người khác hoặc tham gia việc chung",
    narrativeResult: "Em thấy có ý nghĩa khi công việc giúp ích trực tiếp cho mọi người xung quanh.",
  },
  {
    id: "h-e-1",
    group: "Quản lí",
    prompt: "Đứng ra tổ chức nhóm, trao đổi thuyết phục mọi người hoặc thử buôn bán nhỏ",
    narrativeResult: "Em có sự chủ động, thích kết nối công việc và dẫn dắt kế hoạch chung.",
  },
  {
    id: "h-c-1",
    group: "Nghiệp vụ",
    prompt: "Sắp xếp hồ sơ, kiểm tra số liệu, làm việc theo quy trình rõ ràng, ngăn nắp",
    narrativeResult: "Em làm tốt những việc đòi hỏi sự cẩn thận, rõ ràng và theo từng bước cụ thể.",
  },
];

export const SUGGESTED_CRITERIA = [
  "Vừa sức học của em",
  "Gần nhà, đi lại thuận tiện",
  "Có thể đi làm sớm để phụ giúp gia đình",
  "Vẫn có đường học lên khi sẵn sàng",
  "Chi phí vừa phải với gia đình",
  "Đúng việc em thích và làm được",
];

export interface RubricCriterionMeta {
  key: keyof RubricCriterionScores;
  title: string;
  levels: Record<QualitativeLevel, string>;
}

export const RUBRIC_CRITERIA: RubricCriterionMeta[] = [
  {
    key: "hieuBanThan",
    title: "1. Hiểu bản thân",
    levels: {
      "Hạn chế": "Chỉ nói được \"em học yếu\", chưa nêu được điểm mạnh hay điều mình thích.",
      "Đang hình thành": "Bắt đầu nhận ra một vài hoạt động mình làm được nhưng còn e dè khi kể ra.",
      "Khá rõ nét": "Nêu được điểm mạnh, sở thích nhưng còn chung chung, chưa gắn với điều kiện thực tế.",
      "Vững vàng": "Nêu cụ thể điểm mạnh, hứng thú, điều kiện gia đình và liên hệ được với hướng nghề.",
    },
  },
  {
    key: "hieuLoTrinh",
    title: "2. Hiểu thông tin lộ trình",
    levels: {
      "Hạn chế": "Dựa vào lời đồn của bạn bè, chưa phân biệt được các loại hình trường sau THCS.",
      "Đang hình thành": "Biết tên vài hướng đi nhưng còn hiểu nhầm học nghề là mất đường học tiếp.",
      "Khá rõ nét": "Hiểu các lộ trình chính (THPT, GDTX, Trung cấp nghề), còn mơ hồ về đường liên thông.",
      "Vững vàng": "Giải thích được từng lộ trình và cửa liên thông từ học nghề lên Cao đẳng, Đại học.",
    },
  },
  {
    key: "thuHepLuaChon",
    title: "3. Thu hẹp lựa chọn",
    levels: {
      "Hạn chế": "Giữ mọi phương án cùng lúc, liên tục thêm phương án mới theo lời khuyên bên ngoài.",
      "Đang hình thành": "Có nghĩ đến việc chọn lọc nhưng vẫn sợ bỏ lỡ nên chưa dám gạch bớt phương án.",
      "Khá rõ nét": "Đã đặt được tiêu chí tối thiểu nhưng áp dụng chưa nhất quán khi so sánh.",
      "Vững vàng": "Tự đặt tiêu chí \"đủ tốt\" và chủ động loại bỏ phương án không phù hợp với mình.",
    },
  },
  {
    key: "chotQuyetDinh",
    title: "4. Chốt quyết định",
    levels: {
      "Hạn chế": "Trì hoãn đến sát hạn hoặc đẩy việc quyết định cho bố mẹ, thầy cô.",
      "Đang hình thành": "Nghiêng về một lựa chọn nhưng vẫn chần chừ, dễ đổi ý khi nghe so sánh.",
      "Khá rõ nét": "Chốt được phương án nhưng cần thầy cô nhắc nhiều lần mới xác nhận.",
      "Vững vàng": "Chốt đúng hạn tự đặt, nêu được lí do chọn bằng lời của chính mình.",
    },
  },
  {
    key: "camKetHanhDong",
    title: "5. Cam kết và hành động",
    levels: {
      "Hạn chế": "Không có kế hoạch chuẩn bị cụ thể, dễ đổi ý khi gặp trở ngại nhỏ.",
      "Đang hình thành": "Có dự định làm vài việc nhưng chưa ghi thành bước cụ thể để theo dõi.",
      "Khá rõ nét": "Có kế hoạch ngắn hạn rõ ràng nhưng thực hiện chưa đều đặn.",
      "Vững vàng": "Có kế hoạch cụ thể, tự theo dõi tiến độ chuẩn bị và điều chỉnh phù hợp.",
    },
  },
];

export const INITIAL_PATHWAYS: PathwayItem[] = [
  {
    id: "path-thpt",
    title: "1. THPT Công lập / Tư thục",
    shortTitle: "THPT Công lập / Tư thục",
    branchType: "thpt",
    entryCondition: "Tham gia kì tuyển sinh lớp 10 (công lập) hoặc xét học bạ / tuyển sinh riêng (tư thục) theo kế hoạch của địa phương.",
    studyContent: "Học chương trình giáo dục phổ thông 3 năm (lớp 10–12), định hướng tổ hợp môn thi tốt nghiệp THPT.",
    careerOpportunity: "Chuẩn bị nền tảng để dự thi hoặc xét tuyển vào Đại học, Cao đẳng, hoặc học nghề trình độ cao hơn sau lớp 12.",
    articulationNote: "Phù hợp với học sinh có nền tảng học lực văn hóa ổn định và muốn tập trung 3 năm phổ thông trước khi phân nhánh nghề nghiệp.",
    schoolNames: "",
    estimatedCost: "",
    admissionReference: "",
    realStories: [
      {
        id: "st-thpt-1",
        title: "Chia sẻ của cựu học sinh về áp lực và cách chọn tổ hợp lớp 10",
        alumniRole: "Cựu HS khóa trước · Đang học lớp 11",
        summary: "Kinh nghiệm tự đánh giá sức học môn Toán - Văn - Anh trước khi quyết định đăng kí nguyện vọng.",
        url: "#cau-chuyen-thpt",
      },
    ],
  },
  {
    id: "path-gdtx",
    title: "2. Giáo dục thường xuyên (Học văn hóa THPT)",
    shortTitle: "Giáo dục thường xuyên",
    branchType: "gdtx",
    entryCondition: "Đã tốt nghiệp THCS; xét tuyển hồ sơ theo thông báo của Trung tâm GDNN–GDTX địa phương.",
    studyContent: "Học chương trình văn hóa THPT tinh gọn (7 môn bắt buộc và tự chọn theo quy định), có thể kết hợp học song song một nghề cơ bản.",
    careerOpportunity: "Dự thi tốt nghiệp THPT như học sinh THPT, mở rộng cửa vào Cao đẳng, Đại học hoặc đi làm sớm có bằng tốt nghiệp THPT.",
    articulationNote: "Lộ trình nhẹ nhàng hơn về khối lượng môn lí thuyết, giúp em vừa giữ được bằng THPT vừa có thời gian rèn kĩ năng nghề hoặc phụ giúp gia đình.",
    schoolNames: "",
    estimatedCost: "",
    admissionReference: "",
    realStories: [
      {
        id: "st-gdtx-1",
        title: "Vừa học văn hóa GDTX vừa học nghề sửa chữa điện lạnh",
        alumniRole: "Cựu HS · Tốt nghiệp lớp 12 GDTX",
        summary: "Sau 3 năm vừa có bằng tốt nghiệp THPT vừa có tay nghề ổn định, hiện đang học tiếp Cao đẳng.",
        url: "#cau-chuyen-gdtx",
      },
    ],
  },
  {
    id: "path-nghe",
    title: "3. Trung cấp / Sơ cấp nghề (có thể kết hợp văn hóa THPT)",
    shortTitle: "Trung cấp / Sơ cấp nghề",
    branchType: "nghe",
    entryCondition: "Đã tốt nghiệp THCS; xét tuyển trực tiếp theo học bạ hoặc tư vấn định hướng nghề, không áp lực thi tuyển đầu vào nặng nề.",
    studyContent: "70% thời lượng thực hành tại xưởng (điện, cơ khí, công nghệ thông tin, may thiết kế, nấu ăn, chăm sóc sắc đẹp...). Có thể học song song chương trình văn hóa THPT.",
    careerOpportunity: "Ra trường có tay nghề thực tế sau 1,5–2 năm; dễ tìm việc làm tại doanh nghiệp, xưởng sản xuất hoặc tự mở dịch vụ.",
    articulationNote: "Đường liên thông mở rộng: Từ Trung cấp nghề (có hoàn thành khối lượng kiến thức văn hóa THPT theo quy định), người học liên thông thẳng lên Cao đẳng và Đại học.",
    schoolNames: "",
    estimatedCost: "",
    admissionReference: "",
    realStories: [
      {
        id: "st-nghe-1",
        title: "Hành trình từ lớp Trung cấp Điện công nghiệp lên Cao đẳng Kĩ thuật",
        alumniRole: "Anh Minh · Cựu HS Trung cấp nghề",
        summary: "Ngày trước mình ngại học lí thuyết dài, vào xưởng thực hành thấy hợp hẳn. Ra trường đi làm phụ bố mẹ rồi học liên thông Cao đẳng buổi tối.",
        url: "#cau-chuyen-nghe-dien",
      },
      {
        id: "st-nghe-2",
        title: "Chọn hệ Trung cấp May thiết kế kết hợp văn hóa THPT gần nhà",
        alumniRole: "Chị Lan · Học viên năm 2",
        summary: "Không phải xa gia đình sớm, chi phí nhẹ nhàng hơn nhiều và được thực tập may sản phẩm thật ngay từ năm nhất.",
        url: "#cau-chuyen-may",
      },
    ],
  },
  {
    id: "path-dilam",
    title: "4. Đi làm, tích lũy tay nghề, học tiếp khi sẵn sàng",
    shortTitle: "Đi làm & học tiếp sau",
    branchType: "dilam",
    entryCondition: "Học một khóa ngắn hạn (sơ cấp 3–6 tháng) hoặc học việc tại cơ sở uy tín có sự đồng hành của gia đình.",
    studyContent: "Làm quen môi trường lao động thực tế, rèn tác phong kỉ luật, tích lũy thu nhập và kinh nghiệm cuộc sống.",
    careerOpportunity: "Có thu nhập sớm hỗ trợ gia đình; khi tích lũy đủ tài chính và xác định rõ nghề muốn gắn bó lâu dài có thể quay lại học Trung cấp, GDTX hoặc Cao đẳng.",
    articulationNote: "Không có cánh cửa nào đóng vĩnh viễn: việc học có thể tiếp nối ở nhiều thời điểm khác nhau khi điều kiện gia đình và bản thân em sẵn sàng.",
    schoolNames: "",
    estimatedCost: "",
    admissionReference: "",
    realStories: [],
  },
];

export const INITIAL_TRY_ACTIVITIES: TryActivity[] = [
  {
    id: "try-1",
    title: "Tham quan xưởng thực hành Điện – Cơ khí và trao đổi với giảng viên nghề",
    category: "Tham quan xưởng thực hành",
    date: "Thứ Bảy, 28/11",
    location: "Cơ sở Giáo dục Nghề nghiệp liên kết (địa phương)",
    description: "Học sinh được tận mắt xem tiết học thực hành đấu mạch điện dân dụng, hỏi đáp trực tiếp về thời gian học và đường liên thông.",
  },
  {
    id: "try-2",
    title: "Buổi giao lưu: Nghe cựu học sinh kể chuyện học nghề và học liên thông",
    category: "Giao lưu người làm nghề",
    date: "Thứ Tư, 02/12",
    location: "Phòng Hội đồng trường THCS",
    description: "Trò chuyện thân mật với 3 anh chị từng băn khoăn cuối lớp 9, hiện đang đi làm ổn định hoặc học liên thông Cao đẳng.",
  },
  {
    id: "try-3",
    title: "Bài tập tình huống: Một ngày làm thợ thiết kế và cắt may sản phẩm nhỏ",
    category: "Bài tập tình huống nghề",
    date: "Thứ Bảy, 05/12",
    location: "Phòng thực hành Công nghệ",
    description: "Trải nghiệm quy trình đo vẽ, cắt ghép mẫu và hoàn thiện một sản phẩm thủ công trong 90 phút để tự cảm nhận sự phù hợp.",
  },
];

function createDefaultRubric(
  before: QualitativeLevel[],
  after: QualitativeLevel[],
  teacherNote: string
): StudentRubricRecord {
  return {
    beforeTeacher: {
      hieuBanThan: before[0],
      hieuLoTrinh: before[1],
      thuHepLuaChon: before[2],
      chotQuyetDinh: before[3],
      camKetHanhDong: before[4],
    },
    afterTeacher: {
      hieuBanThan: after[0],
      hieuLoTrinh: after[1],
      thuHepLuaChon: after[2],
      chotQuyetDinh: after[3],
      camKetHanhDong: after[4],
    },
    teacherNote,
  };
}

function createSampleStudents(): StudentProfileData[] {
  const hsA: StudentProfileData = {
    id: "HS A",
    className: "9A1",
    isFocusGroup: true,
    currentStep: "THU",
    hasLockedChoice: false,
    shareWithParent: false,
    storyTag: "Hồ sơ minh họa chi tiết",
    teacherAbilityNote:
      "Em chăm chỉ trong các giờ thực hành Công nghệ, có thể làm tốt việc tỉ mỉ theo hướng dẫn trực quan. Tuy nhiên, em còn gặp nhiều khó khăn với các môn cần ghi nhớ lí thuyết dài và bài kiểm tra viết áp lực thời gian.",
    studentAbilityNote:
      "Em thấy mình tiếp thu chậm khi phải học thuộc nhiều, nhưng khi được làm thử trực tiếp trên đồ vật thì em nhớ lâu hơn.",
    selectedHollandAnswers: ["h-r-2"],
    conditions: {
      travelDistance: "Muốn học gần nhà để tự đi xe đạp, tránh tốn thời gian và chi phí đi lại xa.",
      familyFinance: "Gia đình thu nhập vừa phải, cần cân nhắc tiết kiệm học phí.",
      earlyIndependence: "Mong muốn sớm có kĩ năng làm việc phụ giúp bố mẹ trong 2–3 năm tới.",
      healthNote: "Sức khỏe bình thường, phù hợp môi trường vận động vừa phải.",
    },
    consideredOptionIds: ["path-thpt", "path-nghe", "path-gdtx"],
    criteria: ["Vừa sức học của em", "Gần nhà, đi lại thuận tiện"],
    filterMatrix: {
      "path-thpt": {
        "Vừa sức học của em": "Chưa rõ",
        "Gần nhà, đi lại thuận tiện": "Đáp ứng",
      },
      "path-nghe": {
        "Vừa sức học của em": "Đáp ứng",
        "Gần nhà, đi lại thuận tiện": "Chưa rõ",
      },
      "path-gdtx": {
        "Vừa sức học của em": "Chưa rõ",
        "Gần nhà, đi lại thuận tiện": "Đáp ứng",
      },
    },
    journal: [
      {
        id: "j-a-1",
        date: "15/11",
        activityType: "Suy nghĩ cá nhân",
        reflection:
          "Thầy cô khuyên em cân nhắc học nghề cho vừa sức, nhưng bạn bè ai cũng đăng kí thi lớp 10. Em vẫn muốn thi lớp 10 thử, trượt thì tính tiếp, nhưng biết đâu vào được trường nào đó cũng tốt.",
      },
    ],
    tryRegistrations: [{ activityId: "try-1", status: "Đã đăng kí" }],
    chatMessages: [
      {
        id: "m-a-1",
        sender: "student",
        text: "Em vẫn muốn thi lớp 10 thử, trượt thì tính tiếp.",
        createdAt: "15/11 · 19:30",
      },
      {
        id: "m-a-2",
        sender: "ai",
        text: "Mình hiểu cảm giác muốn thử sức cho yên tâm của em. Nếu đặt cạnh tiêu chí 'Vừa sức học của em' và 'Gần nhà', em thấy mình đã tìm hiểu đủ thông tin về cả phương án THPT lẫn Trung cấp nghề chưa?",
        createdAt: "15/11 · 19:30",
        reviewId: "rev-a-1",
      },
    ],
    commitment: {
      studentDisplayName: "HS A",
      className: "9A1",
      chosenPathwayId: "",
      chosenOptionLabel: "",
      reasonInOwnWords: "",
      deadlineDate: "2026-12-10",
      actionPlan: [
        { id: "act-a-1", text: "Tham gia buổi tham quan xưởng thực hành Điện – Cơ khí", done: false },
        { id: "act-a-2", text: "Hỏi thầy cô thông tin tuyển sinh Trung cấp nghề và GDTX ở địa phương", done: false },
      ],
    },
    behaviorCounters: {
      optionChangesCount: 2,
      addedAfterLockCount: 0,
      abandonedLockCount: 1,
      hesitantPhrasesCount: 3,
      sensitiveAlert: false,
      customNotes: [
        "Em thường viết các câu trì hoãn quyết định như 'trượt thì tính tiếp', 'nhưng biết đâu'.",
        "Em giữ đồng thời cả THPT công lập, GDTX và Trung cấp nghề nhưng chưa kiểm chứng thông tin ở bước THU.",
      ],
    },
    rubric: createDefaultRubric(
      ["Hạn chế", "Hạn chế", "Hạn chế", "Hạn chế", "Hạn chế"],
      ["Đang hình thành", "Đang hình thành", "Đang hình thành", "Hạn chế", "Đang hình thành"],
      "Em bắt đầu cởi mở hơn khi đăng kí tham quan xưởng, cần thêm thời gian đối chiếu thực tế."
    ),
  };

  const hsB: StudentProfileData = {
    id: "HS B",
    className: "9A1",
    isFocusGroup: true,
    currentStep: "CAM KẾT",
    hasLockedChoice: true,
    shareWithParent: true,
    storyTag: "Hồ sơ minh họa chi tiết",
    teacherAbilityNote:
      "Em có đôi tay khéo léo, tư duy thực hành mạch lạc, hay chủ động sửa giúp đồ điện đơn giản ở lớp. Các môn lí thuyết trừu tượng em tiếp thu ở mức trung bình.",
    studentAbilityNote:
      "Em rất thích tháo lắp quạt điện, ổ cắm ở nhà và làm được khá gọn. Em muốn học cái gì dùng được tay nghề ngay.",
    selectedHollandAnswers: ["h-r-1", "h-r-2"],
    conditions: {
      travelDistance: "Ưu tiên học gần nhà trong bán kính đi xe đạp hoặc xe buýt ngắn.",
      familyFinance: "Gia đình làm nông, cần tiết kiệm chi phí học tập.",
      earlyIndependence: "Muốn đi làm được sớm sau 2 năm để phụ giúp bố mẹ, nhưng vẫn giữ cửa học lên.",
      healthNote: "Sức khỏe tốt, chịu khó.",
    },
    consideredOptionIds: ["path-nghe", "path-thpt"],
    criteria: [
      "Gần nhà, đi lại thuận tiện",
      "Có thể đi làm sớm để phụ giúp gia đình",
      "Vẫn có đường học lên khi sẵn sàng",
    ],
    filterMatrix: {
      "path-nghe": {
        "Gần nhà, đi lại thuận tiện": "Đáp ứng",
        "Có thể đi làm sớm để phụ giúp gia đình": "Đáp ứng",
        "Vẫn có đường học lên khi sẵn sàng": "Đáp ứng",
      },
      "path-thpt": {
        "Gần nhà, đi lại thuận tiện": "Đáp ứng",
        "Có thể đi làm sớm để phụ giúp gia đình": "Chưa đáp ứng",
        "Vẫn có đường học lên khi sẵn sàng": "Đáp ứng",
      },
    },
    journal: [
      {
        id: "j-b-1",
        date: "04/11",
        activityType: "Suy nghĩ cá nhân",
        reflection:
          "Ban đầu em định cứ đăng kí thi lớp 10, nếu trượt thì xin bố mẹ cho vào trường tư cho bằng bạn. Nhưng nghĩ tới học phí trường tư lại thấy lo.",
      },
      {
        id: "j-b-2",
        date: "14/11",
        activityType: "Tham quan xưởng thực hành",
        reflection:
          "Hôm nay đi tham quan xưởng nghề điện cùng lớp, em được cầm đồng hồ đo mạch và nghe anh khóa trước kể chuyện học liên thông. Cảm giác rất nhẹ nhõm: học mà không sợ nữa!",
      },
    ],
    tryRegistrations: [
      {
        activityId: "try-1",
        status: "Đã tham gia",
        reflection: "Em thấy môi trường xưởng rất hợp với mình, thực hành nhiều và dễ hiểu.",
      },
      {
        activityId: "try-2",
        status: "Đã tham gia",
        reflection: "Nghe anh Minh chia sẻ đường liên thông lên Cao đẳng giúp em yên tâm hẳn.",
      },
    ],
    chatMessages: [
      {
        id: "m-b-1",
        sender: "student",
        text: "Hôm nay đi tham quan xưởng nghề điện về em thấy hợp quá, học mà không sợ!",
        createdAt: "14/11 · 17:15",
      },
      {
        id: "m-b-2",
        sender: "ai",
        text: "Thật vui khi em có trải nghiệm thực tế rõ ràng như vậy tại xưởng. Ba tiêu chí 'gần nhà', 'đi làm sớm' và 'vẫn có đường học lên' em đặt ra có đang khớp với hướng đi này không?",
        createdAt: "14/11 · 17:15",
        reviewId: "rev-b-1",
      },
    ],
    commitment: {
      studentDisplayName: "HS B",
      className: "9A1",
      chosenPathwayId: "path-nghe",
      chosenOptionLabel: "Trung cấp nghề Điện (kết hợp văn hóa) rồi học liên thông khi sẵn sàng",
      reasonInOwnWords:
        "Em khéo tay với việc sửa đồ điện, chọn học Trung cấp nghề điện giúp em đi làm sớm phụ giúp bố mẹ mà vẫn còn đường học liên thông lên Cao đẳng.",
      deadlineDate: "2026-12-05",
      actionPlan: [
        { id: "act-b-1", text: "Tìm hiểu hồ sơ xét tuyển Trung cấp nghề từ nhà trường", done: true },
        { id: "act-b-2", text: "Giữ vững nền tảng Toán và Vật lí cơ bản học kì II", done: true },
        { id: "act-b-3", text: "Trao đổi thống nhất với bố mẹ trong buổi họp ba bên", done: false },
      ],
      studentConfirmedAt: "16/11/2026 · 20:10",
      parentConfirmedAt: "17/11/2026 · 19:45",
      teacherConfirmedAt: "18/11/2026 · 08:30",
    },
    behaviorCounters: {
      optionChangesCount: 1,
      addedAfterLockCount: 0,
      abandonedLockCount: 0,
      hesitantPhrasesCount: 0,
      sensitiveAlert: false,
      customNotes: ["Em đã thu hẹp lựa chọn dứt khoát sau khi đi tham quan xưởng và đối chiếu tiêu chí tài chính."],
    },
    rubric: createDefaultRubric(
      ["Đang hình thành", "Hạn chế", "Hạn chế", "Đang hình thành", "Hạn chế"],
      ["Vững vàng", "Vững vàng", "Vững vàng", "Vững vàng", "Khá rõ nét"],
      "Chuyển biến rất tích cực: em tự tin giải thích lộ trình liên thông cho phụ huynh nghe."
    ),
  };

  const hsC: StudentProfileData = {
    id: "HS C",
    className: "9A1",
    isFocusGroup: true,
    currentStep: "CAM KẾT",
    hasLockedChoice: true,
    shareWithParent: true,
    storyTag: "Hồ sơ minh họa chi tiết",
    teacherAbilityNote:
      "Em có gu thẩm mĩ tốt, cẩn thận trong các sản phẩm thủ công và vẽ kĩ thuật. Em hay bị ảnh hưởng bởi ý kiến nhóm bạn thân khi chọn trường.",
    studentAbilityNote:
      "Em thích vẽ mẫu quần áo và làm đồ thủ công tỉ mỉ, nhưng hay ngại nói trước đám đông.",
    selectedHollandAnswers: ["h-a-1", "h-c-1"],
    conditions: {
      travelDistance: "Không muốn phải ở trọ xa nhà khi mới 15 tuổi.",
      familyFinance: "Mẹ buôn bán nhỏ, thu nhập đủ chi tiêu tiết kiệm, khó theo học phí trường tư ở thành phố.",
      earlyIndependence: "Muốn vừa học văn hóa vừa có nghề thực tế.",
      healthNote: "Sức khỏe ổn định.",
    },
    consideredOptionIds: ["path-nghe", "path-thpt"],
    criteria: ["Chi phí vừa phải với gia đình", "Gần nhà, đi lại thuận tiện", "Đúng việc em thích và làm được"],
    filterMatrix: {
      "path-nghe": {
        "Chi phí vừa phải với gia đình": "Đáp ứng",
        "Gần nhà, đi lại thuận tiện": "Đáp ứng",
        "Đúng việc em thích và làm được": "Đáp ứng",
      },
      "path-thpt": {
        "Chi phí vừa phải với gia đình": "Chưa đáp ứng",
        "Gần nhà, đi lại thuận tiện": "Chưa đáp ứng",
        "Đúng việc em thích và làm được": "Chưa rõ",
      },
    },
    journal: [
      {
        id: "j-c-1",
        date: "02/11",
        activityType: "Suy nghĩ cá nhân",
        reflection:
          "Bạn rủ em nộp hồ sơ vào trường tư ở thành phố cho vui. Em chưa hỏi kĩ học phí hay chỗ ở, nhưng chắc là được.",
      },
      {
        id: "j-c-2",
        date: "12/11",
        activityType: "Bài tập tình huống nghề",
        reflection:
          "Sau khi về hỏi mẹ chi phí đi lại, ăn ở tại thành phố và tham gia buổi cắt may sản phẩm nhỏ, em thấy mình hợp với nghề may thiết kế hơn và không cần đi xa tốn kém.",
      },
    ],
    tryRegistrations: [
      {
        activityId: "try-3",
        status: "Đã tham gia",
        reflection: "Em làm xong mẫu túi vải trước giờ và được cô hướng dẫn khen đường cắt gọn.",
      },
    ],
    chatMessages: [
      {
        id: "m-c-1",
        sender: "student",
        text: "Mấy bạn rủ em vào trường tư ở thành phố, em chưa hỏi học phí nhưng chắc là được.",
        createdAt: "02/11 · 20:05",
      },
      {
        id: "m-c-2",
        sender: "ai",
        text: "Em nhắc đến cụm 'chưa hỏi nhưng chắc là được' về trường tư ở thành phố. Để đối chiếu với tiêu chí 'Chi phí vừa phải' và 'Gần nhà' của gia đình, em định kiểm tra thông tin nào trước tiên?",
        createdAt: "02/11 · 20:05",
        reviewId: "rev-c-1",
      },
    ],
    commitment: {
      studentDisplayName: "HS C",
      className: "9A1",
      chosenPathwayId: "path-nghe",
      chosenOptionLabel: "Trung cấp nghề May thiết kế kết hợp học văn hóa THPT",
      reasonInOwnWords:
        "Sau khi tìm hiểu chi phí cùng mẹ và thử cắt may thực tế, em chọn học Trung cấp may thiết kế kết hợp văn hóa để vừa hợp sở thích, gần mẹ, vừa tiết kiệm cho gia đình.",
      deadlineDate: "2026-12-08",
      actionPlan: [
        { id: "act-c-1", text: "Cùng mẹ xem lịch tư vấn tuyển sinh hệ Trung cấp kết hợp văn hóa", done: true },
        { id: "act-c-2", text: "Luyện thêm vẽ phác thảo và kĩ năng cắt may cơ bản cuối tuần", done: true },
      ],
      studentConfirmedAt: "15/11/2026 · 18:20",
      parentConfirmedAt: "16/11/2026 · 09:15",
    },
    behaviorCounters: {
      optionChangesCount: 1,
      addedAfterLockCount: 0,
      abandonedLockCount: 0,
      hesitantPhrasesCount: 1,
      sensitiveAlert: false,
      customNotes: ["Từ chỗ tin theo lời bạn ('chắc là được'), em đã chủ động kiểm chứng điều kiện tài chính với mẹ."],
    },
    rubric: createDefaultRubric(
      ["Đang hình thành", "Hạn chế", "Hạn chế", "Hạn chế", "Hạn chế"],
      ["Khá rõ nét", "Vững vàng", "Vững vàng", "Vững vàng", "Khá rõ nét"],
      "Phụ huynh đồng thuận cao sau buổi đối thoại rõ về chi phí và lộ trình văn hóa song song."
    ),
  };

  const hsD: StudentProfileData = {
    id: "HS D",
    className: "9A1",
    isFocusGroup: false,
    currentStep: "CHỐT",
    hasLockedChoice: true,
    shareWithParent: true,
    storyTag: "Hồ sơ minh họa chi tiết",
    teacherAbilityNote:
      "Em có học lực khá đều các môn, chăm chỉ và đặt mục tiêu cao. Tuy nhiên em thường mất nhiều thời gian so sánh giữa các trường tương đương nhau.",
    studentAbilityNote:
      "Em học khá môn Ngữ văn và Tiếng Anh, thích các hoạt động câu lạc bộ học thuật.",
    selectedHollandAnswers: ["h-i-1", "h-s-1"],
    conditions: {
      travelDistance: "Đi lại thuận tiện bằng xe buýt hoặc xe đạp điện.",
      familyFinance: "Gia đình đủ điều kiện hỗ trợ học hết 3 năm THPT.",
      earlyIndependence: "Chưa cần đi làm sớm, ưu tiên môi trường phát triển kĩ năng mềm.",
      healthNote: "Tốt.",
    },
    consideredOptionIds: ["path-thpt"],
    criteria: ["Vừa sức học của em", "Gần nhà, đi lại thuận tiện", "Đúng việc em thích và làm được"],
    filterMatrix: {
      "path-thpt": {
        "Vừa sức học của em": "Đáp ứng",
        "Gần nhà, đi lại thuận tiện": "Đáp ứng",
        "Đúng việc em thích và làm được": "Đáp ứng",
      },
    },
    journal: [
      {
        id: "j-d-1",
        date: "08/11",
        activityType: "Suy nghĩ cá nhân",
        reflection:
          "Em phân vân mãi giữa hai trường THPT cùng khu vực. Em sợ chọn trường này xong lại thấy trường kia tốt hơn.",
      },
      {
        id: "j-d-2",
        date: "16/11",
        activityType: "Đối chiếu Bộ lọc Đủ tốt",
        reflection:
          "Viết ra bảng tiêu chí rồi mới thấy trường kia em thích chỉ vì bạn thân học ở đó, còn trường gần nhà đáp ứng đủ cả 3 tiêu chí của riêng em.",
      },
    ],
    tryRegistrations: [],
    chatMessages: [
      {
        id: "m-d-1",
        sender: "student",
        text: "Em sợ chọn trường này xong lại thấy trường kia tốt hơn.",
        createdAt: "08/11 · 21:00",
      },
      {
        id: "m-d-2",
        sender: "ai",
        text: "Cảm giác lo lắng khi phải chọn giữa hai lựa chọn gần giống nhau rất dễ gặp. Nếu đặt riêng bạn bè sang một bên và chỉ nhìn vào các tiêu chí em đã tự viết, trường nào đang đáp ứng đủ tốt cho em?",
        createdAt: "08/11 · 21:00",
        reviewId: "rev-d-1",
      },
    ],
    commitment: {
      studentDisplayName: "HS D",
      className: "9A1",
      chosenPathwayId: "path-thpt",
      chosenOptionLabel: "THPT Công lập (trường gần nhà theo tiêu chí tự đặt)",
      reasonInOwnWords:
        "Viết ra bảng lọc giúp em nhận ra mình phân vân vì chạy theo bạn thân. Trường gần nhà đáp ứng đủ tiêu chí sức học, đi lại và thời gian tự học của em.",
      deadlineDate: "2026-12-01",
      actionPlan: [
        { id: "act-d-1", text: "Lập lịch ôn tập 3 môn thi lớp 10 theo từng tuần", done: true },
        { id: "act-d-2", text: "Hoàn thành phiếu xác nhận với bố mẹ trước hạn", done: true },
      ],
      studentConfirmedAt: "17/11/2026 · 16:40",
    },
    behaviorCounters: {
      optionChangesCount: 3,
      addedAfterLockCount: 0,
      abandonedLockCount: 1,
      hesitantPhrasesCount: 2,
      sensitiveAlert: false,
      customNotes: ["Từng đổi ý nhiều lần giữa 2 phương án THPT, đã ổn định sau bước LỌC."],
    },
    rubric: createDefaultRubric(
      ["Khá rõ nét", "Khá rõ nét", "Hạn chế", "Hạn chế", "Đang hình thành"],
      ["Vững vàng", "Vững vàng", "Vững vàng", "Vững vàng", "Khá rõ nét"],
      "Em nhận ra rõ nguyên nhân do dự của mình và chốt trước hạn tự đặt."
    ),
  };

  // Remaining 41 students (HS 05 .. HS 45) to complete the 45-student class
  const steps: JourneyStep[] = ["THU", "LỌC", "THỬ", "CHỐT", "CAM KẾT"];
  const remaining: StudentProfileData[] = [];

  for (let i = 5; i <= 45; i++) {
    const code = `HS ${i < 10 ? `0${i}` : i}`;
    const step = steps[i % steps.length];
    const isFocus = i % 5 === 0 || i === 7 || i === 12;
    const locked = step === "CAM KẾT" || (step === "CHỐT" && i % 2 === 0);
    const hasHesitant = (isFocus && !locked) || i === 8 || i === 17;
    const sensitive = i === 12; // 1 sample sensitive case for teacher demo

    const beforeLevels: QualitativeLevel[] = isFocus
      ? ["Hạn chế", "Hạn chế", "Hạn chế", "Hạn chế", "Hạn chế"]
      : ["Đang hình thành", "Đang hình thành", "Đang hình thành", "Hạn chế", "Đang hình thành"];
    const afterLevels: QualitativeLevel[] = locked
      ? ["Khá rõ nét", "Vững vàng", "Khá rõ nét", "Vững vàng", "Khá rõ nét"]
      : ["Đang hình thành", "Khá rõ nét", "Đang hình thành", "Đang hình thành", "Đang hình thành"];

    remaining.push({
      id: code,
      className: "9A1",
      isFocusGroup: isFocus,
      currentStep: step,
      hasLockedChoice: locked,
      shareWithParent: i % 3 !== 0,
      teacherAbilityNote: isFocus
        ? "Em có khả năng thực hành ổn định, cần không gian trải nghiệm thực tế và giảm áp lực ghi nhớ lí thuyết."
        : "Em tiếp thu đều các môn, đang từng bước rà soát tiêu chí phù hợp với điều kiện gia đình.",
      studentAbilityNote: "Em đang tiếp tục cập nhật nhận xét về sở thích và điểm mạnh của bản thân.",
      selectedHollandAnswers: [i % 2 === 0 ? "h-r-1" : "h-s-1"],
      conditions: {
        travelDistance: "Ưu tiên di chuyển thuận tiện trong khu vực.",
        familyFinance: "Mức chi phí phù hợp thu nhập gia đình.",
        earlyIndependence: isFocus ? "Cân nhắc hướng đi sớm có kĩ năng thực hành." : "Chưa vội đi làm ngay.",
        healthNote: "Bình thường.",
      },
      consideredOptionIds: locked ? [isFocus ? "path-nghe" : "path-thpt"] : ["path-thpt", "path-nghe"],
      criteria: ["Vừa sức học của em", "Gần nhà, đi lại thuận tiện"],
      filterMatrix: {},
      journal: sensitive
        ? [
            {
              id: `j-${i}-1`,
              date: "18/11",
              activityType: "Suy nghĩ cá nhân",
              reflection: "Ở nhà bố mẹ hay la mắng mỗi lần nhắc chuyện chọn trường, em cảm thấy áp lực quá và nhiều lúc chỉ muốn bỏ học.",
            },
          ]
        : [],
      tryRegistrations: [],
      chatMessages: [],
      commitment: {
        studentDisplayName: code,
        className: "9A1",
        chosenPathwayId: locked ? (isFocus ? "path-nghe" : "path-thpt") : "",
        chosenOptionLabel: locked
          ? isFocus
            ? "Trung cấp nghề (kết hợp học văn hóa THPT)"
            : "THPT Công lập / Tư thục"
          : "",
        reasonInOwnWords: locked ? "Phù hợp với sức học và điều kiện đi lại của gia đình." : "",
        deadlineDate: "2026-12-12",
        actionPlan: [
          { id: `act-${i}-1`, text: "Hoàn thành phiếu tìm hiểu lộ trình sau THCS", done: locked },
        ],
        studentConfirmedAt: locked ? "18/11/2026 · 19:00" : undefined,
      },
      behaviorCounters: {
        optionChangesCount: hasHesitant ? 3 : 0,
        addedAfterLockCount: i === 17 ? 1 : 0,
        abandonedLockCount: hasHesitant ? 1 : 0,
        hesitantPhrasesCount: hasHesitant ? 2 : 0,
        sensitiveAlert: sensitive,
        customNotes: sensitive
          ? ["Cần giáo viên chủ nhiệm gặp gỡ lắng nghe trực tiếp về áp lực tâm lí từ gia đình."]
          : hasHesitant
          ? ["Em đã đổi nguyện vọng nhiều lần trong tháng này và còn phân vân trước hạn chốt."]
          : [],
      },
      rubric: createDefaultRubric(
        beforeLevels,
        afterLevels,
        locked ? "Đã hình thành khung tiêu chí rõ ràng." : "Đang tiếp tục theo dõi ở bước hiện tại."
      ),
    });
  }

  return [hsA, hsB, hsC, hsD, ...remaining];
}

const INITIAL_MEETINGS: MeetingRecord[] = [
  {
    id: "meet-1",
    studentId: "HS B",
    dateTime: "20/11/2026 · 15:30",
    locationOrChannel: "Phòng tư vấn trường THCS",
    participants: "GVCN lớp 9A1 · Phụ huynh HS B · HS B",
    parentInvited: true,
    parentAcknowledged: true,
    summaryPoints:
      "Ba bên cùng xem nhận xét năng lực thực hành của em và kết quả sau buổi tham quan xưởng nghề điện. Phụ huynh giải tỏa được nỗi lo 'học nghề là hết đường học lên'.",
    agreedChoice: "Đăng kí Trung cấp nghề Điện (kết hợp văn hóa), định hướng liên thông Cao đẳng.",
    nextNotes: "Gia đình chuẩn bị hồ sơ học bạ THCS vào đầu học kì II.",
  },
  {
    id: "meet-2",
    studentId: "HS A",
    dateTime: "25/11/2026 · 16:00",
    locationOrChannel: "Phòng Hội đồng (dự kiến)",
    participants: "GVCN lớp 9A1 · Phụ huynh HS A · HS A",
    parentInvited: true,
    parentAcknowledged: false,
    summaryPoints: "",
    agreedChoice: "",
    nextNotes: "Chờ HS A tham gia buổi tham quan xưởng ngày 28/11 rồi trao đổi cùng gia đình.",
  },
];

export const INITIAL_STATE: AppState = {
  students: createSampleStudents(),
  pathways: INITIAL_PATHWAYS,
  tryActivities: INITIAL_TRY_ACTIVITIES,
  aiQueue: [
    {
      id: "rev-a-1",
      studentId: "HS A",
      createdAt: "15/11 · 19:30",
      triggerReason: "Từ khóa phân vân ('trượt thì tính tiếp')",
      studentInput: "Em vẫn muốn thi lớp 10 thử, trượt thì tính tiếp.",
      aiReply:
        "Mình hiểu cảm giác muốn thử sức cho yên tâm của em. Nếu đặt cạnh tiêu chí 'Vừa sức học của em' và 'Gần nhà', em thấy mình đã tìm hiểu đủ thông tin về cả phương án THPT lẫn Trung cấp nghề chưa?",
      nhayCam: false,
      dauHieu: "Em có xu hướng trì hoãn việc tìm hiểu phương án nghề bằng câu 'trượt thì tính tiếp'.",
      status: "Chờ duyệt",
      visibleToStudent: true,
    },
    {
      id: "rev-12-1",
      studentId: "HS 12",
      createdAt: "18/11 · 20:15",
      triggerReason: "Nhật ký có dấu hiệu căng thẳng",
      studentInput:
        "Ở nhà bố mẹ hay la mắng mỗi lần nhắc chuyện chọn trường, em cảm thấy áp lực quá và nhiều lúc chỉ muốn bỏ học.",
      aiReply:
        "Mình nghe thấy em đang trải qua nhiều áp lực và cảm xúc nặng nề lúc này. Em hãy nói chuyện trực tiếp với thầy cô chủ nhiệm để được lắng nghe và đồng hành kịp thời nhé?",
      nhayCam: true,
      dauHieu: "Học sinh nhắc đến bị la mắng kéo dài và có ý nghĩ muốn bỏ học.",
      status: "Chờ duyệt",
      visibleToStudent: true,
    },
    {
      id: "rev-b-1",
      studentId: "HS B",
      createdAt: "14/11 · 17:15",
      triggerReason: "Nhật ký sau trải nghiệm THỬ",
      studentInput: "Hôm nay đi tham quan xưởng nghề điện về em thấy hợp quá, học mà không sợ!",
      aiReply:
        "Thật vui khi em có trải nghiệm thực tế rõ ràng như vậy tại xưởng. Ba tiêu chí 'gần nhà', 'đi làm sớm' và 'vẫn có đường học lên' em đặt ra có đang khớp với hướng đi này không?",
      teacherEncouragement: "Thầy rất mừng khi thấy em tự tin hơn sau buổi tham quan xưởng!",
      nhayCam: false,
      dauHieu: "",
      status: "Đã giữ nguyên",
      visibleToStudent: true,
      reviewedAt: "14/11 · 19:00",
    },
  ],
  meetings: INITIAL_MEETINGS,
  requireTeacherPreApproval: false,
  consentAccepted: false,
};
