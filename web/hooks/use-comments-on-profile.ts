import {useAPIGetter} from './use-api-getter'
import {useApiSubscription} from './use-api-subscription'
import {useIsAuthorized} from './use-user'

/**
 * The comments on a profile, kept current over the websocket.
 *
 * The list always comes from `get-profile-comments`, which decides what this viewer may see. The
 * topic is open to anyone, so it only says that something changed, and this refetches. `refresh` is
 * for the poster: showing their own comment must not depend on the websocket being up.
 */
export function useLiveCommentsOnProfile(userId: string) {
  // Ask only once the auth state is known. The endpoint is open to visitors, but a signed-in member
  // whose token has not been restored yet would be answered as a visitor — empty for a members-only
  // profile — and `useAPIGetter` does not ask twice for the same props.
  const authorized = useIsAuthorized()
  const {data, refresh} = useAPIGetter(
    'get-profile-comments',
    authorized === undefined ? undefined : {userId},
  )

  useApiSubscription({
    topics: [`user/${userId}/comment`],
    onBroadcast: () => void refresh(),
    onReconnect: () => void refresh(),
  })

  return {comments: data?.comments ?? [], refresh}
}
