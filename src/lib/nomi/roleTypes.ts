/** Shared auth/account shapes (client + server safe). */
export type AccountPublic = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  creatorCategory: string;
  tags: string[];
  isVerified: boolean;
  isPremium?: boolean;
  createdAt: number;
};

export type AccountRecord = AccountPublic & {
  passwordHash: string;
  salt: string;
};
