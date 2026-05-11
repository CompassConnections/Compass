import {
  EllipsisHorizontalIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {debug} from 'common/logger'
import {Profile} from 'common/profiles/profile'
import {User, UserActivity} from 'common/user'
import Image from 'next/image'
import Link from 'next/link'
import Router from 'next/router'
import React from 'react'
import toast from 'react-hot-toast'
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
import {updateProfile} from 'web/lib/api'
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
    <Row className={'flex-wrap gap-4'}>
      <Col>
        {currentUser && !isCurrentUser && isHiddenFromMe && (
          <div className="flex items-center gap-2 rounded-lg bg-canvas-200 px-4 py-3 text-sm text-primary-800 mb-4">
            <EyeSlashIcon className="h-4 w-4 flex-none" />
            {t(
              'profile_grid.hidden_notice',
              "You hid this person, so they don't appear in your search results.",
            )}
          </div>
        )}
        {currentUser && isCurrentUser && disabled && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
            <LockClosedIcon className="h-4 w-4 flex-none" />
            {t(
              'profile.header.disabled_notice',
              'You disabled your profile, so no one else can access it.',
            )}
          </div>
        )}
        <Row className="w-full gap-6 flex-wrap">
          {profile.pinned_url && (
            <div className="h-[108px] w-[108px] flex-none">
              <Image
                priority={true}
                src={profile.pinned_url}
                height={300}
                width={300}
                sizes="(max-width: 640px) 100vw, 300px"
                alt=""
                className="h-full w-full rounded-2xl object-cover"
              />
            </div>
          )}
          <Col
            className={clsx(
              profile.pinned_url
                ? 'max-w-[160px] sm:max-w-[300px]'
                : 'max-w-[260px] sm:max-w-[400px]',
            )}
          >
            <Row className={clsx('flex-wrap justify-between gap-2 py-1')}>
              <Row className="items-center gap-1">
                <Col className="gap-1">
                  <Row className="items-center gap-1" data-testid="profile-display-name-age">
                    {/*{!isCurrentUser && <OnlineIcon last_online_time={userActivity?.last_online_time}/>}*/}
                    <span>
                      {simpleView ? (
                        <Link className={linkClass} href={`/${user.username}`}>
                          <span
                            className="font-cormorant text-4xl font-medium"
                            style={{lineHeight: '1.1', letterSpacing: '-0.01em'}}
                          >
                            {user.name}
                          </span>
                        </Link>
                      ) : (
                        <span
                          className="font-cormorant text-4xl font-medium"
                          style={{lineHeight: '1.1', letterSpacing: '-0.01em'}}
                        >
                          {user.name}
                        </span>
                      )}
                    </span>
                  </Row>
                  <ProfilePrimaryInfo profile={profile} />
                </Col>
              </Row>
            </Row>
          </Col>
        </Row>
        <Row className={'gap-2 flex-wrap py-2'} data-testid="profile-keywords">
          {profile.keywords?.map(capitalizePure)?.map((tag, i) => (
            <span
              key={i}
              className={'border-canvas-300 text-primary-700 bg-canvas-200'}
              style={{
                padding: '5px 13px',
                borderRadius: '100px',
                fontSize: '13px',
                fontWeight: '400',
                letterSpacing: '0.01em',
                borderWidth: '1px',
              }}
            >
              {tag.trim()}
            </span>
          ))}
        </Row>
      </Col>
      {profile.headline && (
        <div
          className="relative max-w-xl px-4 py-3 text-ink-600  flex items-center justify-center"
          data-testid="profile-headline"
          style={{
            fontSize: '15px',
            lineHeight: '1.65',
            borderLeft: '1.5px solid rgb(var(--color-primary-300))',
            paddingLeft: '40px',
          }}
        >
          <div className="h-fit relative">
            <span
              className="absolute -mt-6 text-3xl text-primary-300"
              style={{fontFamily: 'serif'}}
            >
              "
            </span>
            <span className="italic">{profile.headline}</span>
            <span
              className="absolute -bottom-8 text-3xl text-primary-300"
              style={{fontFamily: 'serif'}}
            >
              "
            </span>
          </div>
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
}) {
  const {user, profile, starredUserIds, refreshStars, showMessageButton, refreshProfile} = props
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
      <Row className={'items-center gap-2'}>
        <ViewProfileCardButton user={user} profile={profile} />
        <ShareProfileButton className="sm:flex" username={user.username} />
        <Tooltip text={t('more_options_user.edit_profile', 'Edit profile')} noTap>
          <button
            data-testid="profile-edit"
            onClick={() => {
              track('editprofile', {userId: user.id})
              Router.push('profile')
            }}
            className="border-canvas-300 flex items-center gap-1.5 rounded-lg border px-2 py-2 text-sm text-primary-700 transition-colors hover:border-primary-400 hover:bg-primary-50"
          >
            <PencilIcon className="h-4 w-4 text-ink-500" />
          </button>
        </Tooltip>

        <Tooltip
          text={t('more_options_user.profile_options', 'Profile options')}
          noTap
          testId="profile-options"
        >
          <DropdownMenu
            menuWidth={'w-52'}
            icon={
              <button className="border-canvas-300 flex items-center gap-1.5 rounded-lg border px-2 py-2 text-sm text-primary-700 transition-colors hover:border-primary-400 hover:bg-primary-50">
                <EllipsisHorizontalIcon className="h-4 w-4 text-ink-500" aria-hidden="true" />
              </button>
            }
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
                onClick: async () => {
                  toast
                    .promise(
                      updateProfile({
                        visibility: profile.visibility === 'member' ? 'public' : 'member',
                      }),
                      {
                        loading: 'Loading...',
                        success: 'Success!',
                        error:
                          'Failed to update profile visibility. Try again later or contact support.',
                      },
                    )
                    .then(() => {
                      refreshProfile()
                    })
                    .catch(() => {
                      // noop
                    })
                },
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
    <Row className="items-center gap-2">
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
