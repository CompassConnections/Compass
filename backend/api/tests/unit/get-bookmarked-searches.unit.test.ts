import {getBookmarkedSearches} from 'api/get-bookmarked-searches'
import {AuthedUser} from 'api/helpers/endpoint'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'

jest.mock('shared/supabase/init')

describe('getBookmarkedSearches', () => {
  let mockPg = {} as any

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {manyOrNone: jest.fn()}
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("returns the caller's own searches and nobody else's", async () => {
    const rows = [
      {id: 2, creator_id: 'me'},
      {id: 1, creator_id: 'me'},
    ]
    ;(mockPg.manyOrNone as jest.Mock).mockResolvedValue(rows)

    const result = await getBookmarkedSearches({}, {uid: 'me'} as AuthedUser, {} as any)

    expect(mockPg.manyOrNone).toBeCalledWith(
      sqlMatch('from bookmarked_searches where creator_id = $1 order by id desc'),
      ['me'],
    )
    expect(result).toEqual({searches: rows})
  })
})
