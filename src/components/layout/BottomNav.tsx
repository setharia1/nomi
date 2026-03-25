"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, Home, MessageCircle, Plus, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { useVideoJobsStore } from "@/lib/generation/videoJobsStore";
import { useMyProfileHref } from "@/lib/profile/useMyProfileHref";

const baseItems: {
  href: string;
  label: string;
  Icon: typeof Home;
  center?: boolean;
}[] = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/explore", label: "Explore", Icon: Compass },
  { href: "/create", label: "Create", Icon: Plus, center: true },
  { href: "/messages", label: "Messages", Icon: MessageCircle },
];

export function BottomNav({ floating }: { floating?: boolean }) {
  const pathname = usePathname();
  const profileHref = useMyProfileHref();
  const readyVideos = useVideoJobsStore((s) => s.jobs.filter((j) => j.phase === "ready").length);
  const items = [...baseItems, { href: profileHref, label: "Profile", Icon: User }];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto mx-2.5 mb-2.5 drop-shadow-[0_8px_28px_rgba(0,0,0,0.45)] sm:mx-3 sm:mb-3",
          !floating && "drop-shadow-none",
        )}
      >
        <div
          className={cn(
            "glass-panel relative flex items-center justify-around gap-0.5 rounded-xl px-1.5 py-1.5 shadow-lg shadow-black/40",
            "border-white/[0.07] bg-black/38 backdrop-blur-xl backdrop-saturate-150",
          )}
        >
          {items.map(({ href, label, Icon, center }) => {
            const active =
              pathname === href ||
              (href === "/explore" && (pathname.startsWith("/explore") || pathname.startsWith("/search"))) ||
              (label === "Profile" && pathname.startsWith("/profile/")) ||
              (href !== "/home" &&
                href !== "/create" &&
                href !== "/explore" &&
                label !== "Profile" &&
                pathname.startsWith(href));
            if (center) {
              return (
                <Link key={href} href={href} className="relative -mt-6 flex flex-col items-center tap-highlight-none">
                  <motion.span
                    whileTap={{ scale: 0.94 }}
                    className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/16 text-white glow-cta glow-cta-hover shadow-lg bg-gradient-to-br from-violet-500/95 to-cyan-400/85"
                  >
                    <Icon className="h-6 w-6" strokeWidth={2} />
                    {readyVideos > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500 px-1 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(16,185,129,0.45)]">
                        {readyVideos > 9 ? "9+" : readyVideos}
                      </span>
                    ) : null}
                  </motion.span>
                  <span className="sr-only">{label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-0 rounded-lg px-2.5 py-1.5 tap-highlight-none transition-colors",
                  active ? "text-white" : "text-white/44 hover:text-white/68",
                )}
              >
                <span className="relative">
                  {active ? (
                    <motion.span
                      layoutId="nav-glow"
                      className="absolute -inset-1.5 rounded-lg bg-violet-500/12 blur-md"
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    />
                  ) : null}
                  <Icon className="relative z-10 h-[1.15rem] w-[1.15rem]" strokeWidth={active ? 2.25 : 1.75} />
                </span>
                <span className="text-[9px] font-medium tracking-wide">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
