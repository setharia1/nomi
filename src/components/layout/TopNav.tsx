"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { useInteractionsStore } from "@/lib/interactions/store";

export function TopNav({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "immersive";
}) {
  const unread = useInteractionsStore((s) => s.notifications.filter((n) => !n.read).length);
  const immersive = variant === "immersive";

  return (
    <header className={cn("fixed top-0 inset-x-0 z-50 pt-safe pointer-events-none", className)}>
      <div className="pointer-events-auto mx-2.5 mt-2.5 flex h-11 items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-black/34 px-3 shadow-sm shadow-black/25 backdrop-blur-xl backdrop-saturate-150 sm:mx-3 sm:mt-3">
        <Link href="/home" className="tap-highlight-none flex items-center gap-2">
          <span className="inline-block font-[family-name:var(--font-syne)] text-base font-extrabold tracking-tight text-gradient-nomi">
            Nomi
          </span>
          {!immersive ? (
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.22em] text-white/32 sm:inline">
              Signals
            </span>
          ) : null}
        </Link>
        <div className="flex items-center gap-0">
          <Link
            href="/search"
            className="rounded-lg p-2 text-white/58 transition-colors hover:bg-white/[0.06] hover:text-white tap-highlight-none"
            aria-label="Search"
          >
            <Search className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.75} />
          </Link>
          <Link
            href="/notifications"
            className="relative rounded-lg p-2 text-white/58 transition-colors hover:bg-white/[0.06] hover:text-white tap-highlight-none"
            aria-label="Notifications"
          >
            <Bell className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.75} />
            {unread > 0 ? (
              <motion.span
                layoutId="notif-dot"
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.85)]"
              />
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
