"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { PostDraft } from "@/lib/create/types";
import { loadDrafts, deleteDraft } from "@/lib/create/drafts";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlowButton } from "@/components/ui/GlowButton";
import { feedTabLabels } from "@/lib/mock-data";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<PostDraft[]>(() => loadDrafts());

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <PageHeader
        kicker="Studio"
        title="Drafts"
        description="In-progress signals — resume anytime, publish when it feels right."
      />

      {drafts.length === 0 ? (
        <div className="nomi-surface-card px-6 py-10 text-center">
          <p className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">No drafts yet</p>
          <p className="mt-2 text-sm text-white/55">
            Save from any step. Heavy video may ask you to reattach — still quick.
          </p>
          <div className="mt-5">
            <Link href="/create">
              <GlowButton type="button">Start a draft</GlowButton>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <GlassPanel className="flex gap-3 border-white/[0.07] p-3.5">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-black">
                  {d.mediaDataUrl ? (
                    d.mediaType === "video" ? (
                      <video src={d.mediaDataUrl} className="h-full w-full object-cover" muted />
                    ) : (
                      <Image src={d.mediaDataUrl} alt="" fill className="object-cover" unoptimized sizes="80px" />
                    )
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white/35 text-xs font-bold">
                      {d.path.replace(/-/g, " ").slice(0, 8)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white/90">
                    {d.title || d.caption || "Untitled draft"}
                  </p>
                  <p className="mt-1 text-[11px] text-white/45">
                    {feedTabLabels[d.feedTab]} · {d.path.replace(/-/g, " ")}
                  </p>
                  <p className="mt-1 text-xs text-white/35">{new Date(d.updatedAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link href={`/create?draft=${encodeURIComponent(d.id)}`}>
                    <GlowButton type="button" className="px-3 py-2 text-xs">
                      Continue
                    </GlowButton>
                  </Link>
                  <GlowButton
                    type="button"
                    variant="ghost"
                    className="px-3 py-2 text-xs"
                    onClick={() => {
                      deleteDraft(d.id);
                      setDrafts(loadDrafts());
                    }}
                    aria-label="Delete draft"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </span>
                  </GlowButton>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

