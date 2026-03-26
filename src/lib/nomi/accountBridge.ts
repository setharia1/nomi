import type { AccountPublic } from "@/lib/nomi/roleTypes";
import type { Creator } from "@/lib/types";

/** Safe to import from client bundles (types-only import from nomiTypes). */
export function accountPublicToCreator(a: AccountPublic): Creator {
  return {
    id: a.id,
    username: a.username,
    displayName: a.displayName,
    avatarUrl: a.avatarUrl,
    bio: a.bio,
    creatorCategory: a.creatorCategory,
    tags: a.tags,
    isVerified: a.isVerified,
    isPremium: a.isPremium,
  };
}
