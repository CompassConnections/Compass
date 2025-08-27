import { Modal } from 'web/components/layout/modal'
import { Col } from 'web/components/layout/col'
import { Row } from 'web/components/layout/row'
import { Button } from 'web/components/buttons/button'
import { EyeIcon, LockClosedIcon } from '@heroicons/react/outline'

export function VisibilityConfirmationModal(props: {
  open: boolean
  setOpen: (open: boolean) => void
  currentVisibility: 'public' | 'member'
  onConfirm: () => void
}) {
  const { open, setOpen, currentVisibility, onConfirm } = props
  const isMakingPublic = currentVisibility === 'member'

  return (
    <Modal open={open} setOpen={setOpen}>
      <Col className="bg-canvas-0 gap-4 rounded-md px-8 py-6">
        <Row className="items-center gap-2 text-lg">
          {isMakingPublic ? (
            <EyeIcon className="h-5 w-5" />
          ) : (
            <LockClosedIcon className="h-5 w-5" />
          )}
          <span>
            {isMakingPublic
              ? 'Make profile visible publicly?'
              : 'Limit profile to members only?'}
          </span>
        </Row>

        <div className="text-ink-600">
          {isMakingPublic
            ? 'Your profile will be visible to any visitor without logging in.'
            : 'Your profile will only be visible to members. Visitors will have to log in to view your profile.'}
        </div>

        <Row className="w-full justify-end gap-4">
          <Button color="gray-white" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            color={isMakingPublic ? 'blue' : 'gray'}
            onClick={() => {
              onConfirm()
              setOpen(false)
            }}
          >
            {isMakingPublic ? 'Make Public' : 'Limit to Members'}
          </Button>
        </Row>
      </Col>
    </Modal>
  )
}
