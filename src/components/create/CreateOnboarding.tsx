"use client";

import { motion } from "framer-motion";
import { Clapperboard, Droplets, Sparkles, Upload } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { markCreateOnboardingSeen } from "@/lib/create/drafts";

const items = [
  {
    icon: Clapperboard,
    title: "Record",
    text: "Real-life motion, full-screen, zero friction.",
  },
  {
    icon: Upload,
    title: "Upload",
    text: "Bring finished AI or camera work — we’ll adapt the flow.",
  },
  {
    icon: Sparkles,
    title: "AI Post",
    text: "Prompt lineage, remix permissions, and reveal controls built in.",
  },
  {
    icon: Droplets,
    title: "Concept Drop",
    text: "Ship rough ideas fast — invite remixes without polishing.",
  },
];

export function CreateOnboarding({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/65 px-4 py-8 pb-safe backdrop-blur-md sm:items-center"
    >
      <motion.div
        initial={{ y: 24, opacity: 0, filter: "blur(8px)" }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="w-full max-w-md"
      >
        <GlassPanel className="relative border-violet-400/25 p-6 shadow-[0_0_48px_rgba(139,92,246,0.15)]">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/85">
            First signal
          </p>
          <h2 className="mt-2 text-center font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
            Nomi creates differently
          </h2>
          <p className="mt-2 text-center text-sm text-white/55">
            Four doors into one seamless flow — tuned for AI-native creators and real-life moments.
          </p>
          <ul className="mt-6 space-y-4">
            {items.map((it, i) => (
              <motion.li
                key={it.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 * i }}
                className="flex gap-3 rounded-xl border border-white/[0.07] bg-black/30 p-3"
              >
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-100">
                  <it.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-semibold text-white">{it.title}</p>
                  <p className="text-sm text-white/55 leading-snug">{it.text}</p>
                </div>
              </motion.li>
            ))}
          </ul>
          <GlowButton
            type="button"
            className="mt-6 w-full"
            onClick={() => {
              markCreateOnboardingSeen();
              onDone();
            }}
          >
            Enter studio
          </GlowButton>
          <p className="mt-3 text-center text-[11px] text-white/35">Skips automatically next time.</p>
        </GlassPanel>
      </motion.div>
    </motion.div>
  );
}
