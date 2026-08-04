import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {isAdminId} from 'common/envs/constants'
import {
  DORMANT_AFTER_DAYS,
  EMPTY_ROOM_INACTIVE_DAYS,
  EMPTY_ROOM_MAX_NEARBY,
  getOutreachTier,
  getProfileCompleteness,
  LocalDensity,
  OUTREACH_RADIUS_KM,
  OutreachRow,
  OutreachStage,
  OutreachStatus,
  OutreachTrigger,
} from 'common/outreach/outreach'
import {createSupabaseDirectClient} from 'shared/supabase/init'

const DEFAULT_NEW_MEMBER_LIMIT = 20
const DEFAULT_MIN_SIGNUP_DAYS = 3

/**
 * How recently an event has to have happened to still be a reason to write today.
 *
 * The whole argument for triggering on events is that the ask lands while the moment is fresh. An
 * alert that fired in March is not a moment, it is a fact — so past this window the badge goes away
 * rather than sitting there implying the iron is still hot.
 */
const TRIGGER_RECENCY_DAYS = 14

const MS_PER_DAY = 24 * 60 * 60 * 1000

const daysSince = (ts: string | null): number | null =>
  ts === null ? null : Math.floor((Date.now() - new Date(ts).valueOf()) / MS_PER_DAY)

type QueueQueryRow = {
  id: string
  name: string
  username: string
  avatar_url: string | null
  created_time: string
  stage: OutreachStage | null
  next_action: string | null
  channel_id: string | null
  last_message_user_id: string | null
  last_message_time: string | null
  last_online_time: string | null
  bio_length: number | null
  headline: string | null
  occupation: string | null
  occupation_title: string | null
  education_level: string | null
  political_beliefs: string[] | null
  diet: string[] | null
  languages: string[] | null
  city: string | null
  pref_gender: string[] | null
  photo_urls: string[] | null
  pinned_url: string | null
  has_big5: boolean
  interest_count: string
  cause_count: string
  compatibility_answer_count: string
  saved_search_count: string
  referred_count: string
  nearby_count: string | null
  alert_fired: boolean
  got_member_reply: boolean
  sent_member_message: boolean
}

/**
 * The whole queue in one query.
 *
 * Banned and disabled members are dropped from both populations before anything else.
 *
 * Two populations, deliberately sized differently: every member there is already a thread with is
 * returned, because a conversation in flight is never something to page through; members never
 * contacted are capped to the most recent handful, because that set is otherwise the entire
 * directory and only the top of it is ever acted on.
 *
 * Only message *metadata* is read — who sent the last one and when. Nothing is decrypted, so message
 * content never reaches this endpoint.
 */
const QUEUE_SQL = `
  with my_channels as (
    select channel_id
    from private_user_message_channel_members
    where user_id = $(adminId)
  ),
  counterparts as (
    select m.user_id, max(m.channel_id)::bigint as channel_id
    from private_user_message_channel_members m
    where m.channel_id in (select channel_id from my_channels)
      and m.user_id != $(adminId)
    group by m.user_id
  ),
  last_message as (
    select distinct on (channel_id) channel_id, user_id, created_time
    from private_user_messages
    where channel_id in (select channel_id from counterparts)
      and visibility != 'system_status'
    order by channel_id, created_time desc
  ),
  new_members as (
    select u.id as user_id, null::bigint as channel_id
    from users u
      left join outreach_contacts oc on oc.user_id = u.id
      left join profiles p on p.user_id = u.id
    where u.id != $(adminId)
      and u.id not in (select user_id from counterparts)
      and u.created_time <= now() - make_interval(days => $(minSignupDays))
      and not coalesce(u.is_banned_from_posting, false)
      and not coalesce(p.disabled, false)
      and coalesce(oc.stage, '') != 'excluded'
    order by u.created_time desc
    limit $(newMemberLimit)
  ),
  candidates as (
    select user_id, channel_id from counterparts
    union all
    select user_id, channel_id from new_members
  )
  select u.id,
         u.name,
         u.username,
         u.avatar_url,
         u.created_time,
         oc.stage,
         oc.next_action,
         c.channel_id,
         lm.user_id                as last_message_user_id,
         lm.created_time           as last_message_time,
         ua.last_online_time,
         p.bio_length,
         p.headline,
         p.occupation,
         p.occupation_title,
         p.education_level,
         p.political_beliefs,
         p.diet,
         p.languages,
         p.city,
         p.pref_gender,
         p.photo_urls,
         p.pinned_url,
         (p.big5_openness is not null) as has_big5,
         (select count(*) from profile_interests pi where pi.profile_id = p.id) as interest_count,
         (select count(*) from profile_causes pc where pc.profile_id = p.id) as cause_count,
         (select count(*) from compatibility_answers ca where ca.creator_id = u.id)
                                                                 as compatibility_answer_count,
         (select count(*) from bookmarked_searches bs where bs.creator_id = u.id)
                                                                 as saved_search_count,
         (select count(*) from profiles rp where rp.referred_by_username = u.username)
                                                                 as referred_count,
         -- Members within the outreach radius of them. Null when they have no coordinates, which is
         -- not the same as zero: one is a fact about the world, the other about their profile.
         case
             when p.city_latitude is null then null
             else (select count(*)
                   from profiles np
                            join users nu on nu.id = np.user_id
                   where np.user_id != u.id
                     and np.looking_for_matches
                     and not coalesce(nu.is_banned_from_posting, false)
                     and not coalesce(np.disabled, false)
                     and np.city_latitude is not null
                     and calculate_earth_distance_km(p.city_latitude, p.city_longitude,
                                                     np.city_latitude, np.city_longitude)
                         < $(radiusKm))
             end                                                 as nearby_count,
         -- A saved-search alert actually reached them recently. last_notified_at is only stamped on
         -- searches that matched, so this is "the product visibly worked", not "they have a search".
         exists (select 1
                 from bookmarked_searches bs
                 where bs.creator_id = u.id
                   and bs.last_notified_at > now() - make_interval(days => $(triggerRecencyDays)))
                                                                 as alert_fired,
         -- Another member (not me) wrote to them. Admin messages are excluded deliberately: founder
         -- outreach is not the platform working, and counting it would make every thread self-fulfilling.
         exists (select 1
                 from private_user_messages pm
                          join private_user_message_channel_members mem
                               on mem.channel_id = pm.channel_id and mem.user_id = u.id
                 where pm.user_id != u.id
                   and pm.user_id != $(adminId)
                   and pm.visibility != 'system_status')         as got_member_reply,
         -- They have written to someone who is not me, so they have committed to using it.
         exists (select 1
                 from private_user_messages pm
                          join private_user_message_channel_members other
                               on other.channel_id = pm.channel_id and other.user_id != u.id
                 where pm.user_id = u.id
                   and other.user_id != $(adminId)
                   and pm.visibility != 'system_status')         as sent_member_message
  from candidates c
    join users u on u.id = c.user_id
    left join profiles p on p.user_id = u.id
    left join outreach_contacts oc on oc.user_id = u.id
    left join user_activity ua on ua.user_id = u.id
    left join last_message lm on lm.channel_id = c.channel_id
  where coalesce(oc.stage, '') != 'excluded'
    and not coalesce(u.is_banned_from_posting, false)
    -- A disabled profile is someone who has stepped away; there is nothing to reach out about.
    and not coalesce(p.disabled, false)
`

export const getOutreachQueue: APIHandler<'get-outreach-queue'> = async (props, auth) => {
  // Admin rather than mod: the queue is built from the caller's own threads, and the state it shows
  // is one person's working notes rather than shared moderation data.
  if (!isAdminId(auth.uid)) throw APIErrors.forbidden('Admin only')

  const pg = createSupabaseDirectClient()

  const rows = await pg.any<QueueQueryRow>(QUEUE_SQL, {
    adminId: auth.uid,
    minSignupDays: props.minSignupDays ?? DEFAULT_MIN_SIGNUP_DAYS,
    newMemberLimit: props.newMemberLimit ?? DEFAULT_NEW_MEMBER_LIMIT,
    radiusKm: OUTREACH_RADIUS_KM,
    triggerRecencyDays: TRIGGER_RECENCY_DAYS,
  })

  return {rows: rows.map((row) => toOutreachRow(row, auth.uid))}
}

const toOutreachRow = (row: QueueQueryRow, adminId: string): OutreachRow => {
  const daysSinceLastOnline = daysSince(row.last_online_time)
  const daysSinceLastMessage = daysSince(row.last_message_time)
  const repliedToUs = !!row.last_message_user_id && row.last_message_user_id !== adminId

  const completeness = getProfileCompleteness({
    bioLength: row.bio_length,
    headline: row.headline,
    photoCount: row.photo_urls?.length ?? 0,
    pinnedUrl: row.pinned_url,
    // Either column counts — a member who filled in a job title has said what they do.
    occupation: row.occupation ?? row.occupation_title,
    educationLevel: row.education_level,
    politicalBeliefs: row.political_beliefs,
    diet: row.diet,
    languages: row.languages,
    city: row.city,
    prefGender: row.pref_gender,
    interestCount: Number(row.interest_count),
    causeCount: Number(row.cause_count),
    compatibilityAnswerCount: Number(row.compatibility_answer_count),
    hasBig5: row.has_big5,
  })

  const savedSearchCount = Number(row.saved_search_count)

  // `nearby` is left empty here on purpose: naming the nearest few costs a second distance query per
  // member, and the queue renders a hundred rows. The dashboard only needs the number; the messages
  // that actually quote names go through `getLocalDensity`.
  const localDensity: LocalDensity | null =
    row.nearby_count === null ? null : {count: Number(row.nearby_count), city: row.city, nearby: []}

  return {
    user: {
      id: row.id,
      name: row.name,
      username: row.username,
      avatarUrl: row.avatar_url ?? undefined,
    },
    stage: row.stage,
    nextAction: row.next_action,
    status: getStatus(row.channel_id, repliedToUs, daysSinceLastMessage),
    tier: getOutreachTier({
      completeness: completeness.score,
      daysSinceLastOnline,
      repliedToUs,
      savedSearchCount,
    }),
    completeness,
    daysSinceSignup: daysSince(row.created_time) ?? 0,
    daysSinceLastOnline,
    daysSinceLastMessage,
    channelId: row.channel_id === null ? null : Number(row.channel_id),
    savedSearchCount,
    referredCount: Number(row.referred_count),
    localDensity,
    triggers: getTriggers(row, localDensity, daysSinceLastOnline),
  }
}

/**
 * Which peak-willingness events have fired for this member.
 *
 * These are what the day numbers in the sequence were always standing in for. A calendar date says
 * "value has probably landed by now"; these say it did, and name the moment — which is the difference
 * between an ask that reads as timed and one that reads as automated.
 */
const getTriggers = (
  row: QueueQueryRow,
  localDensity: LocalDensity | null,
  daysSinceLastOnline: number | null,
): OutreachTrigger[] => {
  const triggers: OutreachTrigger[] = []

  if (row.alert_fired) triggers.push('search_alert_fired')
  if (row.got_member_reply) triggers.push('first_reply_received')
  if (row.sent_member_message) triggers.push('sent_first_message')

  const roomIsEmpty = localDensity !== null && localDensity.count < EMPTY_ROOM_MAX_NEARBY
  const goneQuiet = daysSinceLastOnline === null || daysSinceLastOnline >= EMPTY_ROOM_INACTIVE_DAYS
  if (roomIsEmpty || goneQuiet) triggers.push('empty_room')

  return triggers
}

const getStatus = (
  channelId: string | null,
  repliedToUs: boolean,
  daysSinceLastMessage: number | null,
): OutreachStatus => {
  if (channelId === null) return 'not_contacted'
  // An unanswered message is the one thing that should never go quiet, so a reply outranks dormancy
  // however old it is.
  if (repliedToUs) return 'needs_reply'
  if (daysSinceLastMessage !== null && daysSinceLastMessage > DORMANT_AFTER_DAYS) return 'dormant'
  return 'awaiting_reply'
}
