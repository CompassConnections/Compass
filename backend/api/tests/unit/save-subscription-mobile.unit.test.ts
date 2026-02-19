import {sqlMatch} from 'common/test-utils'
import {AuthedUser} from 'api/helpers/endpoint'
import {saveSubscriptionMobile} from 'api/save-subscription-mobile'
import * as supabaseInit from 'shared/supabase/init'

jest.mock('shared/supabase/init')

describe('saveSubscriptionMobile', () => {
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
    it('should return success after saving the subscription', async () => {
      const mockBody = {token: 'mockToken'}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.none as jest.Mock).mockResolvedValue(null)

      const result = await saveSubscriptionMobile(mockBody, mockAuth, mockReq)

      expect(result.success).toBeTruthy()
      expect(mockPg.none).toBeCalledTimes(1)
      expect(mockPg.none).toBeCalledWith(
        sqlMatch('insert into push_subscriptions_mobile(token, platform, user_id)'),
        [mockBody.token, 'android', mockAuth.uid],
      )
    })
  })
  describe('when an error occurs', () => {
    it('should throw if token is invalid', async () => {
      const mockBody = {} as any
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      expect(saveSubscriptionMobile(mockBody, mockAuth, mockReq)).rejects.toThrow(
        'Invalid subscription object',
      )
    })

    it('should throw if unable to save subscription', async () => {
      const mockBody = {token: 'mockToken'}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.none as jest.Mock).mockRejectedValue(new Error('Saving error'))
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(saveSubscriptionMobile(mockBody, mockAuth, mockReq)).rejects.toThrow(
        'Failed to save subscription',
      )
      // expect(errorSpy).toBeCalledTimes(1);
      // expect(errorSpy).toBeCalledWith(
      //     expect.stringContaining('Error saving subscription'),
      //     expect.any(Error)
      // );
    })
  })
})
