import { safeDecodeURIComponent } from "@/lib/url/safeDecode";

export function slugifyTag(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function topicSlugFromPathSegment(segment: string): string {
  return safeDecodeURIComponent(segment).toLowerCase();
}
