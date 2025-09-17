import { type JSONContent } from '@tiptap/core'

export const MAX_COMMENT_LENGTH = 10000

type Visibility = 'public' | 'unlisted' | 'private'

// Currently, comments are created after the bet, not atomically with the bet.
// They're uniquely identified by the pair contractId/betId.
export type Comment = {
  id: string
  replyToCommentId?: string
  userId: string

  // profile
  commentType: 'profile'
  onUserId: string

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

export type ReplyToUserInfo = { id: string; username: string }
