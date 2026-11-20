import { INITIAL_STATE } from "../data/seedData";
import { AppState, StudentProfileData } from "../types";

const STORAGE_KEY = "la_ban_lua_chon_state_v1";

export interface DataRepository {
  loadState(): AppState;
  saveState(state: AppState): void;
  resetState(): AppState;
}

class LocalStorageRepository implements DataRepository {
  loadState(): AppState {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return structuredClone(INITIAL_STATE);
      }
      const parsed = JSON.parse(raw) as Partial<AppState>;
      if (!parsed.students || parsed.students.length === 0) {
        return structuredClone(INITIAL_STATE);
      }
      return {
        ...structuredClone(INITIAL_STATE),
        ...parsed,
      };
    } catch {
      return structuredClone(INITIAL_STATE);
    }
  }

  saveState(state: AppState): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Không thể lưu dữ liệu vào bộ nhớ trình duyệt:", err);
    }
  }

  resetState(): AppState {
    const fresh = structuredClone(INITIAL_STATE);
    this.saveState(fresh);
    return fresh;
  }
}

export const dataRepository: DataRepository = new LocalStorageRepository();

export function formatNowVi(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} · ${hh}:${min}`;
}

export function formatShortDateVi(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

/**
 * Translates internal behavioral counters into empathetic, non-diagnostic verbal descriptions
 * for the Teacher dashboard ONLY (never shown to students or parents).
 */
export function getVerbalAttentionSignals(student: StudentProfileData): {
  hasAttentionNeeded: boolean;
  isSensitive: boolean;
  descriptions: string[];
} {
  const descriptions: string[] = [];
  const c = student.behaviorCounters;

  if (c.sensitiveAlert) {
    descriptions.push("Em chia sẻ dấu hiệu căng thẳng hoặc áp lực gia đình nặng nề – cần thầy/cô trao đổi trực tiếp.");
  }
  if (c.addedAfterLockCount > 0) {
    descriptions.push("Em thêm phương án mới sau khi đã chốt hoặc lọc xong.");
  }
  if (c.optionChangesCount >= 2) {
    descriptions.push("Em đã đổi nguyện vọng nhiều lần trong thời gian gần đây.");
  }
  if (c.abandonedLockCount > 0 && !student.hasLockedChoice) {
    descriptions.push("Em từng mở bước chốt quyết định nhưng bỏ dở chưa xác nhận.");
  }
  if (c.hesitantPhrasesCount > 0) {
    descriptions.push("Em viết nhiều câu mang tính chờ đợi hoặc so sánh chưa kiểm chứng (ví dụ: 'nhưng biết đâu...', 'chắc là được').");
  }
  for (const note of c.customNotes) {
    if (!descriptions.includes(note)) {
      descriptions.push(note);
    }
  }

  return {
    hasAttentionNeeded: descriptions.length > 0,
    isSensitive: c.sensitiveAlert,
    descriptions,
  };
}
