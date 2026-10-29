import {getMyStars} from 'api/get-my-stars'
import {AuthedUser} from 'api/helpers/endpoint'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'

jest.mock('shared/supabase/init')

describe('getMyStars', () => {
  let mockPg = {} as any

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {map: jest.fn()}
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("returns the caller's own stars and nobody else's", async () => {
    ;(mockPg.map as jest.Mock).mockResolvedValue(['b', 'a'])

    const result = await getMyStars({}, {uid: 'me'} as AuthedUser, {} as any)

    expect(mockPg.map).toBeCalledWith(
      sqlMatch('from profile_stars where creator_id = $1 order by created_time desc'),
      ['me'],
      expect.any(Function),
    )
    expect(result).toEqual({targetIds: ['b', 'a']})
  })
})
