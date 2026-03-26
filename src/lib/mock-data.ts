import type {
  ChatMessage,
  Creator,
  FeedTab,
  MoodBoard,
  NotificationItem,
  Post,
  Signal,
  ThreadPreview,
} from "./types";

const unsplash = (id: string, w = 800, h = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** The only seeded account — the signed-in user. All posts come from real publishes (local storage). */
export const creators: Creator[] = [
  {
    id: "c1",
    username: "you",
    displayName: "You",
    avatarUrl: unsplash("photo-1534528741775-53994a69daeb", 240, 240),
    bio: "Your Nomi profile. Publish your first signal to join the network.",
    creatorCategory: "Creator",
    tags: ["creator"],
    isVerified: false,
  },
];

export const posts: Post[] = [];

export const exploreFilters = [
  "Trending",
  "Art",
  "Animation",
  "Fashion",
  "Characters",
  "Fantasy",
  "Cinematic",
  "Memes",
] as const;

export type ExploreFilter = (typeof exploreFilters)[number];

export function getCreatorById(id: string) {
  return creators.find((c) => c.id === id);
}

export function getCreatorByUsername(username: string) {
  return creators.find(
    (c) => c.username.toLowerCase() === decodeURIComponent(username).toLowerCase(),
  );
}

export function getPostById(id: string) {
  return posts.find((p) => p.id === id);
}

export function getPostsForCreator(creatorId: string) {
  return posts.filter((p) => p.creatorId === creatorId);
}

export function getPostsForFeedTab(tab: FeedTab) {
  return posts
    .filter((p) => p.feedTab === tab)
    .slice()
    .sort((a, b) => b.likes - a.likes);
}

export const feedTabOrder: FeedTab[] = ["ai-videos", "ai-photos", "real-life"];

export const feedTabLabels: Record<FeedTab, string> = {
  "ai-videos": "AI Videos",
  "ai-photos": "AI Photos",
  "real-life": "Real Life",
};

export const featuredPosts: string[] = [];

export const signalsByCreator: Record<string, Signal[]> = {};

export function getSignalsForCreator(creatorId: string): Signal[] {
  return signalsByCreator[creatorId] ?? [];
}

export const moodBoardsByCreator: Record<string, MoodBoard[]> = {};

export function getMoodBoardsForCreator(creatorId: string): MoodBoard[] {
  return moodBoardsByCreator[creatorId] ?? [];
}

export const notifications: NotificationItem[] = [];

export const threadPreviews: ThreadPreview[] = [];

export const threadMessages: Record<string, ChatMessage[]> = {};

export const featuredCreators: Creator[] = [];
