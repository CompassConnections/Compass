jest.mock('common/discord/core')
jest.mock('shared/supabase/init')
jest.mock('shared/utils')
jest.mock('shared/supabase/utils')

import {createEvent} from 'api/create-event'
import {AuthedUser} from 'api/helpers/endpoint'
import {updateEvent} from 'api/update-event'
import {sendDiscordMessage} from 'common/discord/core'
import * as supabaseInit from 'shared/supabase/init'
import * as supabaseUtils from 'shared/supabase/utils'
import * as sharedUtils from 'shared/utils'

const auth = {uid: '123'} as AuthedUser
const body = {
  eventId: 'event-1',
  title: 'Picnic',
  description: 'In the park',
  locationType: 'online',
  locationUrl: 'https://example.com',
  eventStartTime: new Date(Date.now() + 86_400_000).toISOString(),
} as any

describe('event writes by a banned member', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue({
      oneOrNone: jest.fn().mockResolvedValue({id: 'event-1', creator_id: '123', status: 'active'}),
    })
    ;(sharedUtils.getUser as jest.Mock).mockResolvedValue({
      id: '123',
      name: 'Alice',
      isBannedFromPosting: true,
      banReason: 'under_review',
    })
  })

  it('should refuse to create an event, and announce nothing', async () => {
    await expect(createEvent(body, auth, {} as any)).rejects.toMatchObject({code: 403})
    expect(supabaseUtils.insert).not.toBeCalled()
    expect(sendDiscordMessage).not.toBeCalled()
  })

  it('should refuse to edit an event', async () => {
    await expect(updateEvent(body, auth, {} as any)).rejects.toMatchObject({code: 403})
    expect(supabaseUtils.update).not.toBeCalled()
  })

  it('should still let a member in good standing create an event', async () => {
    ;(sharedUtils.getUser as jest.Mock).mockResolvedValue({id: '123', name: 'Alice'})
    ;(supabaseUtils.insert as jest.Mock).mockResolvedValue({id: 'event-1'})

    const res: any = await createEvent(body, auth, {} as any)
    await res.continue()

    expect(res.result.success).toBe(true)
    expect(sendDiscordMessage).toBeCalledWith(expect.stringContaining('Alice'), 'general')
  })
})
