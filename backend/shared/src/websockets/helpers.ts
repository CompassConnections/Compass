import {type Comment} from 'common/comment'
import {type User} from 'common/user'

import {broadcast} from './server'

export function broadcastUpdatedPrivateUser(userId: string) {
  // don't send private user info because it's private and anyone can listen
  broadcast(`private-user/${userId}`, {})
}

export function broadcastUpdatedUser(user: Partial<User> & {id: string}) {
  broadcast(`user/${user.id}`, {user})
}

export function broadcastUpdatedComment(comment: Comment) {
  broadcast(`user/${comment.onUserId}/comment`, {comment})
}
