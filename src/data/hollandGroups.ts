import type { HollandGroupId } from "../types";

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
