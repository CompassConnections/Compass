import {ProfileRow} from 'common/profiles/profile'
import {User} from 'common/user'
import {buildOgUrl} from 'common/util/og'

// TODO: handle age, gender undefined better
export type ogProps = {
  // user props
  avatarUrl: string
  username: string
  name: string
  // profile props
  age: string
  city: string
  gender: string
}

export function getProfileOgImageUrl(user: User, profile?: ProfileRow | null) {
  const props = {
    avatarUrl: profile?.pinned_url,
    username: user.username,
    name: user.name,
    age: profile?.age?.toString() ?? '25',
    city: profile?.city ?? 'Internet',
    gender: profile?.gender ?? '???',
  } as ogProps

  return buildOgUrl(props, 'profile')
}
