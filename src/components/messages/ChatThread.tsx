"use client";

import { motion } from "framer-motion";
import { threadMessages, threadPreviews } from "@/lib/mock-data";

export function ChatThread({ threadId }: { threadId: string }) {
  const thread = threadPreviews.find((t) => t.id === threadId);
  const msgs = threadMessages[threadId] ?? [];

  if (!thread) return null;

  return (
    <div className="flex flex-col gap-3 pb-4">
      {msgs.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.fromMe
                ? "bg-gradient-to-br from-violet-600/85 to-cyan-600/60 text-white border border-white/15 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                : "glass-panel-muted text-white/85"
            }`}
          >
            {m.text}
            <p className={`text-[10px] mt-1 ${m.fromMe ? "text-white/50" : "text-white/35"}`}>
              {m.time}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
