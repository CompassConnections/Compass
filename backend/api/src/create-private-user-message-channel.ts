import {getConnectionInterests} from 'api/get-connection-interests'
import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {addUsersToPrivateMessageChannel} from 'api/helpers/private-messages'
import {sendDiscordMessage} from 'common/discord/core'
import {DOMAIN, isAdminId, isModUsername} from 'common/envs/constants'
import {
  AUTO_BAN_REVIEW_HOURS,
  AUTO_BAN_UNDER_REVIEW_CODE,
  MAX_NEW_CHANNELS_PER_DAY,
} from 'common/moderation/ban'
import {filterDefined} from 'common/util/array'
import * as admin from 'firebase-admin'
import {uniq} from 'lodash'
import {getProfile} from 'shared/profiles/supabase'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {updateUser} from 'shared/supabase/users'
import {getPrivateUser, getUser} from 'shared/utils'

export const createPrivateUserMessageChannel: APIHandler<
  'create-private-user-message-channel'
> = async (body, auth) => {
  // Do not use auth.creds.data as its info can be staled. It comes from a client token, which refreshes hourly or so
  const user = await admin.auth().getUser(auth.uid)
  // console.log(JSON.stringify(user, null, 2))
  if (!user?.emailVerified) {
    throw APIErrors.forbidden('You must verify your email to contact people.')
  }

  const userIds = uniq(body.userIds.concat(auth.uid))

  const pg = createSupabaseDirectClient()
  const creatorId = auth.uid

  const creator = await getUser(creatorId)
  if (!creator) throw APIErrors.unauthorized('Your account was not found')
  if (creator.isBannedFromPosting) throw APIErrors.forbidden('You are banned')
  const toPrivateUsers = filterDefined(await Promise.all(userIds.map((id) => getPrivateUser(id))))

  if (toPrivateUsers.length !== userIds.length)
    throw APIErrors.notFound(
      `Private user ${userIds.find(
        (uid) => !toPrivateUsers.map((p: any) => p.id).includes(uid),
      )} not found`,
    )

  if (
    toPrivateUsers.some((user: any) =>
      user.blockedUserIds.some((blockedId: string) => userIds.includes(blockedId)),
    )
  ) {
    throw APIErrors.forbidden('One of the users has blocked another user in the list')
  }

  for (const u of toPrivateUsers) {
    const p = await getProfile(u.id)
    if (p && !p.allow_direct_messaging) {
      const {interests, targetInterests} = await getConnectionInterests(
        {targetUserId: u.id},
        auth.uid,
      )
      const matches = interests.filter((interest: string[]) => targetInterests.includes(interest))
      if (matches.length > 0) continue
      const failedUser = await getUser(u.id)
      throw APIErrors.forbidden(`${failedUser?.username} has disabled direct messaging`)
    }
  }

  const currentChannel = await pg.oneOrNone(
    `
        select channel_id
        from private_user_message_channel_members
        group by channel_id
        having array_agg(user_id::text) @> array [$1]::text[]
           and array_agg(user_id::text) <@ array [$1]::text[]
    `,
    [userIds],
  )
  if (currentChannel)
    return {
      status: 'success',
      channelId: Number(currentChannel.channel_id),
    }

  // Admins and mods are exempt: they legitimately reach out to many members (support, moderation,
  // onboarding), and auto-banning the people who handle the review queue would be self-defeating.
  const isStaff = isAdminId(creatorId) || isModUsername(creator.username)

  // Spam guard: count how many conversations this user has started in the last 24h.
  // If they've already created MAX_NEW_CHANNELS_PER_DAY, this new one is over the
  // limit — ban them right away and flag it to the admins for review.
  const {count: recentChannelCount} = isStaff
    ? {count: 0}
    : await pg.one(
        `select count(*) as count
     from private_user_message_channel_members m
     join private_user_message_channels c on c.id = m.channel_id
     where m.user_id = $1
       and m.role = 'creator'
       and c.created_time > now() - interval '24 hours'`,
        [creatorId],
      )

  if (!isStaff && Number(recentChannelCount) >= MAX_NEW_CHANNELS_PER_DAY) {
    await updateUser(creatorId, {isBannedFromPosting: true, banReason: 'auto_rate_limit'})
    try {
      const message = `
      🔨 **Auto-ban: conversation spam** 🔨
      **User:** ${creator.name} ([@${creator.username}](https://${DOMAIN}/${creator.username}))
      **Reason:** Started ${Number(recentChannelCount) + 1} conversations within 24h (limit ${MAX_NEW_CHANNELS_PER_DAY}).
      Please review.
      `
      await sendDiscordMessage(message, 'reports')
    } catch (e) {
      console.error('Failed to send auto-ban discord report', e)
    }
    // Tagged with AUTO_BAN_UNDER_REVIEW_CODE so the client can show the "on hold, being reviewed"
    // explanation rather than a bare "You are banned" — most people who trip this are genuine and
    // get unbanned once a human looks at the profile.
    throw APIErrors.forbidden(
      `You've started too many new conversations in the past 24 hours, so your account is temporarily on hold. We do this automatically to protect our members from spam, scams and harassment. Our team reviews every case within ${AUTO_BAN_REVIEW_HOURS} hours and restores accounts that look genuine — nothing you've written is lost.`,
      {
        context: AUTO_BAN_UNDER_REVIEW_CODE,
        resolution: 'Contact us at /contact if you want to tell us about your account.',
      },
    )
  }

  const channel = await pg.one(
    `insert into private_user_message_channels default
     values
     returning id`,
  )

  await pg.none(
    `insert into private_user_message_channel_members (channel_id, user_id, role, status)
     values ($1, $2, 'creator', 'joined')
    `,
    [channel.id, creatorId],
  )

  const memberIds = userIds.filter((id) => id !== creatorId)
  await addUsersToPrivateMessageChannel(memberIds, channel.id, pg)
  return {status: 'success', channelId: Number(channel.id)}
}
