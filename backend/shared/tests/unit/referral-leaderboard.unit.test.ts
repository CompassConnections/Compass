import {getReferralLeaderboard} from 'shared/outreach/referrals'

jest.mock('shared/supabase/init', () => ({createSupabaseDirectClient: () => ({})}))
jest.mock('shared/mobile', () => ({sendMobileNotifications: jest.fn()}))
jest.mock('shared/supabase/notifications', () => ({insertNotificationToSupabase: jest.fn()}))
jest.mock('shared/utils', () => ({getPrivateUser: jest.fn()}))

/**
 * The SQL is not exercised here — a fake `manyOrNone` stands in for it. What is worth pinning down is
 * the shaping either side of it, because that is where the board can lie: dropping the caller's own
 * row, leaking the two bookkeeping columns into the API response, or reporting a total that is really
 * a page size.
 */
const row = (over: Record<string, unknown>) => ({
  userId: 'u',
  name: 'A member',
  username: 'member',
  avatarUrl: 'https://example.com/a.jpg',
  direct: 1,
  latestReferralTime: '2026-01-01T00:00:00.000Z',
  rank: 1,
  visibility: 'public',
  rn: '1',
  totalReferrers: '3',
  ...over,
})

const pgReturning = (rows: unknown[]) => ({manyOrNone: async () => rows}) as any

describe('getReferralLeaderboard', () => {
  it('cuts the board at the limit and never returns the bookkeeping columns', async () => {
    const board = await getReferralLeaderboard(
      'viewer',
      2,
      pgReturning([
        row({userId: 'a', rank: 1, rn: '1', direct: 9}),
        row({userId: 'b', rank: 2, rn: '2', direct: 4}),
      ]),
    )

    expect(board.entries.map((e) => e.userId)).toEqual(['a', 'b'])
    expect(board.entries[0]).not.toHaveProperty('rn')
    expect(board.entries[0]).not.toHaveProperty('totalReferrers')
    expect(board.entries[0]).not.toHaveProperty('visibility')
  })

  // The one row the query is asked for out of order. It comes back past the cut, so it must not be
  // counted as part of the board — and must still be found, or a member outside the top N would open
  // a page that never mentions them.
  it('keeps the caller out of the listed entries but still reports their place', async () => {
    const board = await getReferralLeaderboard(
      'viewer',
      2,
      pgReturning([
        row({userId: 'a', rank: 1, rn: '1', direct: 9}),
        row({userId: 'b', rank: 2, rn: '2', direct: 4}),
        row({userId: 'viewer', rank: 57, rn: '57', direct: 1}),
      ]),
    )

    expect(board.entries.map((e) => e.userId)).toEqual(['a', 'b'])
    expect(board.you).toMatchObject({userId: 'viewer', rank: 57, direct: 1})
  })

  // Same row, two jobs: highlighted in place rather than pinned a second time below the list.
  it('reports the caller from the listed entries when they are on the board', async () => {
    const board = await getReferralLeaderboard(
      'viewer',
      2,
      pgReturning([
        row({userId: 'viewer', rank: 1, rn: '1', direct: 9}),
        row({userId: 'b', rank: 2, rn: '2', direct: 4}),
      ]),
    )

    expect(board.entries).toHaveLength(2)
    expect(board.you).toMatchObject({userId: 'viewer', rank: 1})
  })

  it('reports no place at all for a member who has referred nobody', async () => {
    const board = await getReferralLeaderboard(
      'viewer',
      2,
      pgReturning([row({userId: 'a', rank: 1, rn: '1', direct: 9})]),
    )

    expect(board.you).toBeNull()
    expect(board.totalReferrers).toBe(3)
  })

  // The endpoint is public, so most callers are anonymous and most rows are gated — `visibility`
  // defaults to 'member'. The board still names them; it just does not hand over the photo.
  it('withholds the photo of a members-only profile from a signed-out reader', async () => {
    const board = await getReferralLeaderboard(
      undefined,
      2,
      pgReturning([
        row({userId: 'a', rank: 1, rn: '1', visibility: 'member'}),
        row({userId: 'b', rank: 2, rn: '2', visibility: 'public'}),
      ]),
    )

    expect(board.entries[0]).toMatchObject({
      userId: 'a',
      name: 'A member',
      username: 'member',
      avatarUrl: null,
    })
    expect(board.entries[1].avatarUrl).toBe('https://example.com/a.jpg')
    expect(board.you).toBeNull()
  })

  it('gives a signed-in reader the photo of a members-only profile', async () => {
    const board = await getReferralLeaderboard(
      'viewer',
      2,
      pgReturning([row({userId: 'a', rank: 1, rn: '1', visibility: 'member'})]),
    )

    expect(board.entries[0].avatarUrl).toBe('https://example.com/a.jpg')
  })

  // `count(*) over ()` rides on the rows, so an empty result carries it nowhere.
  it('reports zero referrers on an empty board rather than NaN', async () => {
    const board = await getReferralLeaderboard(undefined, 2, pgReturning([]))

    expect(board).toEqual({entries: [], you: null, totalReferrers: 0})
  })
})
