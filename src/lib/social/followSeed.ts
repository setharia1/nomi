/**
 * Initial follow graph: `followingByUserId[userId]` = creator ids that user follows.
 * Empty by default — follows only appear after real in-app follow actions.
 */
export const INITIAL_FOLLOWING_BY_USER: Record<string, string[]> = {
  c1: [],
};
