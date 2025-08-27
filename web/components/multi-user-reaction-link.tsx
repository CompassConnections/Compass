import { Col } from 'web/components/layout/col'
import { Modal } from 'web/components/layout/modal'
import { Notification } from 'common/notifications'
import { UserAvatarAndBadge } from './widgets/user-link'

export function MultiUserReactionModal(props: {
  similarNotifications: Notification[]
  modalLabel: string
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const { similarNotifications, modalLabel, open, setOpen } = props
  return (
    <Modal open={open} setOpen={setOpen} size={'sm'}>
      <Col className="bg-canvas-0 items-start gap-4 rounded-md p-6">
        <span className={'text-xl'}>{modalLabel}</span>
        {similarNotifications.map((notif) => (
          <UserAvatarAndBadge
            key={notif.sourceUserUsername}
            className="w-full"
            user={{
              id: notif.userId,
              name: notif.sourceUserName,
              username: notif.sourceUserUsername,
            }}
          />
        ))}
      </Col>
    </Modal>
  )
}
