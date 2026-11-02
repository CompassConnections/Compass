import * as factors from 'common/profiles/compatibility-factors'
import {Profile} from 'common/profiles/profile'
import {recomputeCompatibilityScoresForUser} from 'shared/compatibility/compute-scores'
import * as profilesSupabaseModules from 'shared/profiles/supabase'
import * as supabaseInit from 'shared/supabase/init'

jest.mock('shared/profiles/supabase')
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

describe('recomputeCompatibilityScoresForUser', () => {
  let mockPg: any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      none: jest.fn().mockResolvedValue(null),
      one: jest.fn().mockResolvedValue(null),
      oneOrNone: jest.fn().mockResolvedValue(null),
      any: jest.fn().mockResolvedValue([]),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
    ;(profilesSupabaseModules.getOptionNamesByProfileId as jest.Mock).mockResolvedValue({})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockUser = {userId: '123'}
  const mockUserProfile = {id: 10, user_id: '123', user: {username: 'me'}} as unknown as Profile
  const mockGenderCompatibleProfiles = [
    {id: 1, user_id: '1', city: 'Mockingdale'},
    {id: 2, user_id: '2', city: 'Mockingdale'},
    {id: 3, user_id: '3', city: 'Velvet Suite'},
  ] as Partial<Profile>[]
  const mockAnswersForUser = [
    {
      created_time: '',
      creator_id: mockUser.userId,
      explanation: '',
      id: 1,
      importance: 1,
      multiple_choice: 0,
      pref_choices: [0, 1],
      question_id: 1,
    },
  ]

  const arrange = () => {
    ;(profilesSupabaseModules.getProfile as jest.Mock).mockResolvedValue(mockUserProfile)
    ;(profilesSupabaseModules.getGenderCompatibleProfiles as jest.Mock).mockResolvedValue(
      mockGenderCompatibleProfiles,
    )
    ;(profilesSupabaseModules.getCompatibilityAnswers as jest.Mock).mockResolvedValue([])
    ;(profilesSupabaseModules.getAnswersForUser as jest.Mock).mockResolvedValue(mockAnswersForUser)
  }

  it('scores every candidate on both profiles and answers, and writes the overall and prompt numbers', async () => {
    arrange()
    ;(factors.getOverallCompatibility as jest.Mock).mockReturnValue(
      scored(0.7, {score: 0.6, low: 0.4, high: 0.8}),
    )

    const results = await recomputeCompatibilityScoresForUser(mockUser.userId)

    expect(profilesSupabaseModules.getProfile).toBeCalledWith(mockUser.userId)
    expect(profilesSupabaseModules.getGenderCompatibleProfiles).toBeCalledWith(mockUserProfile)
    expect(profilesSupabaseModules.getOptionNamesByProfileId).toBeCalledWith([10, 1, 2, 3], mockPg)
    expect(factors.getOverallCompatibility).toBeCalledTimes(mockGenderCompatibleProfiles.length)
    // The option labels ride on the profiles handed to the scorer, and the self answers go in as A.
    const [self, other, prompt] = (factors.getOverallCompatibility as jest.Mock).mock.calls[0]
    expect(self.user_id).toBe('123')
    expect(self.interests_names).toEqual([])
    expect(other.user_id).toBe('1')
    expect(prompt.answersA).toBe(mockAnswersForUser)

    // Canonical pair order, the overall with its noise, then the range and the prompt triple.
    expect(results?.[0][0]).toEqual('1')
    expect(results?.[0][1]).toEqual('123')
    expect(results?.[0][2]).toBeCloseTo(0.7, 2)
    expect(results?.[0].slice(3)).toEqual([0.5, 0.9, 3, 0.6, 0.4, 0.8])

    // No dealbreakers: nothing deleted, one upsert.
    expect(mockPg.none).toBeCalledTimes(1)
    expect(mockPg.none.mock.calls[0][0]).toContain('INSERT INTO compatibility_scores')
    expect(mockPg.none.mock.calls[0][0]).toContain('prompt_score_high = EXCLUDED.prompt_score_high')
  })

  it('writes nulls for the prompt columns when the pair shares no answered prompt', async () => {
    arrange()
    ;(factors.getOverallCompatibility as jest.Mock).mockReturnValue(scored(0.55))

    const results = await recomputeCompatibilityScoresForUser(mockUser.userId)

    expect(results?.[0].slice(5)).toEqual([0, null, null, null])
  })

  it('deletes the rows of pairs a dealbreaker now excludes and keeps the rest', async () => {
    arrange()
    ;(factors.getOverallCompatibility as jest.Mock)
      .mockReturnValueOnce({kind: 'dealbreaker', dealbreakers: ['connection_type']})
      .mockReturnValueOnce(scored(0.8))
      .mockReturnValueOnce({kind: 'dealbreaker', dealbreakers: ['gender']})

    const results = await recomputeCompatibilityScoresForUser(mockUser.userId)

    expect(results).toHaveLength(1)
    expect(results?.[0][0]).toEqual('123')
    expect(results?.[0][1]).toEqual('2')
    const [deleteSql, deleteParams] = mockPg.none.mock.calls[0]
    expect(deleteSql).toContain('delete from compatibility_scores')
    expect(deleteParams).toEqual(['123', ['1', '3']])
    expect(mockPg.none.mock.calls[1][0]).toContain('INSERT INTO compatibility_scores')
  })

  it('throws an error if there is no profile matching the user Id', async () => {
    await expect(recomputeCompatibilityScoresForUser(mockUser.userId)).rejects.toThrow(
      'Profile not found',
    )
    expect(profilesSupabaseModules.getProfile).toBeCalledWith(mockUser.userId)
    expect(profilesSupabaseModules.getProfile).toBeCalledTimes(1)
  })
})
