"use client";

import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";

export function MessageComposer() {
  return (
    <motion.div
      layout
      className="nomi-surface-card flex items-end gap-2 p-2.5"
    >
      <textarea
        rows={1}
        placeholder="Message…"
        className="flex-1 max-h-28 resize-none bg-transparent text-sm text-white placeholder:text-white/35 px-2 py-2 glow-focus rounded-lg border border-transparent focus:border-violet-400/30 min-h-[44px]"
      />
      <GlowButton type="button" className="shrink-0 rounded-lg p-2.5">
        <Send className="w-5 h-5" />
      </GlowButton>
    </motion.div>
  );
}
