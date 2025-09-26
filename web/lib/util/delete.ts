import {track} from "web/lib/service/analytics";
import {api} from "web/lib/api";
import {firebaseLogout} from "web/lib/firebase/users";
import posthog from "posthog-js";
import {clearUserCookie} from "web/components/auth-context";

export async function deleteAccount(username: string) {
  track('delete profile')
  await api('me/delete', {username})
  await firebaseLogout()
  clearUserCookie()
  localStorage.clear()
  sessionStorage.clear()
  posthog.reset()
}