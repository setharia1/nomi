/**
 * Initial follow graph: `followingByUserId[userId]` = creator ids that user follows.
 * One row per seeded creator so normalization stays consistent.
 */
export const INITIAL_FOLLOWING_BY_USER: Record<string, string[]> = {
  c1: [],
  c2: [],
  c3: [],
};
