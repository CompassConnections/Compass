import {PlusIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {DisplayUser} from 'common/api/user-types'
import {APIError} from 'common/api/utils'
import {buildArray} from 'common/util/array'
import {useRouter} from 'next/router'
import {useState} from 'react'
import {Row} from 'web/components/layout/row'
import {
  AccountOnHoldNotice,
  isAutoBanUnderReviewError,
} from 'web/components/moderation/account-on-hold'
import {SelectUsers} from 'web/components/select-users'
import {usePrivateUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'

import {Button} from '../buttons/button'
import {Col} from '../layout/col'
import {Modal} from '../layout/modal'

export default function NewMessageButton() {
  const [open, setOpen] = useState(false)
  const t = useT()
  return (
    <>
      <Button className="h-fit gap-1 bg-canvas-50" color={'primary'} onClick={() => setOpen(true)}>
        <PlusIcon className="h-5 w-5" aria-hidden="true" />
        {t('messages.new_message', 'New Message')}
      </Button>
      <MessageModal open={open} setOpen={setOpen} />
    </>
  )
}

function MessageModal(props: {open: boolean; setOpen: (open: boolean) => void}) {
  const {open, setOpen} = props
  const privateUser = usePrivateUser()
  const router = useRouter()
  const t = useT()
  const [errorText, setErrorText] = useState<string>('')
  // The daily new-conversation limit auto-ban gets the full explanation panel instead of a red line.
  const [onHold, setOnHold] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [users, setUsers] = useState<DisplayUser[]>([])
  const createChannel = async () => {
    setErrorText('')
    setSubmitting(true)
    const res = await api('create-private-user-message-channel', {
      userIds: users.map((user) => user.id),
    }).catch((e: APIError) => {
      console.error(e)
      if (isAutoBanUnderReviewError(e)) setOnHold(true)
      else setErrorText(String(e))
      return
    })
    if (!res) {
      setSubmitting(false)
      return
    }
    router.push(`/messages/${res.channelId}`)
  }
  return (
    <Modal open={open} setOpen={setOpen}>
      {/* One flex column at a fixed height: the search field and footer stay put while only the
          result list scrolls, so the Create button can never be pushed out of the modal. */}
      <Col
        className={clsx(
          // canvas-100 is the page ground the conversation list sits on; the rows inside are the
          // same canvas-50 cards, so the picker reads as the inbox it is about to add to.
          'bg-canvas-100 text-ink-1000 overflow-hidden rounded-t-xl shadow-xl sm:rounded-xl',
          'h-[78dvh] max-h-[44rem] min-h-[26rem]',
        )}
      >
        <Col className={'border-canvas-200 gap-0.5 border-b px-5 pb-4 pt-5'}>
          <h2 className={'text-ink-1000 text-lg font-semibold'}>
            {t('messages.new_message', 'New Message')}
          </h2>
          <p className={'text-ink-500 text-sm'}>
            {t('messages.new_message_subtitle', 'Find someone to start a conversation with.')}
          </p>
        </Col>
        <SelectUsers
          className={'min-h-0 w-full flex-1 px-5 pb-2 pt-4'}
          searchLimit={10}
          setSelectedUsers={setUsers}
          selectedUsers={users}
          ignoreUserIds={users
            .map((user) => user.id)
            .concat(privateUser?.blockedUserIds ?? [])
            .concat(buildArray(privateUser?.id))}
        />
        {onHold && (
          <div className={'px-5 pb-2'}>
            {/* compact: the modal is a fixed height, so keep this panel to its essentials. */}
            <AccountOnHoldNotice reason={'auto_rate_limit'} compact />
          </div>
        )}
        {errorText && <p className={'text-red-500 px-5 pb-2 text-sm'}>{errorText}</p>}
        <Row className={'border-canvas-200 items-center justify-between gap-3 border-t px-5 py-3'}>
          <span className={'text-ink-500 text-sm'}>
            {users.length > 0
              ? t('messages.selected_count', '{count} selected', {count: users.length})
              : ''}
          </span>
          <Button
            color={'indigo'}
            loading={submitting}
            disabled={users.length === 0 || onHold}
            onClick={createChannel}
          >
            {t('messages.create', 'Create')}
          </Button>
        </Row>
      </Col>
    </Modal>
  )
}
