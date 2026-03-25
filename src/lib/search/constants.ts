/** Populated from real queries in session; empty default — no filler “trending” strings. */
export const TRENDING_SEARCHES: string[] = [];

/** Topic slugs that always appear in discovery (rich hubs) */
export const CURATED_TOPIC_SLUGS: { slug: string; label: string; blurb: string }[] = [
  { slug: "cinematic", label: "Cinematic", blurb: "Noir, neon, and anamorphic glow." },
  { slug: "fashion", label: "Fashion", blurb: "Editorial AI and fabric fantasy." },
  { slug: "fantasy", label: "Fantasy", blurb: "Soft worlds, hard light." },
  { slug: "concept", label: "Concept", blurb: "Rough drops & remix seeds." },
  { slug: "editorial", label: "Editorial", blurb: "Magazine spacing, negative space." },
  { slug: "noir", label: "Noir", blurb: "Rain reads and latent crime." },
];

/** AI aesthetic “vibes” for chips and suggestions */
export const AESTHETIC_VIBES: { slug: string; label: string }[] = [
  { slug: "cinematic-neon", label: "Cinematic neon" },
  { slug: "fashion-editorial", label: "Fashion editorial" },
  { slug: "surreal-nature", label: "Surreal nature" },
  { slug: "sci-fi-environments", label: "Sci-fi environments" },
  { slug: "dreamy-portraiture", label: "Dreamy portraiture" },
  { slug: "toyetic-fantasy", label: "Toyetic fantasy" },
];
