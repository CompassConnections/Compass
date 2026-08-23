import {PushNotifications} from '@capacitor/push-notifications'
import {debug} from 'common/logger'
import {useEffect} from 'react'
import toast from 'react-hot-toast'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {isNativeApp} from 'web/lib/util/webview'

/**
 * Registers the device for push and keeps its token in `push_subscriptions_mobile`.
 *
 * Both platforms go through FCM: Android natively, iOS because `ios/App/App/AppDelegate.swift`
 * hands the APNs token to the Firebase SDK and reports the *FCM* token back to Capacitor. So the
 * token this saves means the same thing on both, and `sendPushToToken` can address either.
 *
 * Taps are handled by `pushNotificationActionPerformed`, which fires on both platforms and on both
 * cold start and resume — see `handleAppLink` in `web/pages/_app.tsx`.
 */
export default function NativePush() {
  const user = useUser() // authenticated user
  const isApp = isNativeApp()
  useEffect(() => {
    if (!user?.id || !isApp) return
    debug('NativePush', user)

    // iOS shows the system permission dialog exactly once — a denial can only be undone in Settings.
    PushNotifications.requestPermissions().then((result) => {
      if (result.receive !== 'granted') {
        debug('Push notifications not granted')
        return
      }
      PushNotifications.register()
      debug('Push registered')
    })

    PushNotifications.addListener('registration', async (token) => {
      debug('Device token:', token.value)
      try {
        const {data} = await api('save-subscription-mobile', {
          token: token.value,
        })
        debug('Mobile subscription saved:', data)
      } catch (err) {
        console.error('Failed saving mobile push subscription', err)
      }
    })

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration failed', err)
    })

    // iOS only fires this in the foreground, and suppresses the banner there — the toast below is
    // what the user actually sees in that case.
    PushNotifications.addListener('pushNotificationReceived', (notif) => {
      console.debug('Push received', notif, window.location.pathname)
      const endpoint = notif?.data?.endpoint as string
      if (!endpoint) return
      if (!endpoint.startsWith('/messages/')) return
      if (endpoint === window.location.pathname) return
      const author = notif?.title
      const message = notif?.body
      // Reuse the endpoint as the toast id so successive messages from the same
      // conversation replace each other rather than piling up.
      toast.success(`${author}: "${message}"`, {id: endpoint})
    })

    // Cross-platform notification tap. `handleAppLink` is installed on `window` by _app.tsx; going
    // through it rather than calling the router here keeps the external-redirect handling in one place.
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const endpoint = action?.notification?.data?.endpoint as string
      debug('Push tapped', endpoint)
      if (!endpoint) return
      ;(window as any).handleAppLink?.({endpoint})
    })

    return () => {
      PushNotifications.removeAllListeners()
    }
  }, [user?.id, isApp])

  return null
}
