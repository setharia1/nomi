"use client";

import { useAuthStore } from "./authStore";

export function getMeId(): string | null {
  return useAuthStore.getState().account?.id ?? null;
}

export function useMeId(): string | null {
  return useAuthStore((s) => s.account?.id ?? null);
}

export function requireMeId(): string {
  const id = getMeId();
  if (!id) throw new Error("Not signed in");
  return id;
}
