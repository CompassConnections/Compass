import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'
import {Notification} from 'common/notifications'
import {insertNotificationToSupabase} from 'shared/supabase/notifications'
import {tryCatch} from "common/util/try-catch";
import {Row} from "common/supabase/utils";

export const createVoteNotifications = async () => {
  const createdTime = Date.now();
  const id = `vote-${createdTime}`
  const notification: Notification = {
    id,
    userId: 'todo',
    createdTime: createdTime,
    isSeen: false,
    sourceType: 'info',
    sourceUpdateType: 'created',
    sourceSlug: '/vote',
    sourceUserAvatarUrl: 'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/misc%2Fvote-icon-design-free-vector.jpg?alt=media&token=f70b6d14-0511-49b2-830d-e7cabf7bb751',
    title: 'New Proposals & Votes Page',
    sourceText: 'Create proposals and vote on other people\'s suggestions!',
  }
  return await createNotifications(notification)
}

export const createNotifications = async (notification: Notification) => {
  const pg = createSupabaseDirectClient()
  const {data: users, error} = await tryCatch(
    pg.many<Row<'users'>>('select * from users')
  )

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

export const createNotification = async (user: Row<'users'>, notification: Notification, pg: SupabaseDirectClient) => {
  notification.userId = user.id
  console.log('notification', user.username)
  return await insertNotificationToSupabase(notification, pg)
}
