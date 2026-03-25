import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { LifeBuoy } from "lucide-react";

const items = [
  { title: "Help Center", body: "Creator onboarding, posting, drafts & permissions.", href: "#" },
  { title: "Report a problem", body: "Tell us what broke — we’ll stage a fix.", href: "#" },
  { title: "Community guidelines", body: "Signal quality over spam. Remix culture with respect.", href: "#" },
  { title: "Contact support", body: "Reach a human (mock). Premium response times.", href: "#" },
  { title: "Terms", body: "Clear product rules (mock link).", href: "#" },
  { title: "Privacy policy", body: "Data handling & user controls (mock link).", href: "#" },
];

export default function SettingsHelpPage() {
  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <PageHeader
        kicker="Support"
        title="Help & support"
        description="Guidelines, reporting, and contact — keep posting clean and fast."
      />

      <GlassPanel className="space-y-3 border-white/[0.07] p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LifeBuoy className="h-6 w-6 text-cyan-200/70" />
            <div>
              <p className="text-sm font-semibold text-white/90">Need a hand right now?</p>
              <p className="text-sm text-white/45">Report it and we’ll prioritize the fix (mock).</p>
            </div>
          </div>
          <GlowButton type="button" className="shrink-0" variant="ghost">
            Create ticket
          </GlowButton>
        </div>
      </GlassPanel>

      <section className="grid gap-2.5 sm:grid-cols-2">
        {items.map((it) => (
          <Link key={it.title} href={it.href} className="block">
            <GlassPanel className="border-white/[0.07] p-3.5 transition-colors hover:border-violet-400/22">
              <p className="text-sm font-semibold text-white/92">{it.title}</p>
              <p className="mt-1 text-sm leading-snug text-white/48">{it.body}</p>
              <div className="mt-2.5">
                <GlowButton type="button" variant="ghost" className="w-full">
                  Open
                </GlowButton>
              </div>
            </GlassPanel>
          </Link>
        ))}
      </section>
    </div>
  );
}

