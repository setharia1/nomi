"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { NotificationItem } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Heart, MessageCircle, Sparkles, UserPlus, AtSign, Clapperboard } from "lucide-react";
import { useMeId } from "@/lib/auth/meId";
import { useInteractionsStore } from "@/lib/interactions/store";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";

const icon = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
  remix: Sparkles,
  generation_ready: Clapperboard,
};

export function NotificationCard({ n }: { n: NotificationItem }) {
  const meId = useMeId();
  const Icon = icon[n.type];
  const actor =
    meId != null && n.actor.id === meId ? getCreatorByIdResolved(meId) ?? n.actor : n.actor;
  const href =
    n.type === "generation_ready" && n.generationJobId
      ? `/create/ready/${encodeURIComponent(n.generationJobId)}`
      : n.postId
        ? `/post/${n.postId}`
        : `/profile/${encodeURIComponent(actor.username)}`;
  const markNotificationRead = useInteractionsStore((s) => s.markNotificationRead);

  return (
    <motion.div whileHover={{ x: 2 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
      <Link
        href={href}
        className="block tap-highlight-none"
        onClick={() => markNotificationRead(n.id)}
      >
        <div
          className={cn(
            "nomi-surface-card flex items-start gap-3 p-3 transition-colors hover:border-violet-400/22",
            !n.read && "border-violet-400/18 bg-violet-500/[0.03]",
          )}
        >
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-white/[0.08]">
            <Image src={actor.avatarUrl} alt="" fill className="object-cover" sizes="44px" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white/[0.04] p-1 text-violet-200/95">
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span className="text-sm font-semibold text-white/95">{actor.displayName}</span>
              <span className="text-xs text-white/32">{n.time}</span>
            </div>
            <p className="mt-1 text-sm leading-snug text-white/62">{n.message}</p>
          </div>
          {!n.read ? (
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400/95 shadow-[0_0_8px_rgba(56,189,248,0.45)]" />
          ) : null}
        </div>
      </Link>
    </motion.div>
  );
}
