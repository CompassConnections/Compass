jest.mock('common/geodb')

import {AuthedUser} from 'api/helpers/endpoint'
import {searchLocation} from 'api/search-location'
import * as geodbModules from 'common/geodb'

describe('searchLocation', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should return search location', async () => {
      const mockBody = {
        term: 'mockTerm',
        limit: 15,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockReturn = 'Pass'

      ;(geodbModules.geodbFetch as jest.Mock).mockResolvedValue(mockReturn)

      const result = await searchLocation(mockBody, mockAuth, mockReq)

      expect(result).toBe(mockReturn)
      expect(geodbModules.geodbFetch).toBeCalledTimes(1)
      expect(geodbModules.geodbFetch).toBeCalledWith(
        expect.stringContaining(
          `/cities?namePrefix=${mockBody.term}&limit=${mockBody.limit}&offset=0&sort=-population`,
        ),
      )
    })
  })
})
