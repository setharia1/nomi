"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, FileImage, Trash2, Video } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlowButton } from "@/components/ui/GlowButton";
import type { PostDraft } from "@/lib/create/types";
import { deleteDraft, loadDrafts } from "@/lib/create/drafts";
import { feedTabLabels } from "@/lib/mock-data";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<PostDraft[]>(() => loadDrafts());

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <div className="flex items-start gap-3">
        <Link
          href="/create"
          className="tap-highlight-none rounded-lg border border-white/[0.09] bg-black/32 p-2 text-white/65 backdrop-blur-md transition-colors hover:border-white/[0.14] hover:text-white"
          aria-label="Back to Create"
        >
          <ArrowLeft className="h-[1.15rem] w-[1.15rem]" />
        </Link>
        <PageHeader kicker="Studio" title="Drafts" className="min-w-0 flex-1" />
      </div>

      {drafts.length === 0 ? (
        <div className="nomi-surface-card px-6 py-10 text-center">
          <FileImage className="mx-auto h-12 w-12 text-white/25" />
          <p className="mt-4 font-[family-name:var(--font-syne)] text-lg font-bold text-white">
            No drafts yet
          </p>
          <p className="mt-2 text-sm text-white/50">
            Save from any step — we store captions, prompts, and still previews. Heavy video may need
            a quick reattach.
          </p>
          <Link href="/create" className="mt-5 inline-block">
            <GlowButton type="button">Start creating</GlowButton>
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {drafts.map((d, i) => (
            <motion.li
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <GlassPanel className="flex gap-3 border-white/[0.07] p-3.5">
                <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-black">
                  {d.mediaDataUrl ? (
                    d.mediaType === "video" ? (
                      <video src={d.mediaDataUrl} className="h-full w-full object-cover" muted />
                    ) : (
                      <Image src={d.mediaDataUrl} alt="" fill className="object-cover" unoptimized sizes="80px" />
                    )
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-white/35">
                      {d.mediaType === "video" ? <Video className="h-6 w-6" /> : <FileImage className="h-6 w-6" />}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {d.title || d.caption || "Untitled draft"}
                  </p>
                  <p className="mt-1 text-[11px] text-white/45">
                    {feedTabLabels[d.feedTab]} · {d.path.replace(/-/g, " ")}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-white/40">
                    {new Date(d.updatedAt).toLocaleString()}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/create?draft=${encodeURIComponent(d.id)}`}>
                      <GlowButton type="button" className="py-2 text-xs">
                        Continue
                      </GlowButton>
                    </Link>
                    <GlowButton
                      type="button"
                      variant="ghost"
                      className="py-2 text-xs"
                      onClick={() => {
                        deleteDraft(d.id);
                        setDrafts(loadDrafts());
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </span>
                    </GlowButton>
                  </div>
                </div>
              </GlassPanel>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
