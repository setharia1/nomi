"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { useInteractionsStore } from "@/lib/interactions/store";

export default function SettingsSavedPage() {
  const savedPostIds = useInteractionsStore((s) => s.savedPostIds);
  const savedMoodBoardIds = useInteractionsStore((s) => s.savedMoodBoardIds);
  const savedCreatorIds = useInteractionsStore((s) => s.savedCreatorIds);

  const counts = {
    posts: savedPostIds.length,
    boards: savedMoodBoardIds.length,
    creators: savedCreatorIds.length,
  };

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <PageHeader
        kicker="Collections"
        title="Saved & collections"
        description="Saved posts, mood boards, and creators — same library as /saved."
      />

      <div className="grid gap-2.5 sm:grid-cols-3">
        <GlassPanel className="border-white/[0.07] p-3.5">
          <p className="nomi-section-label">Posts</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">{counts.posts}</p>
        </GlassPanel>
        <GlassPanel className="border-white/[0.07] p-3.5">
          <p className="nomi-section-label">Mood boards</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">{counts.boards}</p>
        </GlassPanel>
        <GlassPanel className="border-white/[0.07] p-3.5">
          <p className="nomi-section-label">Creators</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">{counts.creators}</p>
        </GlassPanel>
      </div>

      <GlassPanel className="border-white/[0.07] p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white/90">Open your library</p>
            <p className="mt-1 text-sm text-white/45">Curate references like a studio wall.</p>
          </div>
          <Link href="/saved" className="block">
            <GlowButton type="button" className="shrink-0">
              Open
            </GlowButton>
          </Link>
        </div>
      </GlassPanel>
    </div>
  );
}

