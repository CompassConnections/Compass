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
