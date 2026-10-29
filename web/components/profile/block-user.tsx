import {PrivateUser, User} from 'common/user'
import {toast} from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {invalidateProfilesCache, removeProfileFromCache} from 'web/hooks/use-profiles'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {withTracking} from 'web/lib/service/analytics'

// Shared by the profile page's more-options modal and the chat header's dropdown, so blocking does
// the same thing (same toast, same cache patch) wherever it's triggered from.
//
// The grid the blocker came from is unmounted, but its result set is still in memory and would be
// handed straight back on the way there, blocked profile included — so patch it here rather than
// making them reload to see the block take effect. Unblocking cannot be patched the same way (the
// profiles to put back are not on the client), so it just forces the next visit to refetch.
export const blockUser = async (userId: string, t: ReturnType<typeof useT>) => {
  await toast.promise(api('user/by-id/:id/block', {id: userId}), {
    loading: t('block_user.toast.loading', 'Blocking...'),
    success: t(
      'block_user.toast.success',
      "Blocked. They're hidden from your search results and neither of you can message the other.",
    ),
    error: t('block_user.toast.error', 'Error blocking user'),
  })
  removeProfileFromCache(userId)
}

export const unblockUser = async (userId: string, t: ReturnType<typeof useT>) => {
  await toast.promise(api('user/by-id/:id/unblock', {id: userId}), {
    loading: t('block_user.toast.unblock.loading', 'Unblocking...'),
    success: t(
      'block_user.toast.unblock.success',
      'Unblocked. They can show up in your search results and message you again.',
    ),
    error: t('block_user.toast.unblock.error', 'Error unblocking user'),
  })
  invalidateProfilesCache()
}

export const BlockUser = (props: {
  user: User
  currentUser: PrivateUser
  closeModal: () => void
}) => {
  const {user, currentUser} = props
  const {id: userId} = user
  const t = useT()

  const isBlocked = currentUser.blockedUserIds?.includes(userId)

  const onUnblock = () => unblockUser(userId, t)
  const onBlock = () => blockUser(userId, t)
  return (
    <Col>
      <Row className={'justify-between'}>
        {/*<Button onClick={closeModal} color={'gray-white'}>*/}
        {/*  {t('settings.action.cancel', 'Cancel')}*/}
        {/*</Button>*/}
        <Row className={'gap-4'}>
          {isBlocked ? (
            <Button
              size="sm"
              color="indigo"
              className="my-auto"
              onClick={withTracking(onUnblock, 'unblock')}
            >
              {t('block_user.unblock', 'Unblock')} {user.name}
            </Button>
          ) : (
            <Button
              size="sm"
              color="red"
              className="my-auto"
              onClick={withTracking(onBlock, 'block')}
            >
              {t('block_user.block', 'Block')} {user.name}
            </Button>
          )}
        </Row>
      </Row>
    </Col>
  )
}
