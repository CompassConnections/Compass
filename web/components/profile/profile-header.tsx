import {EllipsisHorizontalIcon, EyeIcon, PencilIcon} from '@heroicons/react/24/outline'
import {Profile} from 'common/profiles/profile'
import {User} from 'common/user'
import Router from 'next/router'
import React from 'react'
import {MoreOptionsUserButton} from 'web/components/buttons/more-options-user-button'
import DropdownMenu from 'web/components/comments/dropdown-menu'
import {Row} from 'web/components/layout/row'
import {SendMessageButton} from 'web/components/messaging/send-message-button'
import {ViewProfileCardButton} from 'web/components/photos-modal'
import {AUDIENCE_ICONS} from 'web/components/profile/audience-chip'
import {
  useViewAsControl,
  useViewAsNames,
  VIEW_AS_AUDIENCES,
} from 'web/components/profile/profile-access'
import {StarButton} from 'web/components/widgets/star-button'
import {Tooltip} from 'web/components/widgets/tooltip'
import {useAdmin} from 'web/hooks/use-admin'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'

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
    isProfileVisible = true,
  } = props
  const currentUser = useUser()
  const isAdmin = useAdmin()
  const isCurrentUser = currentUser?.id === user.id
  const t = useT()
  const viewAsControl = useViewAsControl()
  const viewAsNames = useViewAsNames()

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
            // Same shape as Card and Share beside it: the word at every width, the icon joining it
            // from `sm` up. On a phone three short words fit where three icons plus three words do
            // not, and the words are the unambiguous half — a pencil is guessable, a "card" icon is
            // not.
            className="border-canvas-300 text-ink-500 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors hover:border-primary-400 hover:bg-primary-50"
          >
            <PencilIcon className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" />
            {t('profile.header.edit', 'Edit')}
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
              // "View as" (docs/profile-visibility.md): this page as a visitor, a member or someone
              // you approved receives it. Only where the page offers it — the profile page does, an
              // embedded profile does not. Switching the whole profile between public and
              // members-only used to be the first item here; it lives in the profile form now, next
              // to the per-field choices it is the default for.
              ...(viewAsControl
                ? [
                    {
                      name: t('profile.header.menu.view_as', 'View as'),
                      icon: <EyeIcon className="h-4 w-4" aria-hidden />,
                      onClick: () => {},
                      // One item, which opens a second menu with the three audiences.
                      subItems: VIEW_AS_AUDIENCES.map((audience) => {
                        const Icon = AUDIENCE_ICONS[audience]
                        return {
                          name: viewAsNames[audience],
                          icon: <Icon className="h-4 w-4" aria-hidden />,
                          onClick: () => viewAsControl.setViewAs(audience),
                        }
                      }),
                    },
                  ]
                : []),
              // Pausing the profile used to be the last item here. It moved to Settings (the row above
              // the Danger Zone) and into the delete-account dialog: next to Share and Edit it was one
              // click from taking yourself out of search by accident. A paused profile says so at
              // the top of its own page, with the button to resume.
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
