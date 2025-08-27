import { Col } from 'web/components/layout/col'
import { Row } from 'web/components/layout/row'
import { Button } from 'web/components/buttons/button'
import { withTracking } from 'web/lib/service/analytics'
import { toast } from 'react-hot-toast'
import { PrivateUser, User } from 'common/user'
import { api } from 'web/lib/api'

export const BlockUser = (props: {
  user: User
  currentUser: PrivateUser
  closeModal: () => void
}) => {
  const { user, currentUser, closeModal } = props
  const { id: userId } = user

  const isBlocked = currentUser.blockedUserIds?.includes(userId)

  const onUnblock = () => api('user/by-id/:id/unblock', { id: user.id })

  const onBlock = async () => {
    await toast.promise(api('user/by-id/:id/block', { id: user.id }), {
      loading: 'Blocking...',
      success: `You'll no longer see content from this user`,
      error: 'Error blocking user',
    })
  }
  return (
    <Col>
      <Row className={'justify-between'}>
        <Button onClick={closeModal} color={'gray-white'}>
          Cancel
        </Button>
        <Row className={'gap-4'}>
          {isBlocked ? (
            <Button
              size="sm"
              color="indigo"
              className="my-auto"
              onClick={withTracking(onUnblock, 'unblock')}
            >
              Unblock {user.name}
            </Button>
          ) : (
            <Button
              size="sm"
              color="red"
              className="my-auto"
              onClick={withTracking(onBlock, 'block')}
            >
              Block {user.name}
            </Button>
          )}
        </Row>
      </Row>
    </Col>
  )
}
