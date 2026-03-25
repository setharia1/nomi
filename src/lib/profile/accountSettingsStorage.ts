export type AccountSettings = {
  email: string;
  phone: string;
  username: string;
  // Mock auth flags
  twoFactorEnabled: boolean;
  sessionsDeviceCount: number;
  marketingEmail: boolean;
  pushNotifications: boolean;
  notifyLikes: boolean;
  notifyComments: boolean;
  notifyFollows: boolean;
  notifyMessages: boolean;
  notifyMentions: boolean;
  notifyRemixActivity: boolean;
  notifyPromptReveal: boolean;
  notifyCreatorUpdates: boolean;
};

export type ContentPreferences = {
  defaultAllowComments: boolean;
  defaultAllowRemix: boolean;
  defaultPromptRevealPublic: boolean;
  defaultAudience: "public" | "followers";
  autoSaveDrafts: boolean;
  saveOriginalUploads: boolean;
};

export type PrivacySettings = {
  whoCanMessage: "everyone" | "followers";
  whoCanComment: "everyone" | "followers";
  whoCanRemix: "everyone" | "followers" | "allowed-creators";
  whoCanRevealPrompt: "everyone" | "followers";
  allowTagging: boolean;
  allowMentions: boolean;
  mutedUsernames: string[];
  blockedUsernames: string[];
};

export type AppearanceSettings = {
  theme: "dark" | "light";
  accent: "violet" | "cyan" | "teal" | "rose";
  density: "comfortable" | "compact";
  reduceMotion: boolean;
  autoplayPreviews: boolean;
};

const ACCOUNT_KEY = "nomi-account-settings-v1";

export function loadAccountSettings(): (AccountSettings &
  ContentPreferences &
  PrivacySettings &
  AppearanceSettings) | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AccountSettings &
      ContentPreferences &
      PrivacySettings &
      AppearanceSettings>;
    return {
      ...defaultAccountSettings(),
      ...parsed,
    } as AccountSettings &
      ContentPreferences &
      PrivacySettings &
      AppearanceSettings;
  } catch {
    return null;
  }
}

export function saveAccountSettings(
  next: AccountSettings &
    ContentPreferences &
    PrivacySettings &
    AppearanceSettings,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next));
}

export function defaultAccountSettings(): AccountSettings &
  ContentPreferences &
  PrivacySettings &
  AppearanceSettings {
  return {
    email: "orion@example.com",
    phone: "+1 (555) 010-2044",
    username: "orion.latent",
    twoFactorEnabled: false,
    sessionsDeviceCount: 2,
    marketingEmail: true,
    pushNotifications: true,
    notifyLikes: true,
    notifyComments: true,
    notifyFollows: true,
    notifyMessages: false,
    notifyMentions: true,
    notifyRemixActivity: true,
    notifyPromptReveal: true,
    notifyCreatorUpdates: true,
    defaultAllowComments: true,
    defaultAllowRemix: false,
    defaultPromptRevealPublic: false,
    defaultAudience: "public",
    autoSaveDrafts: true,
    saveOriginalUploads: true,
    whoCanMessage: "followers",
    whoCanComment: "everyone",
    whoCanRemix: "allowed-creators",
    whoCanRevealPrompt: "followers",
    allowTagging: true,
    allowMentions: true,
    mutedUsernames: [],
    blockedUsernames: [],
    theme: "dark",
    accent: "violet",
    density: "comfortable",
    reduceMotion: false,
    autoplayPreviews: true,
  };
}

