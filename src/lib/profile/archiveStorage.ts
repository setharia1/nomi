const ARCHIVED_POSTS_KEY = "nomi-archived-posts-v1";

export function loadArchivedPostIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ARCHIVED_POSTS_KEY);
    if (!raw) return ["p6"];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : ["p6"];
  } catch {
    return ["p6"];
  }
}

export function saveArchivedPostIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ARCHIVED_POSTS_KEY, JSON.stringify(ids));
}

