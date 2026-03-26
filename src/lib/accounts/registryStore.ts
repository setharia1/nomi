"use client";

import { create } from "zustand";
import type { Creator } from "@/lib/types";
import { registerKnownCreatorIds } from "@/lib/social/followGraph";

type State = {
  byId: Record<string, Creator>;
  hydrated: boolean;
  setFromServer: (creators: Creator[]) => void;
  upsert: (c: Creator) => void;
};

export const useAccountRegistryStore = create<State>()((set, get) => ({
  byId: {},
  hydrated: false,

  setFromServer: (creators) => {
    const byId: Record<string, Creator> = {};
    for (const c of creators) byId[c.id] = c;
    registerKnownCreatorIds(creators.map((c) => c.id));
    set({ byId, hydrated: true });
  },

  upsert: (c) => {
    const next = { ...get().byId, [c.id]: c };
    registerKnownCreatorIds([c.id]);
    set({ byId: next, hydrated: true });
  },
}));

export function listRegisteredCreators(): Creator[] {
  return Object.values(useAccountRegistryStore.getState().byId);
}
