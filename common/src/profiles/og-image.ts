import {JSONContent} from '@tiptap/core'
import {ProfileRow} from 'common/profiles/profile'
import {User} from 'common/user'
import {buildOgUrl} from 'common/util/og'
import {parseJsonContentToText} from 'common/util/parse'

// TODO: handle age, gender undefined better
export type ogProps = {
  // user props
  avatarUrl: string
  username: string
  name: string
  headline: string
  // profile props
  age: string
  city: string
  country: string
  gender: string
  interests: string | string[]
  keywords: string | string[]
}

export function getProfileOgImageUrl(user: User, profile?: ProfileRow | null) {
  const props = {
    avatarUrl: profile?.pinned_url,
    username: user.username,
    name: user.name,
    age: profile?.age?.toString() ?? '',
    city: profile?.city ?? '',
    country: profile?.country ?? '',
    gender: profile?.gender ?? '',
    headline:
      profile?.headline || parseJsonContentToText(profile?.bio as JSONContent)?.slice(0, 500) || '',
    interests: '',
    keywords: (profile?.keywords ?? []).join(','),
  }

  return buildOgUrl(props as any, 'profile')
}
