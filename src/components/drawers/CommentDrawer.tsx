"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { ModalBackdrop } from "@/components/ui/ModalBackdrop";
import { GlowButton } from "@/components/ui/GlowButton";
import type { Post } from "@/lib/types";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";
import { useMeId } from "@/lib/auth/meId";
import { EMPTY_COMMENTS, useInteractionsStore } from "@/lib/interactions/store";

export function CommentDrawer({
  post,
  open,
  onClose,
}: {
  post: Post | null;
  open: boolean;
  onClose: () => void;
}) {
  const meId = useMeId();
  /** Read `commentsByPostId` directly — `getComments` uses `get()` and breaks useSyncExternalStore snapshot stability in selectors. */
  const comments = useInteractionsStore((s) =>
    post?.id ? (s.commentsByPostId[post.id] ?? EMPTY_COMMENTS) : EMPTY_COMMENTS,
  );
  const myCommentCount = useMemo(
    () => comments.filter((c) => meId != null && c.userId === meId).length,
    [comments, meId],
  );

  const addComment = useInteractionsStore((s) => s.addComment);
  const [text, setText] = useState("");

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
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 38 }}
              className="fixed inset-x-0 bottom-0 z-[70] max-h-[85dvh] rounded-t-3xl glass-panel border border-b-0 border-white/15 flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-center py-2">
                <span className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3">
                <div>
                  <p className="font-semibold text-white">Comments</p>
                  <p className="text-xs text-white/45">
                    {comments.length.toLocaleString()} voices · {myCommentCount > 0 ? `${myCommentCount} yours` : "Top signal"}
                  </p>
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
              <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-4">
                {comments.length ? (
                  comments.map((c, i) => {
                    const u = getCreatorByIdResolved(c.userId);
                    if (!u) return null;
                    return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex gap-3"
                  >
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                      <Image
                        src={u.avatarUrl}
                        alt=""
                        fill
                        className="object-cover opacity-80"
                        sizes="36px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold text-white">@{u.username}</span>{" "}
                        <span className="text-white/55">
                          {new Date(c.createdAt).toISOString().slice(11, 16)}Z
                        </span>
                      </p>
                      <p className="text-sm text-white/80 mt-1 leading-relaxed">{c.text}</p>
                    </div>
                  </motion.div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center text-sm text-white/45">
                    No comments yet. Be the first voice.
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-white/10 glass-panel-muted rounded-b-none">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      addComment(post.id, text);
                      setText("");
                    }}
                    className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 glow-focus focus:border-violet-400/35"
                  />
                  <GlowButton
                    type="button"
                    className="px-4 py-3"
                    disabled={!text.trim()}
                    onClick={() => {
                      addComment(post.id, text);
                      setText("");
                    }}
                  >
                    Post
                  </GlowButton>
                </div>
              </div>
            </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
