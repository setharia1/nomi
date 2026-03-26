"use client";

import { create } from "zustand";
import type { FeedTab, Post } from "@/lib/types";
import type { PostDraft } from "@/lib/create/types";
import { posts as seedPosts } from "@/lib/mock-data";
import { useFeedCatalogStore } from "@/lib/feed/feedCatalogStore";
import { useAuthStore } from "@/lib/auth/authStore";
import {
  ensurePostMediaPublicUrls,
  postNeedsPublicMediaUpload,
} from "@/lib/media/blobClientUpload";

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

function mergeAll(seed: Post[], network: Post[], user: Post[]): Post[] {
  const byId = new Map<string, Post>();
  for (const p of seed) byId.set(p.id, p);
  for (const p of network) byId.set(p.id, p);
  for (const p of user) byId.set(p.id, p);
  return Array.from(byId.values());
}

type ContentMemoryState = {
  hydrated: boolean;
  userPosts: Post[];
  hydrate: () => void;
  /** Uploads media to public blob URLs when configured, then saves to the server and local cache. */
  publishPost: (post: Post) => Promise<void>;
  removeUserPost: (id: string) => void;
  mergeWithSeed: (seed: Post[]) => Post[];
};

export const useContentMemoryStore = create<ContentMemoryState>()((set, get) => ({
  hydrated: false,
  userPosts: [],

  hydrate: () => {
    if (get().hydrated) return;
    set({ userPosts: loadFromDisk(), hydrated: true });
  },

  publishPost: async (post) => {
    const stamped = normalizeUserPost(post);
    const token = useAuthStore.getState().token;
    const account = useAuthStore.getState().account;

    let toSave = stamped;
    if (token && account?.id && postNeedsPublicMediaUpload(stamped)) {
      try {
        toSave = await ensurePostMediaPublicUrls(stamped, account.id, token);
      } catch {
        /* e.g. BLOB_READ_WRITE_TOKEN missing — fall through and let server / local handle */
      }
    }

    const rest = get().userPosts.filter((p) => p.id !== toSave.id);
    const nextLocal = [toSave, ...rest];
    set({ userPosts: nextLocal });
    persistToDisk(nextLocal);

    if (token) {
      try {
        const res = await fetch("/api/nomi/posts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(toSave),
        });
        if (res.ok) {
          const data = (await res.json()) as { posts?: Post[] };
          const list = data.posts ?? [];
          const saved = list.find((p) => p.id === toSave.id);
          if (saved) {
            const restAfter = get().userPosts.filter((p) => p.id !== saved.id);
            const merged = [saved, ...restAfter];
            set({ userPosts: merged });
            persistToDisk(merged);
          }
        }
      } catch {
        /* offline */
      }
      void useFeedCatalogStore.getState().hydrate();
    }
  },

  removeUserPost: (id) => {
    const next = get().userPosts.filter((p) => p.id !== id);
    set({ userPosts: next });
    persistToDisk(next);
  },

  mergeWithSeed: (seed) => {
    const u = get().userPosts;
    const net = useFeedCatalogStore.getState().posts;
    return mergeAll(seed, net, u);
  },
}));

if (typeof window !== "undefined") {
  setTimeout(() => useContentMemoryStore.getState().hydrate(), 0);
}

export function selectAllPostsMerged(): Post[] {
  return useContentMemoryStore.getState().mergeWithSeed(seedPosts);
}

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
  const fromNet = useFeedCatalogStore.getState().posts.find((p) => p.id === id);
  if (fromNet) return fromNet;
  return seedPosts.find((p) => p.id === id);
}

export function selectPostsForCreatorMerged(creatorId: string): Post[] {
  return sortPostsForProfileGrid(selectAllPostsMerged().filter((p) => p.creatorId === creatorId));
}

export function selectPostsForCreatorSeed(creatorId: string): Post[] {
  return seedPosts.filter((p) => p.creatorId === creatorId);
}

export function selectPostsForFeedTabSeed(tab: FeedTab): Post[] {
  return seedPosts
    .filter((p) => p.feedTab === tab)
    .slice()
    .sort((a, b) => b.likes - a.likes);
}

export function selectHomeFeedPostsSeed(_tab: FeedTab): Post[] {
  return [];
}

export function selectForYouPoolMerged(tab: FeedTab): Post[] {
  return selectAllPostsMerged().filter((p) => p.feedTab === tab);
}

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

export function buildPostFromDraft(input: {
  draft: PostDraft;
  mediaUrl: string | null;
  creatorId: string;
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
