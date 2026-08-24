import {useSaveReferral} from 'web/hooks/use-save-referral'
import {useUser} from 'web/hooks/use-user'

/**
 * Records the `?referrer=` (or base64 `?r=`) query param on whatever page the visitor lands on.
 *
 * Mounted app-wide on purpose: referral links point at the home page (`/?referrer=alice`), the
 * about page, an event — not just profiles. `useSaveReferral` used to run only on `/[username]`,
 * so every share that wasn't a profile link lost its attribution.
 */
export function SaveReferral() {
  const user = useUser()
  useSaveReferral(user)
  return null
}
