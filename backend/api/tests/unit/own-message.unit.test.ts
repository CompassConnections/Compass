jest.mock('api/helpers/blocks')

import * as blocks from 'api/helpers/blocks'
import {getChangeableOwnMessage} from 'api/helpers/own-message'

describe('getChangeableOwnMessage', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {oneOrNone: jest.fn()}
  })

  it('returns the message for an author still in the chat and not blocked', async () => {
    const message = {id: 1, channel_id: 7, member_status: 'member', other_member_ids: ['456']}
    ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(message)

    await expect(getChangeableOwnMessage(mockPg, 1, '321')).resolves.toBe(message)
    expect(blocks.assertNotBlocked).toBeCalledWith('321', ['456'])
  })

  it('throws when the message is not the caller’s', async () => {
    ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(null)

    await expect(getChangeableOwnMessage(mockPg, 1, '321')).rejects.toThrow('Message not found')
  })

  // A member who left could otherwise go back and rewrite what they said before leaving.
  it('throws once the author has left the chat', async () => {
    ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue({
      channel_id: 7,
      member_status: 'left',
      other_member_ids: ['456'],
    })

    await expect(getChangeableOwnMessage(mockPg, 1, '321')).rejects.toThrow(
      'You are no longer in this chat',
    )
    expect(blocks.assertNotBlocked).not.toBeCalled()
  })

  // A blocked harasser could otherwise edit or delete the messages about to be reported.
  it('throws when a block stands between the author and another member', async () => {
    ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue({
      channel_id: 7,
      member_status: 'member',
      other_member_ids: ['456'],
    })
    ;(blocks.assertNotBlocked as jest.Mock).mockRejectedValue(
      new Error('You can no longer interact with this person'),
    )

    await expect(getChangeableOwnMessage(mockPg, 1, '321')).rejects.toThrow(
      'You can no longer interact with this person',
    )
  })
})
