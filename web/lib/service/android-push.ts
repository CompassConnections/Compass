import {PushNotifications} from '@capacitor/push-notifications'
import {useEffect} from "react"
import {api} from "web/lib/api"
import {useUser} from "web/hooks/use-user"

export default function AndroidPush() {
  const user = useUser() // authenticated user
  const isWeb = typeof window !== 'undefined' && 'serviceWorker' in navigator
  useEffect(() => {
    if (!user?.id || isWeb) return
    console.log('AndroidPush', user)

    PushNotifications.requestPermissions().then(result => {
      if (result.receive !== 'granted') return
      PushNotifications.register()
    })

    PushNotifications.addListener('registration', async token => {
      console.log('Device token:', token.value)
      try {
        const {data} = await api('save-subscription-mobile', { token: token.value })
        console.log('Mobile subscription saved:', data)
      } catch (err) {
        console.error('Failed saving android subscription', err)
      }
    })

    PushNotifications.addListener('pushNotificationReceived', notif => {
      console.log('Push received', notif)
    })
  }, [user?.id, isWeb])

  return null
}
