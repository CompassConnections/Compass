import {debug} from 'common/logger'
import {api} from 'web/lib/api'
import {safeLocalStorage} from 'web/lib/util/local'
import {isNativeApp} from 'web/lib/util/webview'

/** Where `NativePush` keeps the device's push token, so sign-out can name the row to remove. */
export const NATIVE_PUSH_TOKEN_KEY = 'native-push-token'

/**
 * Detaches this device from the member who is signing out. Must run before `auth.signOut()`: the
 * server only removes the caller's own subscription, so it needs the session that owns it.
 *
 * The server no longer reassigns a token that already belongs to someone else (see
 * `save-subscription*`), so without this a shared device would keep delivering the previous
 * member's notifications, and the next member to sign in on it would get none.
 *
 * On the web the browser subscription itself is dropped too: `WebPush` does not save a subscription
 * that already exists, so the next member would otherwise never register one. Best-effort
 * throughout — nothing here is a reason to leave someone half signed out.
 */
export async function removePushSubscription() {
  try {
    if (isNativeApp()) {
      const token = safeLocalStorage?.getItem(NATIVE_PUSH_TOKEN_KEY)
      if (!token) return
      await api('delete-subscription', {token})
      safeLocalStorage?.removeItem(NATIVE_PUSH_TOKEN_KEY)
      return
    }

    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    const registration = await navigator.serviceWorker.getRegistration()
    const subscription = await registration?.pushManager.getSubscription()
    if (!subscription) return
    await api('delete-subscription', {endpoint: subscription.endpoint}).catch((e) =>
      debug('Failed to remove push subscription on the server', e),
    )
    await subscription.unsubscribe()
  } catch (e) {
    debug('Push subscription cleanup skipped', e)
  }
}
