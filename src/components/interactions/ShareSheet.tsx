"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, MessageCircle, Sparkles, X } from "lucide-react";
import { ModalBackdrop } from "@/components/ui/ModalBackdrop";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/types";
import { creators, moodBoardsByCreator } from "@/lib/mock-data";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";
import { useInteractionsStore } from "@/lib/interactions/store";

export function ShareSheet({
  post,
  open,
  onClose,
}: {
  post: Post;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const creator = getCreatorByIdResolved(post.creatorId)!;

  const myBoards = useMemo(() => {
    const me = creators[0];
    return moodBoardsByCreator[me.id] ?? [];
  }, []);

  const [boardId, setBoardId] = useState<string>("");

  const sharePost = useInteractionsStore((s) => s.sharePost);
  const saveMoodBoard = useInteractionsStore((s) => s.saveMoodBoard);

  const shareUrl = `/post/${post.id}`;

  if (typeof document === "undefined") return null;

  const close = () => onClose();

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <ModalBackdrop onClose={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-x-4 top-[20%] z-[80] mx-auto max-w-md"
          >
            <GlassPanel className="glow-edge-selected border-cyan-400/15 p-4">
              <div className="flex items-center justify-between gap-3 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-cyan-500/15 text-cyan-100 border border-cyan-400/25">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">Share</p>
                    <p className="text-xs text-white/45">Send this signal anywhere.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-xl p-2 text-white/55 hover:text-white hover:bg-white/10"
                  aria-label="Close share sheet"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <GlowButton
                  type="button"
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`${window.location.origin}${shareUrl}`);
                    } catch {
                      // ignore
                    }
                    sharePost(post.id);
                    onClose();
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy link
                </GlowButton>

                <GlowButton
                  type="button"
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    sharePost(post.id);
                    onClose();
                    router.push(`/messages?participant=${encodeURIComponent(post.creatorId)}`);
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Share to messages
                </GlowButton>

                <GlowButton
                  type="button"
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    sharePost(post.id);
                    onClose();
                    router.push(`/profile/${encodeURIComponent(creator.username)}`);
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  Open creator profile
                </GlowButton>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-3 space-y-2">
                  <p className="text-xs uppercase tracking-wider font-semibold text-white/45">
                    Add to mood board
                  </p>
                  {myBoards.length ? (
                    <>
                      <select
                        value={boardId}
                        onChange={(e) => setBoardId(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white glow-focus"
                      >
                        <option value="">Choose board…</option>
                        {myBoards.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title}
                          </option>
                        ))}
                      </select>
                      <GlowButton
                        type="button"
                        className="w-full justify-center"
                        disabled={!boardId}
                        onClick={() => {
                          if (!boardId) return;
                          saveMoodBoard(boardId);
                          sharePost(post.id);
                          onClose();
                        }}
                      >
                        Save reference
                      </GlowButton>
                    </>
                  ) : (
                    <p className="text-sm text-white/50">No mood boards yet. Create one in the future.</p>
                  )}
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

