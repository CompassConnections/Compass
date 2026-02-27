import {JSONContent} from '@tiptap/core'
import {getLocationText} from 'common/geodb'
import {Profile} from 'common/profiles/profile'
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

type NestedStringArray = (string | NestedStringArray | undefined | null)[]

export const flatten = (arr: NestedStringArray, separator: string = ', '): string =>
  arr
    .flatMap((item) => (Array.isArray(item) ? [flatten(item, separator)] : [item]))
    .filter((item): item is string => item != null && item !== '')
    .join(separator)

export function getProfileOgImageUrl(
  user: User,
  profile?: Profile | null,
  // choicesIdsToLabels?: Record<string, any> | null,
) {
  console.log({profile})
  const headline =
    profile?.headline ||
    parseJsonContentToText(profile?.bio as JSONContent) ||
    flatten(
      [
        // profile?.interests?.map((id: string) => choicesIdsToLabels?.['interests']?.[id]),
        // profile?.causes?.map((id: string) => choicesIdsToLabels?.['causes']?.[id]),
        // profile?.work?.map((id: string) => choicesIdsToLabels?.['work']?.[id]),
        profile?.occupation_title,
        profile?.education_level,
        profile?.university,
        profile?.mbti,
        profile?.religion,
        profile?.political_beliefs,
        profile?.languages,
      ],
      ' • ',
    )
  const props = {
    avatarUrl: profile?.pinned_url ?? '',
    username: user.username ?? '',
    name: user.name ?? '',
    age: profile?.age?.toString() ?? '',
    city: getLocationText(profile) ?? '',
    gender: profile?.gender ?? '',
    headline: headline.slice(0, 500) ?? '',
    interests: '',
    keywords: (profile?.keywords ?? []).join(',') ?? '',
  }

  return buildOgUrl(props as any, 'profile')
}
