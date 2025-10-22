import {useEffect} from "react";
import {urlBase64ToUint8Array} from "common/util/parse";
import {api} from "web/lib/api";
import {useUser} from "web/hooks/use-user";

const vapidPublicKey = 'BF80q7LrDa4a5ksS2BZrX6PPvL__y0jCNvNqyUzvk8Y4ofTdrS0kRnKfGpClCQAHWmcPHIUmWq8jgQ4ROquSpJQ'

export default function PushSubscriber() {
  const user = useUser(); // authenticated user

  useEffect(() => {
    console.log('PushSubscriber', user, 'serviceWorker' in navigator)
    if (!user) return; // only subscribe logged-in users
    if (!('serviceWorker' in navigator)) return;

    const registerPush = async () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(async (registration) => {
          console.log('Service worker registered:', registration)

          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('Notification permission denied')
            return
          }

          // Check if already subscribed
          const existing = await registration.pushManager.getSubscription();
          if (existing) {
            console.log('Already subscribed:', existing)
            return
          } // already subscribed

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          })

          // Send subscription to server
          const {data} = await api('save-subscription', {subscription})
          console.log('Subscription saved:', data)
        })
        .catch((err) => {
          console.error('SW registration failed:', err)
          return
        })
    };

    registerPush()
  }, [user?.id])

  return null; // component doesn't render anything
}
