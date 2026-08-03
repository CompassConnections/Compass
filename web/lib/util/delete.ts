import posthog from 'posthog-js'
import {clearUserCookie} from 'web/components/auth-context'
import {api} from 'web/lib/api'
import {firebaseLogout} from 'web/lib/firebase/users'
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
  await api('me/delete', reasons || {})
  await firebaseLogout()
  clearUserCookie()
  localStorage.clear()
  sessionStorage.clear()
  posthog.reset()
}
