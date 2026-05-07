import {
  EllipsisHorizontalIcon,
  EyeIcon,
  LockClosedIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {debug} from 'common/logger'
import {Profile} from 'common/profiles/profile'
import {User, UserActivity} from 'common/user'
import Link from 'next/link'
import Router from 'next/router'
import React from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {MoreOptionsUserButton} from 'web/components/buttons/more-options-user-button'
import DropdownMenu from 'web/components/comments/dropdown-menu'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {SendMessageButton} from 'web/components/messaging/send-message-button'
import {ViewProfileCardButton} from 'web/components/photos-modal'
import {linkClass} from 'web/components/widgets/site-link'
import {StarButton} from 'web/components/widgets/star-button'
import {Tooltip} from 'web/components/widgets/tooltip'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'
import {disableProfile} from 'web/lib/util/disable'
import {capitalizePure} from 'web/lib/util/time'

import {ShareProfileButton} from '../widgets/share-profile-button'
import ProfilePrimaryInfo from './profile-primary-info'

export default function ProfileHeader(props: {
  user: User
  userActivity?: UserActivity
  profile: Profile
  simpleView?: boolean
  isHiddenFromMe: boolean | undefined
}) {
  const {user, profile, userActivity, simpleView, isHiddenFromMe} = props
  const currentUser = useUser()
  const isCurrentUser = currentUser?.id === user.id
  const disabled = profile.disabled
  const t = useT()

  debug('ProfileProfileHeader', {
    user,
    profile,
    userActivity,
    currentUser,
  })

  return (
    <Row className="w-full">
      <Col className="w-full">
        {currentUser && !isCurrentUser && isHiddenFromMe && (
          <div className="guidance">
            {t(
              'profile_grid.hidden_notice',
              "You hid this person, so they don't appear in your search results.",
            )}
          </div>
        )}
        {currentUser && isCurrentUser && disabled && (
          <div className="text-red-500">
            {t(
              'profile.header.disabled_notice',
              'You disabled your profile, so no one else can access it.',
            )}
          </div>
        )}
        <Row className={clsx('flex-wrap justify-between gap-2 py-1')}>
          <Row className="items-center gap-1">
            <Col className="gap-1">
              <Row className="items-center gap-1 text-xl" data-testid="profile-display-name-age">
                {/*{!isCurrentUser && <OnlineIcon last_online_time={userActivity?.last_online_time}/>}*/}
                <span>
                  {simpleView ? (
                    <Link className={linkClass} href={`/${user.username}`}>
                      <span className="font-semibold">{user.name}</span>
                    </Link>
                  ) : (
                    <span className="font-semibold">{user.name}</span>
                  )}
                </span>
              </Row>
              <ProfilePrimaryInfo profile={profile} />
            </Col>
          </Row>
        </Row>

        <Row className={'px-4 gap-2 flex-wrap py-2'} data-testid="profile-keywords">
          {profile.keywords?.map(capitalizePure)?.map((tag, i) => (
            <span
              key={i}
              className={'bg-canvas-200'}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
              }}
            >
              {tag.trim()}
            </span>
          ))}
        </Row>
      </Col>
      {profile.headline && (
        <div className="italic max-w-3xl px-4 py-3" data-testid="profile-headline">
          "{profile.headline}"
        </div>
      )}
    </Row>
  )
}

export function ProfileHeaderActions(props: {
  user: User
  profile: Profile
  starredUserIds: string[]
  refreshStars: () => Promise<void>
  showMessageButton: boolean
  refreshProfile: () => void
  isHiddenFromMe: boolean | undefined
  setShowVisibilityModal: (show: boolean) => void
}) {
  const {
    user,
    profile,
    starredUserIds,
    refreshStars,
    showMessageButton,
    refreshProfile,
    setShowVisibilityModal,
  } = props
  const currentUser = useUser()
  const isCurrentUser = currentUser?.id === user.id
  const disabled = profile.disabled
  const t = useT()

  let tooltipText = undefined
  if (!profile.allow_direct_messaging) {
    tooltipText = t(
      'profile.header.tooltip.direct_messaging_off',
      '{name} turned off direct messaging',
      {
        name: user.name,
      },
    )
  }
  if (!profile.allow_direct_messaging && profile.allow_interest_indicating) {
    tooltipText =
      tooltipText +
      t(
        'profile.header.tooltip.can_express_interest',
        ', but you can still express interest at the end of the profile',
      )
  }

  if (currentUser && isCurrentUser) {
    return (
      <Row className={'items-center gap-4'}>
        <ViewProfileCardButton user={user} profile={profile} />
        <ShareProfileButton className="sm:flex" username={user.username} />
        <Tooltip text={t('more_options_user.edit_profile', 'Edit profile')} noTap>
          <Button
            data-testid="profile-edit"
            color={'gray-outline'}
            onClick={() => {
              track('editprofile', {userId: user.id})
              Router.push('profile')
            }}
            size="sm"
          >
            <PencilIcon className=" h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip
          text={t('more_options_user.profile_options', 'Profile options')}
          noTap
          testId="profile-options"
        >
          <DropdownMenu
            menuWidth={'w-52'}
            icon={<EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />}
            items={[
              {
                name:
                  profile.visibility === 'member'
                    ? t('profile.header.menu.list_public', 'List Profile Publicly')
                    : t('profile.header.menu.limit_members', 'Limit to Members Only'),
                icon:
                  profile.visibility === 'member' ? (
                    <EyeIcon className="h-4 w-4" />
                  ) : (
                    <LockClosedIcon className="h-4 w-4" />
                  ),
                onClick: () => setShowVisibilityModal(true),
              },
              {
                name: disabled
                  ? t('profile.header.menu.enable_profile', 'Enable profile')
                  : t('profile.header.menu.disable_profile', 'Disable profile'),
                icon: null,
                onClick: async () => {
                  const confirmed = true
                  if (confirmed) {
                    toast
                      .promise(disableProfile(!disabled), {
                        loading: disabled
                          ? t('profile.header.toast.enabling', 'Enabling profile...')
                          : t('profile.header.toast.disabling', 'Disabling profile...'),
                        success: () => {
                          return disabled
                            ? t('profile.header.toast.enabled', 'Profile enabled')
                            : t('profile.header.toast.disabled', 'Profile disabled')
                        },
                        error: () => {
                          return disabled
                            ? t('profile.header.toast.failed_enable', 'Failed to enable profile')
                            : t('profile.header.toast.failed_disable', 'Failed to disable profile')
                        },
                      })
                      .then(() => {
                        refreshProfile()
                      })
                      .catch(() => {
                        // noop
                      })
                  }
                },
              },
            ]}
          />
        </Tooltip>
      </Row>
    )
  }

  return (
    <Row className="items-center gap-1 sm:gap-2">
      <ViewProfileCardButton user={user} profile={profile} />
      <ShareProfileButton className="sm:flex" username={user.username} />
      {currentUser && (
        <StarButton
          targetProfile={profile}
          isStarred={starredUserIds.includes(user.id)}
          refresh={refreshStars}
        />
      )}
      {currentUser && showMessageButton && (
        <SendMessageButton
          toUser={user}
          currentUser={currentUser}
          profile={profile}
          tooltipText={tooltipText}
          disabled={!profile.allow_direct_messaging}
        />
      )}
      <MoreOptionsUserButton user={user} />
    </Row>
  )
}
