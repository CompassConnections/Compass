/**
 * The shape of a referral constellation — everyone who is on Compass because of one member,
 * recursively.
 *
 * Lives in `common` because three places need to agree on it: the recursive walk in
 * `shared/outreach/referrals`, the `get-referral-tree` entry in `api/schema`, and the layout maths in
 * `web/components/referrals`. The tree travels as a **flat list**, not as nested objects: the layout
 * pass wants a flat array anyway, nesting roughly doubles the payload in braces, and a flat list with
 * a `referrerId` cannot be malformed by a truncation the way a nested one can.
 */

export type ReferralTreeNode = {
  id: string
  name: string
  username: string
  avatarUrl: string | null
  joinedTime: string
  /**
   * Who brought them. `null` only for the root of the tree — every other node was, by construction,
   * brought by someone already in the list. Truncation preserves that: nodes are dropped
   * deepest-first, so a node's referrer is always present.
   */
  referrerId: string | null
  /** 0 for the member the tree is drawn around, 1 for the people they invited themselves, and so on. */
  depth: number
}

export type ReferralTreeStats = {
  /** Everyone below the root. Excludes the root itself — you are not one of your own referrals. */
  total: number
  /** People the root invited personally. */
  direct: number
  /** Everyone else: brought by someone the root brought, at any remove. */
  indirect: number
  /** Deepest generation reached, 0 when nobody has been referred yet. */
  maxDepth: number
  /** True when the walk hit `MAX_REFERRAL_TREE_NODES` and the outermost ring is incomplete. */
  truncated: boolean
}

/**
 * Just the numbers, for callers that need the size of a constellation and not the shape of it.
 *
 * Separate from `ReferralTree` because the sidebar badge is on every page: fetching the tree to
 * display one integer means walking the whole thing, joining every member against `users`, and
 * shipping up to two thousand rows of names and avatar URLs to render two characters.
 */
export type ReferralCount = {
  /** Everyone below the member. Excludes themselves. */
  total: number
  /** People they invited personally. */
  direct: number
}

export type ReferralTree = {
  nodes: ReferralTreeNode[]
  stats: ReferralTreeStats
}

/**
 * How far out the walk goes.
 *
 * Not a correctness bound — it is a legibility one. Past eight generations the ring radii stop being
 * distinguishable on a phone and the relationship to the member at the centre stops meaning anything
 * a person would recognise. It doubles as a backstop against a cycle the path-guard somehow missed.
 */
export const MAX_REFERRAL_TREE_DEPTH = 8

/**
 * Hard cap on nodes returned. Sized for the payload and the SVG, not the query — the query would
 * happily return far more. Nodes are dropped deepest-first so the tree stays prefix-closed, and
 * `stats.truncated` tells the page to say so out loud rather than quietly showing a partial sky.
 */
export const MAX_REFERRAL_TREE_NODES = 2000

/**
 * One row of the direct-referral leaderboard.
 *
 * **`direct` only, never the whole tree.** The board ranks people by who they personally brought,
 * which is the only part of a constellation a member actually did. Ranking on the recursive total
 * would mean the top of the board was decided by what the people you invited went on to do — a
 * quantity nobody can influence, that compounds fastest for whoever joined earliest, and that would
 * make the board a seniority list wearing a contest's clothes.
 */
export type ReferralLeaderboardEntry = {
  /**
   * Competition rank: equal counts share a rank and the next one skips (1, 2, 2, 4). Assigned by the
   * query rather than the row's position, so the caller's own row carries a true rank even when it is
   * appended from far down the board.
   */
  rank: number
  userId: string
  name: string
  username: string
  avatarUrl: string | null
  /** People who signed up with this member recorded as their referrer. */
  direct: number
  /** When the most recent of those signed up. Doubles as the tiebreak within a rank. */
  latestReferralTime: string
}

export type ReferralLeaderboard = {
  /** The top of the board, best first. At most `REFERRAL_LEADERBOARD_LIMIT` rows. */
  entries: ReferralLeaderboardEntry[]
  /**
   * The caller's own row, whether or not it is in `entries` — that is the whole point of the board for
   * the person reading it. `null` when they have referred nobody, which is not a rank-zero position but
   * an absence from the ranking altogether.
   */
  you: ReferralLeaderboardEntry | null
  /** How many members have brought at least one person. The denominator behind "#12 of 340". */
  totalReferrers: number
}

/**
 * How many rows the board shows.
 *
 * Long enough that reaching it is a real threshold and short enough that the page is still a page.
 * The caller's own row is fetched regardless of this, so raising it would add names, not usefulness,
 * for anyone below it.
 */
export const REFERRAL_LEADERBOARD_LIMIT = 100
