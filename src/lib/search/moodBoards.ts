import { creators, moodBoardsByCreator } from "@/lib/mock-data";
import type { BoardHit } from "./types";

export function allMoodBoardsWithCreators(): BoardHit[] {
  const out: BoardHit[] = [];
  for (const c of creators) {
    const boards = moodBoardsByCreator[c.id] ?? [];
    for (const board of boards) {
      out.push({ board, creator: c, score: 0 });
    }
  }
  return out;
}

export function searchMoodBoards(query: string, boards: BoardHit[]): BoardHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return boards;
  return boards
    .map((b) => {
      const hay = `${b.board.title} ${b.creator.displayName} ${b.creator.username}`.toLowerCase();
      let s = 0;
      for (const t of q.split(/\s+/).filter(Boolean)) {
        if (hay.includes(t)) s += 4;
      }
      return { ...b, score: s };
    })
    .filter((b) => b.score > 0)
    .sort((a, b) => b.score - a.score);
}
