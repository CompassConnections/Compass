jest.mock('shared/supabase/init')
jest.mock('common/util/try-catch')
jest.mock('shared/supabase/utils')
jest.mock('shared/create-profile-notification')

import {shipProfiles} from 'api/ship-profiles'
import * as supabaseInit from 'shared/supabase/init'
import {tryCatch} from 'common/util/try-catch'
import * as supabaseUtils from 'shared/supabase/utils'
import * as profileNotificationModules from 'shared/create-profile-notification'
import {AuthedUser} from 'api/helpers/endpoint'
import {sqlMatch} from 'common/test-utils'

describe('shipProfiles', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      oneOrNone: jest.fn(),
      none: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should return success if the profile ship already exists', async () => {
      const mockProps = {
        targetUserId1: 'mockTargetUserId1',
        targetUserId2: 'mockTargetUserId2',
        remove: false,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockExisting = {
        data: {ship_id: 'mockShipId'},
        error: null,
      }

      ;(tryCatch as jest.Mock).mockResolvedValue(mockExisting)
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(null)

      const result: any = await shipProfiles(mockProps, mockAuth, mockReq)

      expect(result.status).toBe('success')
      expect(tryCatch).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(sqlMatch('select ship_id from profile_ships'), [
        mockAuth.uid,
        mockProps.targetUserId1,
        mockProps.targetUserId2,
      ])
    })

    it('should return success if trying to remove a profile ship that already exists', async () => {
      const mockProps = {
        targetUserId1: 'mockTargetUserId1',
        targetUserId2: 'mockTargetUserId2',
        remove: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockExisting = {
        data: {ship_id: 'mockShipId'},
        error: null,
      }

      ;(tryCatch as jest.Mock)
        .mockResolvedValueOnce(mockExisting)
        .mockResolvedValueOnce({error: null})
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(null)
      ;(mockPg.none as jest.Mock).mockResolvedValue(null)

      const result: any = await shipProfiles(mockProps, mockAuth, mockReq)

      expect(result.status).toBe('success')
      expect(tryCatch).toBeCalledTimes(2)
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(sqlMatch('select ship_id from profile_ships'), [
        mockAuth.uid,
        mockProps.targetUserId1,
        mockProps.targetUserId2,
      ])
      expect(mockPg.none).toBeCalledTimes(1)
      expect(mockPg.none).toBeCalledWith(sqlMatch('delete from profile_ships where ship_id = $1'), [
        mockExisting.data.ship_id,
      ])
    })

    it('should return success when creating a new profile ship', async () => {
      const mockProps = {
        targetUserId1: 'mockTargetUserId1',
        targetUserId2: 'mockTargetUserId2',
        remove: false,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockExisting = {
        data: null,
        error: null,
      }
      const mockData = {
        created_time: 'mockCreatedTime',
        creator_id: 'mockCreatorId',
        ship_id: 'mockShipId',
        target1_id: 'mockTarget1Id',
        target2_id: 'mockTarget2Id',
      }

      ;(tryCatch as jest.Mock)
        .mockResolvedValueOnce(mockExisting)
        .mockResolvedValueOnce({data: mockData, error: null})
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(null)
      ;(supabaseUtils.insert as jest.Mock).mockReturnValue(null)

      const result: any = await shipProfiles(mockProps, mockAuth, mockReq)

      expect(result.result.status).toBe('success')
      expect(tryCatch).toBeCalledTimes(2)
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(sqlMatch('select ship_id from profile_ships'), [
        mockAuth.uid,
        mockProps.targetUserId1,
        mockProps.targetUserId2,
      ])
      expect(supabaseUtils.insert).toBeCalledTimes(1)
      expect(supabaseUtils.insert).toBeCalledWith(expect.any(Object), 'profile_ships', {
        creator_id: mockAuth.uid,
        target1_id: mockProps.targetUserId1,
        target2_id: mockProps.targetUserId2,
      })
      ;(profileNotificationModules.createProfileShipNotification as jest.Mock).mockReturnValue(null)

      await result.continue()

      expect(profileNotificationModules.createProfileShipNotification).toBeCalledTimes(2)
      expect(profileNotificationModules.createProfileShipNotification).toHaveBeenNthCalledWith(
        1,
        mockData,
        mockData.target1_id,
      )
      expect(profileNotificationModules.createProfileShipNotification).toHaveBeenNthCalledWith(
        2,
        mockData,
        mockData.target2_id,
      )
    })
  })
  describe('when an error occurs', () => {
    it('should throw if unable to check ship', async () => {
      const mockProps = {
        targetUserId1: 'mockTargetUserId1',
        targetUserId2: 'mockTargetUserId2',
        remove: false,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockExisting = {
        data: null,
        error: Error,
      }

      ;(tryCatch as jest.Mock).mockResolvedValue(mockExisting)
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(null)

      expect(shipProfiles(mockProps, mockAuth, mockReq)).rejects.toThrow(
        'Error when checking ship: ',
      )
    })

    it('should throw if unable to remove a profile ship that already exists', async () => {
      const mockProps = {
        targetUserId1: 'mockTargetUserId1',
        targetUserId2: 'mockTargetUserId2',
        remove: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockExisting = {
        data: {ship_id: 'mockShipId'},
        error: null,
      }

      ;(tryCatch as jest.Mock)
        .mockResolvedValueOnce(mockExisting)
        .mockResolvedValueOnce({error: Error})
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(null)
      ;(mockPg.none as jest.Mock).mockResolvedValue(null)

      expect(shipProfiles(mockProps, mockAuth, mockReq)).rejects.toThrow('Failed to remove ship: ')
    })

    it('should return success when creating a new profile ship', async () => {
      const mockProps = {
        targetUserId1: 'mockTargetUserId1',
        targetUserId2: 'mockTargetUserId2',
        remove: false,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockExisting = {
        data: null,
        error: null,
      }

      ;(tryCatch as jest.Mock)
        .mockResolvedValueOnce(mockExisting)
        .mockResolvedValueOnce({data: null, error: Error})
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(null)
      ;(supabaseUtils.insert as jest.Mock).mockReturnValue(null)

      expect(shipProfiles(mockProps, mockAuth, mockReq)).rejects.toThrow('Failed to create ship: ')
    })
  })
})
