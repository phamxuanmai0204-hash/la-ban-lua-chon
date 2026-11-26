import type {
  HollandGroupId,
  InterestQuizAnalysis,
  InterestQuizAnswer,
  InterestQuizQuestion,
  InterestQuizResult,
  InterestQuizScores,
  MbtiLetter,
} from "../types";
import { HOLLAND_GROUPS } from "./hollandGroups";

export const INTEREST_QUIZ_QUESTIONS: InterestQuizQuestion[] = [
  {
    id: "iq-1",
    prompt:
      "Khi được chọn một hoạt động ngoại khóa vào cuối tuần, em hào hứng hơn với việc nào?",
    options: [
      {
        key: "A",
        text: "Tự tay lắp ráp, sửa chữa đồ vật hoặc thực hành làm sản phẩm thủ công",
        tag: "R",
      },
      {
        key: "B",
        text: "Thảo luận, tìm hiểu nguyên nhân của một hiện tượng khoa học hay giải câu đố logic",
        tag: "I",
      },
    ],
  },
  {
    id: "iq-2",
    prompt:
      "Sau một ngày học tập ở trường có nhiều tiết học và trao đổi nhóm, em thường nạp lại năng lượng bằng cách nào?",
    options: [
      {
        key: "A",
        text: "Trò chuyện, đi chơi hoặc chia sẻ với bạn bè để thấy thoải mái hơn",
        tag: "E",
      },
      {
        key: "B",
        text: "Dành thời gian yên tĩnh ở một mình, nghe nhạc hoặc làm việc riêng",
        tag: "I_mbti",
      },
    ],
  },
  {
    id: "iq-3",
    prompt:
      "Nếu lớp tổ chức một dự án truyền thông hoặc ngày hội, em muốn đảm nhận vai trò nào nhất?",
    options: [
      {
        key: "A",
        text: "Thiết kế poster, trang trí không gian, viết kịch bản hoặc biểu diễn tiết mục",
        tag: "A",
      },
      {
        key: "B",
        text: "Đứng ra hướng dẫn, kết nối các bạn và hỗ trợ mọi người phối hợp nhịp nhàng",
        tag: "S_holland",
      },
    ],
  },
  {
    id: "iq-4",
    prompt:
      "Khi tiếp cận một bài học mới hoặc một hướng đi sau lớp 9, em thường chú ý điều gì trước?",
    options: [
      {
        key: "A",
        text: "Các thông tin cụ thể, rõ ràng như môn học, lịch học, điểm chuẩn và việc làm thực tế",
        tag: "S_mbti",
      },
      {
        key: "B",
        text: "Ý nghĩa lâu dài, cơ hội phát triển mới mẻ và những khả năng có thể mở ra trong tương lai",
        tag: "N",
      },
    ],
  },
  {
    id: "iq-5",
    prompt:
      "Trong một nhóm học tập chuẩn bị thuyết trình, em thường tự nhiên làm việc gì?",
    options: [
      {
        key: "A",
        text: "Đề xuất kế hoạch, phân công nhiệm vụ và thúc đẩy cả nhóm hoàn thành đúng mục tiêu",
        tag: "E_holland",
      },
      {
        key: "B",
        text: "Tổng hợp tài liệu, kiểm tra lỗi chính tả, sắp xếp slide và số liệu thật ngăn nắp",
        tag: "C",
      },
    ],
  },
  {
    id: "iq-6",
    prompt:
      "Khi đứng trước hai lựa chọn khó phân xử (ví dụ chọn trường hay chọn tổ hợp môn), em dựa vào điều gì nhiều hơn?",
    options: [
      {
        key: "A",
        text: "Phân tích ưu – nhược điểm một cách khách quan, hợp lý và có căn cứ rõ ràng",
        tag: "T",
      },
      {
        key: "B",
        text: "Cân nhắc cảm xúc của bản thân, sự thoải mái và sự hòa hợp với gia đình, bạn bè",
        tag: "F",
      },
    ],
  },
  {
    id: "iq-7",
    prompt:
      "Trong các tiết thực hành hoặc trải nghiệm thực tế, kiểu hoạt động nào khiến em thấy cuốn hút?",
    options: [
      {
        key: "A",
        text: "Vận hành máy móc, dụng cụ kỹ thuật hoặc làm việc ngoài trời",
        tag: "R",
      },
      {
        key: "B",
        text: "Vẽ phác thảo, phối màu, sáng tạo ý tưởng mới không bị gò bó theo khuôn mẫu",
        tag: "A",
      },
    ],
  },
  {
    id: "iq-8",
    prompt:
      "Khi chuẩn bị cho kỳ thi hoặc hoàn thành một bài tập lớn, phong cách làm việc của em là gì?",
    options: [
      {
        key: "A",
        text: "Lập thời gian biểu từ sớm, chia nhỏ từng bước và làm xong trước hạn mới yên tâm",
        tag: "J",
      },
      {
        key: "B",
        text: "Thích làm việc linh hoạt theo cảm hứng, đến sát hạn thường tập trung bứt tốc rất nhanh",
        tag: "P",
      },
    ],
  },
  {
    id: "iq-9",
    prompt:
      "Khi gặp một vấn đề hóc búa trong học tập hoặc đời sống, phản ứng đầu tiên của em là gì?",
    options: [
      {
        key: "A",
        text: "Đào sâu suy nghĩ, tra cứu tài liệu và tự tìm ra quy luật hoạt động của nó",
        tag: "I",
      },
      {
        key: "B",
        text: "Lắng nghe, hỏi han và tìm cách giúp đỡ những người xung quanh cùng vượt qua",
        tag: "S_holland",
      },
    ],
  },
  {
    id: "iq-10",
    prompt:
      "Trong một buổi thảo luận lớp đông người, em thường có xu hướng như thế nào?",
    options: [
      {
        key: "A",
        text: "Sẵn sàng phát biểu ý kiến ngay khi nảy ra suy nghĩ và thích không khí sôi nổi",
        tag: "E",
      },
      {
        key: "B",
        text: "Quan sát, suy nghĩ kỹ trong đầu trước rồi mới chia sẻ khi thật sự cần thiết",
        tag: "I_mbti",
      },
    ],
  },
  {
    id: "iq-11",
    prompt:
      "Nếu được giao phụ trách một gian hàng hội chợ của lớp, em thích phần việc nào hơn?",
    options: [
      {
        key: "A",
        text: "Trực tiếp mời chào, thuyết phục khách và điều phối các bạn bán hàng",
        tag: "E_holland",
      },
      {
        key: "B",
        text: "Ghi chép thu chi, kiểm đếm hàng hóa cẩn thận từng món để không sai sót",
        tag: "C",
      },
    ],
  },
  {
    id: "iq-12",
    prompt:
      "Khi đọc hướng dẫn của một hoạt động trải nghiệm mới, em thích kiểu hướng dẫn nào?",
    options: [
      {
        key: "A",
        text: "Chỉ rõ từng bước thực hiện cụ thể, làm theo đúng trình tự là ra kết quả",
        tag: "S_mbti",
      },
      {
        key: "B",
        text: "Nêu mục tiêu chung để em tự hình dung cách làm mới và sáng tạo theo ý mình",
        tag: "N",
      },
    ],
  },
  {
    id: "iq-13",
    prompt:
      "Kiểu môi trường học tập hoặc làm việc nào khiến em cảm thấy dễ phát huy khả năng nhất?",
    options: [
      {
        key: "A",
        text: "Phòng thí nghiệm, thư viện hoặc nơi yên tĩnh để nghiên cứu, phân tích sâu",
        tag: "I",
      },
      {
        key: "B",
        text: "Xưởng thực hành, phòng kỹ thuật hoặc công việc gắn với thao tác thực tế rõ ràng",
        tag: "R",
      },
    ],
  },
  {
    id: "iq-14",
    prompt:
      "Khi một người bạn thân đang băn khoăn chưa biết chọn hướng đi nào sau THCS, em thường làm gì?",
    options: [
      {
        key: "A",
        text: "Giúp bạn liệt kê các tiêu chí thực tế để so sánh xem phương án nào hợp lý nhất",
        tag: "T",
      },
      {
        key: "B",
        text: "Lắng nghe, động viên để bạn bớt lo lắng và cảm thấy được thấu hiểu trước tiên",
        tag: "F",
      },
    ],
  },
  {
    id: "iq-15",
    prompt:
      "Khi tham gia câu lạc bộ của trường, em thấy mình hợp với hoạt động nào hơn?",
    options: [
      {
        key: "A",
        text: "Sáng tác nội dung, thiết kế ấn phẩm, nhiếp ảnh hoặc biểu diễn nghệ thuật",
        tag: "A",
      },
      {
        key: "B",
        text: "Tổ chức sự kiện, kêu gọi tài trợ hoặc làm trưởng nhóm điều hành hoạt động",
        tag: "E_holland",
      },
    ],
  },
  {
    id: "iq-16",
    prompt:
      "Khi lên kế hoạch cho một tuần học tập và ôn luyện, em cảm thấy thoải mái hơn khi nào?",
    options: [
      {
        key: "A",
        text: "Mọi khung giờ được sắp xếp rõ ràng, cố định để dễ theo dõi và thực hiện",
        tag: "J",
      },
      {
        key: "B",
        text: "Để lịch trình mở và linh hoạt thay đổi tùy theo tình huống phát sinh trong ngày",
        tag: "P",
      },
    ],
  },
  {
    id: "iq-17",
    prompt:
      "Giữa hai công việc hỗ trợ lớp học sau đây, em sẵn sàng nhận việc nào hơn?",
    options: [
      {
        key: "A",
        text: "Kèm cặp, giải thích bài cho các bạn học chậm hơn hoặc tư vấn, lắng nghe bạn bè",
        tag: "S_holland",
      },
      {
        key: "B",
        text: "Nhập dữ liệu, lập bảng theo dõi điểm danh, sắp xếp hồ sơ lớp theo trật tự",
        tag: "C",
      },
    ],
  },
  {
    id: "iq-18",
    prompt:
      "Khi tìm hiểu về một ngành nghề hoặc một ngôi trường cấp 3, điều gì thu hút em hơn?",
    options: [
      {
        key: "A",
        text: "Cơ sở vật chất, lộ trình học tập cụ thể và các môn học chính xác của trường đó",
        tag: "S_mbti",
      },
      {
        key: "B",
        text: "Bầu không khí năng động, những trải nghiệm mới mẻ và định hướng tương lai rộng mở",
        tag: "N",
      },
    ],
  },
  {
    id: "iq-19",
    prompt: "Khi giải quyết một nhiệm vụ thực tế, em tin tưởng vào điều gì hơn?",
    options: [
      {
        key: "A",
        text: "Sự chính xác, tuân thủ quy trình và kiểm tra kỹ từng chi tiết nhỏ",
        tag: "C",
      },
      {
        key: "B",
        text: "Khả năng tự tay thử nghiệm, thao tác trực tiếp và sửa lỗi ngay trên vật thật",
        tag: "R",
      },
    ],
  },
  {
    id: "iq-20",
    prompt:
      "Khi kế hoạch học tập hoặc dự định ban đầu của em bất ngờ thay đổi, em phản ứng thế nào?",
    options: [
      {
        key: "A",
        text: "Thấy hơi bối rối vì lệch kế hoạch, muốn nhanh chóng sắp xếp lại lịch trình mới",
        tag: "J",
      },
      {
        key: "B",
        text: "Thích nghi khá nhanh, xem đó là cơ hội để thử một cách tiếp cận khác thú vị hơn",
        tag: "P",
      },
    ],
  },
];

const HOLLAND_TAG_TO_GROUP: Partial<Record<InterestQuizAnswer["tag"], HollandGroupId>> = {
  R: "ki_thuat",
  I: "nghien_cuu",
  A: "nghe_thuat",
  S_holland: "xa_hoi",
  E_holland: "quan_li",
  C: "nghiep_vu",
};

const MBTI_TAG_TO_LETTER: Partial<Record<InterestQuizAnswer["tag"], MbtiLetter>> = {
  E: "E",
  I_mbti: "I",
  S_mbti: "S",
  N: "N",
  T: "T",
  F: "F",
  J: "J",
  P: "P",
};

const HOLLAND_GROUP_ORDER: HollandGroupId[] = [
  "ki_thuat",
  "nghien_cuu",
  "nghe_thuat",
  "xa_hoi",
  "quan_li",
  "nghiep_vu",
];

export interface InterestQuizEvaluation {
  scores: InterestQuizScores;
  hollandTop: HollandGroupId[];
  mbtiType: string;
  mbtiDetail: InterestQuizResult["mbtiDetail"];
  summaryText: string;
}

export function evaluateInterestQuiz(
  answers: InterestQuizAnswer[]
): InterestQuizEvaluation {
  const holland = HOLLAND_GROUP_ORDER.reduce(
    (acc, id) => ({ ...acc, [id]: 0 }),
    {} as Record<HollandGroupId, number>
  );
  const mbti = ["E", "I", "S", "N", "T", "F", "J", "P"].reduce(
    (acc, letter) => ({ ...acc, [letter]: 0 }),
    {} as Record<MbtiLetter, number>
  );

  for (const answer of answers) {
    const hollandGroup = HOLLAND_TAG_TO_GROUP[answer.tag];
    if (hollandGroup) holland[hollandGroup] += 1;

    const mbtiLetter = MBTI_TAG_TO_LETTER[answer.tag];
    if (mbtiLetter) mbti[mbtiLetter] += 1;
  }

  const hollandTop = [...HOLLAND_GROUP_ORDER]
    .sort(
      (a, b) =>
        holland[b] - holland[a] ||
        HOLLAND_GROUP_ORDER.indexOf(a) - HOLLAND_GROUP_ORDER.indexOf(b)
    )
    .filter((id) => holland[id] > 0)
    .slice(0, 3);

  const socialSignal = holland.xa_hoi + holland.quan_li;
  const solitarySignal = holland.nghien_cuu + holland.ki_thuat;
  const thinkingSignal =
    holland.nghien_cuu + holland.ki_thuat + holland.nghiep_vu;
  const feelingSignal =
    holland.xa_hoi + holland.nghe_thuat + holland.quan_li;

  const ei = mbti.E === mbti.I ? (socialSignal >= solitarySignal ? "E" : "I") : mbti.E > mbti.I ? "E" : "I";
  const sn = mbti.S > mbti.N ? "S" : "N";
  const tf = mbti.T === mbti.F ? (thinkingSignal >= feelingSignal ? "T" : "F") : mbti.T > mbti.F ? "T" : "F";
  const jp = mbti.J > mbti.P ? "J" : "P";

  const mbtiDetail = { EI: ei, SN: sn, TF: tf, JP: jp } as InterestQuizResult["mbtiDetail"];
  const mbtiType = `${ei}${sn}${tf}${jp}`;
  const hollandSummary = hollandTop
    .map((id) => `${HOLLAND_GROUPS[id].name} (${holland[id]} điểm)`)
    .join(", ");

  return {
    scores: { holland, mbti },
    hollandTop,
    mbtiType,
    mbtiDetail,
    summaryText: `Nhóm hứng thú nổi trội: ${hollandSummary}. Xu hướng MBTI gợi ý: ${mbtiType}.`,
  };
}

const MBTI_DIMENSION_TEXT: Record<MbtiLetter, string> = {
  E: "Em có xu hướng nạp năng lượng qua trao đổi và hoạt động cùng mọi người",
  I: "Em thường quan sát, suy nghĩ kỹ trong đầu trước khi chia sẻ",
  S: "Em chú ý đến thông tin cụ thể, rõ ràng và những bước làm thực tế",
  N: "Em quan tâm đến ý nghĩa tổng thể, khả năng mới và những điều có thể mở ra",
  T: "Khi quyết định, em nghiêng về phân tích lợi hại và căn cứ khách quan",
  F: "Khi quyết định, em cân nhắc cảm xúc, sự hòa hợp và ảnh hưởng tới mọi người",
  J: "Em thoải mái hơn khi có kế hoạch rõ ràng và biết trước các bước tiếp theo",
  P: "Em thoải mái hơn khi được linh hoạt và điều chỉnh theo tình huống",
};

const HOLLAND_ENVIRONMENT_TEXT: Record<HollandGroupId, string> = {
  ki_thuat:
    "môi trường có nhiều hoạt động thực hành, xưởng kỹ thuật, câu lạc bộ robotics hoặc các tổ hợp môn có Toán, Vật lí, Công nghệ",
  nghien_cuu:
    "môi trường có thư viện, phòng thí nghiệm, các dự án nghiên cứu nhỏ và tổ hợp môn có Toán, Vật lí, Hóa học hoặc Sinh học",
  nghe_thuat:
    "môi trường ưu tiên sáng tạo như câu lạc bộ truyền thông, thiết kế, nhiếp ảnh, biểu diễn và các môn học thiên về ngôn ngữ, nghệ thuật",
  xa_hoi:
    "môi trường làm việc cùng người khác như câu lạc bộ tình nguyện, hỗ trợ học tập, hoạt động cộng đồng và các môn học gắn với giao tiếp",
  quan_li:
    "môi trường có hoạt động tổ chức sự kiện, ban cán sự lớp, câu lạc bộ khởi nghiệp hoặc dự án nhóm cần người điều phối",
  nghiep_vu:
    "môi trường đề cao sự ngăn nắp, quy trình rõ ràng như công tác thư viện, hậu cần, quản lý dữ liệu và các hoạt động cần ghi chép chính xác",
};

export function buildFallbackInterestAnalysis(
  evaluation: InterestQuizEvaluation
): InterestQuizAnalysis {
  const { mbtiDetail, mbtiType, hollandTop, scores } = evaluation;
  const topNames = hollandTop.map((id) => HOLLAND_GROUPS[id].name);
  const topDescriptions = hollandTop
    .map((id) => HOLLAND_GROUPS[id].descriptionText)
    .join(" ");
  const environments = hollandTop
    .slice(0, 2)
    .map((id) => HOLLAND_ENVIRONMENT_TEXT[id])
    .join("; ");

  return {
    personality: `${MBTI_DIMENSION_TEXT[mbtiDetail.EI]}. ${MBTI_DIMENSION_TEXT[mbtiDetail.SN]}. ${MBTI_DIMENSION_TEXT[mbtiDetail.TF]}. ${MBTI_DIMENSION_TEXT[mbtiDetail.JP]}. Tổ hợp gợi ý ${mbtiType} chỉ là một cách quan sát thói quen học tập và ra quyết định, không phải nhãn cố định về em.`,
    interests: `Các lựa chọn của em cho thấy hứng thú nổi trội ở nhóm ${topNames.join(", ")}. ${topDescriptions} Điểm số lần lượt là ${hollandTop
      .map((id) => `${HOLLAND_GROUPS[id].name}: ${scores.holland[id]}`)
      .join("; ")}. Em có thể xem đây là những hướng nên thử thêm để kiểm chứng, không phải kết luận cuối cùng.`,
    environment: `Em có thể thử tìm hiểu ${environments}. Khi bước sang lộ trình 5 bước, hãy dùng những gợi ý này để đặt câu hỏi ở bước THU, chọn tiêu chí ở bước LỌC và chọn hoạt động trải nghiệm ở bước THỬ. Điều quan trọng là em tự kiểm tra lại cảm nhận của mình sau mỗi trải nghiệm.`,
    source: "fallback",
    generatedAt: new Date().toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function buildInterestQuizResult(
  answers: InterestQuizAnswer[],
  analysis: InterestQuizAnalysis
): InterestQuizResult {
  const evaluation = evaluateInterestQuiz(answers);
  return {
    version: 1,
    completedAt: new Date().toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    answers,
    scores: evaluation.scores,
    hollandTop: evaluation.hollandTop,
    mbtiType: evaluation.mbtiType,
    mbtiDetail: evaluation.mbtiDetail,
    summaryText: evaluation.summaryText,
    analysis,
  };
}

export function hollandGroupNames(ids: HollandGroupId[]): string {
  return ids.map((id) => HOLLAND_GROUPS[id].name).join(", ");
}

const MBTI_DIMENSIONS: Record<
  keyof InterestQuizResult["mbtiDetail"],
  MbtiLetter[]
> = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"],
};

/**
 * Dữ liệu lưu trong localStorage có thể đến từ phiên bản cũ hoặc bị ghi dở.
 * Chỉ chấp nhận kết quả đầy đủ để tránh lỗi render làm trắng toàn bộ ứng dụng.
 */
export function sanitizeInterestQuiz(
  raw: unknown
): InterestQuizResult | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const record = raw as Record<string, unknown>;
  if (record.version !== 1) return undefined;
  if (
    typeof record.completedAt !== "string" ||
    typeof record.mbtiType !== "string" ||
    typeof record.summaryText !== "string" ||
    !Array.isArray(record.answers) ||
    !Array.isArray(record.hollandTop)
  ) {
    return undefined;
  }

  const hollandTop = record.hollandTop.filter(
    (id): id is HollandGroupId =>
      typeof id === "string" &&
      (HOLLAND_GROUP_ORDER as string[]).includes(id)
  );
  if (hollandTop.length === 0) return undefined;

  const scores = record.scores as Record<string, unknown> | undefined;
  const rawHollandScores = scores?.holland as
    | Record<string, unknown>
    | undefined;
  const rawMbtiScores = scores?.mbti as Record<string, unknown> | undefined;
  if (!rawHollandScores || !rawMbtiScores) return undefined;

  const detail = record.mbtiDetail as Record<string, unknown> | undefined;
  if (!detail) return undefined;
  const mbtiDetail = {} as InterestQuizResult["mbtiDetail"];
  for (const key of Object.keys(MBTI_DIMENSIONS) as (keyof InterestQuizResult["mbtiDetail"])[]) {
    const value = detail[key];
    if (typeof value !== "string" || !MBTI_DIMENSIONS[key].includes(value as MbtiLetter)) {
      return undefined;
    }
    mbtiDetail[key] = value as MbtiLetter;
  }

  const analysis = record.analysis as Record<string, unknown> | undefined;
  if (
    !analysis ||
    typeof analysis.personality !== "string" ||
    typeof analysis.interests !== "string" ||
    typeof analysis.environment !== "string"
  ) {
    return undefined;
  }

  const holland = HOLLAND_GROUP_ORDER.reduce(
    (acc, id) => ({
      ...acc,
      [id]: typeof rawHollandScores[id] === "number" ? (rawHollandScores[id] as number) : 0,
    }),
    {} as InterestQuizScores["holland"]
  );
  const mbti = (["E", "I", "S", "N", "T", "F", "J", "P"] as MbtiLetter[]).reduce(
    (acc, letter) => ({
      ...acc,
      [letter]: typeof rawMbtiScores[letter] === "number" ? (rawMbtiScores[letter] as number) : 0,
    }),
    {} as InterestQuizScores["mbti"]
  );

  return {
    version: 1,
    completedAt: record.completedAt,
    answers: record.answers as InterestQuizAnswer[],
    scores: { holland, mbti },
    hollandTop,
    mbtiType: record.mbtiType,
    mbtiDetail,
    summaryText: record.summaryText,
    analysis: {
      personality: analysis.personality,
      interests: analysis.interests,
      environment: analysis.environment,
      source: analysis.source === "ai" ? "ai" : "fallback",
      generatedAt:
        typeof analysis.generatedAt === "string"
          ? analysis.generatedAt
          : record.completedAt,
    },
  };
}

export function formatMbtiDetail(detail: InterestQuizResult["mbtiDetail"]): string {
  const labels: Record<keyof InterestQuizResult["mbtiDetail"], string> = {
    EI: "Hướng năng lượng",
    SN: "Cách tiếp nhận thông tin",
    TF: "Cách ra quyết định",
    JP: "Cách sắp xếp công việc",
  };
  return (Object.keys(labels) as (keyof typeof labels)[])
    .map((key) => `${labels[key]}: ${detail[key]}`)
    .join(" · ");
}
