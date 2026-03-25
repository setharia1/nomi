"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlowButton } from "@/components/ui/GlowButton";
import { feedTabLabels, posts as seedPosts } from "@/lib/mock-data";
import { loadArchivedPostIds, saveArchivedPostIds } from "@/lib/profile/archiveStorage";
import { useContentMemoryStore } from "@/lib/content/contentMemoryStore";

export default function ArchivePage() {
  const hydrate = useContentMemoryStore((s) => s.hydrate);
  const userPosts = useContentMemoryStore((s) => s.userPosts);
  const [archivedIds, setArchivedIds] = useState<string[]>(() => loadArchivedPostIds());

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const archivedPosts = useMemo(() => {
    const all = useContentMemoryStore.getState().mergeWithSeed(seedPosts);
    return all.filter((p) => archivedIds.includes(p.id));
  }, [archivedIds, userPosts]);

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <PageHeader
        kicker="Library"
        title="Archive"
        description="Hide posts from your public profile while keeping them in your library."
      />

      {archivedPosts.length ? (
        <div className="grid grid-cols-3 gap-1.5">
          {archivedPosts.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
            >
              <div className="nomi-surface-card overflow-hidden p-0">
                <Link href={`/post/${p.id}`} className="relative block aspect-square">
                  <Image src={p.imageUrl} alt="" fill className="object-cover" sizes="120px" />
                </Link>
                <div className="space-y-1 p-2.5">
                  <p className="text-sm font-semibold text-white/90 line-clamp-1">{p.caption || p.category}</p>
                  <p className="text-[11px] text-white/45">{feedTabLabels[p.feedTab]}</p>
                  <GlowButton
                    type="button"
                    variant="ghost"
                    className="w-full px-3 py-2 text-xs"
                    onClick={() => {
                      const next = archivedIds.filter((id) => id !== p.id);
                      setArchivedIds(next);
                      saveArchivedPostIds(next);
                    }}
                  >
                    Unarchive
                  </GlowButton>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="nomi-surface-card px-6 py-10 text-center">
          <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">No archived signals</p>
          <p className="mt-2 text-sm text-white/50">Archive a drop from your profile to keep the grid calm.</p>
        </div>
      )}
    </div>
  );
}

