export const ORDER_BY = ['recent', 'mostVoted', 'priority'] as const
export type OrderBy = typeof ORDER_BY[number]
export const ORDER_BY_CHOICES: Record<OrderBy, string> = {
  recent: 'Most recent',
  mostVoted: 'Most voted',
  priority: 'Highest Priority',
}

export const STATUS_CHOICES: Record<string, string> = {
  draft: "Draft",
  under_review: "Under Review",
  voting_open: "Voting Open",
  voting_closed: "Voting Closed",
  accepted: "Accepted",
  pending: "Pending Implementation",
  implemented: "Implemented ✔️",
  rejected: "Rejected ❌",
  cancelled: "Cancelled 🚫",
  superseded: "Superseded",
  expired: "Expired ⌛",
  archived: "Archived",
}
