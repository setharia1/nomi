import type { Creator } from "@/lib/types";
import { creators, getCreatorById } from "@/lib/mock-data";
import { getSelfProfileOverrides } from "./selfProfileStorage";

/** Stable ID for the signed-in account (seed “me”); all user-made posts use this. */
export const ME_CREATOR_ID = creators[0]!.id;

export function mergeSelfProfileIntoCreator(creator: Creator): Creator {
  if (creator.id !== ME_CREATOR_ID) return creator;
  const o = getSelfProfileOverrides();
  if (!o) return creator;
  const next = { ...creator };
  if (o.displayName != null && String(o.displayName).trim() !== "") {
    next.displayName = String(o.displayName).trim();
  }
  if (o.username != null && String(o.username).trim() !== "") {
    next.username = String(o.username).trim();
  }
  if (o.bio != null) next.bio = o.bio;
  if (o.avatarUrl != null) next.avatarUrl = o.avatarUrl;
  return next;
}

/** Use for any UI that shows a creator — applies live profile overrides for “me”. */
export function getCreatorByIdResolved(id: string): Creator | undefined {
  const c = getCreatorById(id);
  return c ? mergeSelfProfileIntoCreator(c) : undefined;
}

/**
 * Resolve profile route slug to a seed creator. Supports overridden handle for the current account
 * (client reads localStorage; SSR falls back to seed usernames only).
 */
export function resolveProfileCreator(usernameFromUrl: string): Creator | null {
  const slug = decodeURIComponent(usernameFromUrl).trim().toLowerCase();
  if (!slug) return null;
  const bySeed = creators.find((c) => c.username.toLowerCase() === slug);
  if (bySeed) return bySeed;
  const me = creators[0]!;
  const o = getSelfProfileOverrides();
  const effective = (o?.username?.trim() || me.username).toLowerCase();
  if (slug === effective) return me;
  return null;
}

export function isSelfProfileSlug(usernameFromUrl: string): boolean {
  const c = resolveProfileCreator(usernameFromUrl);
  return c?.id === ME_CREATOR_ID;
}
