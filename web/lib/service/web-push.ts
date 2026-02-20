import {urlBase64ToUint8Array} from 'common/util/parse'
import {useEffect} from 'react'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {isNativeMobile} from 'web/lib/util/webview'

const vapidPublicKey =
  'BF80q7LrDa4a5ksS2BZrX6PPvL__y0jCNvNqyUzvk8Y4ofTdrS0kRnKfGpClCQAHWmcPHIUmWq8jgQ4ROquSpJQ'

export default function WebPush() {
  const user = useUser() // authenticated user
  const isWeb = typeof window !== 'undefined' && 'serviceWorker' in navigator && !isNativeMobile()
  useEffect(() => {
    if (!user?.id || !isWeb) return
    console.log('WebPush', user)

    const registerPush = async () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(async (registration) => {
          console.log('Service worker registered:', registration)

          // May need to ask for permission from a button the user clicks, per this error:
          // The Notification permission may only be requested from inside a short-running user-generated event handler.
          const permission = await Notification.requestPermission()
          if (permission !== 'granted') {
            console.log('Notification permission denied')
            return
          }

          // Check if already subscribed
          const existing = await registration.pushManager.getSubscription()
          if (existing) {
            console.log('Already subscribed:', existing)
            return
          } // already subscribed

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          })

          // Send subscription to backend
          const {data} = await api('save-subscription', {subscription})
          console.log('Subscription saved:', data)
        })
        .catch((err) => {
          console.error('SW registration failed:', err)
          return
        })
    }

    registerPush()
  }, [user?.id, isWeb])

  return null
}
