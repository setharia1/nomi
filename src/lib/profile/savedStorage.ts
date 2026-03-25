const SAVED_POSTS_KEY = "nomi-saved-posts-v1";
const SAVED_CREATORS_KEY = "nomi-saved-creators-v1";
const SAVED_MOOD_BOARDS_KEY = "nomi-saved-mood-boards-v1";

export function loadSavedPostIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function saveSavedPostIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(ids));
}

export function loadSavedCreatorIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_CREATORS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function saveSavedCreatorIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_CREATORS_KEY, JSON.stringify(ids));
}

export function loadSavedMoodBoardIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_MOOD_BOARDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function saveSavedMoodBoardIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_MOOD_BOARDS_KEY, JSON.stringify(ids));
}
