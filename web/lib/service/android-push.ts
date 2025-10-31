import {PushNotifications} from '@capacitor/push-notifications'
import {useEffect} from "react"
import {api} from "web/lib/api"
import {useUser} from "web/hooks/use-user"
import {isAndroidWebView} from "web/lib/util/webview";
import {useRouter} from "next/router";

export default function AndroidPush() {
  const user = useUser() // authenticated user
  const isAndroid = isAndroidWebView()
  const router = useRouter()
  useEffect(() => {
    if (!user?.id || !isAndroid) return
    console.log('AndroidPush', user)

    PushNotifications.requestPermissions().then(result => {
      if (result.receive !== 'granted') {
        console.log('Push notifications not granted')
        return
      }
      PushNotifications.register()
      console.log('Push registered')
    })

    PushNotifications.addListener('registration', async token => {
      console.log('Device token:', token.value)
      try {
        const {data} = await api('save-subscription-mobile', {token: token.value})
        console.log('Mobile subscription saved:', data)
      } catch (err) {
        console.error('Failed saving android subscription', err)
      }
    })

    PushNotifications.addListener('pushNotificationReceived', notif => {
      console.log('Push received', notif)
      const url = notif?.data?.url
      if (url) {
        router.push(url)
        window.location.href = url
      }
    })
  }, [user?.id, isAndroid])

  return null
}
