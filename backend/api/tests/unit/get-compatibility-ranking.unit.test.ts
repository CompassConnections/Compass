jest.mock('shared/supabase/init')
jest.mock('shared/helpers/auth')

import {getCompatibilityRanking} from 'api/get-compatibility-ranking'
import {AuthedUser} from 'api/helpers/endpoint'
import * as auth from 'shared/helpers/auth'
import * as supabaseInit from 'shared/supabase/init'

describe('getCompatibilityRanking', () => {
  let mockPg: any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {map: jest.fn().mockResolvedValue([])}
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })

  it('is admin only', async () => {
    ;(auth.throwErrorIfNotAdmin as jest.Mock).mockRejectedValue(new Error('not admin'))
    await expect(
      getCompatibilityRanking({userId: 'them', limit: 100}, {uid: 'me'} as AuthedUser, {} as any),
    ).rejects.toThrow('not admin')
    expect(mockPg.map).not.toBeCalled()
  })

  it('reads the cache in the order the Compatible sort uses and maps each row', async () => {
    ;(auth.throwErrorIfNotAdmin as jest.Mock).mockResolvedValue(undefined)

    await getCompatibilityRanking({userId: 'them', limit: 50}, {uid: 'me'} as AuthedUser, {} as any)

    const [sql, params, map] = mockPg.map.mock.calls[0]
    expect(sql).toContain('order by coalesce(cs.score_low, cs.score) desc, cs.score desc')
    expect(sql).toContain('cs.score is not null')
    expect(params).toEqual(['them', 50])

    expect(
      map({
        user_id: 'u2',
        name: 'Sam',
        username: 'sam',
        pinned_url: null,
        score: 0.8,
        score_low: 0.6,
        score_high: 0.9,
        shared_answers: 12,
        prompt_score: 0.7,
        prompt_score_low: 0.5,
        prompt_score_high: 0.85,
      }),
    ).toEqual({
      userId: 'u2',
      name: 'Sam',
      username: 'sam',
      avatarUrl: null,
      score: 0.8,
      low: 0.6,
      high: 0.9,
      sharedAnswers: 12,
      confidence: 'medium',
      prompt: {score: 0.7, low: 0.5, high: 0.85},
    })
    // A pair without shared prompts: no prompt score, low confidence.
    expect(
      map({user_id: 'u3', name: 'Al', username: 'al', pinned_url: 'x', score: 0.6}),
    ).toMatchObject({avatarUrl: 'x', confidence: 'low', prompt: undefined})
  })
})
