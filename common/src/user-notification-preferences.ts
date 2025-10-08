import { PrivateUser } from './user'
import { filterDefined } from './util/array'

export type notification_destination_types = 'email' | 'browser' | 'mobile'
export type notification_preference = keyof notification_preferences
export type notification_preferences = {
  new_match: notification_destination_types[]
  new_endorsement: notification_destination_types[]
  new_love_like: notification_destination_types[]
  new_love_ship: notification_destination_types[]
  new_search_alerts: notification_destination_types[]

  // User-related
  new_message: notification_destination_types[]
  tagged_user: notification_destination_types[]
  on_new_follow: notification_destination_types[]

  // General
  onboarding_flow: notification_destination_types[] // unused
  thank_you_for_purchases: notification_destination_types[] // unused
  opt_out_all: notification_destination_types[]
}

export const getDefaultNotificationPreferences = (isDev?: boolean) => {
  const constructPref = (
    browserIf: boolean,
    emailIf: boolean,
    mobileIf: boolean
  ) => {
    const browser = browserIf ? 'browser' : undefined
    const email = isDev ? undefined : emailIf ? 'email' : undefined
    const mobile = mobileIf ? 'mobile' : undefined
    return filterDefined([
      browser,
      email,
      mobile,
    ]) as notification_destination_types[]
  }
  const defaults: notification_preferences = {
    new_match: constructPref(true, true, true),
    new_search_alerts: constructPref(true, true, true),
    new_endorsement: constructPref(true, true, true),
    new_love_like: constructPref(true, false, false),
    new_love_ship: constructPref(true, false, false),

    // User-related
    new_message: constructPref(true, true, true),
    tagged_user: constructPref(true, true, true),
    on_new_follow: constructPref(true, true, false),

    // General
    thank_you_for_purchases: constructPref(false, false, false),
    onboarding_flow: constructPref(true, true, false),

    opt_out_all: [],
  }
  return defaults
}

export const UNSUBSCRIBE_URL = 'https://compassmeet.com/notifications';
export const getNotificationDestinationsForUser = (
  privateUser: PrivateUser,
  type: notification_preference
) => {
  let destinations = privateUser.notificationPreferences[type]
  if (!destinations) destinations = ['email', 'browser', 'mobile']
  let opt_out = privateUser.notificationPreferences.opt_out_all
  if (!opt_out) opt_out = []

  return {
    sendToEmail: destinations.includes('email') && !opt_out.includes('email'),
    sendToBrowser:
      destinations.includes('browser') && !opt_out.includes('browser'),
    sendToMobile:
      destinations.includes('mobile') && !opt_out.includes('mobile'),
    unsubscribeUrl: UNSUBSCRIBE_URL,
    urlToManageThisNotification: '/notifications',
  }
}
