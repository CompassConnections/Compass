import {type JSONContent} from '@tiptap/core'
import {type Row, tsToMillis} from './utils'
import {type Comment} from 'common/comment'

export const convertComment = (row: Row<'profile_comments'>): Comment => ({
  id: row.id + '',
  userId: row.user_id,
  commentType: 'profile',
  onUserId: row.on_user_id,
  createdTime: tsToMillis(row.created_time),
  userName: row.user_name,
  userUsername: row.user_username,
  userAvatarUrl: row.user_avatar_url,
  hidden: row.hidden,
  visibility: 'public',
  content: row.content as JSONContent,
})
