jest.mock('shared/supabase/init')

import {deleteSubscription} from 'api/delete-subscription'
import {AuthedUser} from 'api/helpers/endpoint'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'

describe('deleteSubscription', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {none: jest.fn().mockResolvedValue(null)}
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })

  const mockAuth = {uid: '321'} as AuthedUser

  // Scoped to the caller, so nobody can sign another member's device out of their notifications.
  it('removes only the caller’s web subscription', async () => {
    const result = await deleteSubscription({endpoint: 'mockEndpoint'}, mockAuth, {} as any)

    expect(result).toEqual({success: true})
    expect(mockPg.none).toBeCalledTimes(1)
    expect(mockPg.none).toBeCalledWith(
      sqlMatch('delete from push_subscriptions where endpoint = $1 and user_id = $2'),
      ['mockEndpoint', mockAuth.uid],
    )
  })

  it('removes only the caller’s mobile subscription', async () => {
    await deleteSubscription({token: 'mockToken'}, mockAuth, {} as any)

    expect(mockPg.none).toBeCalledTimes(1)
    expect(mockPg.none).toBeCalledWith(
      sqlMatch('delete from push_subscriptions_mobile where token = $1 and user_id = $2'),
      ['mockToken', mockAuth.uid],
    )
  })

  it('rejects a request that names neither', async () => {
    await expect(deleteSubscription({}, mockAuth, {} as any)).rejects.toThrow(
      'Missing endpoint or token',
    )
    expect(mockPg.none).not.toBeCalled()
  })
})
