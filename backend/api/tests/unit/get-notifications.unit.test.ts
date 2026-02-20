jest.mock('shared/supabase/init')

import {getNotifications} from 'api/get-notifications'
import {AuthedUser} from 'api/helpers/endpoint'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'

describe('getNotifications', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      map: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should send user notifications', async () => {
      const mockProps = {
        limit: 10,
        after: 2,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockNotifications = {} as any

      ;(mockPg.map as jest.Mock).mockResolvedValue(mockNotifications)

      const result = await getNotifications(mockProps, mockAuth, mockReq)

      expect(result).toBe(mockNotifications)
      expect(mockPg.map).toBeCalledTimes(1)
      expect(mockPg.map).toBeCalledWith(
        sqlMatch(
          'from user_notifications un left join notification_templates nt on un.template_id = nt.id',
        ),
        [mockAuth.uid, mockProps.limit, mockProps.after],
        expect.any(Function),
      )
    })
  })
})
