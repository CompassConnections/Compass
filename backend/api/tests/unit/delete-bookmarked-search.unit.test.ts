import {sqlMatch} from 'common/test-utils'
import {deleteBookmarkedSearch} from 'api/delete-bookmarked-search'
import {AuthedUser} from 'api/helpers/endpoint'
import * as supabaseInit from 'shared/supabase/init'

jest.mock('shared/supabase/init')

describe('deleteBookmarkedSearch', () => {
  let mockPg = {} as any

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      none: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should successfully deletes a bookmarked search', async () => {
      const mockProps = {
        id: 123,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      const result = await deleteBookmarkedSearch(mockProps, mockAuth, mockReq)

      expect(result).toStrictEqual({})
      expect(mockPg.none).toBeCalledTimes(1)
      expect(mockPg.none).toBeCalledWith(sqlMatch('DELETE FROM bookmarked_searches'), [
        mockProps.id,
        mockAuth.uid,
      ])
    })
  })
})
