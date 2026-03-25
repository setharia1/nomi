/** Home feed category — full-screen vertical rails */
export type FeedTab = "ai-videos" | "ai-photos" | "real-life";

export interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  /** Primary public role (filmmaker, artist, etc.) */
  creatorCategory: string;
  tags: string[];
  isVerified?: boolean;
  isPremium?: boolean;
}

export interface GenerationStep {
  id: string;
  label: string;
  detail: string;
  thumbnailUrl?: string;
}

export interface Post {
  id: string;
  creatorId: string;
  imageUrl: string;
  caption: string;
  prompt: string;
  processNotes: string;
  tags: string[];
  category: string;
  likes: number;
  comments: number;
  saves: number;
  shares?: number;
  views: string;
  createdAt: string;
  /** Unix ms — used for profile / discovery ordering */
  publishedAt?: number;
  isConceptDrop?: boolean;
  generationJourney: GenerationStep[];
  feedTab: FeedTab;
  mediaType: "video" | "image";
  videoUrl?: string;
  audioLabel?: string;
}

export interface Signal {
  id: string;
  label: string;
  coverUrl: string;
  type: "drop" | "board" | "series";
}

export interface MoodBoard {
  id: string;
  title: string;
  coverUrls: string[];
  itemCount: number;
}

export interface NotificationItem {
  id: string;
  type: "like" | "comment" | "follow" | "mention" | "remix" | "generation_ready";
  actor: Creator;
  message: string;
  time: string;
  read: boolean;
  postId?: string;
  /** Ready-to-post AI video: open `/create/ready/[id]` */
  generationJobId?: string;
}

export interface ThreadPreview {
  id: string;
  participant: Creator;
  lastMessage: string;
  time: string;
  unread: boolean;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  fromMe: boolean;
  text: string;
  time: string;
}
