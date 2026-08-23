import posthog from 'posthog-js'
import {clearUserCookie} from 'web/components/auth-context'
import {api} from 'web/lib/api'
import {firebaseLogout, revokeAppleToken} from 'web/lib/firebase/users'
import {track} from 'web/lib/service/analytics'

export async function deleteAccount(reasons?: {
  reasonCategory?: string | null
  reasonDetails?: string
  /**
   * A parting testimonial, sent on the deletion call itself so it is written before the account it
   * belongs to stops existing. See the `me/delete` schema entry for why it is not a separate request.
   */
  testimonial?: {
    body: string
    headline?: string | null
    rating?: number | null
    showAuthor?: boolean
  }
}) {
  track('delete account', {wroteTestimonial: !!reasons?.testimonial})

  // Before the account stops existing, not after: revocation needs a live Firebase user to
  // re-authenticate, and `me/delete` removes the auth record. Best-effort — see `revokeAppleToken`
  // for why a failure must not block the deletion.
  const appleRevocation = await revokeAppleToken()
  track('delete account apple revocation', {result: appleRevocation})

  await api('me/delete', reasons || {})
  await firebaseLogout()
  clearUserCookie()
  localStorage.clear()
  sessionStorage.clear()
  posthog.reset()
}
