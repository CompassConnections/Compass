jest.mock('common/util/try-catch')
jest.mock('shared/supabase/init')
jest.mock('shared/supabase/notifications')

import * as createNotificationModules from 'api/create-notification'
import {Notification} from 'common/notifications'
import {tryCatch} from 'common/util/try-catch'
import * as supabaseInit from 'shared/supabase/init'
import * as supabaseNotifications from 'shared/supabase/notifications'

describe('createNotifications', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      many: jest.fn().mockReturnValue(null),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should sucessfully create a notification', async () => {
      const mockUsers = [
        {
          created_time: 'mockCreatedTime',
          data: {mockData: 'mockDataJson'},
          id: 'mockId',
          name: 'mockName',
          name_user_vector: 'mockNUV',
          username: 'mockUsername',
        },
      ]
      const mockNotification = {
        userId: 'mockUserId',
      } as Notification

      ;(tryCatch as jest.Mock).mockResolvedValue({data: mockUsers, error: null})
      jest.spyOn(createNotificationModules, 'createNotification')

      const results = await createNotificationModules.createNotifications(mockNotification)

      expect(results?.success).toBeTruthy()
      expect(tryCatch).toBeCalledTimes(1)
      expect(mockPg.many).toBeCalledTimes(1)
      expect(mockPg.many).toBeCalledWith('select * from users')
      expect(createNotificationModules.createNotification).toBeCalledTimes(1)
      expect(createNotificationModules.createNotification).toBeCalledWith(
        mockUsers[0],
        mockNotification,
        expect.any(Object),
      )
      expect(supabaseNotifications.insertNotificationToSupabase).toBeCalledTimes(1)
      expect(supabaseNotifications.insertNotificationToSupabase).toBeCalledWith(
        mockNotification,
        expect.any(Object),
      )
    })
  })

  describe('when an error occurs', () => {
    it('should throw if its unable to fetch users', async () => {
      const mockNotification = {
        userId: 'mockUserId',
      } as Notification

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      ;(tryCatch as jest.Mock).mockResolvedValue({data: null, error: Error})

      await createNotificationModules.createNotifications(mockNotification)

      expect(errorSpy).toBeCalledWith(
        'Error fetching users',
        expect.objectContaining({name: 'Error'}),
      )
    })

    it('should throw if there are no users', async () => {
      const mockNotification = {
        userId: 'mockUserId',
      } as Notification

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      ;(tryCatch as jest.Mock).mockResolvedValue({data: null, error: null})

      await createNotificationModules.createNotifications(mockNotification)
      expect(errorSpy).toBeCalledWith('No users found')
    })

    it('should throw if unable to create notification', async () => {
      const mockUsers = [
        {
          created_time: 'mockCreatedTime',
          data: {mockData: 'mockDataJson'},
          id: 'mockId',
          name: 'mockName',
          name_user_vector: 'mockNUV',
          username: 'mockUsername',
        },
      ]
      const mockNotification = {
        userId: 'mockUserId',
      } as Notification

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      ;(tryCatch as jest.Mock).mockResolvedValue({data: mockUsers, error: null})
      jest
        .spyOn(createNotificationModules, 'createNotification')
        .mockRejectedValue(new Error('Creation failure'))

      await createNotificationModules.createNotifications(mockNotification)

      expect(errorSpy).toBeCalledWith(
        'Failed to create notification',
        expect.objectContaining({name: 'Error'}),
        mockUsers[0],
      )
    })
  })
})
