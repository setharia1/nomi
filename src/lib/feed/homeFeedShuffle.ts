import type { FeedTab, Post } from "@/lib/types";

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  const rand = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function lastOrderKey(tab: FeedTab): string {
  return `nomi-feed-last-order:${tab}`;
}

function orderSignature(posts: Post[]): string {
  return posts.map((p) => p.id).join("\0");
}

/**
 * Random order per tab; on each navigation / generation change, bias away from repeating
 * the exact sequence from the last client shuffle (same tab, same pool).
 */
export function shuffleHomeFeed(pool: Post[], tab: FeedTab, generation: number): Post[] {
  if (pool.length === 0) return [];
  if (pool.length === 1) return pool;

  if (typeof window === "undefined") {
    return shuffleWithSeed(pool, hashString(`${tab}:${orderSignature(pool)}`));
  }

  const poolSig = pool.map((p) => p.id).sort().join(",");
  const timeOrigin =
    typeof performance !== "undefined" && Number.isFinite(performance.timeOrigin)
      ? Math.floor(performance.timeOrigin)
      : 0;

  let seed = hashString(`${tab}:${poolSig}:${timeOrigin}:${generation}`);
  let order = shuffleWithSeed(pool, seed);
  let sig = orderSignature(order);
  const last = sessionStorage.getItem(lastOrderKey(tab));
  let tries = 0;

  while (last === sig && tries < 72 && pool.length > 1) {
    tries += 1;
    seed = hashString(`${tab}:${poolSig}:${timeOrigin}:${generation}:t${tries}`);
    order = shuffleWithSeed(pool, seed);
    sig = orderSignature(order);
  }

  sessionStorage.setItem(lastOrderKey(tab), sig);
  return order;
}
