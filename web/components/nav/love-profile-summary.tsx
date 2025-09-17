import clsx from 'clsx'
import { useProfile } from 'web/hooks/use-lover'
import Link from 'next/link'
import { Avatar } from 'web/components/widgets/avatar'
import { User } from 'web/lib/firebase/users'
import { trackCallback } from 'web/lib/service/analytics'

export function ProfileSummary(props: { user: User; className?: string }) {
  const { user, className } = props

  const lover = useProfile()

  return (
    <Link
      href={lover === null ? '/signup' : `/${user.username}`}
      onClick={trackCallback('sidebar: profile')}
      className={clsx(
        'hover:bg-ink-100 text-ink-700 group flex w-full shrink-0 flex-row items-center truncate rounded-md py-3',
        className
      )}
    >
      <div className="w-2 shrink" />
      <Avatar
        avatarUrl={lover?.pinned_url ?? ''}
        username={user.username}
        noLink
      />
      <div className="mr-1 w-2 shrink-[2]" />
      <div className="shrink-0 grow">
        <div className="group-hover:text-primary-700">{user.name}</div>
      </div>
      <div className="w-2 shrink" />
    </Link>
  )
}
