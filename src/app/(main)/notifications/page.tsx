"use client";

import Link from "next/link";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { useInteractionsStore } from "@/lib/interactions/store";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NotificationsPage() {
  const notifications = useInteractionsStore((s) => s.notifications);
  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-4">
      <PageHeader
        title="Notifications"
        description="Signals from your creative graph — likes, follows, and drops in one calm stream."
      />
      {notifications.length ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationCard key={n.id} n={n} />
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-14 text-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 90% 55% at 50% -20%, rgba(139, 92, 246, 0.1), transparent 60%)",
            }}
            aria-hidden
          />
          <p className="relative font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
            All quiet
          </p>
          <p className="relative mx-auto mt-2 max-w-sm text-sm text-white/45">
            Likes, follows, comments, and generation completions land here as real actions happen on your work.
          </p>
          <Link
            href="/home"
            className="relative mt-8 inline-flex rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/88 hover:border-violet-400/35"
          >
            Open feed
          </Link>
        </div>
      )}
    </div>
  );
}
