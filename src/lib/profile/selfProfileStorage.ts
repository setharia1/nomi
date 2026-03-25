import type { Creator } from "@/lib/types";

const SELF_PROFILE_KEY = "nomi-self-profile-v1";

export type SelfProfileOverrides = Partial<
  Pick<Creator, "displayName" | "username" | "bio" | "avatarUrl">
> & {
  location?: string;
  website?: string;
  creatorLabel?: string;
  featuredMoodBoardId?: string;
  accent?: "violet" | "cyan" | "teal" | "rose";
};

export function getSelfProfileOverrides(): SelfProfileOverrides | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SELF_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SelfProfileOverrides;
  } catch {
    return null;
  }
}

export function setSelfProfileOverrides(overrides: SelfProfileOverrides) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SELF_PROFILE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event("nomi-self-profile-changed"));
}

export function clearSelfProfileOverrides() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SELF_PROFILE_KEY);
  window.dispatchEvent(new Event("nomi-self-profile-changed"));
}

