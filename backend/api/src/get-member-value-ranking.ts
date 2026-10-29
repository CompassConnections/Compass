import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {isAdminId} from 'common/envs/constants'
import {
  getMemberValue,
  MemberValueInput,
  MemberValueRanking,
  MemberValueRow,
} from 'common/member-value'
import {getProfileCompleteness} from 'common/outreach/outreach'
import {orderBy} from 'lodash'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Bytes of the TipTap document wrapper around a one-paragraph message:
 * `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}`.
 *
 * Message bodies are stored AES-GCM encrypted, and GCM ciphertext is exactly as long as the plaintext
 * (the tag sits in its own column), so the decoded ciphertext length minus this wrapper is the number
 * of UTF-8 bytes the member typed, give or take a paragraph's worth of JSON. Close enough to rank on,
 * and it means this page never decrypts anything.
 */
export const CHAT_JSON_OVERHEAD_BYTES = 85

const MS_PER_DAY = 24 * 60 * 60 * 1000

const daysSince = (ts: string | null): number | null =>
  ts === null ? null : Math.floor((Date.now() - new Date(ts).valueOf()) / MS_PER_DAY)

/** pg returns every count and sum as a string. */
export type RankingQueryRow = {
  id: string
  name: string
  username: string
  avatar_url: string | null
  created_time: string
  last_online_time: string | null
  bio_length: number | null
  headline: string | null
  occupation: string | null
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
  conversations: string
  initiated: string
  initiated_replied: string
  chars_sent: string
  inbound: string
  inbound_replied: string
  referrals: string
  referrals_active: string
  profile_comments: string
  vote_comments: string
  votes_cast: string
  testimonials: string
  events_created: string
  events_attended: string
  donated_cents: string
}

/**
 * One pass over the whole directory. Every behaviour CTE is computed once over its table and joined
 * in, rather than as a correlated subquery per member, because the message CTEs run over the whole
 * message table and there are a thousand members.
 *
 * The founder is removed from every conversation measure, in both directions, for the same reason
 * `get-outreach-stats` does it: outreach answering itself is not the platform working. Threads whose
 * only counterpart is the founder vanish entirely; a member in a group thread with the founder and
 * someone else still counts, for the someone else.
 *
 * Only message metadata and ciphertext *length* are read. Nothing is decrypted.
 */
export const RANKING_SQL = `
  with msgs as (
    -- Member-to-member messages: a non-founder sender, in a channel with a non-founder counterpart.
    select pm.user_id as sender_id,
           pm.channel_id,
           pm.created_time,
           greatest(0, octet_length(decode(pm.ciphertext, 'base64')) - $(overhead)) as chars
    from private_user_messages pm
    where pm.user_id is not null
      and pm.user_id != $(adminId)
      and pm.visibility != 'system_status'
      and not coalesce(pm.deleted, false)
      and pm.ciphertext is not null
      and exists (select 1
                  from private_user_message_channel_members m
                  where m.channel_id = pm.channel_id
                    and m.user_id != pm.user_id
                    and m.user_id != $(adminId))
  ),
  sent as (
    select sender_id as user_id, sum(chars) as chars_sent
    from msgs
    group by sender_id
  ),
  -- One row per (channel, writer): when they first wrote there.
  channel_senders as (
    select channel_id, sender_id, min(created_time) as first_time
    from msgs
    group by channel_id, sender_id
  ),
  channel_opened as (
    select channel_id, min(first_time) as opened_time
    from channel_senders
    group by channel_id
  ),
  sides as (
    select cs.channel_id,
           cs.sender_id,
           cs.first_time = co.opened_time as initiated,
           exists (select 1
                   from channel_senders o
                   where o.channel_id = cs.channel_id
                     and o.sender_id != cs.sender_id) as two_sided
    from channel_senders cs
      join channel_opened co on co.channel_id = cs.channel_id
  ),
  conv as (
    select sender_id as user_id,
           count(*) filter (where two_sided)               as conversations,
           count(*) filter (where initiated)               as initiated,
           count(*) filter (where initiated and two_sided) as initiated_replied
    from sides
    group by sender_id
  ),
  -- Threads another member opened with them, whether or not they ever wrote back. Read from channel
  -- membership rather than from messages, because the silent recipient is exactly the person this
  -- measures.
  inbound as (
    select m.user_id,
           count(*) as inbound,
           count(*) filter (where exists (select 1
                                          from channel_senders me
                                          where me.channel_id = m.channel_id
                                            and me.sender_id = m.user_id)) as inbound_replied
    from private_user_message_channel_members m
      join channel_opened co on co.channel_id = m.channel_id
      join channel_senders opener
        on opener.channel_id = m.channel_id
       and opener.first_time = co.opened_time
    where opener.sender_id != m.user_id
      and m.user_id != $(adminId)
    group by m.user_id
  ),
  referral_counts as (
    select rp.referred_by_username as username,
           count(*) as referrals,
           count(*) filter (where exists (select 1 from sent s where s.user_id = rp.user_id))
                                                                     as referrals_active
    from profiles rp
    where rp.referred_by_username is not null
    group by rp.referred_by_username
  ),
  comment_counts as (
    select user_id, count(*) as n
    from profile_comments
    where user_id != on_user_id and not coalesce(hidden, false)
    group by user_id
  ),
  vote_comment_counts as (
    select user_id, count(*) as n
    from vote_comments
    where not coalesce(hidden, false)
    group by user_id
  ),
  vote_counts as (
    select user_id, count(distinct vote_id) as n from vote_results group by user_id
  ),
  testimonial_counts as (
    select author_id as user_id, count(*) as n
    from testimonials
    where status = 'approved'
    group by author_id
  ),
  event_counts as (
    select creator_id as user_id, count(*) as n from events group by creator_id
  ),
  attendance_counts as (
    select user_id, count(*) as n from events_participants where status = 'going' group by user_id
  ),
  donation_totals as (
    select user_id, sum(amount_cents) as cents from donations group by user_id
  )
  select u.id,
         u.name,
         u.username,
         u.avatar_url,
         u.created_time,
         ua.last_online_time,
         p.bio_length,
         p.headline,
         p.occupation,
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
         coalesce(cv.conversations, 0)      as conversations,
         coalesce(cv.initiated, 0)          as initiated,
         coalesce(cv.initiated_replied, 0)  as initiated_replied,
         coalesce(s.chars_sent, 0)          as chars_sent,
         coalesce(i.inbound, 0)             as inbound,
         coalesce(i.inbound_replied, 0)     as inbound_replied,
         coalesce(r.referrals, 0)           as referrals,
         coalesce(r.referrals_active, 0)    as referrals_active,
         coalesce(pcm.n, 0)                 as profile_comments,
         coalesce(vc.n, 0)                  as vote_comments,
         coalesce(vt.n, 0)                  as votes_cast,
         coalesce(t.n, 0)                   as testimonials,
         coalesce(ec.n, 0)                  as events_created,
         coalesce(ea.n, 0)                  as events_attended,
         coalesce(d.cents, 0)               as donated_cents
  from users u
    left join profiles p on p.user_id = u.id
    left join user_activity ua on ua.user_id = u.id
    left join conv cv on cv.user_id = u.id
    left join sent s on s.user_id = u.id
    left join inbound i on i.user_id = u.id
    left join referral_counts r on r.username = u.username
    left join comment_counts pcm on pcm.user_id = u.id
    left join vote_comment_counts vc on vc.user_id = u.id
    left join vote_counts vt on vt.user_id = u.id
    left join testimonial_counts t on t.user_id = u.id
    left join event_counts ec on ec.user_id = u.id
    left join attendance_counts ea on ea.user_id = u.id
    left join donation_totals d on d.user_id = u.id
  where u.id != $(adminId)
    and not coalesce(u.is_banned_from_posting, false)
    and not coalesce(p.disabled, false)
`

export const toRow = (row: RankingQueryRow): MemberValueRow => {
  const completeness = getProfileCompleteness({
    bioLength: row.bio_length,
    headline: row.headline,
    photoCount: row.photo_urls?.length ?? 0,
    pinnedUrl: row.pinned_url,
    occupation: row.occupation,
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

  const input: MemberValueInput = {
    conversations: Number(row.conversations),
    initiated: Number(row.initiated),
    initiatedReplied: Number(row.initiated_replied),
    charsSent: Number(row.chars_sent),
    inbound: Number(row.inbound),
    inboundReplied: Number(row.inbound_replied),
    referrals: Number(row.referrals),
    referralsActive: Number(row.referrals_active),
    completeness: completeness.score,
    bioLength: row.bio_length ?? 0,
    daysSinceLastOnline: daysSince(row.last_online_time),
    profileComments: Number(row.profile_comments),
    voteComments: Number(row.vote_comments),
    votesCast: Number(row.votes_cast),
    testimonials: Number(row.testimonials),
    eventsCreated: Number(row.events_created),
    eventsAttended: Number(row.events_attended),
    donatedCents: Number(row.donated_cents),
  }

  return {
    id: row.id,
    name: row.name,
    username: row.username,
    avatarUrl: row.avatar_url,
    joinedTime: row.created_time,
    lastOnlineTime: row.last_online_time,
    missing: completeness.missing,
    input,
    value: getMemberValue(input),
  }
}

export const getMemberValueRanking: APIHandler<'get-member-value-ranking'> = async (
  _props,
  auth,
): Promise<MemberValueRanking> => {
  // The page lists every member by name against their private messaging behaviour. Admin only, and
  // scored against the founder's own id so the founder's threads are excluded.
  if (!isAdminId(auth.uid)) throw APIErrors.forbidden('Admin only')

  const pg = createSupabaseDirectClient()
  const rows = await pg.any<RankingQueryRow>(RANKING_SQL, {
    adminId: auth.uid,
    overhead: CHAT_JSON_OVERHEAD_BYTES,
  })

  return {
    rows: orderBy(rows.map(toRow), (r) => r.value.score, 'desc'),
    computedAt: new Date().toISOString(),
  }
}
