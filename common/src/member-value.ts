/**
 * "Value for Compass": how much a member advances the mission of maximising deep connections,
 * whether by forming them, by helping others form them, or by keeping the place alive.
 *
 * Every input is a measured behaviour read from the database; nothing here is a hand-set field, and
 * nothing is decrypted. The score is a weighted sum of saturating components so that one member with
 * ten thousand messages cannot drown the rest of the column, and so each component can be read on its
 * own in the admin table next to the total. The weights are a judgement about the mission, not a
 * fitted model — change them in `MEMBER_VALUE_WEIGHTS` and the whole page follows.
 */

export type MemberValueInput = {
  /** Two-sided conversations with another member (both wrote, founder excluded). */
  conversations: number
  /** Conversations they opened. */
  initiated: number
  /** Conversations they opened that got an answer. */
  initiatedReplied: number
  /** Approximate characters written to other members, all conversations. */
  charsSent: number
  /** Conversations another member opened with them. */
  inbound: number
  /** ...of which they answered. */
  inboundReplied: number
  /** Members who signed up with their referral link. */
  referrals: number
  /** ...of which went on to write to someone. */
  referralsActive: number
  /** `getProfileCompleteness().score`, 0–1. */
  completeness: number
  bioLength: number
  daysSinceLastOnline: number | null
  /** Comments left on other members' profiles. */
  profileComments: number
  voteComments: number
  votesCast: number
  /** Approved testimonials. */
  testimonials: number
  eventsCreated: number
  eventsAttended: number
  donatedCents: number
}

export const MEMBER_VALUE_PARTS = [
  'conversations',
  'outreach',
  'responsiveness',
  'referrals',
  'profile',
  'recency',
  'community',
] as const

export type MemberValuePart = (typeof MEMBER_VALUE_PARTS)[number]

/** Points each component can contribute at most. They sum to 100. */
export const MEMBER_VALUE_WEIGHTS: Record<MemberValuePart, number> = {
  // The mission itself: conversations where both sides wrote. Weighted highest because it is the
  // outcome everything else is a means to.
  conversations: 30,
  // Effort to make connections happen: text written, and openers that landed.
  outreach: 20,
  // Answering people who write to you is the cheapest way to help someone else connect, and not
  // answering is the commonest way a connection dies.
  responsiveness: 10,
  // Bringing people is the one contribution that compounds.
  referrals: 15,
  // A findable, readable profile is the precondition for anyone connecting with them.
  profile: 10,
  // Still here. Past value counts, but a member who left adds nothing from now on.
  recency: 5,
  // Keeping the place itself alive: comments, votes, testimonials, events, money.
  community: 10,
}

export const MEMBER_VALUE_PART_LABELS: Record<MemberValuePart, string> = {
  conversations: 'Conversations',
  outreach: 'Outreach',
  responsiveness: 'Responsiveness',
  referrals: 'Referrals',
  profile: 'Profile',
  recency: 'Recency',
  community: 'Community',
}

export const MEMBER_VALUE_PART_DESCRIPTIONS: Record<MemberValuePart, string> = {
  conversations:
    'Two-sided conversations with another member — both people wrote. Threads with the founder do not count.',
  outreach:
    'Characters written to other members (approximate — measured on the encrypted payload) and conversations they opened that got a reply.',
  responsiveness:
    'Share of conversations others opened with them that they answered. Needs a few inbound threads before it counts fully.',
  referrals:
    'Members who joined from their link, with extra credit when those members went on to write to someone.',
  profile:
    'Profile completeness (the same checks as outreach), plus bio length — full credit from 1,000 characters.',
  recency: 'Last seen online: within a week, a month, a quarter, a year.',
  community:
    'Profile comments, vote comments, votes cast, approved testimonials, events created or attended, and donations.',
}

/** Where each count stops earning more. Chosen so the top decile of a ~1,000-member base saturates. */
export const MEMBER_VALUE_CAPS = {
  conversations: 12,
  charsSent: 30_000,
  initiatedReplied: 8,
  /** Inbound threads needed before the reply rate is trusted in full. */
  inboundForFullTrust: 3,
  referrals: 10,
  referralsActive: 5,
  /** The bio length that earns full profile credit — the ask in the brief. */
  fullBio: 1000,
  communityActions: 20,
  donatedCents: 10_000,
} as const

/**
 * Saturating 0–1 scale: concave, so the second conversation is worth less than the first and the
 * cap is where it reaches 1. `log1p` rather than a hard ratio because every count here has a long
 * tail and a linear scale would hand the whole column to its top entry.
 */
export const saturate = (n: number, cap: number) =>
  n <= 0 ? 0 : Math.min(1, Math.log1p(n) / Math.log1p(cap))

/** Bio credit by length: nothing below the point search can use, full at `fullBio`. */
export const bioCredit = (bioLength: number) => {
  if (bioLength >= MEMBER_VALUE_CAPS.fullBio) return 1
  if (bioLength >= 500) return 0.6
  if (bioLength >= 200) return 0.3
  return 0
}

export const recencyCredit = (daysSinceLastOnline: number | null) => {
  if (daysSinceLastOnline === null) return 0
  if (daysSinceLastOnline <= 7) return 1
  if (daysSinceLastOnline <= 30) return 0.75
  if (daysSinceLastOnline <= 90) return 0.4
  if (daysSinceLastOnline <= 365) return 0.15
  return 0
}

export type MemberValue = {
  /** 0–100. */
  score: number
  /** Points earned per component, each within its weight. */
  parts: Record<MemberValuePart, number>
}

export const getMemberValue = (m: MemberValueInput): MemberValue => {
  const w = MEMBER_VALUE_WEIGHTS
  const c = MEMBER_VALUE_CAPS

  const conversations = w.conversations * saturate(m.conversations, c.conversations)

  const outreach =
    w.outreach *
    (0.5 * saturate(m.charsSent, c.charsSent) +
      0.5 * saturate(m.initiatedReplied, c.initiatedReplied))

  // A perfect rate off one thread is not evidence of anything; scale by how much there is to judge.
  const replyRate = m.inbound > 0 ? m.inboundReplied / m.inbound : 0
  const trust = Math.min(1, m.inbound / c.inboundForFullTrust)
  const responsiveness = w.responsiveness * replyRate * trust

  const referrals =
    w.referrals *
    ((2 / 3) * saturate(m.referrals, c.referrals) +
      (1 / 3) * saturate(m.referralsActive, c.referralsActive))

  const profile = w.profile * (0.6 * m.completeness + 0.4 * bioCredit(m.bioLength))

  const recency = w.recency * recencyCredit(m.daysSinceLastOnline)

  // Testimonials and events weigh double: each is a public act that takes real effort, where a vote
  // is one tap.
  const actions =
    m.profileComments +
    m.voteComments +
    m.votesCast +
    2 * m.testimonials +
    2 * m.eventsCreated +
    m.eventsAttended
  const community =
    w.community *
    (0.7 * saturate(actions, c.communityActions) + 0.3 * saturate(m.donatedCents, c.donatedCents))

  const parts = {conversations, outreach, responsiveness, referrals, profile, recency, community}
  const score = Object.values(parts).reduce((a, b) => a + b, 0)

  return {score, parts}
}

/** One row of the admin ranking: who, the raw measurements, and the score they produce. */
export type MemberValueRow = {
  id: string
  name: string
  username: string
  avatarUrl: string | null
  joinedTime: string
  lastOnlineTime: string | null
  /** `getProfileCompleteness().missing`, so a low profile score says what to ask for. */
  missing: string[]
  input: MemberValueInput
  value: MemberValue
}

export type MemberValueRanking = {
  rows: MemberValueRow[]
  /** When the numbers were computed — the query is heavy enough that this matters. */
  computedAt: string
}
