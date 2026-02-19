import {PlusIcon} from '@heroicons/react/solid'
import clsx from 'clsx'
import {DisplayUser} from 'common/api/user-types'
import {buildArray} from 'common/util/array'
import {useRouter} from 'next/router'
import {useState} from 'react'
import {Row} from 'web/components/layout/row'
import {SelectUsers} from 'web/components/select-users'
import {usePrivateUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'

import {Button} from '../buttons/button'
import {Col} from '../layout/col'
import {Modal, MODAL_CLASS} from '../layout/modal'

export default function NewMessageButton() {
  const [open, setOpen] = useState(false)
  const t = useT()
  return (
    <>
      <Button className="h-fit gap-1" color={'gray-outline'} onClick={() => setOpen(true)}>
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

  const [users, setUsers] = useState<DisplayUser[]>([])
  const createChannel = async () => {
    const res = await api('create-private-user-message-channel', {
      userIds: users.map((user) => user.id),
    }).catch((e) => {
      console.error(e)
      return
    })
    if (!res) {
      return
    }
    router.push(`/messages/${res.channelId}`)
  }
  return (
    <Modal open={open} setOpen={setOpen}>
      <Col className={clsx(MODAL_CLASS, 'h-[20rem] rounded-b-none')}>
        <SelectUsers
          className={'w-full'}
          searchLimit={10}
          setSelectedUsers={setUsers}
          selectedUsers={users}
          ignoreUserIds={users
            .map((user) => user.id)
            .concat(privateUser?.blockedUserIds ?? [])
            .concat(buildArray(privateUser?.id))}
        />
      </Col>
      <Row className={'bg-canvas-0 justify-end rounded-b-md p-2'}>
        <Button disabled={users.length === 0} onClick={createChannel}>
          {t('messages.create', 'Create')}
        </Button>
      </Row>
    </Modal>
  )
}
