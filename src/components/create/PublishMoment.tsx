"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Check, Plus, Share2, Telescope } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function PublishMoment({
  onCreateAnother,
}: {
  onCreateAnother: () => void;
}) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="flex min-h-[60dvh] flex-col items-center justify-center px-4 py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.08 }}
        className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/35 bg-gradient-to-br from-cyan-500/25 to-violet-600/25 shadow-[0_0_48px_rgba(56,189,248,0.25)]"
      >
        <Check className="h-9 w-9 text-cyan-100" strokeWidth={2.5} />
      </motion.div>
      <h2 className="mt-6 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
        Signal live
      </h2>
      <p className="mt-2 max-w-sm text-sm text-white/55">
        Your post is staged for the Nomi network. In production, this would sync to feeds, remix
        graphs, and distribution.
      </p>
      <GlassPanel className="mt-8 w-full max-w-sm space-y-3 border-white/[0.08] p-4">
        <GlowButton
          type="button"
          className="flex w-full items-center justify-center gap-2"
          onClick={() => router.push("/home")}
        >
          <Telescope className="h-4 w-4" />
          View in feed
        </GlowButton>
        <GlowButton type="button" variant="ghost" className="flex w-full items-center justify-center gap-2">
          <Share2 className="h-4 w-4" />
          Share link
        </GlowButton>
        <GlowButton
          type="button"
          variant="ghost"
          className="flex w-full items-center justify-center gap-2"
          onClick={onCreateAnother}
        >
          <Plus className="h-4 w-4" />
          Create another
        </GlowButton>
      </GlassPanel>
    </motion.div>
  );
}

export function PublishProcessing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-6 backdrop-blur-md"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
        className="h-14 w-14 rounded-full border-2 border-violet-400/35 border-t-cyan-300"
      />
      <p className="sr-only">Publishing</p>
    </motion.div>
  );
}
