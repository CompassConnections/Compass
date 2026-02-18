import Link from 'next/link'

type User = {
  id: string
  name: string
  username: string
  avatar_url?: string | null
}

export function UserLink({user, className = ""}: {
  user: User | null | undefined
  className?: string
}) {
  if (!user) return null

  return (
    <Link
      href={`/${user.username}`}
      className={`hover:text-primary-600 flex items-center gap-1 ${className}`}
    >
      {user.avatar_url && (
        <img
          src={user.avatar_url}
          alt={user.name}
          className="h-5 w-5 rounded-full"
        />
      )}
      <span>{user.name}</span>
    </Link>
  )
}
