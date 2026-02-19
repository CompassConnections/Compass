jest.mock('shared/supabase/init')
jest.mock('shared/supabase/users')
jest.mock('shared/websockets/helpers')

import {AuthedUser} from 'api/helpers/endpoint'
import {updateNotifSettings} from 'api/update-notif-setting'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'
import * as supabaseUsers from 'shared/supabase/users'
import * as websocketHelpers from 'shared/websockets/helpers'

describe('updateNotifSettings', () => {
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
    it('should update notification settings', async () => {
      const mockProps = {
        type: 'new_match' as const,
        medium: 'email' as const,
        enabled: false,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.none as jest.Mock).mockResolvedValue(null)
      ;(websocketHelpers.broadcastUpdatedPrivateUser as jest.Mock).mockReturnValue(null)

      await updateNotifSettings(mockProps, mockAuth, mockReq)

      expect(mockPg.none).toBeCalledTimes(1)
      expect(mockPg.none).toBeCalledWith(sqlMatch('update private_users'), [
        mockProps.type,
        mockProps.medium,
        mockAuth.uid,
      ])
      expect(websocketHelpers.broadcastUpdatedPrivateUser).toBeCalledTimes(1)
      expect(websocketHelpers.broadcastUpdatedPrivateUser).toBeCalledWith(mockAuth.uid)
    })

    it('should turn off notifications', async () => {
      const mockProps = {
        type: 'opt_out_all' as const,
        medium: 'mobile' as const,
        enabled: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(supabaseUsers.updatePrivateUser as jest.Mock).mockResolvedValue(null)

      await updateNotifSettings(mockProps, mockAuth, mockReq)

      expect(supabaseUsers.updatePrivateUser).toBeCalledTimes(1)
      expect(supabaseUsers.updatePrivateUser).toBeCalledWith(expect.any(Object), mockAuth.uid, {
        interestedInPushNotifications: !mockProps.enabled,
      })
    })
  })
})
