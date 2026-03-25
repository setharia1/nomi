"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, X } from "lucide-react";
import { ModalBackdrop } from "@/components/ui/ModalBackdrop";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { Post } from "@/lib/types";

export function PromptRevealModal({
  post,
  open,
  onClose,
}: {
  post: Post | null;
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  const close = () => {
    setCopied(false);
    onClose();
  };

  const hasPrompt = Boolean(post?.prompt?.trim());

  async function copyPrompt() {
    if (!post?.prompt) return;
    try {
      await navigator.clipboard.writeText(post.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && post ? (
        <>
          <ModalBackdrop onClose={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-reveal-title"
            initial={{ opacity: 0, scale: 0.94, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96, y: 10, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-4 top-[10%] z-[70] mx-auto max-w-md"
          >
            <GlassPanel className="glow-edge-selected relative border-cyan-400/20 p-5">
              <button
                type="button"
                onClick={close}
                className="absolute right-4 top-4 rounded-xl p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <h2
                id="prompt-reveal-title"
                className="pr-10 font-[family-name:var(--font-syne)] text-lg font-bold text-gradient-nomi"
              >
                Prompt & process
              </h2>

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-sm font-medium leading-relaxed text-white/50">Primary prompt</p>
                {hasPrompt ? (
                  <button
                    type="button"
                    onClick={copyPrompt}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/75 transition-all hover:border-violet-400/35 hover:text-white"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-cyan-300" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                ) : null}
              </div>
              <div className="mt-2 rounded-xl border border-white/[0.07] bg-black/35 p-4 font-mono text-[13px] leading-relaxed text-white/90">
                {hasPrompt ? post.prompt : "This signal was captured in real life — no diffusion prompt attached."}
              </div>

              <p className="mt-5 text-sm leading-relaxed text-white/50">Notes</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{post.processNotes}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-violet-400/25 bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-100"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
