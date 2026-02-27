import * as admin from 'firebase-admin'
import {TokenMessage} from 'firebase-admin/lib/messaging/messaging-api'
import {SupabaseDirectClient} from 'shared/supabase/init'
import webPush from 'web-push'

export async function sendWebNotifications(
  pg: SupabaseDirectClient,
  userId: string,
  payload: string,
) {
  webPush.setVapidDetails(
    'mailto:hello@compassmeet.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
  // Retrieve subscription from the database
  const subscriptions = await getSubscriptionsFromDB(pg, userId)
  for (const subscription of subscriptions) {
    try {
      console.log('Sending notification to:', subscription.endpoint, payload)
      await webPush.sendNotification(subscription, payload)
    } catch (err: any) {
      console.log('Failed to send notification', err)
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.warn('Removing expired subscription', subscription.endpoint)
        await removeSubscription(pg, subscription.endpoint, userId)
      } else {
        console.error('Push failed', err)
      }
    }
  }
}

export async function getSubscriptionsFromDB(pg: SupabaseDirectClient, userId: string) {
  try {
    const subscriptions = await pg.manyOrNone(
      `
                select endpoint, keys
                from push_subscriptions
                where user_id = $1
      `,
      [userId],
    )

    return subscriptions.map((sub) => ({
      endpoint: sub.endpoint,
      keys: sub.keys,
    }))
  } catch (err) {
    console.error('Error fetching subscriptions', err)
    return []
  }
}

async function removeSubscription(pg: SupabaseDirectClient, endpoint: any, userId: string) {
  await pg.none(
    `DELETE
     FROM push_subscriptions
     WHERE endpoint = $1
       AND user_id = $2`,
    [endpoint, userId],
  )
}

async function removeMobileSubscription(pg: SupabaseDirectClient, token: any, userId: string) {
  await pg.none(
    `DELETE
     FROM push_subscriptions_mobile
     WHERE token = $1
       AND user_id = $2`,
    [token, userId],
  )
}

export async function sendMobileNotifications(
  pg: SupabaseDirectClient,
  userId: string,
  payload: PushPayload,
) {
  const subscriptions = await getMobileSubscriptionsFromDB(pg, userId)
  for (const subscription of subscriptions) {
    await sendPushToToken(pg, userId, subscription.token, payload)
  }
}

interface PushPayload {
  title: string
  body: string
  url: string
  data?: Record<string, string>
  imageUrl?: string
}

export async function sendPushToToken(
  pg: SupabaseDirectClient,
  userId: string,
  token: string,
  payload: PushPayload,
) {
  const message: TokenMessage = {
    token,
    android: {
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl || undefined, // 👈 publicly accessible HTTPS URL
      },
    },
    data: {
      endpoint: payload.url,
    },
  }

  try {
    // Fine to create at each call, as it's a cached singleton
    const fcm = admin.messaging()
    console.log('Sending notification to:', token, message)
    const response = await fcm.send(message)
    console.log('Push sent successfully:', response)
    return response
  } catch (err: unknown) {
    // Check if it's a Firebase Messaging error
    if (err instanceof Error && 'code' in err) {
      const firebaseError = err as {code: string; message: string}
      console.warn('Firebase error:', firebaseError.code, firebaseError.message)

      // Handle specific error cases here if needed
      // For example, if token is no longer valid:
      if (
        firebaseError.code === 'messaging/registration-token-not-registered' ||
        firebaseError.code === 'messaging/invalid-argument'
      ) {
        console.warn('Removing invalid FCM token')
        await removeMobileSubscription(pg, token, userId)
      }
    } else {
      console.error('Unknown error:', err)
    }
  }
  return
}

export async function getMobileSubscriptionsFromDB(pg: SupabaseDirectClient, userId: string) {
  try {
    const subscriptions = await pg.manyOrNone(
      `
                select token
                from push_subscriptions_mobile
                where user_id = $1
      `,
      [userId],
    )

    return subscriptions
  } catch (err) {
    console.error('Error fetching subscriptions', err)
    return []
  }
}
