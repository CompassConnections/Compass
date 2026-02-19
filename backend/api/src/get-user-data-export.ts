import {Row} from 'common/supabase/utils'
import {parseJsonContentToText} from 'common/util/parse'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {parseMessageObject} from 'shared/supabase/messages'

import {getLikesAndShipsMain} from './get-likes-and-ships'
import {APIHandler} from './helpers/endpoint'

export const getUserDataExport: APIHandler<'me/data'> = async (_, auth) => {
  const userId = auth.uid
  const pg = createSupabaseDirectClient()

  const user = await pg.oneOrNone<Row<'users'>>('select * from users where id = $1', [userId])

  const privateUser = await pg.oneOrNone<Row<'private_users'>>(
    'select * from private_users where id = $1',
    [userId],
  )

  const profile = await pg.oneOrNone(
    `
        select profiles.*,
               users.name,
               users.username,
               users.data                                  as "user",
               COALESCE(profile_interests.interests, '{}') as interests,
               COALESCE(profile_causes.causes, '{}')       as causes,
               COALESCE(profile_work.work, '{}')           as work
        from profiles
                 join users on users.id = profiles.user_id
                 left join (select pi.profile_id,
                                   array_agg(i.name order by i.id) as interests
                            from profile_interests pi
                                     join interests i on i.id = pi.option_id
                            group by pi.profile_id) as profile_interests on profile_interests.profile_id = profiles.id
                 left join (select pc.profile_id,
                                   array_agg(c.name order by c.id) as causes
                            from profile_causes pc
                                     join causes c on c.id = pc.option_id
                            group by pc.profile_id) as profile_causes on profile_causes.profile_id = profiles.id
                 left join (select pw.profile_id,
                                   array_agg(w.name order by w.id) as work
                            from profile_work pw
                                     join work w on w.id = pw.option_id
                            group by pw.profile_id) as profile_work on profile_work.profile_id = profiles.id
        where profiles.user_id = $1
    `,
    [userId],
  )

  if (profile.bio) {
    profile.bio_clean = parseJsonContentToText(profile.bio).replace(/\n/g, ' ').trim()
  }

  const compatibilityAnswers = await pg.manyOrNone(
    `
        select a.*,
               p.question,
               p.answer_type,
               p.multiple_choice_options,
               p.category,
               p.importance_score
        from compatibility_answers a
                 join compatibility_prompts p
                      on p.id = a.question_id
        where a.creator_id = $1
        order by a.created_time desc
    `,
    [userId],
  )

  const userActivity = await pg.oneOrNone<Row<'user_activity'>>(
    'select * from user_activity where user_id = $1',
    [userId],
  )

  const searchBookmarks = await pg.manyOrNone<Row<'bookmarked_searches'>>(
    'select * from bookmarked_searches where creator_id = $1 order by id desc',
    [userId],
  )

  const hiddenProfiles = await pg.manyOrNone(
    `select hp.id, hp.hidden_user_id, hp.created_time, u.username
     from hidden_profiles hp
              join users u on u.id = hp.hidden_user_id
     where hp.hider_user_id = $1
     order by hp.id desc`,
    [userId],
  )

  const messageChannelMemberships = await pg.manyOrNone<
    Row<'private_user_message_channel_members'>
  >('select * from private_user_message_channel_members where user_id = $1', [userId])

  const channelIds = Array.from(new Set(messageChannelMemberships.map((m) => m.channel_id)))

  const messageChannels = channelIds.length
    ? await pg.manyOrNone<Row<'private_user_message_channels'>>(
        'select * from private_user_message_channels where id = any($1)',
        [channelIds],
      )
    : []

  const messages = channelIds.length
    ? await pg.manyOrNone<Row<'private_user_messages'>>(
        `select *
       from private_user_messages
       where channel_id = any ($1)
       order by created_time`,
        [channelIds],
      )
    : []
  for (const message of messages) parseMessageObject(message)

  const membershipsWithUsernames = channelIds.length
    ? await pg.manyOrNone(
        `
          select m.*,
                 u.username
          from private_user_message_channel_members m
                   join users u on u.id = m.user_id
          where m.channel_id = any ($1)
            and m.user_id != $2
      `,
        [channelIds, userId],
      )
    : []

  const endorsements = await getLikesAndShipsMain(userId)

  const accountMetadata = {
    // userData: (user as any)?.data ?? null,
    userActivity,
  }

  const voteAnswers = await pg.manyOrNone(
    `
        select r.*,
               v.title,
               v.description,
               v.is_anonymous,
               v.status,
               v.created_time as vote_created_time
        from vote_results r
                 join votes v on v.id = r.vote_id
        where r.user_id = $1
        order by v.created_time desc
    `,
    [userId],
  )

  const reports = await pg.manyOrNone<Row<'reports'>>(
    'select * from reports where user_id = $1 order by created_time desc nulls last',
    [userId],
  )

  const contactMessages = await pg.manyOrNone<Row<'contact'>>(
    'select * from contact where user_id = $1 order by created_time desc nulls last',
    [userId],
  )

  return {
    user,
    privateUser,
    profile,
    compatibilityAnswers,
    voteAnswers,
    messages: {
      channels: messageChannels,
      memberships: membershipsWithUsernames,
      messages,
    },
    endorsements,
    searchBookmarks,
    hiddenProfiles,
    reports,
    contactMessages,
    accountMetadata,
  }
}
