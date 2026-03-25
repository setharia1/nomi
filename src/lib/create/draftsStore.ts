"use client";

import { create } from "zustand";
import type { PostDraft } from "./types";
import { deleteDraft, loadDrafts, upsertDraft as persistUpsert } from "./drafts";

type DraftsStore = {
  list: PostDraft[];
  hydrate: () => void;
  upsert: (draft: PostDraft) => void;
  remove: (id: string) => void;
};

export const useDraftsStore = create<DraftsStore>()((set) => ({
  list: [],

  hydrate: () => set({ list: loadDrafts() }),

  upsert: (draft) => {
    persistUpsert(draft);
    set({ list: loadDrafts() });
  },

  remove: (id) => {
    deleteDraft(id);
    set({ list: loadDrafts() });
  },
}));

if (typeof window !== "undefined") {
  setTimeout(() => useDraftsStore.getState().hydrate(), 0);
}
