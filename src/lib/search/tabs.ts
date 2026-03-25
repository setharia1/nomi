import type { SearchTab } from "./types";

export const SEARCH_TAB_ORDER: SearchTab[] = [
  "top",
  "creators",
  "posts",
  "ai-videos",
  "ai-photos",
  "real-life",
  "topics",
  "concept-drops",
  "boards",
];

export const SEARCH_TAB_LABELS: Record<SearchTab, string> = {
  top: "Top",
  creators: "Creators",
  posts: "Posts",
  "ai-videos": "AI Video",
  "ai-photos": "AI Photo",
  "real-life": "Real Life",
  topics: "Topics",
  "concept-drops": "Concept",
  boards: "Boards",
};

const TAB_SET = new Set<SearchTab>(SEARCH_TAB_ORDER);

export function parseSearchTab(raw: string | null | undefined): SearchTab {
  const v = (raw ?? "top").toLowerCase().trim();
  if (TAB_SET.has(v as SearchTab)) return v as SearchTab;
  return "top";
}
