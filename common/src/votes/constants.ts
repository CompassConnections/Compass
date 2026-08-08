export const ORDER_BY = ['recent', 'mostVoted', 'mostDiscussed', 'priority'] as const
export type OrderBy = (typeof ORDER_BY)[number]
export const ORDER_BY_CHOICES: Record<OrderBy, string> = {
  recent: 'Most recent',
  mostVoted: 'Most voted',
  mostDiscussed: 'Most discussed',
  priority: 'Highest Priority',
}

// A comment's stance on the proposal it's attached to. `null`/undefined means the author didn't pick
// one — a neutral remark. Kept separate from the author's actual vote in `vote_results`: you can
// argue against a proposal you ultimately voted for, and the whole point of the discussion is that
// the two can drift apart before you change your mind.
export const STANCES = ['for', 'against', 'both', 'question', 'answer'] as const
export type Stance = (typeof STANCES)[number]

export const STANCE_CHOICES: Record<Stance, string> = {
  for: 'Argument for',
  against: 'Argument against',
  both: 'Cuts both ways',
  question: 'Question',
  answer: 'Answer',
}

// Only these two get pulled out into the highlighted pair at the top of a thread. 'both' is
// deliberately excluded: a comment that argues each way can't stand in for the case on either side,
// and promoting it would crowd out the one-sided argument a reader actually needs.
export const OPPOSING_STANCES = ['for', 'against'] as const satisfies readonly Stance[]

// Ordered roughly as a proposal moves through its life, because this doubles as the option order in
// the admin status picker. Declared as a tuple so the API schema can validate against it — `status`
// is a free-text column in Postgres, so this list is the only thing standing between a typo and a
// proposal that renders with no pill and can never be voted on again.
export const VOTE_STATUSES = [
  'draft',
  'under_review',
  'voting_open',
  'voting_closed',
  'accepted',
  'pending',
  'implemented',
  'rejected',
  'cancelled',
  'superseded',
  'expired',
  'archived',
] as const
export type VoteStatus = (typeof VOTE_STATUSES)[number]

// Annotated `Record<string, string>` so the many call sites holding a plain `string` status can still
// index it, but `satisfies` makes adding a status to the tuple without a label (or vice versa) a
// compile error.
export const STATUS_CHOICES: Record<string, string> = {
  draft: 'Draft',
  under_review: 'Under Review',
  voting_open: 'Voting Open',
  voting_closed: 'Voting Closed',
  accepted: 'Accepted',
  pending: 'Pending Implementation',
  implemented: 'Implemented ✔️',
  rejected: 'Rejected ❌',
  cancelled: 'Cancelled 🚫',
  superseded: 'Superseded',
  expired: 'Expired ⌛',
  archived: 'Archived',
} satisfies Record<VoteStatus, string>

// Statuses where the discussion is still live. Everything else is settled — the thread stays readable
// but freezes, because arguing with a decision that already shipped should become a new proposal
// rather than a reply nobody who voted will ever see.
export const COMMENTABLE_STATUSES = ['draft', 'under_review', 'voting_open'] as const

export const isCommentable = (status: string | null | undefined) =>
  !!status && (COMMENTABLE_STATUSES as readonly string[]).includes(status)
