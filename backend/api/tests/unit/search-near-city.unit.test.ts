jest.mock('common/geodb')

import * as citySearchModules from 'api/search-near-city'
import * as geoDbModules from 'common/geodb'
import {AuthedUser} from 'api/helpers/endpoint'

describe('searchNearCity', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should return locations near a city', async () => {
      const mockBody = {
        radius: 123,
        cityId: 'mockCityId',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockReturn = 'Pass'

      ;(geoDbModules.geodbFetch as jest.Mock).mockResolvedValue(mockReturn)

      const result = await citySearchModules.searchNearCity(mockBody, mockAuth, mockReq)

      expect(result).toBe(mockReturn)
      expect(geoDbModules.geodbFetch).toBeCalledTimes(1)
      expect(geoDbModules.geodbFetch).toBeCalledWith(
        expect.stringContaining(
          `/cities/${mockBody.cityId}/nearbyCities?radius=${mockBody.radius}&offset=0&sort=-population&limit=100`,
        ),
      )
    })
  })
})

describe('getNearCity', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should return locations near a city', async () => {
      const mockBody = {
        radius: 123,
        cityId: 'mockCityId',
      }
      const mockReturn = {
        status: 'mockStatus',
        data: {
          data: [{id: 'mockId'}],
        },
      }

      ;(geoDbModules.geodbFetch as jest.Mock).mockResolvedValue(mockReturn)

      const result = await citySearchModules.getNearbyCities(mockBody.cityId, mockBody.radius)

      expect(result).toStrictEqual([mockReturn.data.data[0].id])
      expect(geoDbModules.geodbFetch).toBeCalledTimes(1)
      expect(geoDbModules.geodbFetch).toBeCalledWith(
        expect.stringContaining(
          `/cities/${mockBody.cityId}/nearbyCities?radius=${mockBody.radius}&offset=0&sort=-population&limit=100`,
        ),
      )
    })
  })
})
