jest.mock('shared/supabase/init')

import {AuthedUser} from 'api/helpers/endpoint'
import {saveSubscription} from 'api/save-subscription'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'

describe('saveSubscription', () => {
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
    it('should save user subscription', async () => {
      const mockBody = {
        subscription: {
          endpoint: 'mockEndpoint',
          keys: 'mockKeys',
        },
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.none as jest.Mock).mockResolvedValue(null)

      const result = await saveSubscription(mockBody, mockAuth, mockReq)

      expect(result.success).toBeTruthy()
      expect(mockPg.none).toBeCalledTimes(1)
      expect(mockPg.none).toBeCalledWith(
        sqlMatch('insert into push_subscriptions(endpoint, keys, user_id) values($1, $2, $3)'),
        [mockBody.subscription.endpoint, mockBody.subscription.keys, mockAuth.uid],
      )
    })

    // The endpoint used to be reassigned to whoever sent it, which let anyone holding another
    // member's endpoint redirect their notifications.
    it("only updates an existing endpoint that is unowned or already the caller's", async () => {
      const mockAuth = {uid: '321'} as AuthedUser
      ;(mockPg.none as jest.Mock).mockResolvedValue(null)

      await saveSubscription(
        {subscription: {endpoint: 'mockEndpoint', keys: 'mockKeys'}} as any,
        mockAuth,
        {} as any,
      )

      expect(mockPg.none).toBeCalledWith(
        sqlMatch(
          'where push_subscriptions.user_id is null or push_subscriptions.user_id = excluded.user_id',
        ),
        expect.anything(),
      )
    })
  })
  describe('when an error occurs', () => {
    it('should throw if the subscription object is invalid', async () => {
      const mockBody = {} as any
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      expect(saveSubscription(mockBody, mockAuth, mockReq)).rejects.toThrow(
        'Invalid subscription object',
      )
    })

    it('should throw if unable to save subscription', async () => {
      const mockBody = {
        subscription: {
          endpoint: 'mockEndpoint',
          keys: 'mockKeys',
        },
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockExists = {id: 'mockId'}

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockExists)
      ;(mockPg.none as jest.Mock).mockRejectedValue(new Error('Saving error'))
      const _errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(saveSubscription(mockBody, mockAuth, mockReq)).rejects.toThrow(
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
