import { User } from 'common/user'
import { ProfileRow } from 'common/profiles/profile'
import { buildOgUrl } from 'common/util/og'

// TODO: handle age, gender undefined better
export type LoveOgProps = {
  // user props
  avatarUrl: string
  username: string
  name: string
  // profile props
  age: string
  city: string
  gender: string
}

export function getLoveOgImageUrl(user: User, profile?: ProfileRow | null) {
  const loveProps = {
    avatarUrl: profile?.pinned_url,
    username: user.username,
    name: user.name,
    age: profile?.age?.toString() ?? '25',
    city: profile?.city ?? 'Internet',
    gender: profile?.gender ?? '???',
  } as LoveOgProps

  return buildOgUrl(loveProps, 'profile')
}
