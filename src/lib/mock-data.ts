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

const SAMPLE_CLIP =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
const SAMPLE_CLIP_2 =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

/** You are always `c1`. Other creators power the home feed (you never see your own posts there). */
export const creators: Creator[] = [
  {
    id: "c1",
    username: "you",
    displayName: "You",
    avatarUrl: unsplash("photo-1534528741775-53994a69daeb", 240, 240),
    bio: "Your Nomi profile. Publish your first signal to light up the network.",
    creatorCategory: "Creator",
    tags: ["creator"],
    isVerified: true,
  },
  {
    id: "c2",
    username: "mira.studio",
    displayName: "Mira Chen",
    avatarUrl: unsplash("photo-1494790108377-be9c29b29330", 240, 240),
    bio: "Fashion & motion studies — real light, simulated silk.",
    creatorCategory: "Visual Artist",
    tags: ["fashion", "motion"],
    isVerified: true,
  },
  {
    id: "c3",
    username: "orion.latent",
    displayName: "Orion Vale",
    avatarUrl: unsplash("photo-1507003211169-0a1dd7228f2d", 240, 240),
    bio: "Cinematic AI shorts and latent travelogues.",
    creatorCategory: "AI Filmmaker",
    tags: ["cinematic", "ai-video"],
    isVerified: true,
    isPremium: true,
  },
];

/** Network posts (not yours) merged into the app so the home feed shows other people. */
export const posts: Post[] = [
  {
    id: "net-v-1",
    creatorId: "c2",
    imageUrl: unsplash("photo-1529626455594-4ff0802cfb75", 960, 1200),
    caption: "Runway motion test — cloth sim, cold key.",
    prompt: "Editorial runway, fabric sim, cold spotlight",
    processNotes: "",
    tags: ["fashion", "motion"],
    category: "Fashion",
    likes: 420,
    comments: 12,
    saves: 88,
    views: "12K",
    createdAt: "2d",
    publishedAt: 1_730_100_000_000,
    feedTab: "ai-videos",
    mediaType: "video",
    videoUrl: SAMPLE_CLIP,
    audioLabel: "Ambient",
    generationJourney: [],
  },
  {
    id: "net-v-2",
    creatorId: "c3",
    imageUrl: unsplash("photo-1574169208507-84376144848b", 960, 1200),
    caption: "Teal hour drift — one prompt, three passes.",
    prompt: "Teal hour city drift, anamorphic glow",
    processNotes: "",
    tags: ["cinematic", "neon"],
    category: "Cinematic",
    likes: 890,
    comments: 34,
    saves: 120,
    views: "45K",
    createdAt: "1w",
    publishedAt: 1_730_090_000_000,
    feedTab: "ai-videos",
    mediaType: "video",
    videoUrl: SAMPLE_CLIP_2,
    audioLabel: "City tone",
    generationJourney: [],
  },
  {
    id: "net-p-1",
    creatorId: "c3",
    imageUrl: unsplash("photo-1634017839464-5c339ebe3cb4", 960, 1200),
    caption: "Negative space study — hero frame only.",
    prompt: "Minimal hero frame, fog, single light source",
    processNotes: "",
    tags: ["minimal", "portrait"],
    category: "Art",
    likes: 2100,
    comments: 45,
    saves: 300,
    views: "210K",
    createdAt: "3d",
    publishedAt: 1_730_080_000_000,
    feedTab: "ai-photos",
    mediaType: "image",
    generationJourney: [],
  },
  {
    id: "net-p-2",
    creatorId: "c2",
    imageUrl: unsplash("photo-1515886657613-9f3515b0c78f", 960, 1200),
    caption: "Silhouette grid — before the color pass.",
    prompt: "High contrast silhouette grid, fashion",
    processNotes: "",
    tags: ["fashion", "editorial"],
    category: "Fashion",
    likes: 1500,
    comments: 28,
    saves: 190,
    views: "98K",
    createdAt: "5d",
    publishedAt: 1_730_070_000_000,
    feedTab: "ai-photos",
    mediaType: "image",
    generationJourney: [],
  },
  {
    id: "net-rl-1",
    creatorId: "c2",
    imageUrl: unsplash("photo-1469334031218-e382a71b716b", 960, 1200),
    caption: "Rooftop wind — color ref before the sim.",
    prompt: "",
    processNotes: "",
    tags: ["travel", "irl"],
    category: "Real Life",
    likes: 640,
    comments: 9,
    saves: 40,
    views: "22K",
    createdAt: "1d",
    publishedAt: 1_730_060_000_000,
    feedTab: "real-life",
    mediaType: "image",
    generationJourney: [],
  },
  {
    id: "net-rl-2",
    creatorId: "c3",
    imageUrl: unsplash("photo-1522075469751-3a6694fb2f61", 960, 1200),
    caption: "Studio BTS — dust in the beam.",
    prompt: "",
    processNotes: "",
    tags: ["studio", "bts"],
    category: "Real Life",
    likes: 410,
    comments: 6,
    saves: 22,
    views: "8K",
    createdAt: "4h",
    publishedAt: 1_730_050_000_000,
    feedTab: "real-life",
    mediaType: "video",
    videoUrl: SAMPLE_CLIP,
    audioLabel: "Room tone",
    generationJourney: [],
  },
];

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
