import type { Creator, MoodBoard, Post } from "@/lib/types";

export type SearchTab =
  | "top"
  | "creators"
  | "posts"
  | "ai-videos"
  | "ai-photos"
  | "real-life"
  | "topics"
  | "concept-drops"
  | "boards";

export type PersonalizationSignals = {
  followedCreatorIds: string[];
  likedPostIds: string[];
  savedPostIds: string[];
  savedCreatorIds: string[];
  /** Live follower counts from social graph (mock store) */
  followerCounts: Record<string, number>;
  /** tag slugs from liked/saved posts for affinity */
  affinityTagSlugs: string[];
  /** creator ids inferred from liked/saved */
  affinityCreatorIds: string[];
  recentQueries: string[];
};

export type TopicHit = {
  slug: string;
  label: string;
  postCount: number;
  creatorCount: number;
  trendScore: number;
};

export type BoardHit = {
  board: MoodBoard;
  creator: Creator;
  score: number;
};

export type SearchSnapshot = {
  query: string;
  normalized: string;
  tokens: string[];
  creators: { creator: Creator; score: number; reason?: string }[];
  posts: { post: Post; score: number; reason?: string }[];
  topics: TopicHit[];
  boards: BoardHit[];
  /** short editorial line for Top tab */
  personalizedHint?: string;
};
