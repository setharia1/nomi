"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { GlowButton } from "@/components/ui/GlowButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useAuthStore } from "@/lib/auth/authStore";
import {
  loadLoginIdentifierSnapshot,
  saveLastLoginInput,
} from "@/lib/auth/loginIdentifierStore";
import { cn } from "@/lib/cn";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const nextPath =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/home";

  const ready = useAuthStore((s) => s.ready);
  const account = useAuthStore((s) => s.account);
  const loginFn = useAuthStore((s) => s.login);

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [rememberedIdentifiers, setRememberedIdentifiers] = useState<string[]>(
    [],
  );
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!account) return;
    router.replace(nextPath);
  }, [ready, account, router, nextPath]);

  useEffect(() => {
    const snapshot = loadLoginIdentifierSnapshot();
    const options = [
      ...snapshot.emails,
      ...snapshot.usernames.map((u) => `@${u}`),
    ].filter((value, index, arr) => arr.indexOf(value) === index);
    setRememberedIdentifiers(options.slice(0, 6));
    const suggested =
      snapshot.lastInputIdentifier ??
      snapshot.lastSuccessfulIdentifier ??
      options[0] ??
      "";
    if (suggested) {
      setEmailOrUsername(suggested);
    }
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setBusy(true);
      try {
        const normalizedIdentifier = emailOrUsername.trim();
        saveLastLoginInput(normalizedIdentifier);
        const res = await loginFn(normalizedIdentifier, password);
        if (res.error) {
          setError(res.error);
          return;
        }
        router.replace(nextPath);
      } finally {
        setBusy(false);
      }
    },
    [emailOrUsername, password, loginFn, router, nextPath],
  );

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 300], [0, 80]);

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
      <motion.div style={{ y: heroY }} className="mb-10 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-[family-name:var(--font-syne)] text-5xl font-extrabold tracking-tight text-gradient-nomi sm:text-6xl"
        >
          Nomi
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/55"
        >
          Create. Post. Remix.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mx-auto mt-5 max-w-sm text-base leading-relaxed text-white/65"
        >
          Sign in with the same email or @username you used when you joined — your profile, posts, and
          follows come back with you.
        </motion.p>
      </motion.div>

      <GlassPanel className="space-y-4 border-violet-400/15 p-6 shadow-[0_0_40px_rgba(139,92,246,0.08)]">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Email or username
            </label>
            <input
              value={emailOrUsername}
              onChange={(e) => {
                setEmailOrUsername(e.target.value);
                saveLastLoginInput(e.target.value);
              }}
              autoComplete="username"
              className="glow-focus mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 transition-colors focus:border-violet-400/35"
              placeholder="you@studio.ai or @handle"
            />
            {rememberedIdentifiers.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {rememberedIdentifiers.map((identifier) => (
                  <button
                    key={identifier}
                    type="button"
                    onClick={() => {
                      setEmailOrUsername(identifier);
                      saveLastLoginInput(identifier);
                    }}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/60 transition-colors hover:border-violet-300/40 hover:text-white/90"
                  >
                    {identifier}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              className="glow-focus mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 transition-colors focus:border-cyan-400/35"
              placeholder="••••••••"
            />
          </div>
          {error ? (
            <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100/90">
              {error}
            </p>
          ) : null}
          <GlowButton type="submit" className={cn("w-full", busy && "pointer-events-none opacity-70")}>
            {busy ? "Signing in…" : "Sign in"}
          </GlowButton>
        </form>
        <p className="text-center text-sm text-white/45">
          New here?{" "}
          <Link href="/signup" className="font-medium text-cyan-300/90 hover:text-cyan-200">
            Create account
          </Link>
        </p>
      </GlassPanel>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-white/55">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
