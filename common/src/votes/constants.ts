export const ORDER_BY = ['recent', 'mostVoted', 'priority'] as const
export type OrderBy = typeof ORDER_BY[number]
export const Constants: Record<OrderBy, string> = {
  recent: 'Most recent',
  mostVoted: 'Most voted',
  priority: 'Highest Priority',
}