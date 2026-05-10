import {EllipsisHorizontalIcon} from '@heroicons/react/24/outline'
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
import {Avatar} from 'web/components/widgets/avatar'
import {Subtitle} from 'web/components/widgets/subtitle'
import {Tooltip} from 'web/components/widgets/tooltip'
import {useAdmin, useTrusted} from 'web/hooks/use-admin'
import {usePrivateUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'

import {Row} from '../layout/row'

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

  return (
    <>
      <Tooltip text={t('more_options_user.more_options', 'More Options')} noTap>
        <Button
          color={'gray-white'}
          className="border-canvas-300 flex items-center gap-1.5 rounded-lg border px-[8px] py-2 text-sm text-primary-700 transition-colors hover:border-primary-400 hover:bg-primary-50"
          onClick={() => setIsModalOpen(true)}
        >
          <EllipsisHorizontalIcon className={clsx('h-5 w-5 flex-shrink-0')} aria-hidden="true" />
        </Button>
      </Tooltip>

      <Modal open={isModalOpen} setOpen={setIsModalOpen} size="md">
        <Col className="items-center gap-5 rounded-xl bg-canvas-50 px-4 pb-6 pt-6 text-ink-1000 sm:px-8">
          {/* Header */}
          <Row className="w-full items-center gap-4">
            <Avatar username={user.username} avatarUrl={user.avatarUrl} size="md" noLink />
            <Col className="min-w-0 flex-1">
              <Subtitle className="!mb-0 !mt-0 truncate">{name}</Subtitle>
              <Row className="flex-wrap items-center gap-x-3 gap-y-1 text-ink-500">
                <span className="text-sm">
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
            </Col>
          </Row>

          {/* Tabs */}
          <div className="w-full">
            <UncontrolledTabs
              className="mb-2"
              tabs={buildArray([
                [
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
          </div>

          {/* Admin actions */}
          {(isAdmin || isTrusted) && (
            <>
              <div className="w-full border-t border-canvas-200" />
              <Col className="w-full gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  {t('more_options_user.admin', 'Admin')}
                </span>
                <Row className="flex-wrap gap-2">
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
              </Col>
            </>
          )}
        </Col>
      </Modal>
    </>
  )
}
