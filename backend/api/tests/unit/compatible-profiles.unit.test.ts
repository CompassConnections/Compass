jest.mock('shared/supabase/init')
jest.mock('api/helpers/profile-visibility')

import {getCompatibleProfiles, getCompatibleProfilesHandler} from 'api/compatible-profiles'
import {AuthedUser} from 'api/helpers/endpoint'
import * as profileVisibility from 'api/helpers/profile-visibility'
import * as supabaseInit from 'shared/supabase/init'

describe('getCompatibleProfilesHandler', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {map: jest.fn().mockResolvedValue([])}
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })

  it('returns no scores for a profile the caller may not read', async () => {
    ;(profileVisibility.canReadProfileContent as jest.Mock).mockResolvedValue(false)

    const result: any = await getCompatibleProfilesHandler(
      {userId: 'them'},
      {uid: 'me'} as AuthedUser,
      {} as any,
    )

    expect(profileVisibility.canReadProfileContent).toBeCalledWith('me', 'them')
    expect(result).toEqual({status: 'success', profileCompatibilityScores: {}})
    expect(mockPg.map).not.toBeCalled()
  })

  it('reads the scores when the caller may', async () => {
    ;(profileVisibility.canReadProfileContent as jest.Mock).mockResolvedValue(true)

    await getCompatibleProfilesHandler({userId: 'them'}, {uid: 'me'} as AuthedUser, {} as any)

    expect(mockPg.map).toBeCalledTimes(1)
  })
})

describe('getCompatibleProfiles', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      map: jest.fn().mockResolvedValue([]),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should successfully get compatible profiles', async () => {
      const mockProps = '123'
      const mockScores = ['abc', {score: 0.69}]
      const mockScoresFromEntries = {abc: {score: 0.69}}

      ;(mockPg.map as jest.Mock).mockResolvedValue([mockScores])

      const results = await getCompatibleProfiles(mockProps)
      const [sql, param, fn] = mockPg.map.mock.calls[0]

      expect(results.status).toEqual('success')
      expect(results.profileCompatibilityScores).toEqual(mockScoresFromEntries)
      expect(mockPg.map).toBeCalledTimes(1)
      expect(sql).toContain('select *')
      expect(sql).toContain('from compatibility_scores')
      expect(param).toStrictEqual([mockProps])
      expect(fn).toEqual(expect.any(Function))
    })
  })
})
