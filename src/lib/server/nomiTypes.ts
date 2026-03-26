import type { Creator, Post } from "@/lib/types";
import type { AccountPublic, AccountRecord } from "@/lib/nomi/roleTypes";

export type { AccountPublic, AccountRecord };

export type NomiDb = {
  accountsById: Record<string, AccountRecord>;
  usernameToId: Record<string, string>;
  emailToId: Record<string, string>;
  /** session token -> { accountId, expiresAt } */
  sessions: Record<string, { accountId: string; expiresAt: number }>;
  postsByAccountId: Record<string, Post[]>;
  followingByAccountId: Record<string, string[]>;
};

export function accountToCreator(a: AccountPublic): Creator {
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

export function stripAccount(a: AccountRecord): AccountPublic {
  const { passwordHash, salt, ...pub } = a;
  void passwordHash;
  void salt;
  return pub;
}
