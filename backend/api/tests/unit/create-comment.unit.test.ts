import {createComment} from 'api/create-comment'
import {AuthedUser} from 'api/helpers/endpoint'
import {convertComment} from 'common/supabase/comment'
import {sqlMatch} from 'common/test-utils'
import * as notificationPrefs from 'common/user-notification-preferences'
import {richTextToString} from 'common/util/parse'
import * as emailHelpers from 'email/functions/helpers'
import * as supabaseInit from 'shared/supabase/init'
import * as supabaseNotifications from 'shared/supabase/notifications'
import * as sharedUtils from 'shared/utils'
import * as websocketHelpers from 'shared/websockets/helpers'

jest.mock('shared/supabase/init')
jest.mock('shared/supabase/notifications')
jest.mock('email/functions/helpers')
jest.mock('common/supabase/comment')
jest.mock('shared/utils')
jest.mock('common/user-notification-preferences')
jest.mock('shared/websockets/helpers')

describe('createComment', () => {
  let mockPg: any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      one: jest.fn(),
      oneOrNone: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should successfully create a comment', async () => {
      const mockUserId = {
        userId: '123',
        blockedUserIds: ['111'],
      }
      const mockOnUser = {id: '123'}
      const mockCreator = {
        id: '1234',
        name: 'Mock Creator',
        username: 'mock.creator.username',
        avatarUrl: 'mock.creator.avatarurl',
        is_banned_from_posting: false,
      }
      const mockContent = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This is the comment text',
                },
              ],
            },
          ],
        },
        userId: '123',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockReplyToCommentId = {} as any
      const mockComment = {id: 12}
      const mockNotificationDestination = {
        sendToBrowser: true,
        sendToMobile: false,
        sendToEmail: true,
      }
      const mockProps = {
        userId: mockUserId.userId,
        content: mockContent.content,
        replyToCommentId: mockReplyToCommentId,
      }
      const mockConvertCommentReturn = 'mockConverComment'

      ;(sharedUtils.getUser as jest.Mock)
        .mockResolvedValueOnce(mockCreator)
        .mockResolvedValueOnce(mockOnUser)
      ;(sharedUtils.getPrivateUser as jest.Mock).mockImplementation(async (id: string) =>
        id === mockOnUser.id ? mockOnUser : {id, blockedUserIds: []},
      )
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue({comments_enabled: true})
      ;(mockPg.one as jest.Mock).mockResolvedValue(mockComment)
      ;(notificationPrefs.getNotificationDestinationsForUser as jest.Mock).mockReturnValue(
        mockNotificationDestination,
      )
      ;(convertComment as jest.Mock).mockReturnValue(mockConvertCommentReturn)

      const results = await createComment(mockProps, mockAuth, mockReq)

      expect(results.status).toBe('success')
      expect(sharedUtils.getUser).toBeCalledTimes(2)
      expect(sharedUtils.getUser).toHaveBeenNthCalledWith(1, mockAuth.uid)
      expect(sharedUtils.getUser).toHaveBeenNthCalledWith(2, mockUserId.userId)
      expect(mockPg.oneOrNone).toBeCalledWith(sqlMatch('select comments_enabled from profiles'), [
        mockProps.userId,
      ])
      expect(sharedUtils.getPrivateUser).toHaveBeenCalledWith(mockAuth.uid)
      expect(sharedUtils.getPrivateUser).toHaveBeenCalledWith(mockOnUser.id)
      expect(mockPg.one).toBeCalledTimes(1)
      expect(mockPg.one).toBeCalledWith(sqlMatch('insert into profile_comments'), [
        mockCreator.id,
        mockCreator.name,
        mockCreator.username,
        mockCreator.avatarUrl,
        mockProps.userId,
        mockProps.content,
        mockProps.replyToCommentId,
      ])
      expect(notificationPrefs.getNotificationDestinationsForUser).toBeCalledTimes(1)
      expect(notificationPrefs.getNotificationDestinationsForUser).toBeCalledWith(
        mockOnUser,
        'new_endorsement',
      )
      expect(supabaseNotifications.insertNotificationToSupabase).toBeCalledTimes(1)
      expect(supabaseNotifications.insertNotificationToSupabase).toBeCalledWith(expect.any(Object))
      expect(emailHelpers.sendNewEndorsementEmail).toBeCalledTimes(1)
      expect(emailHelpers.sendNewEndorsementEmail).toBeCalledWith(
        mockOnUser,
        mockCreator,
        mockOnUser,
        richTextToString(mockProps.content),
      )
      expect(websocketHelpers.broadcastUpdatedComment).toBeCalledTimes(1)
      expect(websocketHelpers.broadcastUpdatedComment).toBeCalledWith(mockConvertCommentReturn)
    })
  })

  describe('when an error occurs', () => {
    it('should throw if there is no user matching the userId', async () => {
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockReplyToCommentId = {} as any
      const mockUserId = {
        userId: '123',
        blockedUserIds: ['111'],
      }
      const mockCreator = {
        id: '1234',
        name: 'Mock Creator',
        username: 'mock.creator.username',
        avatarUrl: 'mock.creator.avatarurl',
        is_banned_from_posting: false,
      }
      const mockContent = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This is the comment text',
                },
              ],
            },
          ],
        },
        userId: '123',
      }
      const mockProps = {
        userId: mockUserId.userId,
        content: mockContent.content,
        replyToCommentId: mockReplyToCommentId,
      }

      ;(sharedUtils.getUser as jest.Mock)
        .mockResolvedValueOnce(mockCreator)
        .mockResolvedValueOnce(false)
      ;(sharedUtils.getPrivateUser as jest.Mock).mockResolvedValue(mockUserId)
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue({comments_enabled: true})

      await expect(createComment(mockProps, mockAuth, mockReq)).rejects.toThrowError(
        'User not found',
      )
    })

    it('throw if there is no account associated with the authId', async () => {
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockReplyToCommentId = {} as any
      const mockUserId = {
        userId: '123',
        blockedUserIds: ['111'],
      }
      const mockContent = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This is the comment text',
                },
              ],
            },
          ],
        },
        userId: '123',
      }
      const mockProps = {
        userId: mockUserId.userId,
        content: mockContent.content,
        replyToCommentId: mockReplyToCommentId,
      }

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValueOnce(null)

      expect(createComment(mockProps, mockAuth, mockReq)).rejects.toThrowError(
        'Your account was not found',
      )
    })

    it('throw if the account is banned from posting', async () => {
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockReplyToCommentId = {} as any
      const mockUserId = {
        userId: '123',
        blockedUserIds: ['111'],
      }
      const mockCreator = {
        id: '1234',
        name: 'Mock Creator',
        username: 'mock.creator.username',
        avatarUrl: 'mock.creator.avatarurl',
        isBannedFromPosting: true,
      }
      const mockContent = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This is the comment text',
                },
              ],
            },
          ],
        },
        userId: '123',
      }
      const mockProps = {
        userId: mockUserId.userId,
        content: mockContent.content,
        replyToCommentId: mockReplyToCommentId,
      }

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValueOnce(mockCreator)

      expect(createComment(mockProps, mockAuth, mockReq)).rejects.toThrowError(
        'Your account has been suspended',
      )
    })

    it('throw if the other user is not found', async () => {
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockReplyToCommentId = {} as any
      const mockUserId = {
        userId: '123',
        blockedUserIds: ['111'],
      }
      const mockCreator = {
        id: '1234',
        name: 'Mock Creator',
        username: 'mock.creator.username',
        avatarUrl: 'mock.creator.avatarurl',
        is_banned_from_posting: false,
      }
      const mockContent = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This is the comment text',
                },
              ],
            },
          ],
        },
        userId: '123',
      }
      const mockProps = {
        userId: mockUserId.userId,
        content: mockContent.content,
        replyToCommentId: mockReplyToCommentId,
      }

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValueOnce(mockCreator)
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(null)

      await expect(createComment(mockProps, mockAuth, mockReq)).rejects.toThrowError(
        'Other user not found',
      )
    })

    it('throw if the user has blocked you', async () => {
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockReplyToCommentId = {} as any
      const mockUserId = {
        userId: '123',
        blockedUserIds: ['321'],
      }
      const mockCreator = {
        id: '1234',
        name: 'Mock Creator',
        username: 'mock.creator.username',
        avatarUrl: 'mock.creator.avatarurl',
        is_banned_from_posting: false,
      }
      const mockContent = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This is the comment text',
                },
              ],
            },
          ],
        },
        userId: '123',
      }
      const mockProps = {
        userId: mockUserId.userId,
        content: mockContent.content,
        replyToCommentId: mockReplyToCommentId,
      }

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValueOnce(mockCreator)
      ;(sharedUtils.getPrivateUser as jest.Mock).mockImplementation(async (id: string) =>
        id === mockUserId.userId ? mockUserId : {id, blockedUserIds: []},
      )
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue({comments_enabled: true})

      await expect(createComment(mockProps, mockAuth, mockReq)).rejects.toThrowError(
        'You can no longer interact with this person',
      )
      expect(mockPg.one).not.toHaveBeenCalled()
    })

    it('throw if you have blocked the user', async () => {
      const mockAuth = {uid: '321'} as AuthedUser
      const mockCreator = {id: '321', name: 'Mock Creator', username: 'mock.creator'}
      const mockProps = {
        userId: '123',
        content: {
          type: 'doc',
          content: [{type: 'paragraph', content: [{type: 'text', text: 'Hi'}]}],
        },
        replyToCommentId: undefined,
      } as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValueOnce(mockCreator)
      ;(sharedUtils.getPrivateUser as jest.Mock).mockImplementation(async (id: string) =>
        id === mockAuth.uid ? {id, blockedUserIds: ['123']} : {id, blockedUserIds: []},
      )
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue({comments_enabled: true})

      await expect(createComment(mockProps, mockAuth, {} as any)).rejects.toThrowError(
        'You can no longer interact with this person',
      )
      expect(mockPg.one).not.toHaveBeenCalled()
    })

    it('throw if the profile has endorsements turned off', async () => {
      const mockAuth = {uid: '321'} as AuthedUser
      const mockCreator = {id: '321', name: 'Mock Creator', username: 'mock.creator'}
      const mockProps = {
        userId: '123',
        content: {
          type: 'doc',
          content: [{type: 'paragraph', content: [{type: 'text', text: 'Hi'}]}],
        },
        replyToCommentId: undefined,
      } as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValueOnce(mockCreator)
      ;(sharedUtils.getPrivateUser as jest.Mock).mockImplementation(async (id: string) => ({
        id,
        blockedUserIds: [],
      }))
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue({comments_enabled: false})

      await expect(createComment(mockProps, mockAuth, {} as any)).rejects.toThrowError(
        'This person has turned off endorsements',
      )
      expect(mockPg.one).not.toHaveBeenCalled()
    })

    it('throw if the comment is too long', async () => {
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockReplyToCommentId = {} as any
      const mockUserId = {
        userId: '123',
        blockedUserIds: ['111'],
      }
      const mockCreator = {
        id: '1234',
        name: 'Mock Creator',
        username: 'mock.creator.username',
        avatarUrl: 'mock.creator.avatarurl',
        is_banned_from_posting: false,
      }
      const mockContent = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This '.repeat(30000),
                },
              ],
            },
          ],
        },
        userId: '123',
      }
      const mockProps = {
        userId: mockUserId.userId,
        content: mockContent.content,
        replyToCommentId: mockReplyToCommentId,
      }

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValueOnce(mockCreator)
      ;(sharedUtils.getPrivateUser as jest.Mock).mockResolvedValue(mockUserId)

      expect(createComment(mockProps, mockAuth, mockReq)).rejects.toThrowError(
        'Comment is too long',
      )
    })
  })
})
