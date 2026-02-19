import {sqlMatch} from 'common/test-utils'
import {hideComment} from 'api/hide-comment'
import * as supabaseInit from 'shared/supabase/init'
import * as envConsts from 'common/envs/constants'
import {convertComment} from 'common/supabase/comment'
import * as websocketHelpers from 'shared/websockets/helpers'
import {AuthedUser} from 'api/helpers/endpoint'

jest.mock('shared/supabase/init')
jest.mock('common/supabase/comment')
jest.mock('shared/websockets/helpers')

describe('hideComment', () => {
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
    it('should successfully hide the comment if the user is an admin', async () => {
      const mockProps = {
        commentId: 'mockCommentId',
        hide: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockComment = {
        content: {mockContent: 'mockContentValue'},
        created_time: 'mockCreatedTime',
        hidden: false,
        id: 123,
        on_user_id: '4321',
        reply_to_comment_id: null,
        user_avatar_url: 'mockAvatarUrl',
        user_id: '4321',
        user_name: 'mockUserName',
        user_username: 'mockUserUsername',
      }
      const mockConvertedComment = 'mockConvertedCommentValue'

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockComment)
      jest.spyOn(envConsts, 'isAdminId').mockReturnValue(true)
      ;(convertComment as jest.Mock).mockReturnValue(mockConvertedComment)

      await hideComment(mockProps, mockAuth, mockReq)

      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(
        sqlMatch('select * from profile_comments where id = $1'),
        [mockProps.commentId],
      )
      expect(envConsts.isAdminId).toBeCalledTimes(1)
      expect(envConsts.isAdminId).toBeCalledWith(mockAuth.uid)
      expect(convertComment).toBeCalledTimes(1)
      expect(convertComment).toBeCalledWith(mockComment)
      expect(websocketHelpers.broadcastUpdatedComment).toBeCalledTimes(1)
      expect(websocketHelpers.broadcastUpdatedComment).toBeCalledWith(mockConvertedComment)
    })

    it('should successfully hide the comment if the user is the one who made the comment', async () => {
      const mockProps = {
        commentId: 'mockCommentId',
        hide: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockComment = {
        content: {mockContent: 'mockContentValue'},
        created_time: 'mockCreatedTime',
        hidden: false,
        id: 123,
        on_user_id: '4321',
        reply_to_comment_id: null,
        user_avatar_url: 'mockAvatarUrl',
        user_id: '321',
        user_name: 'mockUserName',
        user_username: 'mockUserUsername',
      }

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockComment)
      jest.spyOn(envConsts, 'isAdminId').mockReturnValue(false)

      await hideComment(mockProps, mockAuth, mockReq)
    })

    it('should successfully hide the comment if the user is the one who is being commented on', async () => {
      const mockProps = {
        commentId: 'mockCommentId',
        hide: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockComment = {
        content: {mockContent: 'mockContentValue'},
        created_time: 'mockCreatedTime',
        hidden: false,
        id: 123,
        on_user_id: '321',
        reply_to_comment_id: null,
        user_avatar_url: 'mockAvatarUrl',
        user_id: '4321',
        user_name: 'mockUserName',
        user_username: 'mockUserUsername',
      }

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockComment)
      jest.spyOn(envConsts, 'isAdminId').mockReturnValue(false)

      await hideComment(mockProps, mockAuth, mockReq)
    })
  })
  describe('when an error occurs', () => {
    it('should throw if the comment was not found', async () => {
      const mockProps = {
        commentId: 'mockCommentId',
        hide: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(false)

      expect(hideComment(mockProps, mockAuth, mockReq)).rejects.toThrow('Comment not found')
    })

    it('should throw if the user is not an admin, the comments author or the one being commented on', async () => {
      const mockProps = {
        commentId: 'mockCommentId',
        hide: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockComment = {
        content: {mockContent: 'mockContentValue'},
        created_time: 'mockCreatedTime',
        hidden: false,
        id: 123,
        on_user_id: '4321',
        reply_to_comment_id: null,
        user_avatar_url: 'mockAvatarUrl',
        user_id: '4321',
        user_name: 'mockUserName',
        user_username: 'mockUserUsername',
      }

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockComment)
      jest.spyOn(envConsts, 'isAdminId').mockReturnValue(false)

      expect(hideComment(mockProps, mockAuth, mockReq)).rejects.toThrow(
        'You are not allowed to hide this comment',
      )
    })
  })
})
