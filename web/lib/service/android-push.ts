import {PushNotifications} from '@capacitor/push-notifications'
import {debug} from 'common/logger'
import {useEffect} from 'react'
import toast from 'react-hot-toast'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {isAndroidApp} from 'web/lib/util/webview'

export default function AndroidPush() {
  const user = useUser() // authenticated user
  const isAndroid = isAndroidApp()
  useEffect(() => {
    if (!user?.id || !isAndroid) return
    debug('AndroidPush', user)

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
        console.error('Failed saving android subscription', err)
      }
    })

    PushNotifications.addListener('pushNotificationReceived', (notif) => {
      console.debug('Push received', notif, window.location.pathname)
      const endpoint = notif?.data?.endpoint as string
      if (!endpoint) return
      if (!endpoint.startsWith('/messages/')) return
      if (endpoint === window.location.pathname) return
      const author = notif?.title
      const message = notif?.body
      toast.success(`${author}: "${message}"`)
    })
  }, [user?.id, isAndroid])

  return null
}
