"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { ThreadPreview } from "@/lib/types";
import { cn } from "@/lib/cn";

export function MessageList({
  threads,
  activeId,
  onSelect,
}: {
  threads: ThreadPreview[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {threads.map((t, i) => {
        const active = t.id === activeId;
        return (
          <motion.button
            key={t.id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(t.id)}
            className={cn("w-full text-left tap-highlight-none", active && "relative")}
          >
            <div
              className={cn(
                "nomi-surface-card flex items-center gap-3 p-2.5 transition-colors",
                active
                  ? "border-cyan-400/28 bg-cyan-500/[0.04]"
                  : "hover:border-white/[0.1]",
              )}
            >
              <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-white/[0.08]">
                <Image
                  src={t.participant.avatarUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white truncate">{t.participant.displayName}</span>
                  <span className="text-[11px] text-white/35 flex-shrink-0">{t.time}</span>
                </div>
                <p className="text-sm text-white/55 truncate mt-0.5">{t.lastMessage}</p>
              </div>
              {t.unread ? (
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.55)]" />
              ) : null}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
