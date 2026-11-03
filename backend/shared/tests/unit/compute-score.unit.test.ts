import * as factors from 'common/profiles/compatibility-factors'
import {recomputeCompatibilityScoresForUser} from 'shared/compatibility/compute-scores'
import * as supabaseInit from 'shared/supabase/init'

jest.mock('shared/supabase/init')
jest.mock('common/profiles/compatibility-factors')

const scored = (score: number, prompt?: {score: number; low: number; high: number}) =>
  ({
    kind: 'scored',
    score,
    low: 0.5,
    high: 0.9,
    sharedAnswers: prompt ? 3 : 0,
    confidence: 'low',
    prompt,
    factors: {},
  }) as unknown as factors.ScoredCompatibility

const dealbreaker = (key: string) => ({kind: 'dealbreaker', dealbreakers: [key]})

describe('recomputeCompatibilityScoresForUser', () => {
  let mockPg: any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      none: jest.fn().mockResolvedValue(null),
      manyOrNone: jest.fn().mockResolvedValue([]),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockUser = {userId: '123'}
  const answersSelf = [{question_id: 1, importance: 1, multiple_choice: 0, pref_choices: [0, 1]}]
  // What the one query returns: the user's own row and every member with no dealbreaker against
  // them, each with their answers and option labels already attached.
  const me = {
    id: 10,
    user_id: '123',
    gender: 'female',
    eligible: true,
    answers: answersSelf,
    interests_names: ['Chess'],
    causes_names: [],
    work_names: [],
  }
  const candidate = (id: number, extra: object = {}) => ({
    id,
    user_id: String(id),
    gender: 'male',
    eligible: true,
    answers: [],
    interests_names: [],
    causes_names: [],
    work_names: [],
    ...extra,
  })
  const loaded = [candidate(1), me, candidate(2), candidate(3, {eligible: false})]

  const arrange = () => mockPg.manyOrNone.mockResolvedValueOnce(loaded)

  it('reads everything in one query, scores every candidate in memory, and writes in one statement', async () => {
    arrange()
    ;(factors.getOverallCompatibility as jest.Mock).mockReturnValue(
      scored(0.7, {score: 0.6, low: 0.4, high: 0.8}),
    )

    const results = await recomputeCompatibilityScoresForUser(mockUser.userId)

    expect(mockPg.manyOrNone).toBeCalledTimes(1)
    const [readSql, readParams] = mockPg.manyOrNone.mock.calls[0]
    // The scored columns only, never the whole row; answers and labels ride along as columns.
    expect(readSql).toContain('p.city_latitude')
    expect(readSql).not.toContain('p.*,')
    expect(readSql).toContain('from compatibility_answers a')
    expect(readSql).not.toContain('explanation')
    expect(readSql).toContain('as interests_names')
    expect(readSql).toContain('as work_names')
    // Eligibility and the four dealbreakers are the database's filter.
    expect(readSql).toContain('(me.eligible or (p.looking_for_matches')
    expect(readSql).toContain('me.pref_gender[1]')
    expect(readSql).toContain('me.pref_relation_styles && p.pref_relation_styles')
    expect(readSql).toContain('me.pref_romantic_styles && p.pref_romantic_styles')
    expect(readSql).toContain('abs(me.wants_kids_strength - p.wants_kids_strength) > $(tolerance)')
    expect(readParams).toEqual({user_id: '123', tolerance: 2})

    expect(factors.getOverallCompatibility).toBeCalledTimes(3)
    // The row itself carries the labels and the answers the scorer reads; self goes in as A.
    const [self, other, prompt] = (factors.getOverallCompatibility as jest.Mock).mock.calls[0]
    expect(self.user_id).toBe('123')
    expect(self.interests_names).toEqual(['Chess'])
    expect(other.user_id).toBe('1')
    expect(prompt.answersA).toBe(answersSelf)
    expect(prompt.answersB).toEqual([])

    // Canonical pair order, the overall with its noise, then the range and the prompt triple.
    expect(results?.[0][0]).toEqual('1')
    expect(results?.[0][1]).toEqual('123')
    expect(results?.[0][2]).toBeCloseTo(0.7, 2)
    expect(results?.[0].slice(3)).toEqual([0.5, 0.9, 3, 0.6, 0.4, 0.8])

    // One statement: drop every row of the user's that was not kept, upsert the kept ones, the
    // rows travelling as one array per column.
    expect(mockPg.none).toBeCalledTimes(1)
    const [writeSql, writeParams] = mockPg.none.mock.calls[0]
    expect(writeSql).toContain('delete from compatibility_scores')
    expect(writeSql).toContain('user_id_2 <> all ($2)')
    expect(writeSql).toContain('insert into compatibility_scores')
    expect(writeSql).toContain('unnest($3::text[], $4::text[], $5::real[]')
    expect(writeSql).toContain('on conflict (user_id_1, user_id_2)')
    expect(writeParams[0]).toEqual('123')
    expect(writeParams[1]).toEqual(['1', '2', '3'])
    expect(writeParams).toHaveLength(2 + 9)
    // Canonical order: '123' sorts before '2' and '3', after '1'.
    expect(writeParams[2]).toEqual(['1', '123', '123'])
    expect(writeParams[3]).toEqual(['123', '2', '3'])
    expect(writeParams[7]).toEqual([3, 3, 3])
  })

  it('writes nulls for the prompt columns when the pair shares no answered prompt', async () => {
    arrange()
    ;(factors.getOverallCompatibility as jest.Mock).mockReturnValue(scored(0.55))

    const results = await recomputeCompatibilityScoresForUser(mockUser.userId)

    expect(results?.[0].slice(5)).toEqual([0, null, null, null])
    expect(mockPg.none.mock.calls[0][1][8]).toEqual([null, null, null])
  })

  it('keeps only the pairs the scorer accepts, and drops the rest', async () => {
    arrange()
    // The SQL filter is the same rule; the scorer still has the final say on every row it admits.
    ;(factors.getOverallCompatibility as jest.Mock)
      .mockReturnValueOnce(dealbreaker('connection_type'))
      .mockReturnValueOnce(scored(0.8))
      .mockReturnValueOnce(dealbreaker('gender'))

    const results = await recomputeCompatibilityScoresForUser(mockUser.userId)

    expect(results).toHaveLength(1)
    expect(results?.[0][0]).toEqual('123')
    expect(results?.[0][1]).toEqual('2')
    expect(mockPg.none.mock.calls[0][1][1]).toEqual(['2'])
  })

  it('still drops every old row when nothing is kept', async () => {
    arrange()
    ;(factors.getOverallCompatibility as jest.Mock).mockReturnValue(dealbreaker('monogamy'))

    const results = await recomputeCompatibilityScoresForUser(mockUser.userId)

    expect(results).toHaveLength(0)
    const [, writeParams] = mockPg.none.mock.calls[0]
    expect(writeParams[1]).toEqual([])
    expect(writeParams.slice(2)).toEqual(Array(9).fill([]))
  })

  it('throws an error if there is no profile matching the user Id', async () => {
    mockPg.manyOrNone.mockResolvedValueOnce([])
    await expect(recomputeCompatibilityScoresForUser(mockUser.userId)).rejects.toThrow(
      'Profile not found',
    )
    expect(mockPg.none).not.toBeCalled()
  })
})
