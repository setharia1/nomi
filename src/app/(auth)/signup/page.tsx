"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/ui/GlowButton";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function SignupPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col px-6 py-10 max-w-lg mx-auto w-full justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-gradient-nomi">
          Join Nomi
        </h1>
        <p className="mt-2 text-white/55 text-sm">
          Ship concepts, remix lineage, grow your audience.
        </p>
      </motion.div>

      <GlassPanel className="p-6 space-y-4">
        {["Display name", "Email", "Password"].map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <label className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">
              {label}
            </label>
            <input
              className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 glow-focus focus:border-violet-400/35 transition-colors"
              placeholder={label === "Email" ? "you@lab.ai" : ""}
              type={label === "Password" ? "password" : label === "Email" ? "email" : "text"}
            />
          </motion.div>
        ))}
        <GlowButton type="button" className="w-full" onClick={() => router.push("/home")}>
          Start creating
        </GlowButton>
        <p className="text-center text-sm text-white/45">
          Already in?{" "}
          <Link href="/login" className="text-violet-300/90 hover:text-violet-200 font-medium">
            Log in
          </Link>
        </p>
      </GlassPanel>
    </div>
  );
}
