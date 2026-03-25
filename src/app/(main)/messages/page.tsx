"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { threadPreviews } from "@/lib/mock-data";
import { MessageList } from "@/components/messages/MessageList";
import { ChatThread } from "@/components/messages/ChatThread";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { PageHeader } from "@/components/layout/PageHeader";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [active, setActive] = useState<string | null>(() => {
    const participant = searchParams.get("participant");
    if (!participant) return null;
    const match = threadPreviews.find((t) => t.participant.id === participant);
    return match?.id ?? null;
  });

  const thread = threadPreviews.find((t) => t.id === active);

  return (
    <div className="flex min-h-[70dvh] flex-col pb-4">
      <PageHeader
        className="mb-1"
        title="Messages"
        description="Direct threads will appear here as your network grows."
      />

      <div className="flex flex-1 flex-col gap-2.5">
        <AnimatePresence mode="wait">
          {active && thread ? (
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="flex flex-1 flex-col gap-2.5"
            >
              <button
                type="button"
                onClick={() => setActive(null)}
                className="tap-highlight-none flex items-center gap-1.5 self-start py-1 text-sm text-white/52 transition-colors hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Inbox
              </button>
              <div className="nomi-surface-card flex items-center justify-between px-3 py-2.5">
                <div>
                  <p className="font-semibold text-white/95">{thread.participant.displayName}</p>
                  <p className="text-xs text-white/42">@{thread.participant.username}</p>
                </div>
              </div>
              <div className="flex-1 max-h-[45dvh] overflow-y-auto pr-1">
                <ChatThread threadId={active} />
              </div>
              <MessageComposer />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
            >
              {threadPreviews.length ? (
                <MessageList threads={threadPreviews} activeId={active} onSelect={setActive} />
              ) : (
                <div className="nomi-surface-card px-6 py-14 text-center">
                  <p className="font-[family-name:var(--font-syne)] text-base font-semibold text-white">Inbox is ready</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-white/45">
                    No conversations yet — when messaging goes live, threads show up here with full history.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
