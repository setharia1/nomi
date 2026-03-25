import type { PostDraft } from "./types";

const KEY = "nomi-post-drafts";

export function loadDrafts(): PostDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PostDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDrafts(list: PostDraft[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

export function upsertDraft(draft: PostDraft) {
  const list = loadDrafts().filter((d) => d.id !== draft.id);
  list.unshift({ ...draft, updatedAt: Date.now() });
  saveDrafts(list);
}

export function deleteDraft(id: string) {
  saveDrafts(loadDrafts().filter((d) => d.id !== id));
}

export function getDraft(id: string) {
  return loadDrafts().find((d) => d.id === id) ?? null;
}

const ONBOARD_KEY = "nomi-create-onboard-v1";

export function hasSeenCreateOnboarding() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARD_KEY) === "1";
}

export function markCreateOnboardingSeen() {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARD_KEY, "1");
}
