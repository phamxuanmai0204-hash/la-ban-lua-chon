import type {
  AIMessage,
  AssessmentLevelMap,
  Experience,
  JourneyStep,
  RubricCriterionKey,
  Student,
  StudentSummary,
} from "../types";

const LEVEL_RANK: Record<string, number> = {
  "Hạn chế": 1,
  "Đang hình thành": 2,
  "Khá rõ nét": 3,
  "Vững vàng": 4,
};

const LEVEL_LABELS: Record<RubricCriterionKey, string> = {
  understandingSelf: "Hiểu bản thân",
  understandingPathways: "Hiểu các lộ trình",
  narrowingOptions: "Thu hẹp phương án",
  decidingOnTime: "Quyết định đúng hạn",
  committingAndActing: "Cam kết & hành động",
};

function joinNonEmpty(items: (string | undefined | null)[], fallback: string): string {
  const cleaned = items
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned.join("; ") : fallback;
}

function truncate(text: string, max = 220): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

function describeAssessment(levels: AssessmentLevelMap): string {
  return (Object.keys(LEVEL_LABELS) as RubricCriterionKey[])
    .map((key) => `${LEVEL_LABELS[key]}: ${levels[key]}`)
    .join("; ");
}

function describeFluctuation(student: Student): string {
  const { signals } = student;
  const parts: string[] = [];
  if (signals.changeOptionCount > 0) {
    parts.push(`đổi phương án ${signals.changeOptionCount} lần`);
  }
  if (signals.addedAfterCommit) {
    parts.push("thêm phương án sau khi đã chốt");
  }
  if (signals.abandonedCommitStep) {
    parts.push("từng dừng lại ở bước cam kết");
  }
  if (signals.hesitancyPhrasesCount > 0) {
    parts.push(`${signals.hesitancyPhrasesCount} lần dùng từ ngữ do dự`);
  }
  if (signals.hasSensitiveAlert) {
    parts.push("có tín hiệu cảm xúc cần giáo viên lưu ý");
  }
  if (signals.recentPhrases.length > 0) {
    parts.push(
      `cụm từ gần đây: ${signals.recentPhrases.slice(0, 4).join(", ")}`
    );
  }
  return parts.length > 0
    ? `${parts.join("; ")}.`
    : "Không ghi nhận dấu hiệu dao động rõ rệt.";
}

function readinessLevel(student: Student): string {
  const values = Object.values(student.assessment.studentSelf).filter(
    (v): v is string => typeof v === "string"
  );
  if (values.length === 0) {
    return "Chưa đủ dữ liệu tự đánh giá — cần đồng hành thêm của giáo viên và gia đình.";
  }
  const ranks = values.map((v) => LEVEL_RANK[v] ?? 2);
  const average = ranks.reduce((sum, r) => sum + r, 0) / ranks.length;
  if (average >= 3.4) {
    return "Mức độ sẵn sàng cao: em đã tự đánh giá khá vững vàng ở phần lớn năng lực ra quyết định.";
  }
  if (average >= 2.6) {
    return "Mức độ sẵn sàng khá: em nắm được các bước chính, cần thêm thời gian củng cố ở một vài năng lực.";
  }
  if (average >= 1.8) {
    return "Đang hình thành: em đã có nhận thức ban đầu, nên tiếp tục đồng hành và nhắc nhở nhẹ nhàng.";
  }
  return "Còn nhiều điểm cần hỗ trợ: nên ưu tiên trao đổi trực tiếp với giáo viên và phụ huynh.";
}

export function buildStudentSummary(
  student: Student,
  aiMessages: AIMessage[],
  experiences: Experience[]
): StudentSummary {
  const now = new Date().toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const msgs = aiMessages.filter((m) => m.studentId === student.id);
  const activeOptions = student.consideredOptions.filter(
    (o) => o.status !== "Tạm gác lại"
  );
  const archivedOptions = student.consideredOptions.filter(
    (o) => o.status === "Tạm gác lại"
  );

  const criteria = student.criteria.map((c) => c.label);
  const evaluations = activeOptions.map((opt) => {
    let match = 0;
    let missing = 0;
    let unclear = 0;
    student.criteria.forEach((c) => {
      const value = opt.evaluations[c.id] || "Chưa rõ";
      if (value === "Đáp ứng") match += 1;
      else if (value === "Chưa đáp ứng") missing += 1;
      else unclear += 1;
    });
    return `${opt.title} (${opt.status}): ${match} đáp ứng, ${missing} chưa đáp ứng, ${unclear} chưa rõ`;
  });

  const joinedExperiences = experiences
    .filter((exp) => student.joinedExperienceIds.includes(exp.id))
    .map((exp) => `${exp.title} – ${exp.activityType}`);

  const tryJournalEntries = student.journal.filter(
    (entry) => (entry.step || "THỬ") === "THỬ"
  );
  const latestTryReflection =
    student.scenarioReflections?.[0]?.reflection ||
    tryJournalEntries[0]?.content ||
    "";

  const actionPlan = student.commitment.actionPlan.map((task) => {
    const due = task.dueDate ? ` (hạn ${task.dueDate})` : "";
    const status = task.done ? " – đã xong" : "";
    return `${task.title}${due}${status}`;
  });

  const confirmations = joinNonEmpty(
    [
      student.commitment.studentConfirmedAt
        ? `Học sinh xác nhận: ${student.commitment.studentConfirmedAt}`
        : "Học sinh chưa xác nhận",
      student.commitment.parentConfirmedAt
        ? `Phụ huynh xác nhận: ${student.commitment.parentConfirmedAt}`
        : "Phụ huynh chưa xác nhận",
      student.commitment.teacherConfirmedAt
        ? `Giáo viên xác nhận: ${student.commitment.teacherConfirmedAt}`
        : "Giáo viên chưa xác nhận",
    ],
    "Chưa có thông tin xác nhận."
  );

  const sentToParentAt = student.shareWithParent ? now : null;

  return {
    generatedAt: now,
    sentToTeacherAt: now,
    sentToParentAt,
    identity: {
      fullName: student.fullName,
      className: "Lớp 9",
      parentContact: `Phụ huynh của ${student.fullName} (liên kết qua mã PIN)`,
      teacherContact: "Giáo viên phụ trách Lớp 9",
      completedAt: now,
    },
    selfProfile: {
      strengths: joinNonEmpty(
        [student.profile.abilitiesStudentSelf],
        "Em chưa ghi phần năng lực/điểm mạnh."
      ),
      teacherNote: joinNonEmpty(
        [student.profile.abilitiesTeacherNote],
        "Giáo viên chưa ghi lưu ý."
      ),
      holland: joinNonEmpty(
        [student.profile.hollandSummaryText],
        "Chưa có kết quả Holland."
      ),
      conditions: joinNonEmpty(
        [
          student.profile.conditions.commuteDistance
            ? `Đi lại: ${student.profile.conditions.commuteDistance}`
            : "",
          student.profile.conditions.familyFinance
            ? `Tài chính gia đình: ${student.profile.conditions.familyFinance}`
            : "",
          student.profile.conditions.earlyIndependence
            ? `Tự lập sớm: ${student.profile.conditions.earlyIndependence}`
            : "",
          student.profile.conditions.healthNote
            ? `Sức khỏe: ${student.profile.conditions.healthNote}`
            : "",
        ],
        "Chưa ghi điều kiện gia đình/đi lại/tự lập."
      ),
      fluctuation: describeFluctuation(student),
    },
    steps: {
      thu: joinNonEmpty(
        [
          activeOptions.length > 0
            ? `Đang cân nhắc: ${activeOptions.map((o) => o.title).join(", ")}`
            : "",
          archivedOptions.length > 0
            ? `Đã xem và tạm gác: ${archivedOptions.map((o) => o.title).join(", ")}`
            : "",
        ],
        "Chưa ghi nhận lộ trình/trường đã xem."
      ),
      loc: joinNonEmpty(
        [
          criteria.length > 0
            ? `Tiêu chí "đủ tốt": ${criteria.join(", ")}`
            : "",
          evaluations.length > 0
            ? evaluations.join(" | ")
            : "",
        ],
        "Chưa đặt tiêu chí đủ tốt."
      ),
      thuTry: joinNonEmpty(
        [
          joinedExperiences.length > 0
            ? `Hoạt động đã tham gia: ${joinedExperiences.join(", ")}`
            : "",
          tryJournalEntries.length > 0
            ? `Đã ghi ${tryJournalEntries.length} nhật ký ở bước THỬ`
            : "",
          latestTryReflection
            ? `Cảm nhận cốt lõi: ${truncate(latestTryReflection)}`
            : "",
        ],
        "Chưa ghi nhận hoạt động trải nghiệm."
      ),
      chot: joinNonEmpty(
        [
          student.commitment.chosenOption
            ? `Lựa chọn cuối: ${student.commitment.chosenOption}`
            : "",
          student.commitment.deadlineDate
            ? `Hạn chốt: ${student.commitment.deadlineDate}`
            : "",
          student.commitment.reasonInOwnWords
            ? `Lý do bằng lời của em: ${truncate(student.commitment.reasonInOwnWords)}`
            : "",
        ],
        "Chưa chốt phương án."
      ),
      camKet: joinNonEmpty(
        [
          actionPlan.length > 0
            ? `Kế hoạch ngắn hạn: ${actionPlan.join("; ")}`
            : "Chưa có việc nào trong kế hoạch ngắn hạn",
          confirmations,
        ],
        "Chưa có kế hoạch cam kết."
      ),
    },
    aiInteraction: joinNonEmpty(
      [
        msgs.length > 0
          ? `Có ${msgs.length} lượt trao đổi với trợ lí`
          : "Chưa có lượt trao đổi nào với trợ lí",
        student.signals.changeOptionCount > 0
          ? `Đổi ý ${student.signals.changeOptionCount} lần`
          : "",
        student.signals.hesitancyPhrasesCount > 0
          ? `Xuất hiện ${student.signals.hesitancyPhrasesCount} cụm từ do dự`
          : "",
        msgs[0]?.studentText
          ? `Nội dung gần nhất: ${truncate(msgs[0].studentText, 160)}`
          : "",
        student.criteria.length > 0
          ? "Em đã tự đối chiếu phương án theo tiêu chí cá nhân ở bước LỌC"
          : "",
      ],
      "Chưa ghi nhận tương tác AI."
    ),
    readiness: `${readinessLevel(student)} Tự đánh giá hiện tại — ${describeAssessment(
      student.assessment.studentSelf
    )}.`,
    sendStatus: joinNonEmpty(
      [
        `Đã gửi tới tài khoản giáo viên phụ trách lúc ${now}`,
        sentToParentAt
          ? `Đã gửi tới tài khoản phụ huynh lúc ${sentToParentAt}`
          : "Chưa gửi phụ huynh vì em đang tắt chia sẻ hồ sơ",
      ],
      "Chưa gửi."
    ),
  };
}

export function allStepsCompleted(student: Student): boolean {
  const completed = new Set(student.completedSteps || []);
  const coreSteps = ["THU", "LỌC", "THỬ", "CHỐT"].every((step) =>
    completed.has(step as JourneyStep)
  );
  return coreSteps && Boolean(student.commitment.studentConfirmedAt);
}
