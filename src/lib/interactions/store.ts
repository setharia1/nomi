"use client";

import { create } from "zustand";
import { creators, notifications as seedNotifications } from "@/lib/mock-data";
import { selectPostByIdMerged } from "@/lib/content/contentMemoryStore";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";
import type { NotificationItem } from "@/lib/types";
import {
  cloneFollowingGraph,
  computeFollowerCounts,
  countFollowers,
  listFollowerIds,
  mergeLegacyMeFollowing,
  normalizeFollowingGraph,
} from "@/lib/social/followGraph";
import {
  loadSavedCreatorIds,
  loadSavedMoodBoardIds,
  loadSavedPostIds,
  saveSavedCreatorIds,
  saveSavedMoodBoardIds,
  saveSavedPostIds,
} from "@/lib/profile/savedStorage";
import { useAuthStore } from "@/lib/auth/authStore";

export type InteractionComment = {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: number;
};

export const EMPTY_COMMENTS: InteractionComment[] = [];

function me(): string {
  return useAuthStore.getState().account?.id ?? "";
}

const likedKey = "nomi-liked-post-ids-v1";
const followedKey = "nomi-followed-creator-ids-v1";
const followGraphKey = "nomi-following-graph-v1";
const commentsKey = "nomi-comments-by-post-v1";
const notificationsKey = "nomi-notifications-v1";
const sharesKey = "nomi-shares-count-by-post-v1";

const initialFollowingByUserId = cloneFollowingGraph();

function safeLoadIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function safeSaveIds(key: string, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* */
  }
}

function safeLoadFollowingGraph(): Record<string, string[]> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(followGraphKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Record<string, string[]>;
  } catch {
    return null;
  }
}

function safeSaveFollowingGraph(next: Record<string, string[]>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(followGraphKey, JSON.stringify(next));
  } catch {
    /* */
  }
}

function safeLoadComments(): Record<string, InteractionComment[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(commentsKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, InteractionComment[]>;
  } catch {
    return {};
  }
}

function safeSaveComments(next: Record<string, InteractionComment[]>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(commentsKey, JSON.stringify(next));
  } catch {
    /* */
  }
}

function safeLoadNotifications(): NotificationItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(notificationsKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as NotificationItem[]) : null;
  } catch {
    return null;
  }
}

function safeSaveNotifications(next: NotificationItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(notificationsKey, JSON.stringify(next));
  } catch {
    /* */
  }
}

function safeLoadShares(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(sharesKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function safeSaveShares(next: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(sharesKey, JSON.stringify(next));
  } catch {
    /* */
  }
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type ShareCounts = Record<string, number>;

export type InteractionsState = {
  hydrated: boolean;
  likedPostIds: string[];
  followingByUserId: Record<string, string[]>;
  commentsByPostId: Record<string, InteractionComment[]>;
  notifications: NotificationItem[];
  shareCountsByPostId: ShareCounts;
  savedPostIds: string[];
  savedCreatorIds: string[];
  savedMoodBoardIds: string[];

  reconcileFollowingGraph: () => void;

  isLiked: (postId: string) => boolean;
  isSaved: (postId: string) => boolean;
  isFollowing: (creatorId: string) => boolean;
  getComments: (postId: string) => InteractionComment[];

  getFollowerCount: (creatorId: string) => number;
  getFollowingCount: (creatorId: string) => number;
  listFollowerIds: (creatorId: string) => string[];
  listFollowingIds: (creatorId: string) => string[];
  getMeFollowingIds: () => string[];
  getFollowerCountsMap: () => Record<string, number>;

  toggleFollow: (creatorId: string) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  markNotificationRead: (notificationId: string) => void;
  sharePost: (postId: string, kind?: string) => void;
  pushNotification: (item: NotificationItem) => void;

  saveMoodBoard: (moodBoardId: string) => void;
  unsaveMoodBoard: (moodBoardId: string) => void;
  saveCreator: (creatorId: string) => void;
  unsaveCreator: (creatorId: string) => void;
};

export const useInteractionsStore = create<InteractionsState>()((set, get) => {
  const likedPostIds: string[] = [];
  const commentsByPostId = {} as Record<string, InteractionComment[]>;
  const savedPostIds: string[] = [];
  const savedCreatorIds: string[] = [];
  const savedMoodBoardIds: string[] = [];
  const notifications = [...seedNotifications];
  const shareCountsByPostId = {} as ShareCounts;

  const hydrateFromLocalStorage = () => {
    if (typeof window === "undefined") return;

    const my = me();
    const savedGraph = safeLoadFollowingGraph();
    let graph: Record<string, string[]>;
    if (savedGraph) {
      graph = normalizeFollowingGraph(savedGraph);
    } else {
      graph = cloneFollowingGraph();
      const legacyFollowed = safeLoadIds(followedKey);
      if (legacyFollowed.length && my) {
        graph = mergeLegacyMeFollowing(graph, my, legacyFollowed);
      }
      safeSaveFollowingGraph(graph);
    }
    if (my) safeSaveIds(followedKey, graph[my] ?? []);

    const nextLiked = safeLoadIds(likedKey);
    const nextComments = safeLoadComments();
    const nextSavedPosts = loadSavedPostIds();
    const nextSavedCreators = loadSavedCreatorIds();
    const nextSavedBoards = loadSavedMoodBoardIds();
    const existingNotifications = safeLoadNotifications();
    const nextNotifications = existingNotifications ?? seedNotifications;
    const nextShares = safeLoadShares();

    set({
      hydrated: true,
      likedPostIds: nextLiked,
      followingByUserId: graph,
      commentsByPostId: nextComments,
      notifications: nextNotifications,
      shareCountsByPostId: nextShares,
      savedPostIds: nextSavedPosts,
      savedCreatorIds: nextSavedCreators,
      savedMoodBoardIds: nextSavedBoards,
    });
  };

  if (typeof window !== "undefined") {
    setTimeout(() => hydrateFromLocalStorage(), 0);
  }

  function persistSnapshot(next: Partial<InteractionsState>) {
    if (typeof window === "undefined") return;
    if (next.likedPostIds) safeSaveIds(likedKey, next.likedPostIds);
    if (next.commentsByPostId) safeSaveComments(next.commentsByPostId);
    if (next.notifications) safeSaveNotifications(next.notifications);
    if (next.shareCountsByPostId) safeSaveShares(next.shareCountsByPostId);
    if (next.savedPostIds) saveSavedPostIds(next.savedPostIds);
    if (next.savedCreatorIds) saveSavedCreatorIds(next.savedCreatorIds);
    if (next.savedMoodBoardIds) saveSavedMoodBoardIds(next.savedMoodBoardIds);
  }

  function persistFollowGraph(graph: Record<string, string[]>) {
    const normalized = normalizeFollowingGraph(graph);
    safeSaveFollowingGraph(normalized);
    const my = me();
    if (my) safeSaveIds(followedKey, normalized[my] ?? []);
  }

  return {
    hydrated: false,
    likedPostIds,
    followingByUserId: initialFollowingByUserId,
    commentsByPostId,
    notifications,
    shareCountsByPostId,
    savedPostIds,
    savedCreatorIds,
    savedMoodBoardIds,

    reconcileFollowingGraph: () => {
      const cur = get().followingByUserId;
      const next = cloneFollowingGraph(cur);
      set({ followingByUserId: next });
      persistFollowGraph(next);
    },

    isLiked: (postId) => get().likedPostIds.includes(postId),
    isSaved: (postId) => get().savedPostIds.includes(postId),
    isFollowing: (creatorId) => (get().followingByUserId[me()] ?? []).includes(creatorId),
    getComments: (postId) => get().commentsByPostId[postId] ?? EMPTY_COMMENTS,

    getFollowerCount: (creatorId) => countFollowers(creatorId, get().followingByUserId),
    getFollowingCount: (creatorId) => (get().followingByUserId[creatorId] ?? []).length,
    listFollowerIds: (creatorId) => listFollowerIds(creatorId, get().followingByUserId),
    listFollowingIds: (creatorId) => [...(get().followingByUserId[creatorId] ?? [])],
    getMeFollowingIds: () => [...(get().followingByUserId[me()] ?? [])],
    getFollowerCountsMap: () => computeFollowerCounts(get().followingByUserId),

    toggleFollow: (creatorId) => {
      const myId = me();
      if (!myId || creatorId === myId) return;
      const token = useAuthStore.getState().token;
      if (token) {
        void (async () => {
          const r = await fetch("/api/nomi/following", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ targetId: creatorId }),
          });
          if (!r.ok) return;
          const { followingIds } = (await r.json()) as { followingIds: string[] };
          const graph = normalizeFollowingGraph({
            ...get().followingByUserId,
            [myId]: followingIds,
          });
          set({ followingByUserId: graph });
          persistFollowGraph(graph);

          const followed = getCreatorByIdResolved(creatorId);
          if (followed && followingIds.includes(creatorId)) {
            const addNoti: NotificationItem = {
              id: createId("n"),
              type: "follow",
              actor: followed,
              message: `You're now following @${followed.username}`,
              time: "now",
              read: false,
            };
            const updated = [addNoti, ...get().notifications];
            set({ notifications: updated });
            persistSnapshot({ notifications: updated });
          }
        })();
        return;
      }

      const graph = normalizeFollowingGraph({ ...get().followingByUserId });
      const cur = graph[myId] ?? [];
      const wasFollowing = cur.includes(creatorId);
      const nextMe = wasFollowing
        ? cur.filter((id) => id !== creatorId)
        : [creatorId, ...cur.filter((id) => id !== creatorId)];
      graph[myId] = nextMe;
      set({ followingByUserId: graph });
      persistFollowGraph(graph);

      const followed = getCreatorByIdResolved(creatorId);
      if (followed && !wasFollowing) {
        const addNoti: NotificationItem = {
          id: createId("n"),
          type: "follow",
          actor: followed,
          message: `You're now following @${followed.username}`,
          time: "now",
          read: false,
        };
        const updated = [addNoti, ...get().notifications];
        set({ notifications: updated });
        persistSnapshot({ notifications: updated });
      }
    },

    toggleLike: (postId) => {
      const post = selectPostByIdMerged(postId);
      const creator = post ? getCreatorByIdResolved(post.creatorId) : null;
      const currently = get().likedPostIds;
      const willLike = !currently.includes(postId);
      const next = willLike ? [postId, ...currently] : currently.filter((id) => id !== postId);
      set({ likedPostIds: next });
      persistSnapshot({ likedPostIds: next });

      const myId = me();
      if (willLike && post && creator && myId) {
        const actor = getCreatorByIdResolved(myId);
        if (!actor) return;
        const updatedNoti: NotificationItem = {
          id: createId("n"),
          type: "like",
          actor,
          message: `liked ${creator.displayName}'s signal`,
          time: "now",
          read: false,
          postId: postId,
        };
        const updated = [updatedNoti, ...get().notifications];
        set({ notifications: updated });
        persistSnapshot({ notifications: updated });
      }
    },

    toggleSave: (postId) => {
      const currently = get().savedPostIds;
      const willSave = !currently.includes(postId);
      const next = willSave ? [postId, ...currently] : currently.filter((id) => id !== postId);
      set({ savedPostIds: next });
      persistSnapshot({ savedPostIds: next });
    },

    addComment: (postId, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const myId = me();
      if (!myId) return;
      const u = getCreatorByIdResolved(myId);
      if (!u) return;

      const newComment: InteractionComment = {
        id: createId("cm"),
        postId,
        userId: myId,
        text: trimmed,
        createdAt: Date.now(),
      };

      const existing = get().commentsByPostId[postId] ?? [];
      const nextComments = [...existing, newComment];
      const nextMap = { ...get().commentsByPostId, [postId]: nextComments };
      set({ commentsByPostId: nextMap });
      persistSnapshot({ commentsByPostId: nextMap });

      const post = selectPostByIdMerged(postId);
      const updatedNoti: NotificationItem = {
        id: createId("n"),
        type: "comment",
        actor: u,
        message: `commented on ${post?.category ?? "a signal"}`,
        time: "now",
        read: false,
        postId,
      };
      const updated = [updatedNoti, ...get().notifications];
      set({ notifications: updated });
      persistSnapshot({ notifications: updated });
    },

    markNotificationRead: (notificationId) => {
      const updated = get().notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
      set({ notifications: updated });
      persistSnapshot({ notifications: updated });
    },

    sharePost: (postId) => {
      const current = get().shareCountsByPostId;
      const nextCount = (current[postId] ?? 0) + 1;
      const next = { ...current, [postId]: nextCount };
      set({ shareCountsByPostId: next });
      persistSnapshot({ shareCountsByPostId: next });
    },

    pushNotification: (item) => {
      const updated = [item, ...get().notifications];
      set({ notifications: updated });
      persistSnapshot({ notifications: updated });
    },

    saveMoodBoard: (moodBoardId) => {
      const cur = get().savedMoodBoardIds;
      if (cur.includes(moodBoardId)) return;
      const next = [moodBoardId, ...cur];
      set({ savedMoodBoardIds: next });
      persistSnapshot({ savedMoodBoardIds: next });
    },

    unsaveMoodBoard: (moodBoardId) => {
      const cur = get().savedMoodBoardIds;
      const next = cur.filter((id) => id !== moodBoardId);
      set({ savedMoodBoardIds: next });
      persistSnapshot({ savedMoodBoardIds: next });
    },

    saveCreator: (creatorId) => {
      const cur = get().savedCreatorIds;
      if (cur.includes(creatorId)) return;
      const next = [creatorId, ...cur];
      set({ savedCreatorIds: next });
      persistSnapshot({ savedCreatorIds: next });
    },

    unsaveCreator: (creatorId) => {
      const cur = get().savedCreatorIds;
      const next = cur.filter((id) => id !== creatorId);
      set({ savedCreatorIds: next });
      persistSnapshot({ savedCreatorIds: next });
    },
  };
});
