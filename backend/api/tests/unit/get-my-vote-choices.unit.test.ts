import {getMyVoteChoices} from 'api/get-my-vote-choices'
import {AuthedUser} from 'api/helpers/endpoint'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'

jest.mock('shared/supabase/init')

describe('getMyVoteChoices', () => {
  let mockPg = {} as any

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {manyOrNone: jest.fn()}
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("returns the caller's own ballots keyed by proposal", async () => {
    ;(mockPg.manyOrNone as jest.Mock).mockResolvedValue([
      {vote_id: 3, choice: 1},
      {vote_id: 7, choice: -1},
    ])

    const result = await getMyVoteChoices({}, {uid: 'me'} as AuthedUser, {} as any)

    expect(mockPg.manyOrNone).toBeCalledWith(sqlMatch('from vote_results where user_id = $1'), [
      'me',
    ])
    expect(result).toEqual({choices: {3: 1, 7: -1}})
  })
})
