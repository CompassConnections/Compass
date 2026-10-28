import clsx from 'clsx'
import {ReactNode, useRef} from 'react'
import {ProfileInfo, ProfileInfoSkeleton} from 'web/components/profile/profile-info'
import {useAdminOrMod} from 'web/hooks/use-admin'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useHideOnScrollWithin} from 'web/hooks/use-hide-bottom-nav-on-scroll'
import {useT} from 'web/lib/locale'
import {DisplayUser} from 'web/lib/supabase/users'

/**
 * The other person's profile, beside a 1-on-1 conversation on wide screens.
 *
 * Mounted only when it is actually shown (see `PrivateChat`), so a phone never pays for the profile
 * requests. Mirrors the profile page's walls: mods see banned and disabled profiles, everyone else
 * gets a one-line placeholder instead.
 */
export function ChatProfilePanel(props: {
  // undefined when the account is gone and the store has nothing to name.
  member: DisplayUser | undefined
  // The chat's member batch is still in flight, so an absent member means nothing yet.
  loading?: boolean
  className?: string
}) {
  const {member, loading, className} = props
  const t = useT()
  const isMod = useAdminOrMod()

  const username = member?.username
  const bannedWall = !!member?.isBannedFromPosting && !isMod
  // Signed-in read: members-only profiles are the default, and the anonymous lookup redacts them.
  const {data, error, refresh} = useAPIGetter(
    'get-profile',
    username && !bannedWall ? {username} : undefined,
  )

  const placeholder = (text: string) => (
    <PanelShell className={className}>
      <div className="bg-canvas-50 border border-canvas-200 rounded-xl p-8 text-center m-4">
        <p className="text-ink-500 text-sm">{text}</p>
      </div>
    </PanelShell>
  )

  if (loading) {
    return (
      <PanelShell className={className}>
        <ProfileInfoSkeleton />
      </PanelShell>
    )
  }
  if (!username) {
    return placeholder(
      t('messages.profile_panel.unavailable', 'This profile is no longer available.'),
    )
  }
  if (bannedWall) {
    return placeholder(t('userpage.accountSuspended', 'This account has been suspended.'))
  }
  if (error) {
    return placeholder(
      t('messages.profile_panel.unavailable', 'This profile is no longer available.'),
    )
  }
  if (!data) {
    return (
      <PanelShell className={className}>
        <ProfileInfoSkeleton />
      </PanelShell>
    )
  }

  const {user, profile} = data
  if (!user || !profile || user.userDeleted) {
    return placeholder(
      t('messages.profile_panel.unavailable', 'This profile is no longer available.'),
    )
  }
  if (profile.disabled && !isMod) {
    return placeholder(t('userpage.profileDisabled', 'The user disabled their profile.'))
  }

  return (
    <PanelShell className={className}>
      <ProfileInfo
        key={profile.user_id}
        profile={{...profile, user}}
        user={user}
        refreshProfile={refresh}
        embedded
      />
    </PanelShell>
  )
}

// Scrolls on its own so reading the profile never moves the conversation beside it.
// Its profile top bar slides away while scrolling down, as it does on the profile page, so the bar
// doesn't sit over the top of the Details rail.
function PanelShell(props: {className?: string; children: ReactNode}) {
  const ref = useRef<HTMLDivElement>(null)
  useHideOnScrollWithin(ref)
  return (
    <div
      ref={ref}
      className={clsx(
        'min-w-0 overflow-y-auto rounded-xl border border-canvas-200',
        props.className,
      )}
      data-testid="chat-profile-panel"
    >
      {props.children}
    </div>
  )
}
