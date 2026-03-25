"use client";

import { create } from "zustand";

const SESSION_KEY = "nomi-feed-audio-muted-v1";

type FeedPlaybackState = {
  /** false = user wants sound on the in-view clip (browser may still gate autoplay until gesture). */
  muted: boolean;
  hydrated: boolean;
  hydrate: () => void;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
};

export const useFeedPlaybackStore = create<FeedPlaybackState>()((set, get) => ({
  muted: true,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated || typeof window === "undefined") return;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw === "0") set({ muted: false, hydrated: true });
    else set({ muted: true, hydrated: true });
  },

  setMuted: (muted) => {
    set({ muted });
    if (typeof window !== "undefined") sessionStorage.setItem(SESSION_KEY, muted ? "1" : "0");
  },

  toggleMuted: () => {
    const next = !get().muted;
    get().setMuted(next);
  },
}));

if (typeof window !== "undefined") {
  setTimeout(() => useFeedPlaybackStore.getState().hydrate(), 0);
}
