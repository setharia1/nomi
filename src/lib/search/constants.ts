/** Populated from real queries in session; empty default — no filler “trending” strings. */
export const TRENDING_SEARCHES: string[] = [];

/** Empty — topic hubs only appear from real post tags (see Explore topic index). */
export const CURATED_TOPIC_SLUGS: { slug: string; label: string; blurb: string }[] = [];

/** Empty default — no preset “vibe” chips; search uses recents and real catalog. */
export const AESTHETIC_VIBES: { slug: string; label: string }[] = [];
