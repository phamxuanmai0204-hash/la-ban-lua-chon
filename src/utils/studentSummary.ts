import { HOLLAND_GROUPS } from "../data/hollandGroups";
import { sanitizeInterestQuiz } from "../data/interestQuiz";
import { HOMEROOM_TEACHER_USERNAME } from "../services/authValidation";
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
  const interestQuiz = sanitizeInterestQuiz(student.profile.interestQuiz);
  const interestHollandGroups = interestQuiz
    ? interestQuiz.hollandTop
        .map(
          (id) =>
            `${HOLLAND_GROUPS[id].name} (${interestQuiz.scores.holland[id]} điểm)`
        )
        .join(", ")
    : "";

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

  const joinedExperienceRecords = experiences.filter((exp) =>
    student.joinedExperienceIds.includes(exp.id)
  );
  const joinedExperiences = joinedExperienceRecords.map(
    (exp) => `${exp.title} – ${exp.activityType}`
  );

  const tryScenarioReflections = (student.scenarioReflections ?? []).map(
    (item) => ({
      pathwayTitle: item.pathwayTitle,
      chosenPathLabels: item.chosenPathLabels,
      reflection: item.reflection.trim(),
      date: item.date,
    })
  );

  const tryJournalEntries = student.journal.filter(
    (entry) =>
      (entry.step || "THỬ") === "THỬ" && !entry.id.startsWith("j-sc-")
  );
  const tryReflection3QCount = tryJournalEntries.filter(
    (entry) => Boolean(entry.reflection3Q)
  ).length;

  const chosenOptionTitle = student.commitment.chosenOption.trim();
  const chosenOption =
    student.consideredOptions.find((opt) => opt.status === "Đã chọn") ??
    student.consideredOptions.find(
      (opt) => opt.title.trim() === chosenOptionTitle
    ) ??
    null;
  const optionTitleByPathwayId = new Map(
    student.consideredOptions
      .filter((opt) => opt.pathwayId !== "custom")
      .map((opt) => [opt.pathwayId, opt.title])
  );
  const triedPathwayTitles = Array.from(
    new Set(
      [
        ...tryScenarioReflections.map((item) => item.pathwayTitle),
        ...tryJournalEntries.map((item) => item.pathwayTitle ?? ""),
        ...joinedExperienceRecords.map(
          (item) => optionTitleByPathwayId.get(item.pathwayId ?? "") ?? ""
        ),
      ].filter(Boolean)
    )
  );
  const normalizeTitle = (value: string) =>
    value.toLocaleLowerCase("vi").trim();
  const chosenMatchesTry =
    Boolean(chosenOptionTitle) &&
    triedPathwayTitles.some((title) => {
      const normalized = normalizeTitle(title);
      const chosen = normalizeTitle(chosenOptionTitle);
      return (
        normalized === chosen ||
        normalized.includes(chosen) ||
        chosen.includes(normalized)
      );
    });
  const chosenPathwayActivityCount = chosenOption
    ? joinedExperienceRecords.filter(
        (item) => item.pathwayId === chosenOption.pathwayId
      ).length
    : 0;

  const tryCrossCheck = (() => {
    if (
      tryScenarioReflections.length === 0 &&
      joinedExperienceRecords.length === 0 &&
      tryJournalEntries.length === 0
    ) {
      return "Chưa có dữ liệu chặng THỬ để đối chiếu với bước LỌC và CHỐT.";
    }

    const parts = [
      `Đã đối chiếu ${tryScenarioReflections.length} lần thử lộ trình, ${joinedExperienceRecords.length} hoạt động nhà trường đã đăng kí và ${tryJournalEntries.length} nhật ký (${tryReflection3QCount} phiếu cảm nhận 3 câu) với bước LỌC và CHỐT.`,
    ];

    if (criteria.length === 0) {
      parts.push(
        "Bước LỌC chưa có tiêu chí nào nên chưa thể kiểm tra trải nghiệm thử có đúng điều em coi trọng hay không."
      );
    } else {
      parts.push(
        `Bước LỌC đã có ${criteria.length} tiêu chí để làm mốc so sánh với cảm nhận sau trải nghiệm.`
      );
    }

    if (!chosenOptionTitle) {
      parts.push(
        "Bước CHỐT chưa có lựa chọn cuối nên chưa xác định được mức khớp giữa THỬ và quyết định."
      );
    } else if (triedPathwayTitles.length === 0) {
      parts.push(
        `Dữ liệu THỬ chưa gắn với lộ trình cụ thể nên chưa đối chiếu trực tiếp được với lựa chọn cuối “${chosenOptionTitle}”.`
      );
    } else if (chosenMatchesTry) {
      parts.push(
        `Các trải nghiệm thử (${triedPathwayTitles.join(
          ", "
        )}) trùng với lựa chọn cuối “${chosenOptionTitle}”, cho thấy em đã trải nghiệm đúng hướng trước khi chốt.`
      );
    } else {
      parts.push(
        `Các trải nghiệm thử (${triedPathwayTitles.join(
          ", "
        )}) chưa trùng với lựa chọn cuối “${chosenOptionTitle}” – cần trao đổi thêm để hiểu vì sao em chuyển hướng sau trải nghiệm.`
      );
    }

    if (joinedExperienceRecords.length > 0) {
      parts.push(
        chosenPathwayActivityCount > 0
          ? `Có ${chosenPathwayActivityCount} hoạt động thực tế gắn trực tiếp với lộ trình em chốt.`
          : "Các hoạt động đã đăng kí chưa gắn trực tiếp với lộ trình em chốt, nên đối chiếu thêm với cảm nhận của em."
      );
    }

    if (tryReflection3QCount > 0) {
      parts.push(
        `${tryReflection3QCount} phiếu cảm nhận 3 câu có ghi nhận mức độ thay đổi suy nghĩ sau trải nghiệm.`
      );
    }

    return parts.join(" ");
  })();

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
      teacherContact: `Cô Thủy — giáo viên chủ nhiệm Lớp 9 (tài khoản ${HOMEROOM_TEACHER_USERNAME})`,
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
      holland: interestQuiz
        ? interestHollandGroups
        : joinNonEmpty(
            [student.profile.hollandSummaryText],
            "Chưa có kết quả Holland."
          ),
      ...(interestQuiz
        ? {
            mbti: interestQuiz.mbtiType,
            interestAnalysis: {
              personality: interestQuiz.analysis.personality,
              interests: interestQuiz.analysis.interests,
              environment: interestQuiz.analysis.environment,
              source: interestQuiz.analysis.source,
              completedAt: interestQuiz.completedAt,
            },
          }
        : {}),
      conditions: joinNonEmpty(
        [
          student.profile.conditions.commuteDistance
            ? `Đi lại: ${student.profile.conditions.commuteDistance}`
            : "",
          student.profile.conditions.familyFinance
            ? `Tài chính gia đình: ${student.profile.conditions.familyFinance}`
            : "",
          student.profile.conditions.healthNote
            ? `Sức khỏe: ${student.profile.conditions.healthNote}`
            : "",
          student.profile.conditions.otherConditions
            ? `Điều kiện khác: ${student.profile.conditions.otherConditions}`
            : "",
        ],
        "Chưa ghi điều kiện thực tế của em và gia đình."
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
          tryScenarioReflections.length > 0
            ? `Thử một ngày theo lộ trình: ${triedPathwayTitles.join(", ")}`
            : "",
          joinedExperiences.length > 0
            ? `Hoạt động nhà trường đã đăng kí: ${joinedExperiences.join(", ")}`
            : "",
          tryJournalEntries.length > 0
            ? `${tryJournalEntries.length} nhật ký ở bước THỬ, trong đó ${tryReflection3QCount} phiếu cảm nhận 3 câu`
            : "",
        ],
        "Chưa ghi nhận hoạt động trải nghiệm."
      ),
      tryDetails: {
        scenarioReflections: tryScenarioReflections,
        activities: joinedExperienceRecords.map((item) => ({
          title: item.title,
          activityType: item.activityType,
          dateLabel: item.dateLabel,
          location: item.location,
          status: "Đã đăng kí / tham gia",
        })),
        journalEntries: tryJournalEntries.map((entry) => ({
          date: entry.date,
          activityType: entry.activityType,
          pathwayTitle: entry.pathwayTitle,
          content: entry.content,
          reflection3Q: entry.reflection3Q,
        })),
        reflection3QCount: tryReflection3QCount,
        crossCheck: tryCrossCheck,
      },
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
    )}. Đối chiếu THỬ – LỌC – CHỐT: ${tryCrossCheck}`,
    sendStatus: joinNonEmpty(
      [
        `Đã gửi tới tài khoản giáo viên chủ nhiệm ${HOMEROOM_TEACHER_USERNAME} lúc ${now}`,
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
