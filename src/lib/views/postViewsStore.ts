"use client";

import { create } from "zustand";

const BONUS_KEY = "nomi-post-view-bonus-v1";
const DAY_KEY = "nomi-post-view-last-day-v1";

function loadBonus(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(BONUS_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    return p && typeof p === "object" ? { ...(p as Record<string, number>) } : {};
  } catch {
    return {};
  }
}

function persistBonus(next: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BONUS_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

function loadDay(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DAY_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    return p && typeof p === "object" ? { ...(p as Record<string, string>) } : {};
  } catch {
    return {};
  }
}

function persistDay(next: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DAY_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

type PostViewsState = {
  hydrated: boolean;
  bonusVersion: number;
  bonusByPostId: Record<string, number>;
  lastCountedDayByPostId: Record<string, string>;
  hydrate: () => void;
  /** Count at most once per post per local calendar day after a qualified feed/detail view. */
  recordQualifiedView: (postId: string) => void;
  getBonus: (postId: string) => number;
};

export const usePostViewsStore = create<PostViewsState>()((set, get) => ({
  hydrated: false,
  bonusVersion: 0,
  bonusByPostId: {},
  lastCountedDayByPostId: {},

  hydrate: () => {
    if (get().hydrated) return;
    set({
      bonusByPostId: loadBonus(),
      lastCountedDayByPostId: loadDay(),
      hydrated: true,
    });
  },

  getBonus: (postId) => get().bonusByPostId[postId] ?? 0,

  recordQualifiedView: (postId) => {
    const day = todayKey();
    const days = { ...get().lastCountedDayByPostId };
    if (days[postId] === day) return;

    const bonus = { ...get().bonusByPostId };
    bonus[postId] = (bonus[postId] ?? 0) + 1;
    days[postId] = day;

    set((s) => ({
      bonusByPostId: bonus,
      lastCountedDayByPostId: days,
      bonusVersion: s.bonusVersion + 1,
    }));
    persistBonus(bonus);
    persistDay(days);
  },
}));

if (typeof window !== "undefined") {
  setTimeout(() => usePostViewsStore.getState().hydrate(), 0);
}
