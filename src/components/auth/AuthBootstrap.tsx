"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/authStore";
import { useContentMemoryStore } from "@/lib/content/contentMemoryStore";
import { useInteractionsStore } from "@/lib/interactions/store";
import {
  cloneFollowingGraph,
  normalizeFollowingGraph,
} from "@/lib/social/followGraph";
import type { Post } from "@/lib/types";
import { useFeedCatalogStore } from "@/lib/feed/feedCatalogStore";

async function mergeAndSyncPosts(token: string, accountId: string) {
  const remoteRes = await fetch(`/api/nomi/posts?authorId=${encodeURIComponent(accountId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!remoteRes.ok) return;
  const remoteJson = (await remoteRes.json()) as { posts: Post[] };
  const remote = remoteJson.posts ?? [];
  const local = useContentMemoryStore.getState().userPosts;
  const byId = new Map<string, Post>();
  for (const p of remote) byId.set(p.id, p);
  for (const p of local) {
    const o = byId.get(p.id);
    if (!o || (p.publishedAt ?? 0) >= (o.publishedAt ?? 0)) byId.set(p.id, p);
  }
  const merged = [...byId.values()].sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));

  useContentMemoryStore.setState({ userPosts: merged });
  try {
    localStorage.setItem("nomi-user-posts-v1", JSON.stringify(merged));
  } catch {
    /* quota */
  }

  await fetch("/api/nomi/posts", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ posts: merged }),
  }).catch(() => {});

  await useFeedCatalogStore.getState().hydrate();
}

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const ready = useAuthStore((s) => s.ready);
  const account = useAuthStore((s) => s.account);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!ready || !account?.id || !token) return;
    void (async () => {
      const fRes = await fetch("/api/nomi/following", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (fRes.ok) {
        const { followingIds } = (await fRes.json()) as { followingIds: string[] };
        const base = cloneFollowingGraph(useInteractionsStore.getState().followingByUserId);
        base[account.id] = followingIds;
        const normalized = normalizeFollowingGraph(base);
        useInteractionsStore.setState({ followingByUserId: normalized });
        try {
          localStorage.setItem("nomi-following-graph-v1", JSON.stringify(normalized));
          localStorage.setItem("nomi-followed-creator-ids-v1", JSON.stringify(followingIds));
        } catch {
          /* */
        }
        useInteractionsStore.getState().reconcileFollowingGraph();
      }
      await mergeAndSyncPosts(token, account.id);
    })();
  }, [ready, account?.id, token]);

  useEffect(() => {
    if (!ready) return;
    const publicPaths = ["/login", "/signup"];
    if ((!account || !token) && !publicPaths.includes(pathname)) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [ready, account, token, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center nomi-ambient text-sm text-white/55">
        Loading Nomi…
      </div>
    );
  }

  return <>{children}</>;
}
