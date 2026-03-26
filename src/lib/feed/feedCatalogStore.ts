"use client";

import { create } from "zustand";
import type { Post } from "@/lib/types";

type State = {
  posts: Post[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  mergePosts: (incoming: Post[]) => void;
};

export const useFeedCatalogStore = create<State>()((set) => ({
  posts: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const r = await fetch("/api/nomi/posts/catalog");
      if (!r.ok) return;
      const data = (await r.json()) as { posts: Post[] };
      set({ posts: data.posts ?? [], hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  mergePosts: (incoming) => {
    if (!incoming.length) return;
    set((s) => {
      const byId = new Map(s.posts.map((p) => [p.id, p]));
      for (const p of incoming) byId.set(p.id, p);
      return { posts: Array.from(byId.values()) };
    });
  },
}));
