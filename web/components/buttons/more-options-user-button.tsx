import {DotsHorizontalIcon} from '@heroicons/react/outline'
import clsx from 'clsx'
import {User} from 'common/user'
import {buildArray} from 'common/util/array'
import Router from 'next/router'
import {useState} from 'react'
import {toast} from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {SimpleCopyTextButton} from 'web/components/buttons/copy-link-button'
import {Col} from 'web/components/layout/col'
import {Modal} from 'web/components/layout/modal'
import {UncontrolledTabs} from 'web/components/layout/tabs'
import {BlockUser} from 'web/components/profile/block-user'
import {ReportUser} from 'web/components/profile/report-user'
import {Title} from 'web/components/widgets/title'
import {Tooltip} from 'web/components/widgets/tooltip'
import {useAdmin, useTrusted} from 'web/hooks/use-admin'
import {usePrivateUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'

import {Row} from '../layout/row'
import {DeleteYourselfButton} from '../profile/delete-yourself'

export function MoreOptionsUserButton(props: {user: User}) {
  const {user} = props
  const {id: userId, name} = user
  const currentPrivateUser = usePrivateUser()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const isAdmin = useAdmin()
  const isTrusted = useTrusted()
  const t = useT()

  if (!currentPrivateUser) return <div />

  const createdTime = new Date(user.createdTime).toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'short',
  })

  const isYou = currentPrivateUser.id === userId

  return (
    <>
      <Tooltip text={t('more_options_user.more_options', 'More Options')} noTap>
        <Button
          color={'gray-white'}
          className="rounded-none px-6"
          onClick={() => setIsModalOpen(true)}
        >
          <DotsHorizontalIcon className={clsx('h-5 w-5 flex-shrink-0')} aria-hidden="true" />
        </Button>
      </Tooltip>

      <Modal open={isModalOpen} setOpen={setIsModalOpen}>
        <Col className={'bg-canvas-0 text-ink-1000 rounded-md p-4 '}>
          <div className="mb-2 flex flex-wrap justify-between">
            <Title className={'!mb-0'}>{name}</Title>
            {(isAdmin || isTrusted) && (
              <Row className="gap-2">
                <Button
                  color={'red'}
                  size="xs"
                  onClick={async () => {
                    await toast.promise(
                      api('ban-user', {
                        userId,
                        unban: user.isBannedFromPosting ?? false,
                      }),
                      {
                        loading: t('more_options_user.banning', 'Banning...'),
                        success: () => {
                          return t('more_options_user.user_banned', 'User banned!')
                        },
                        error: () => {
                          return t('more_options_user.error_banning', 'Error banning user')
                        },
                      },
                    )
                  }}
                >
                  {user.isBannedFromPosting
                    ? t('more_options_user.banned', 'Banned')
                    : t('more_options_user.ban_user', 'Ban User')}
                </Button>
                <Button
                  size="sm"
                  color="red"
                  onClick={() => {
                    api('remove-pinned-photo', {userId}).then(() => Router.back())
                  }}
                >
                  {t('more_options_user.delete_pinned_photo', 'Delete pinned photo')}
                </Button>
              </Row>
            )}
          </div>
          <Row className={'text-ink-600 flex-wrap items-center gap-x-3 gap-y-1 px-1'}>
            <span className={'text-sm'}>
              {t('more_options_user.joined', 'Joined')} {createdTime}
            </span>
            {isAdmin && (
              <SimpleCopyTextButton
                text={user.id}
                tooltip={t('more_options_user.copy_user_id', 'Copy user id')}
                className="!px-1 !py-px"
                eventTrackingName={'admin copy user id'}
              />
            )}
          </Row>
          <UncontrolledTabs
            className={'mb-4'}
            tabs={buildArray([
              // TODO: if isYou include a tab for users you've blocked?
              isYou
                ? [
                    {
                      title: t('more_options_user.delete_account', 'Delete Account'),
                      content: (
                        <div className="flex min-h-[200px] items-center justify-center p-4">
                          <DeleteYourselfButton />
                        </div>
                      ),
                    },
                  ]
                : [
                    {
                      title: t('more_options_user.block', 'Block'),
                      content: (
                        <BlockUser
                          user={user}
                          currentUser={currentPrivateUser}
                          closeModal={() => setIsModalOpen(false)}
                        />
                      ),
                    },
                    {
                      title: t('more_options_user.report', 'Report'),
                      content: <ReportUser user={user} closeModal={() => setIsModalOpen(false)} />,
                    },
                  ],
            ])}
          />
        </Col>
      </Modal>
    </>
  )
}
