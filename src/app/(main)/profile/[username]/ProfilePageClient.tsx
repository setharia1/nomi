"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "./ProfileTabs";
import { getMoodBoardsForCreator } from "@/lib/mock-data";
import { isSelfProfileSlug, resolveProfileCreator } from "@/lib/profile/meCreator";

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

  const creator = useMemo(
    () => resolveProfileCreator(username),
    [username, profileEpoch],
  );

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
