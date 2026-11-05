import {type VoteComment} from 'common/comment'
import {type User} from 'common/user'

import {broadcast, broadcastMulti} from './server'

export function broadcastUpdatedPrivateUser(userId: string) {
  // don't send private user info because it's private and anyone can listen
  broadcast(`private-user/${userId}`, {})
}

export function broadcastUpdatedUser(user: Partial<User> & {id: string}) {
  broadcast(`user/${user.id}`, {user})
}

// Carries no comment on purpose: this topic is open to anyone, while who may read a profile's comments
// depends on the viewer. Subscribers refetch, and `get-profile-comments` applies those rules.
export function broadcastProfileCommentsChanged(onUserId: string) {
  broadcast(`user/${onUserId}/comment`, {})
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
