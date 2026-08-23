jest.mock('common/discord/core')
jest.mock('shared/supabase/init')
jest.mock('shared/utils')
jest.mock('shared/supabase/utils')
jest.mock('common/util/try-catch')

import {createVote} from 'api/create-vote'
import {AuthedUser} from 'api/helpers/endpoint'
import {sendDiscordMessage} from 'common/discord/core'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {tryCatch} from 'common/util/try-catch'
import * as supabaseInit from 'shared/supabase/init'
import * as supabaseUtils from 'shared/supabase/utils'
import * as sharedUtils from 'shared/utils'

describe('createVote', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    const mockPg = {} as any
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should successfully creates a vote', async () => {
      const mockProps = {
        title: 'mockTitle',
        description: {mockDescription: 'mockDescriptionValue'},
        isAnonymous: true,
      }
      const mockCreator = {id: '123', name: 'Alice', username: 'alice'}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockData = {
        id: 7,
        creator_id: mockCreator.id,
        title: 'mockTitle',
        description: {mockDescription: 'mockDescriptionValue'},
        is_anonymous: true,
        status: 'voting_open',
      }

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator)
      ;(tryCatch as jest.Mock).mockResolvedValue({data: mockData, error: null})

      const result = await createVote(mockProps, mockAuth, mockReq)
      expect((result as any).result.data).toEqual(mockData)
      expect(sharedUtils.getUser).toBeCalledTimes(1)
      expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid)
      expect(supabaseUtils.insert).toBeCalledTimes(1)
      expect(supabaseUtils.insert).toHaveBeenCalledWith(expect.any(Object), 'votes', {
        creator_id: mockCreator.id,
        title: mockProps.title,
        description: mockProps.description,
        is_anonymous: mockProps.isAnonymous,
        status: 'voting_open',
      })
    })
  })
  describe('the #suggestions announcement', () => {
    const description = {
      type: 'doc',
      content: [
        {type: 'paragraph', content: [{type: 'text', text: 'Make the feed chronological.'}]},
      ],
    }
    const mockAuth = {uid: '321'} as AuthedUser
    const mockReq = {} as any
    const mockCreator = {id: '123', name: 'Alice', username: 'alice'}

    const create = async (isAnonymous: boolean) => {
      const mockProps = {title: 'Chronological feed', description, isAnonymous}
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator)
      ;(tryCatch as jest.Mock).mockResolvedValue({data: {id: 7}, error: null})
      const result: any = await createVote(mockProps, mockAuth, mockReq)
      await result.continue()
    }

    it('names and links the author, with an excerpt of the proposal', async () => {
      await create(false)

      expect(sendDiscordMessage).toBeCalledTimes(1)
      expect(sendDiscordMessage).toBeCalledWith(
        `[**Alice**](${DEPLOYED_WEB_URL}/alice) opened a new proposal: ` +
          `[**Chronological feed**](${DEPLOYED_WEB_URL}/vote/7)\nMake the feed chronological.`,
        'suggestions',
      )
    })

    // The whole point of the checkbox. A name here would leak in the one room the author never sees.
    it('withholds the author when the proposal is anonymous', async () => {
      await create(true)

      expect(sendDiscordMessage).toBeCalledTimes(1)
      const [content, channel] = (sendDiscordMessage as jest.Mock).mock.calls[0]
      expect(content).not.toContain('Alice')
      expect(content).not.toContain('alice')
      expect(content).toContain('A new anonymous proposal')
      expect(channel).toBe('suggestions')
    })

    // The proposal is already saved by the time we post; a Discord outage must not surface as a failure.
    it('swallows a discord failure', async () => {
      ;(sendDiscordMessage as jest.Mock).mockRejectedValue(new Error('Discord down'))
      jest.spyOn(console, 'error').mockImplementation(() => {})

      await expect(create(false)).resolves.toBeUndefined()
    })
  })

  describe('when an error occurs', () => {
    it('should throw if the account was not found', async () => {
      const mockProps = {
        title: 'mockTitle',
        description: {mockDescription: 'mockDescriptionValue'},
        isAnonymous: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(null)

      expect(createVote(mockProps, mockAuth, mockReq)).rejects.toThrow('Your account was not found')
    })

    it('should throw if unable to create a question', async () => {
      const mockProps = {
        title: 'mockTitle',
        description: {mockDescription: 'mockDescriptionValue'},
        isAnonymous: true,
      }
      const mockCreator = {id: '123'}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator)
      ;(tryCatch as jest.Mock).mockResolvedValue({data: null, error: Error})

      expect(createVote(mockProps, mockAuth, mockReq)).rejects.toThrow('Error creating question')
    })
  })
})
