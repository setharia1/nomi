"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Wand2, X } from "lucide-react";
import { ModalBackdrop } from "@/components/ui/ModalBackdrop";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import type { Post } from "@/lib/types";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";

function RemixPanel({ post, onClose }: { post: Post; onClose: () => void }) {
  const [seed, setSeed] = useState(() => {
    const t = post.prompt?.trim();
    if (!t) return "";
    return t.length > 120 ? `${t.slice(0, 120)}…` : t;
  });
  const creator = getCreatorByIdResolved(post.creatorId)!;

  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="fixed inset-y-0 right-0 z-[70] w-full max-w-md glass-panel border-l border-white/10 shadow-2xl flex flex-col"
    >
      <div className="flex items-center justify-between p-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-violet-500/20 text-violet-100">
            <Wand2 className="w-5 h-5" />
          </span>
          <div>
            <p className="font-[family-name:var(--font-syne)] font-bold text-white">
              Remix with AI
            </p>
            <p className="text-xs text-white/50">Build on @{creator.username}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <label className="text-[11px] uppercase tracking-wider text-white/45 font-semibold">
            Seed prompt
          </label>
          <textarea
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            rows={6}
            className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 glow-focus resize-none focus:border-violet-400/35 transition-colors"
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider text-white/45 font-semibold">
            Remix direction
          </label>
          <input
            type="text"
            placeholder="e.g. swap palette to dawn, add chromatic rain…"
            className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 glow-focus focus:border-cyan-400/35 transition-colors"
          />
        </div>
        <GlassPanel muted className="p-4 text-sm text-white/60 leading-relaxed">
          Remix lineage stays attributed to the original signal. Nomi tracks creative continuity
          for your feed.
        </GlassPanel>
      </div>
      <div className="p-5 border-t border-white/10 space-y-2">
        <GlowButton type="button" className="w-full">
          Queue remix
        </GlowButton>
        <GlowButton type="button" variant="ghost" className="w-full" onClick={onClose}>
          Cancel
        </GlowButton>
      </div>
    </motion.aside>
  );
}

export function RemixModal({
  post,
  open,
  onClose,
}: {
  post: Post | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  const creator = post ? getCreatorByIdResolved(post.creatorId) : null;

  return createPortal(
    <AnimatePresence>
      {open && post && creator ? (
        <>
          <ModalBackdrop onClose={onClose} />
          <RemixPanel key={post.id} post={post} onClose={onClose} />
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
