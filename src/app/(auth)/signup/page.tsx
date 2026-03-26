"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/ui/GlowButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useAuthStore } from "@/lib/auth/authStore";
import { cn } from "@/lib/cn";

export default function SignupPage() {
  const router = useRouter();
  const ready = useAuthStore((s) => s.ready);
  const account = useAuthStore((s) => s.account);
  const registerFn = useAuthStore((s) => s.register);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!account) return;
    router.replace("/home");
  }, [ready, account, router]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setBusy(true);
      try {
        const res = await registerFn({
          email: email.trim().toLowerCase(),
          password,
          username: username.trim().replace(/^@+/, ""),
          displayName: displayName.trim(),
        });
        if (res.error) {
          setError(res.error);
          return;
        }
        router.replace("/home");
      } finally {
        setBusy(false);
      }
    },
    [displayName, username, email, password, registerFn, router],
  );

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-white/55">
        Loading…
      </div>
    );
  }

  if (account) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-white/55">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-gradient-nomi">
          Join Nomi
        </h1>
        <p className="mt-2 text-sm text-white/55">
          One account — searchable @username, reusable sign-in, and posts that follow you across devices
          when Nomi is connected to shared storage.
        </p>
      </motion.div>

      <GlassPanel className="space-y-4 p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              className="glow-focus mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-400/35"
              placeholder="How you appear to others"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="glow-focus mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-400/35"
              placeholder="your_handle (letters, numbers, underscores)"
            />
            <p className="mt-1.5 text-[11px] text-white/35">3–32 characters. This becomes your profile URL.</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              className="glow-focus mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-400/35"
              placeholder="you@lab.ai"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              className="glow-focus mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/35"
              placeholder="At least 8 characters"
            />
          </div>
          {error ? (
            <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100/90">
              {error}
            </p>
          ) : null}
          <GlowButton type="submit" className={cn("w-full", busy && "pointer-events-none opacity-70")}>
            {busy ? "Creating account…" : "Create account"}
          </GlowButton>
        </form>
        <p className="text-center text-sm text-white/45">
          Already in?{" "}
          <Link href="/login" className="font-medium text-violet-300/90 hover:text-violet-200">
            Sign in
          </Link>
        </p>
      </GlassPanel>
    </div>
  );
}
