import {createBookmarkedSearch} from 'api/create-bookmarked-search'
import {AuthedUser} from 'api/helpers/endpoint'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'

jest.mock('shared/supabase/init')

describe('createBookmarkedSearch', () => {
  let mockPg: any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      one: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should insert a bookmarked search into the database', async () => {
      const mockProps = {
        search_filters: 'mock_search_filters',
        location: 'mock_location',
        search_name: 'mock_search_name',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockInserted = 'mockInsertedReturn'

      ;(mockPg.one as jest.Mock).mockResolvedValue(mockInserted)

      const result = await createBookmarkedSearch(mockProps, mockAuth, mockReq)

      expect(result).toBe(mockInserted)
      expect(mockPg.one).toBeCalledTimes(1)
      expect(mockPg.one).toHaveBeenCalledWith(sqlMatch('INSERT INTO bookmarked_searches'), [
        mockAuth.uid,
        mockProps.search_filters,
        mockProps.location,
        mockProps.search_name,
      ])
    })
  })
})
