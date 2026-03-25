import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlowButton } from "@/components/ui/GlowButton";

const items = [
  { href: "/settings/account", title: "Account", subtitle: "Identity, email, sessions, security actions" },
  { href: "/settings/privacy", title: "Privacy", subtitle: "Messaging, comments, remix, prompt reveal controls" },
  { href: "/settings/notifications", title: "Notifications", subtitle: "Likes, follows, mentions, remix activity" },
  { href: "/settings/content", title: "Content & Posting", subtitle: "Defaults for comments, remix, prompt reveal" },
  { href: "/settings/creator-tools", title: "Creator Tools", subtitle: "Performance insights, follower trends, drafts manager" },
  { href: "/settings/saved", title: "Saved & Collections", subtitle: "Your library, mood boards, and saved creators" },
  { href: "/settings/appearance", title: "Appearance", subtitle: "Theme, accent, density, motion preferences" },
  { href: "/settings/security", title: "Security", subtitle: "Two-factor, login activity, account recovery" },
  { href: "/settings/help", title: "Help & Support", subtitle: "Guidelines, report a problem, contact support" },
] as const;

export default function SettingsHubPage() {
  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <PageHeader
        kicker="Account"
        title="Settings"
        description="Identity, privacy, posting defaults, and creator tools — tuned to your craft."
      />

      <section className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className="block">
            <div className="nomi-surface-card hover:border-violet-400/22 p-3.5 transition-colors">
              <p className="text-sm font-semibold text-white/92">{it.title}</p>
              <p className="mt-1 text-sm leading-snug text-white/48">{it.subtitle}</p>
              <div className="mt-2.5">
                <GlowButton type="button" variant="ghost" className="w-full">
                  Open
                </GlowButton>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

