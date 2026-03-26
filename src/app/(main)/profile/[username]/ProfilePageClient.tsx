"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "./ProfileTabs";
import { getMoodBoardsForCreator } from "@/lib/mock-data";
import { isSelfProfileSlug, resolveProfileCreator } from "@/lib/profile/meCreator";
import { useAccountRegistryStore } from "@/lib/accounts/registryStore";
import { useFeedCatalogStore } from "@/lib/feed/feedCatalogStore";
import type { Creator, Post } from "@/lib/types";

export function ProfilePageClient() {
  const params = useParams();
  const raw = params?.username;
  const username = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] ?? "" : "";

  const [profileEpoch, setProfileEpoch] = useState(0);
  useEffect(() => {
    const onProfile = () => setProfileEpoch((n) => n + 1);
    window.addEventListener("nomi-self-profile-changed", onProfile);
    return () => window.removeEventListener("nomi-self-profile-changed", onProfile);
  }, []);

  const localCreator = useMemo(() => {
    if (typeof window === "undefined") return null;
    return resolveProfileCreator(username);
  }, [username, profileEpoch]);

  const [remoteCreator, setRemoteCreator] = useState<Creator | null>(null);
  const [fetchDone, setFetchDone] = useState(false);

  useEffect(() => {
    if (localCreator) {
      queueMicrotask(() => {
        setRemoteCreator(null);
        setFetchDone(true);
      });
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setFetchDone(false);
      setRemoteCreator(null);
    });
    (async () => {
      const r = await fetch(`/api/nomi/accounts/by-username/${encodeURIComponent(username)}`);
      if (cancelled) return;
      if (!r.ok) {
        setRemoteCreator(null);
        setFetchDone(true);
        return;
      }
      const data = (await r.json()) as { creator: Creator; posts?: Post[] };
      useAccountRegistryStore.getState().upsert(data.creator);
      const posts = data.posts ?? [];
      if (posts.length) useFeedCatalogStore.getState().mergePosts(posts);
      setRemoteCreator(data.creator);
      setFetchDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [username, profileEpoch, localCreator]);

  const creator = localCreator ?? remoteCreator;

  if (!fetchDone) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-white/50">
        Loading profile…
      </div>
    );
  }

  if (!creator) {
    notFound();
  }

  const isSelf = isSelfProfileSlug(username);
  const boards = getMoodBoardsForCreator(creator.id);

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-8 md:pb-10">
      <ProfileHeader creator={creator} isSelf={isSelf} />
      <ProfileTabs creator={creator} moodBoards={boards} isSelf={isSelf} />
    </div>
  );
}
