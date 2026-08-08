import {type JSONContent} from '@tiptap/core'
import {type Stance} from 'common/votes/constants'

export const MAX_COMMENT_LENGTH = 3000

export const MAX_VOTE_COMMENT_LENGTH = 3000

type Visibility = 'public' | 'unlisted' | 'private'

// Currently, comments are created after the bet, not atomically with the bet.
// They're uniquely identified by the pair contractId/betId.
type BaseComment = {
  id: string
  replyToCommentId?: string
  userId: string

  /** @deprecated - content now stored as JSON in content*/
  text?: string
  content: JSONContent
  createdTime: number

  // Denormalized, for rendering comments
  userName: string
  userUsername: string
  userAvatarUrl?: string

  hidden?: boolean
  hiddenTime?: number
  hiderId?: string
  pinned?: boolean
  pinnedTime?: number
  pinnerId?: string
  visibility: Visibility
  editedTime?: number
  isApi?: boolean
}

export type ProfileComment = BaseComment & {
  commentType: 'profile'
  onUserId: string
}

export type VoteComment = BaseComment & {
  commentType: 'vote'
  voteId: number
  // Whether the author is arguing for, against, or just asking. Undefined = neutral.
  stance?: Stance
}

export type Comment = ProfileComment | VoteComment

// Which table a comment lives in. Sent over the wire by the endpoints that operate on both
// (hide-comment, report) so the handler knows where to look without a second round trip.
export const COMMENT_TYPES = ['profile', 'vote'] as const
export type CommentType = (typeof COMMENT_TYPES)[number]

export type ReplyToUserInfo = {id: string; username: string}
