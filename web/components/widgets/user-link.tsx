import {CheckBadgeIcon, ShieldCheckIcon} from '@heroicons/react/24/outline'
import {SparklesIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {isAdminUserId, MOD_USERNAMES, VERIFIED_USERNAMES} from 'common/envs/constants'
import {DAY_MS} from 'common/util/time'
import Link from 'next/link'
import {useT} from 'web/lib/locale'

import {Row} from '../layout/row'
import {Avatar} from './avatar'
import {linkClass} from './site-link'
import {Tooltip} from './tooltip'

export const isFresh = (createdTime: number) => createdTime > Date.now() - DAY_MS * 14

export function shortenName(name: string) {
  const firstName = name.split(' ')[0]
  const maxLength = 10
  return firstName.length >= 3 && name.length > maxLength
    ? firstName.length < maxLength
      ? firstName
      : firstName.substring(0, maxLength - 3) + '...'
    : name.length > maxLength
      ? name.substring(0, maxLength - 3) + '...'
      : name
}

export function UserAvatarAndBadge(props: {
  user: {id: string; name: string; username: string; avatarUrl?: string}
  noLink?: boolean
  className?: string
}) {
  const {user, noLink, className} = props
  const {username, avatarUrl} = user

  return (
    <Row className={clsx('items-center gap-2', className)}>
      <Avatar avatarUrl={avatarUrl} username={username} size={'sm'} noLink={noLink} />
      <UserLink user={user} noLink={noLink} />
    </Row>
  )
}

export function UserLink(props: {
  user: {id: string; name: string; username: string}
  className?: string
  short?: boolean
  noLink?: boolean
  createdTime?: number
  hideBadge?: boolean
}) {
  const {
    user: {id, name, username},
    className,
    short,
    noLink,
    createdTime,
    hideBadge,
  } = props
  const fresh = createdTime ? isFresh(createdTime) : false
  const shortName = short ? shortenName(name) : name
  const children = (
    <>
      <span className="max-w-[200px] truncate">{shortName}</span>
      {!hideBadge && <UserBadge userId={id} username={username} fresh={fresh} />}
    </>
  )
  if (noLink) {
    return (
      <div className={clsx('inline-flex flex-row items-center gap-1', className)}>{children}</div>
    )
  }
  return (
    <Link
      href={`/${username}`}
      className={clsx(linkClass, 'inline-flex flex-row items-center gap-1', className)}
      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
    >
      {children}
    </Link>
  )
}

// function BotBadge() {
//   return (
//     <span className="bg-ink-100 text-ink-800 ml-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium">
//       Bot
//     </span>
//   )
// }

export function BannedBadge() {
  return (
    <Tooltip text="Can't create comments, messages, or questions" placement="bottom">
      <span className="ml-1.5 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100">
        Banned
      </span>
    </Tooltip>
  )
}

/**
 * Marks a Compass admin, and has to be worth trusting on a site where anyone can call themselves
 * anything.
 *
 * Two things make it unforgeable. It is derived from the user id against `ENV_CONFIG.adminIds`
 * (`isAdminUserId`) — never from the name, username or avatar, so no amount of profile editing
 * produces one. And it is a filled chip carrying the word rather than a bare glyph: a lone
 * checkmark or shield is exactly what a display name could imitate, whereas a coloured pill sits
 * outside the name's text run in colours no text can paint. The remaining route — typing "Admin"
 * into the name itself — is closed on the way in by `cleanDisplayName` / `impersonatesStaff`, which
 * strip emoji and symbols and reject staff words.
 *
 * `shrink-0` because it shares a row with names that truncate: the name gives up characters, the
 * badge never gives up pixels.
 */
export function AdminBadge(props: {className?: string}) {
  const t = useT()
  return (
    <Tooltip
      text={t(
        'badge.admin.tooltip',
        'Verified Compass admin. Only staff accounts show this badge.',
      )}
      placement="bottom"
      // On the Tooltip rather than the chip: Tooltip renders its own wrapper span, which is what
      // ends up being the flex item in every row this badge sits in.
      className="inline-flex shrink-0 align-middle"
    >
      <span
        className={clsx(
          'bg-cta inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-white',
          props.className,
        )}
        data-testid="admin-badge"
      >
        <ShieldCheckIcon className="h-3 w-3" aria-hidden="true" />
        {t('badge.admin', 'Admin')}
      </span>
    </Tooltip>
  )
}

export function UserBadge(props: {userId: string; username: string; fresh?: boolean}) {
  const {userId, username, fresh} = props
  const badges = []

  // Admin outranks the others rather than stacking with them: two badges next to one name read as
  // decoration, and "runs the site" is the only one a reader needs at that point.
  if (isAdminUserId(userId)) {
    badges.push(<AdminBadge key="admin" />)
  } else if (MOD_USERNAMES.includes(username)) {
    badges.push(<ModBadge key="mod" />)
  } else if (VERIFIED_USERNAMES.includes(username)) {
    badges.push(<VerifiedBadge key="check" />)
  }
  if (fresh) {
    badges.push(<FreshBadge key="fresh" />)
  }
  return <>{badges}</>
}

// Show a normal checkmark next to our mods
function ModBadge() {
  return (
    <Tooltip text="Moderator" placement="right">
      <ShieldCheckIcon
        className="h-4 w-4 text-purple-700 dark:text-purple-400"
        aria-hidden="true"
      />
    </Tooltip>
  )
}

// Show a normal checkmark next to our verified users
function VerifiedBadge() {
  return (
    <Tooltip text="Verified" placement="right">
      <CheckBadgeIcon className="text-primary-700 h-4 w-4" aria-hidden />
    </Tooltip>
  )
}

// Show a fresh badge next to new users
function FreshBadge() {
  return (
    <Tooltip text="I'm new here!" placement="right">
      <SparklesIcon className="h-4 w-4 text-green-500" aria-hidden="true" />
    </Tooltip>
  )
}

// export const StackedUserNames = (props: {
//   user: {
//     id: string
//     name: string
//     username: string
//     createdTime: number
//     is_banned_from_posting?: boolean
//   }
//   followsYou?: boolean
//   className?: string
//   usernameClassName?: string
// }) => {
//   const {user, followsYou, usernameClassName, className} = props
//   return (
//     <Col>
//       <div className={'inline-flex flex-row items-center gap-1 pt-1'}>
//         <span className={clsx('break-anywhere ', className)}>{user.name}</span>
//         {
//           <UserBadge
//             userId={user.id}
//             username={user.username}
//             fresh={isFresh(user.createdTime)}
//           />
//         }
//         {user.is_banned_from_posting && <BannedBadge/>}
//       </div>
//       <Row className={'flex-shrink flex-wrap gap-x-2'}>
//         <span className={clsx('text-ink-400 text-sm', usernameClassName)}>
//           @{user.username}{' '}
//         </span>
//         {followsYou && (
//           <span
//             className={
//               'bg-ink-200 w-fit self-center rounded-md p-0.5 px-1 text-xs'
//             }
//           >
//             Follows you
//           </span>
//         )}
//       </Row>
//     </Col>
//   )
// }
