jest.mock('shared/supabase/init')
jest.mock('shared/helpers/auth')
jest.mock('common/envs/constants')
jest.mock('shared/supabase/users')
jest.mock('shared/analytics')
jest.mock('shared/utils')

import {banUser} from 'api/ban-user'
import {AuthedUser} from 'api/helpers/endpoint'
import * as constants from 'common/envs/constants'
import * as sharedAnalytics from 'shared/analytics'
import {throwErrorIfNotMod} from 'shared/helpers/auth'
import * as supabaseInit from 'shared/supabase/init'
import * as supabaseUsers from 'shared/supabase/users'

describe('banUser', () => {
  const mockPg = {} as any

  beforeEach(() => {
    jest.resetAllMocks()
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should ban a user successfully', async () => {
      const mockUser = {
        userId: '123',
        unban: false,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(constants.isAdminId as jest.Mock).mockReturnValue(false)

      await banUser(mockUser, mockAuth, mockReq)

      expect(throwErrorIfNotMod).toBeCalledTimes(1)
      expect(throwErrorIfNotMod).toBeCalledWith(mockAuth.uid)
      expect(constants.isAdminId).toBeCalledTimes(1)
      expect(constants.isAdminId).toBeCalledWith(mockUser.userId)
      expect(sharedAnalytics.trackPublicEvent).toBeCalledTimes(1)
      expect(sharedAnalytics.trackPublicEvent).toBeCalledWith(mockAuth.uid, 'ban user', {
        userId: mockUser.userId,
      })
      expect(supabaseUsers.updateUser).toBeCalledTimes(1)
      expect(supabaseUsers.updateUser).toBeCalledWith(mockPg, mockUser.userId, {
        isBannedFromPosting: true,
      })
    })

    it('should unban a user successfully', async () => {
      const mockUser = {
        userId: '123',
        unban: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(constants.isAdminId as jest.Mock).mockReturnValue(false)

      await banUser(mockUser, mockAuth, mockReq)

      expect(throwErrorIfNotMod).toBeCalledWith(mockAuth.uid)
      expect(constants.isAdminId).toBeCalledWith(mockUser.userId)
      expect(sharedAnalytics.trackPublicEvent).toBeCalledWith(mockAuth.uid, 'ban user', {
        userId: mockUser.userId,
      })
      expect(supabaseUsers.updateUser).toBeCalledWith(mockPg, mockUser.userId, {
        isBannedFromPosting: false,
      })
    })
  })
  describe('when an error occurs', () => {
    it('throw if the ban requester is not a mod or admin', async () => {
      const mockUser = {
        userId: '123',
        unban: false,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(throwErrorIfNotMod as jest.Mock).mockRejectedValue(
        new Error(`User ${mockAuth.uid} must be an admin or trusted to perform this action.`),
      )

      await expect(banUser(mockUser, mockAuth, mockReq)).rejects.toThrowError(
        `User ${mockAuth.uid} must be an admin or trusted to perform this action.`,
      )
      expect(throwErrorIfNotMod).toBeCalledWith(mockAuth.uid)
    })

    it('throw if the ban target is an admin', async () => {
      const mockUser = {
        userId: '123',
        unban: false,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(constants.isAdminId as jest.Mock).mockReturnValue(true)

      await expect(banUser(mockUser, mockAuth, mockReq)).rejects.toThrowError('Cannot ban admin')
      expect(throwErrorIfNotMod).toBeCalledWith(mockAuth.uid)
      expect(constants.isAdminId).toBeCalledWith(mockUser.userId)
    })
  })
})
