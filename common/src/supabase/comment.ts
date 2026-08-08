import {type JSONContent} from '@tiptap/core'
import {type ProfileComment, type VoteComment} from 'common/comment'
import {type Stance} from 'common/votes/constants'

import {type Row, tsToMillis} from './utils'

export const convertComment = (row: Row<'profile_comments'>): ProfileComment => ({
  id: row.id + '',
  userId: row.user_id,
  commentType: 'profile',
  onUserId: row.on_user_id,
  createdTime: tsToMillis(row.created_time),
  userName: row.user_name,
  userUsername: row.user_username,
  userAvatarUrl: row.user_avatar_url ?? undefined,
  hidden: row.hidden,
  visibility: 'public',
  content: row.content as JSONContent,
})

export const convertVoteComment = (row: Row<'vote_comments'>): VoteComment => ({
  id: row.id + '',
  userId: row.user_id,
  commentType: 'vote',
  voteId: row.vote_id,
  replyToCommentId: row.reply_to_comment_id ? row.reply_to_comment_id + '' : undefined,
  stance: (row.stance as Stance | null) ?? undefined,
  createdTime: tsToMillis(row.created_time),
  editedTime: row.edited_time ? tsToMillis(row.edited_time) : undefined,
  userName: row.user_name,
  userUsername: row.user_username,
  userAvatarUrl: row.user_avatar_url ?? undefined,
  hidden: row.hidden,
  visibility: 'public',
  content: row.content as JSONContent,
})
