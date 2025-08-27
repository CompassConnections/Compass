import { User } from 'common/user'
import { LoverRow } from 'common/love/lover'
import { buildOgUrl } from 'common/util/og'

// TODO: handle age, gender undefined better
export type LoveOgProps = {
  // user props
  avatarUrl: string
  username: string
  name: string
  // lover props
  age: string
  city: string
  gender: string
}

export function getLoveOgImageUrl(user: User, lover?: LoverRow | null) {
  const loveProps = {
    avatarUrl: lover?.pinned_url,
    username: user.username,
    name: user.name,
    age: lover?.age.toString() ?? '25',
    city: lover?.city ?? 'Internet',
    gender: lover?.gender ?? '???',
  } as LoveOgProps

  return buildOgUrl(loveProps, 'lover', 'manifold.love')
}
