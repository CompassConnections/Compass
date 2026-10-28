import {type ProfileComment, type VoteComment} from 'common/comment'
import {type User} from 'common/user'

import {broadcast, broadcastMulti} from './server'

export function broadcastUpdatedPrivateUser(userId: string) {
  // don't send private user info because it's private and anyone can listen
  broadcast(`private-user/${userId}`, {})
}

export function broadcastUpdatedUser(user: Partial<User> & {id: string}) {
  broadcast(`user/${user.id}`, {user})
}

export function broadcastUpdatedComment(comment: ProfileComment) {
  broadcast(`user/${comment.onUserId}/comment`, {comment})
}

export function broadcastUpdatedVoteComment(comment: VoteComment) {
  broadcast(`vote/${comment.voteId}/comment`, {comment})
}

export function broadcastTyping(channelId: number, userId: string, toUserIds: string[]) {
  broadcastMulti(
    toUserIds.map((id) => `private-user-messages/${id}/typing`),
    {channelId, userId},
  )
}
