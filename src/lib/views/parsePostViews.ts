import type { Post } from "@/lib/types";
import { formatEngagementCount } from "@/lib/format/count";

/** Numeric baseline from the post's display field (e.g. "1.2M", "840", "0"). */
export function parsePostViewsLabel(views: string): number {
  const s = views.trim().toUpperCase();
  const num = Number(s.replace(/[^\d.]/g, ""));
  if (s.endsWith("M")) return Math.round(num * 1_000_000);
  if (s.endsWith("K")) return Math.round(num * 1_000);
  return Number.isFinite(num) ? Math.floor(num) : 0;
}

export function getTotalPostViews(post: Post, bonusViews: number): number {
  return Math.max(0, parsePostViewsLabel(post.views) + Math.max(0, Math.floor(bonusViews)));
}

export function formatViewLabel(total: number): string {
  return `${formatEngagementCount(total)} views`;
}
