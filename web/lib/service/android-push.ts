import {PushNotifications} from '@capacitor/push-notifications'
import {debug} from 'common/logger'
import {useRouter} from 'next/router'
import {useEffect} from 'react'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {isAndroidApp} from 'web/lib/util/webview'

export default function AndroidPush() {
  const user = useUser() // authenticated user
  const isAndroid = isAndroidApp()
  const router = useRouter()
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
      debug('Push received', notif)
      const url = notif?.data?.url
      if (url) {
        router.push(url)
        window.location.href = url
      }
    })
  }, [user?.id, isAndroid])

  return null
}
