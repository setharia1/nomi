"use client";

import { create } from "zustand";
import type { FeedTab, Post } from "@/lib/types";
import type { PostDraft } from "@/lib/create/types";
import { posts as seedPosts } from "@/lib/mock-data";
import { ME_CREATOR_ID } from "@/lib/profile/meCreator";

const KEY = "nomi-user-posts-v1";

function loadFromDisk(): Post[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const base = Date.now();
    return (parsed as Post[]).map((p, i) =>
      p.publishedAt != null ? p : { ...p, publishedAt: base - i },
    );
  } catch {
    return [];
  }
}

function normalizeUserPost(p: Post): Post {
  return p.publishedAt != null ? p : { ...p, publishedAt: Date.now() };
}

function persistToDisk(next: Post[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

type ContentMemoryState = {
  hydrated: boolean;
  userPosts: Post[];
  hydrate: () => void;
  publishPost: (post: Post) => void;
  removeUserPost: (id: string) => void;
  /** Seed-first merge: user posts override same id, then seed */
  mergeWithSeed: (seed: Post[]) => Post[];
};

export const useContentMemoryStore = create<ContentMemoryState>()((set, get) => ({
  hydrated: false,
  userPosts: [],

  hydrate: () => {
    if (get().hydrated) return;
    set({ userPosts: loadFromDisk(), hydrated: true });
  },

  publishPost: (post) => {
    const stamped = normalizeUserPost(post);
    const rest = get().userPosts.filter((p) => p.id !== stamped.id);
    const next = [stamped, ...rest];
    set({ userPosts: next });
    persistToDisk(next);
  },

  removeUserPost: (id) => {
    const next = get().userPosts.filter((p) => p.id !== id);
    set({ userPosts: next });
    persistToDisk(next);
  },

  mergeWithSeed: (seed) => {
    const u = get().userPosts;
    const byId = new Map<string, Post>();
    for (const p of seed) byId.set(p.id, p);
    for (const p of u) byId.set(p.id, p);
    return Array.from(byId.values());
  },
}));

if (typeof window !== "undefined") {
  setTimeout(() => useContentMemoryStore.getState().hydrate(), 0);
}

export function selectAllPostsMerged(): Post[] {
  return useContentMemoryStore.getState().mergeWithSeed(seedPosts);
}

/** Newest first — uses `publishedAt`, then user-post order, then id. */
export function sortPostsForProfileGrid(posts: Post[]): Post[] {
  const user = useContentMemoryStore.getState().userPosts;
  const idx = new Map(user.map((p, i) => [p.id, i]));
  return posts.slice().sort((a, b) => {
    const ta = a.publishedAt ?? 0;
    const tb = b.publishedAt ?? 0;
    if (ta !== tb) return tb - ta;
    const ia = idx.get(a.id);
    const ib = idx.get(b.id);
    if (ia !== undefined && ib !== undefined) return ia - ib;
    if (ia !== undefined) return -1;
    if (ib !== undefined) return 1;
    return b.id.localeCompare(a.id);
  });
}

export function selectPostByIdMerged(id: string): Post | undefined {
  const fromUser = useContentMemoryStore.getState().userPosts.find((p) => p.id === id);
  if (fromUser) return fromUser;
  return seedPosts.find((p) => p.id === id);
}

export function selectPostsForCreatorMerged(creatorId: string): Post[] {
  return sortPostsForProfileGrid(selectAllPostsMerged().filter((p) => p.creatorId === creatorId));
}

/** Seed/mock posts only — matches server SSR and first client paint before local storage hydrates. */
export function selectPostsForCreatorSeed(creatorId: string): Post[] {
  return seedPosts.filter((p) => p.creatorId === creatorId);
}

/** Seed-only feed tab ordering (empty without demo posts). Explore may still sort merged catalog. */
export function selectPostsForFeedTabSeed(tab: FeedTab): Post[] {
  return seedPosts
    .filter((p) => p.feedTab === tab)
    .slice()
    .sort((a, b) => b.likes - a.likes);
}

/** Pre-hydration / SSR: seed catalog has no posts — matches first client paint before local storage loads. */
export function selectHomeFeedPostsSeed(_tab: FeedTab): Post[] {
  return [];
}

/**
 * Home (see `HomeImmersiveFeed`):
 * - **For you** — `selectForYouPoolMerged` → every real published post in this tab (you + everyone else),
 *   then `buildForYouStream` (ranked + light randomness so new uploads mix into the stream).
 * - **Following** — `selectFollowingPoolMerged` → only followed creator ids in this tab,
 *   then `sortFollowingFeed` (newest first).
 */
export function selectForYouPoolMerged(tab: FeedTab): Post[] {
  return selectAllPostsMerged().filter((p) => p.feedTab === tab);
}

/** Following: posts only from accounts the user follows in this tab. */
export function selectFollowingPoolMerged(tab: FeedTab, followingCreatorIds: string[]): Post[] {
  const allow = new Set(followingCreatorIds);
  return selectAllPostsMerged().filter((p) => p.feedTab === tab && allow.has(p.creatorId));
}

export function selectPostsForFeedTabMerged(tab: FeedTab): Post[] {
  const user = useContentMemoryStore.getState().userPosts;
  const userIdx = new Map(user.map((p, i) => [p.id, i]));
  const inTab = selectAllPostsMerged().filter((p) => p.feedTab === tab);
  return inTab.slice().sort((a, b) => {
    const ia = userIdx.get(a.id);
    const ib = userIdx.get(b.id);
    if (ia !== undefined && ib !== undefined) return ia - ib;
    if (ia !== undefined) return -1;
    if (ib !== undefined) return 1;
    const ta = a.publishedAt ?? 0;
    const tb = b.publishedAt ?? 0;
    if (ta !== tb) return tb - ta;
    return b.likes - a.likes;
  });
}

const FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80";

/** Build a published post from a finished Veo job (client-only). */
export function buildUserPostFromVideoJob(input: {
  id: string;
  creatorId: string;
  videoDataUrl: string;
  caption: string;
  tagsLine: string;
  title: string;
  prompt: string;
  processNotes: string;
  modelLabel: string;
  feedTab: FeedTab;
  /** First-frame JPEG data URL from the video — profile grid + post posters */
  posterDataUrl?: string | null;
}): Post {
  const tags = input.tagsLine
    .split(/[#,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const cap =
    input.caption.trim() ||
    (input.title.trim() ? input.title.trim() : "New AI video");
  const poster = input.posterDataUrl?.trim();
  return {
    id: input.id,
    creatorId: input.creatorId,
    imageUrl: poster && poster.length > 22 ? poster : FALLBACK_POSTER,
    caption: cap,
    prompt: input.prompt,
    processNotes: input.processNotes,
    tags: tags.length ? tags : ["ai", "video"],
    category: "Signal",
    likes: 0,
    comments: 0,
    saves: 0,
    shares: 0,
    views: "0",
    createdAt: "Just now",
    publishedAt: Date.now(),
    generationJourney: input.modelLabel
      ? [
          {
            id: "g1",
            label: "Model",
            detail: input.modelLabel,
          },
        ]
      : [],
    feedTab: input.feedTab,
    mediaType: "video",
    videoUrl: input.videoDataUrl,
    isConceptDrop: false,
  };
}

/** Publish from Create Studio — always scoped to `creatorId` (your account). */
export function buildPostFromDraft(input: {
  draft: PostDraft;
  mediaUrl: string | null;
  creatorId: string;
  /** First-frame JPEG data URL when publishing video — used as profile thumbnail */
  posterDataUrl?: string | null;
}): Post {
  const { draft, mediaUrl, creatorId } = input;
  const tags = draft.tags
    .split(/[#,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `post-${Date.now()}`;
  const caption =
    draft.caption.trim() || draft.title.trim() || (draft.isConceptDrop ? "Concept drop" : "New signal");
  const isVideo = draft.mediaType === "video";
  const poster = input.posterDataUrl?.trim();
  const imageUrl = isVideo
    ? poster && poster.length > 22
      ? poster
      : FALLBACK_POSTER
    : mediaUrl || FALLBACK_POSTER;
  return {
    id,
    creatorId,
    imageUrl,
    caption,
    prompt: draft.prompt,
    processNotes: draft.processNotes,
    tags: tags.length ? tags : draft.isConceptDrop ? ["concept"] : ["signal"],
    category: draft.category.trim() || "Signal",
    likes: 0,
    comments: 0,
    saves: 0,
    shares: 0,
    views: "0",
    createdAt: "Just now",
    publishedAt: Date.now(),
    isConceptDrop: draft.isConceptDrop,
    generationJourney: (draft.journey ?? []).map((s) => ({
      id: s.id,
      label: s.label,
      detail: s.detail,
    })),
    feedTab: draft.feedTab,
    mediaType: isVideo ? "video" : "image",
    videoUrl: isVideo && mediaUrl ? mediaUrl : undefined,
  };
}
