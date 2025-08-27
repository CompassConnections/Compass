import { broadcast } from './server'
import { type User } from 'common/user'
import { type Comment } from 'common/comment'

export function broadcastUpdatedPrivateUser(userId: string) {
  // don't send private user info because it's private and anyone can listen
  broadcast(`private-user/${userId}`, {})
}

export function broadcastUpdatedUser(user: Partial<User> & { id: string }) {
  broadcast(`user/${user.id}`, { user })
}

export function broadcastUpdatedComment(comment: Comment) {
  broadcast(`user/${comment.onUserId}/comment`, { comment })
}
