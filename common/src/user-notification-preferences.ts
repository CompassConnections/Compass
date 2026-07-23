import {DEPLOYED_WEB_URL} from 'common/envs/constants'

import {PrivateUser} from './user'
import {filterDefined} from './util/array'

export const NOTIFICATION_DESTINATION_TYPES = ['email', 'browser', 'mobile'] as const
export type notification_destination_types = (typeof NOTIFICATION_DESTINATION_TYPES)[number]
export type notification_preference = keyof notification_preferences

// Runtime allow-list of valid preference keys. Kept in sync with `notification_preferences`
// by the `satisfies` clause below — adding a key to the type without adding it here (or vice
// versa) is a compile error. Used to validate the untrusted `type` field on the wire so it
// never reaches a SQL statement unchecked.
export const NOTIFICATION_PREFERENCE_TYPES = [
  'new_match',
  'new_endorsement',
  'new_profile_like',
  'new_profile_ship',
  'new_search_alerts',
  'connection_interest_match',
  'new_message',
  'tagged_user',
  'on_new_follow',
  'onboarding_flow',
  'thank_you_for_purchases',
  'platform_updates',
  'opt_out_all',
] as const satisfies readonly notification_preference[]

// Reverse check: every key of `notification_preferences` must appear in the list above.
// `satisfies` only guards the forward direction; this errors if a key is ever missing.
type _AllPreferenceTypesListed =
  notification_preference extends (typeof NOTIFICATION_PREFERENCE_TYPES)[number]
    ? true
    : ['missing notification_preference in NOTIFICATION_PREFERENCE_TYPES']
const _assertAllPreferenceTypesListed: _AllPreferenceTypesListed = true
void _assertAllPreferenceTypesListed

export type notification_preferences = {
  new_match: notification_destination_types[]
  new_endorsement: notification_destination_types[]
  new_profile_like: notification_destination_types[]
  new_profile_ship: notification_destination_types[]
  new_search_alerts: notification_destination_types[]
  connection_interest_match: notification_destination_types[]

  // User-related
  new_message: notification_destination_types[]
  tagged_user: notification_destination_types[]
  on_new_follow: notification_destination_types[]

  // General
  onboarding_flow: notification_destination_types[] // unused
  thank_you_for_purchases: notification_destination_types[] // unused
  platform_updates: notification_destination_types[]
  opt_out_all: notification_destination_types[]
}

export const getDefaultNotificationPreferences = (isDev?: boolean) => {
  const constructPref = (browserIf: boolean, emailIf: boolean, mobileIf: boolean) => {
    const browser = browserIf ? 'browser' : undefined
    const email = isDev ? undefined : emailIf ? 'email' : undefined
    const mobile = mobileIf ? 'mobile' : undefined
    return filterDefined([browser, email, mobile]) as notification_destination_types[]
  }
  const defaults: notification_preferences = {
    new_match: constructPref(true, true, true),
    new_search_alerts: constructPref(true, true, true),
    new_endorsement: constructPref(true, true, true),
    new_profile_like: constructPref(true, false, false),
    new_profile_ship: constructPref(true, false, false),
    connection_interest_match: constructPref(true, false, true),

    // User-related
    new_message: constructPref(true, true, true),
    tagged_user: constructPref(true, true, true),
    on_new_follow: constructPref(true, true, false),

    // General
    thank_you_for_purchases: constructPref(false, false, false),
    onboarding_flow: constructPref(true, true, false),
    platform_updates: constructPref(true, true, false),

    opt_out_all: [],
  }
  return defaults
}

export const UNSUBSCRIBE_URL = `${DEPLOYED_WEB_URL}/settings#1`
export const getNotificationDestinationsForUser = (
  privateUser: PrivateUser,
  type: notification_preference,
) => {
  let destinations = privateUser.notificationPreferences[type]
  if (!destinations) destinations = ['email', 'browser', 'mobile']
  let opt_out = privateUser.notificationPreferences.opt_out_all
  if (!opt_out) opt_out = []

  return {
    sendToEmail: destinations.includes('email') && !opt_out.includes('email'),
    sendToBrowser: destinations.includes('browser') && !opt_out.includes('browser'),
    sendToMobile: destinations.includes('mobile') && !opt_out.includes('mobile'),
    unsubscribeUrl: UNSUBSCRIBE_URL,
    urlToManageThisNotification: '/notifications',
  }
}
