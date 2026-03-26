import type { Creator } from "@/lib/types";
import { resolveCreator, resolveCreatorByUsername } from "@/lib/accounts/resolveCreator";
import { getMeId } from "@/lib/auth/meId";
import { getSelfProfileOverrides } from "./selfProfileStorage";
import { safeDecodeURIComponent } from "@/lib/url/safeDecode";

export function mergeSelfProfileIntoCreator(creator: Creator): Creator {
  const me = getMeId();
  if (!me || creator.id !== me) return creator;
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

/** Use for any UI that shows a creator — applies live profile overrides for the signed-in account. */
export function getCreatorByIdResolved(id: string): Creator | undefined {
  const c = resolveCreator(id);
  return c ? mergeSelfProfileIntoCreator(c) : undefined;
}

/**
 * Resolve profile route slug to a creator. Uses the live registry first, then optional local handle
 * overrides for the current account.
 */
export function resolveProfileCreator(usernameFromUrl: string): Creator | null {
  const byRegistry = resolveCreatorByUsername(usernameFromUrl);
  if (byRegistry) return byRegistry;
  const me = getMeId();
  if (!me) return null;
  const meCreator = resolveCreator(me);
  if (!meCreator) return null;
  const o = getSelfProfileOverrides();
  const slug = safeDecodeURIComponent(usernameFromUrl, "").trim().toLowerCase().replace(/^@+/, "");
  const effective = (o?.username?.trim() || meCreator.username).toLowerCase();
  if (slug === effective) return meCreator;
  return null;
}

export function isSelfProfileSlug(usernameFromUrl: string): boolean {
  const me = getMeId();
  if (!me) return false;
  const c = resolveProfileCreator(usernameFromUrl);
  return c?.id === me;
}
