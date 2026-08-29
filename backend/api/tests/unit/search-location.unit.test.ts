// Only the network call is faked — `normalizeCountry` is the real one, since normalizing the GeoDB
// response is part of what this endpoint is expected to do.
jest.mock('common/geodb', () => ({
  ...jest.requireActual('common/geodb'),
  geodbFetch: jest.fn(),
}))

import {AuthedUser} from 'api/helpers/endpoint'
import {searchLocationEndpoint} from 'api/search-location'
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

      const result = await searchLocationEndpoint(mockBody, mockAuth, mockReq)

      expect(result).toBe(mockReturn)
      expect(geodbModules.geodbFetch).toBeCalledTimes(1)
      expect(geodbModules.geodbFetch).toBeCalledWith(
        expect.stringContaining(
          `/cities?namePrefix=${mockBody.term}&limit=${mockBody.limit}&offset=0&sort=-population`,
        ),
      )
    })
  })

  describe('when GeoDB names the United States', () => {
    it('should rewrite the country onto the spelling profiles store', async () => {
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      ;(geodbModules.geodbFetch as jest.Mock).mockResolvedValue({
        status: 'success',
        data: {
          data: [
            {city: 'Austin', country: 'United States of America'},
            {city: 'Brussels', country: 'Belgium'},
          ],
        },
      })

      const result = await searchLocationEndpoint({term: 'Austin', limit: 2}, mockAuth, mockReq)

      expect((result as any).data.data.map((c: any) => c.country)).toEqual([
        geodbModules.UNITED_STATES,
        'Belgium',
      ])
    })
  })

  describe('when the term contains URL metacharacters', () => {
    it('should encode the term so it cannot inject extra query params', async () => {
      const mockBody = {
        // Tries to override the limit / add params on the external GeoDB request.
        term: 'Paris&limit=1000&sort=name',
        limit: 15,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      ;(geodbModules.geodbFetch as jest.Mock).mockResolvedValue('Pass')

      await searchLocationEndpoint(mockBody, mockAuth, mockReq)

      const calledWith = (geodbModules.geodbFetch as jest.Mock).mock.calls[0][0] as string
      // The injected `&`/`=` must be percent-encoded, not passed through as separators.
      expect(calledWith).toContain('namePrefix=Paris%26limit%3D1000%26sort%3Dname')
      expect(calledWith).toContain('&limit=15&offset=0&sort=-population')
      // Exactly one real `limit=` param (ours), not the injected one.
      expect(calledWith.match(/&limit=/g)).toHaveLength(1)
    })
  })
})
