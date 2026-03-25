"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { GlowButton } from "@/components/ui/GlowButton";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function LoginPage() {
  const router = useRouter();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 300], [0, 80]);

  return (
    <div className="flex-1 flex flex-col px-6 py-10 max-w-lg mx-auto w-full justify-center">
      <motion.div style={{ y: heroY }} className="text-center mb-10">
        <motion.h1
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-[family-name:var(--font-syne)] text-5xl sm:text-6xl font-extrabold tracking-tight text-gradient-nomi"
        >
          Nomi
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-3 text-white/55 text-sm tracking-[0.25em] uppercase font-semibold"
        >
          Create. Post. Remix.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-5 text-white/65 text-base leading-relaxed max-w-sm mx-auto"
        >
          The immersive feed for AI-native creators — prompts, lineage, and discovery in one cinematic
          surface.
        </motion.p>
      </motion.div>

      <GlassPanel className="p-6 space-y-4 border-violet-400/15 shadow-[0_0_40px_rgba(139,92,246,0.08)]">
        <div>
          <label className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 glow-focus focus:border-violet-400/35 transition-colors"
            placeholder="you@studio.ai"
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">
            Password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 glow-focus focus:border-cyan-400/35 transition-colors"
            placeholder="••••••••"
          />
        </div>
        <GlowButton
          type="button"
          className="w-full"
          onClick={() => router.push("/home")}
        >
          Enter Nomi
        </GlowButton>
        <p className="text-center text-sm text-white/45">
          New here?{" "}
          <Link href="/signup" className="text-cyan-300/90 hover:text-cyan-200 font-medium">
            Create account
          </Link>
        </p>
      </GlassPanel>

      <p className="text-center text-xs text-white/30 mt-8">
        Prototype — authentication is visual only.
      </p>
    </div>
  );
}
