import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export function CreatorBadge({
  verified,
  premium,
  className,
}: {
  verified?: boolean;
  premium?: boolean;
  className?: string;
}) {
  if (!verified && !premium) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]",
        premium
          ? "border border-cyan-400/20 bg-gradient-to-r from-violet-500/20 to-cyan-500/15 text-cyan-100/95"
          : "border border-white/[0.09] bg-white/[0.06] text-white/80",
        className,
      )}
    >
      {premium ? <Sparkles className="h-2.5 w-2.5 opacity-90" /> : null}
      {premium ? "Premium" : "Verified"}
    </span>
  );
}
