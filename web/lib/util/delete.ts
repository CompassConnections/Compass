import posthog from 'posthog-js'
import {clearUserCookie} from 'web/components/auth-context'
import {api} from 'web/lib/api'
import {firebaseLogout} from 'web/lib/firebase/users'
import {track} from 'web/lib/service/analytics'

export async function deleteAccount() {
  track('delete account')
  await api('me/delete')
  await firebaseLogout()
  clearUserCookie()
  localStorage.clear()
  sessionStorage.clear()
  posthog.reset()
}
