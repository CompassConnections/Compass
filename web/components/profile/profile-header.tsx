import {
  EllipsisHorizontalIcon,
  EyeIcon,
  LockClosedIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import {feedVisibilityForMembersOnly} from 'common/feed/feed'
import {Profile} from 'common/profiles/profile'
import {User} from 'common/user'
import {removeUndefinedProps} from 'common/util/object'
import Router from 'next/router'
import React from 'react'
import toast from 'react-hot-toast'
import {MoreOptionsUserButton} from 'web/components/buttons/more-options-user-button'
import DropdownMenu from 'web/components/comments/dropdown-menu'
import {Row} from 'web/components/layout/row'
import {SendMessageButton} from 'web/components/messaging/send-message-button'
import {ViewProfileCardButton} from 'web/components/photos-modal'
import {StarButton} from 'web/components/widgets/star-button'
import {Tooltip} from 'web/components/widgets/tooltip'
import {useAdmin} from 'web/hooks/use-admin'
import {useUser} from 'web/hooks/use-user'
import {updateProfile} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'
import {disableProfile} from 'web/lib/util/disable'

import {ShareProfileButton} from '../widgets/share-profile-button'

export function ProfileHeaderActions(props: {
  user: User
  profile: Profile
  starredUserIds: string[]
  refreshStars: () => Promise<void>
  showMessageButton: boolean
  refreshProfile: () => void
  isHiddenFromMe: boolean | undefined
  /** False for a members-only profile read by someone who is not signed in. */
  isProfileVisible?: boolean
}) {
  const {
    user,
    profile,
    starredUserIds,
    refreshStars,
    showMessageButton,
    refreshProfile,
    isProfileVisible = true,
  } = props
  const currentUser = useUser()
  const isAdmin = useAdmin()
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
  // Admins can still message them (the API lets staff through), so say so rather than leaving a
  // tooltip that reads like the button is dead.
  if (!profile.allow_direct_messaging && isAdmin) {
    tooltipText =
      tooltipText +
      t('profile.header.tooltip.admin_can_still_message', ', but you can message them as an admin')
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
                  const visibility = profile.visibility === 'member' ? 'public' : 'member'
                  // Limiting the profile to members also switches the feed off, unless a level was
                  // deliberately chosen — see feedVisibilityForMembersOnly.
                  const feedVisibility =
                    visibility === 'member'
                      ? feedVisibilityForMembersOnly(profile.feed_visibility)
                      : undefined
                  toast
                    .promise(
                      updateProfile(
                        removeUndefinedProps({visibility, feed_visibility: feedVisibility}),
                      ),
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
      {/* The card is the profile in miniature — photo, place, tagline — so it is gated by the same
          rule as the page it sits on. Sharing a link is not: a link reveals nothing the recipient
          isn't separately entitled to. */}
      {isProfileVisible && <ViewProfileCardButton user={user} profile={profile} />}
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
          profile={profile}
          tooltipText={tooltipText}
          disabled={!profile.allow_direct_messaging && !isAdmin}
        />
      )}
      <MoreOptionsUserButton user={user} />
    </Row>
  )
}
