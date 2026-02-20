import {ANDROID_APP_URL} from 'common/constants'
import {Notification} from 'common/notifications'
import {Row} from 'common/supabase/utils'
import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'
import {createBulkNotification, insertNotificationToSupabase} from 'shared/supabase/notifications'

export const createAndroidReleaseNotifications = async () => {
  const createdTime = Date.now()
  const id = `android-release-${createdTime}`
  const notification: Notification = {
    id,
    userId: 'todo',
    createdTime: createdTime,
    isSeen: false,
    sourceType: 'info',
    sourceUpdateType: 'created',
    sourceSlug: ANDROID_APP_URL,
    sourceUserAvatarUrl:
      'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/misc%2Fcompass-192.png?alt=media&token=9fd251c5-fc43-4375-b629-1a8f4bbe8185',
    title: 'Android App Released on Google Play',
    sourceText:
      'The Compass Android app is now publicly available on Google Play! Download it today to stay connected on the go.',
  }
  return await createNotifications(notification)
}

export const createAndroidTestNotifications = async () => {
  const createdTime = Date.now()
  const id = `android-test-${createdTime}`
  const notification: Notification = {
    id,
    userId: 'todo',
    createdTime: createdTime,
    isSeen: false,
    sourceType: 'info',
    sourceUpdateType: 'created',
    sourceSlug: '/contact',
    sourceUserAvatarUrl:
      'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/misc%2Fcompass-192.png?alt=media&token=9fd251c5-fc43-4375-b629-1a8f4bbe8185',
    title: 'Android App Ready for Review — Help Us Unlock the Google Play Release',
    sourceText:
      'To release our app, Google requires a closed test with at least 12 testers for 14 days. Please share your Google Play–registered email address so we can add you as a tester and complete the review process.',
  }
  return await createNotifications(notification)
}

export const createShareNotifications = async () => {
  const createdTime = Date.now()
  const id = `share-${createdTime}`
  const notification: Notification = {
    id,
    userId: 'todo',
    createdTime: createdTime,
    isSeen: false,
    sourceType: 'info',
    sourceUpdateType: 'created',
    sourceSlug: '/contact',
    sourceUserAvatarUrl:
      'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/misc%2Ficon-outreach-outstrip-outreach-272151502.jpg?alt=media&token=6d6fcecb-818c-4fca-a8e0-d2d0069b9445',
    title: 'Give us tips to reach more people',
    sourceText: '250 members already! Tell us where and how we can best share Compass.',
  }
  return await createNotifications(notification)
}

export const createVoteNotifications = async () => {
  const createdTime = Date.now()
  const id = `vote-${createdTime}`
  const notification: Notification = {
    id,
    userId: 'todo',
    createdTime: createdTime,
    isSeen: false,
    sourceType: 'info',
    sourceUpdateType: 'created',
    sourceSlug: '/vote',
    sourceUserAvatarUrl:
      'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/misc%2Fvote-icon-design-free-vector.jpg?alt=media&token=f70b6d14-0511-49b2-830d-e7cabf7bb751',
    title: 'New Proposals & Votes Page',
    sourceText: "Create proposals and vote on other people's suggestions!",
  }
  return await createNotifications(notification)
}

export const createNotifications = async (notification: Notification) => {
  const pg = createSupabaseDirectClient()
  const {data: users, error} = await tryCatch(pg.many<Row<'users'>>('select * from users'))

  if (error) {
    console.error('Error fetching users', error)
    return
  }

  if (!users) {
    console.error('No users found')
    return
  }

  for (const user of users) {
    try {
      await createNotification(user, notification, pg)
    } catch (e) {
      console.error('Failed to create notification', e, user)
    }
  }

  return {
    success: true,
  }
}

export const createNotification = async (
  user: Row<'users'>,
  notification: Notification,
  pg: SupabaseDirectClient,
) => {
  notification.userId = user.id
  console.log('notification', user.username)
  return await insertNotificationToSupabase(notification, pg)
}

/**
 * Send "Events now available" notification to all users
 * Uses the new template-based system for efficient bulk notifications
 */
export const createEventsAvailableNotifications = async () => {
  const pg = createSupabaseDirectClient()

  // Fetch all users
  const {data: users, error} = await tryCatch(pg.many<Row<'users'>>('select id from users'))

  if (error) {
    console.error('Error fetching users', error)
    return {success: false, error}
  }

  if (!users || users.length === 0) {
    console.error('No users found')
    return {success: false, error: 'No users found'}
  }

  const userIds = users.map((u) => u.id)

  // Create template and bulk notifications using the new system
  const {templateId, count} = await createBulkNotification(
    {
      sourceType: 'info',
      title: 'New Events Page',
      sourceText:
        'You can now create and join events on Compass! Meet up with other members online or in person for workshops, social events, etc.',
      sourceSlug: '/events',
      sourceUserAvatarUrl:
        'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/misc%2Fcompass-192.png?alt=media&token=9fd251c5-fc43-4375-b629-1a8f4bbe8185',
      sourceUpdateType: 'created',
    },
    userIds,
    pg,
  )

  console.log(`Created events notification template ${templateId} for ${count} users`)

  return {
    success: true,
    templateId,
    userCount: count,
  }
}
