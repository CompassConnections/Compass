import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {isAdminId} from 'common/envs/constants'
import {OUTREACH_SEND_KINDS, OUTREACH_STAGES, OutreachOutcomes} from 'common/outreach/outreach'
import {keyBy} from 'lodash'
import {createSupabaseDirectClient} from 'shared/supabase/init'

type StatsQueryRow = {
  /** `stage:<stage>` or `send:<kind>` — the two halves of the panel in one result set. */
  bucket: string
  members: string
  replied_to_us: string
  messaged_member: string
  heard_from_member: string
  brought_someone: string
}

/**
 * Outcome rates per bucket, in one pass.
 *
 * Every column is a measured behaviour rather than a hand-set field. The stage is set by the same
 * person the panel is scoring, so a "success rate" read off the stage column would only report what
 * was intended; these report what the members went on to do.
 *
 * The behaviour CTEs are computed once over the whole message table and joined in, rather than as
 * correlated subqueries per member the way `get-outreach-queue` does it — that query runs over at most
 * a couple of hundred rows, this one runs over the whole directory.
 *
 * Only message metadata is read: sender, channel, visibility. Nothing is decrypted.
 */
const STATS_SQL = `
  with admin_channels as (
    select channel_id
    from private_user_message_channel_members
    where user_id = $(adminId)
  ),
  -- Wrote back in a thread the founder is in. This measures the outreach message, not the product.
  replied_to_us as (
    select distinct pm.user_id
    from private_user_messages pm
    where pm.channel_id in (select channel_id from admin_channels)
      and pm.user_id != $(adminId)
      and pm.visibility != 'system_status'
  ),
  -- Every message with a non-founder counterpart in its channel: one side of a real member-to-member
  -- conversation. Founder messages are dropped from both ends deliberately — outreach answering itself
  -- is not the platform working, and counting it would make every worked thread look like a success.
  member_conversations as (
    select pm.user_id as sender_id, other.user_id as recipient_id
    from private_user_messages pm
      join private_user_message_channel_members other
        on other.channel_id = pm.channel_id
       and other.user_id != pm.user_id
       and other.user_id != $(adminId)
    where pm.user_id != $(adminId)
      and pm.visibility != 'system_status'
  ),
  messaged_member as (select distinct sender_id as user_id from member_conversations),
  -- Everyone else in the channel counts as having heard from them. In a group thread that is generous,
  -- but the claim it backs — "someone reached out to them" — survives the generosity.
  heard_from_member as (select distinct recipient_id as user_id from member_conversations),
  brought_someone as (
    select distinct referred_by_username as username
    from profiles
    where referred_by_username is not null
  ),
  -- Everyone the founder has written to. Mirrors i_messaged_them in the queue, and for the same
  -- reason: an empty stage column on a thread the founder opened means nobody recorded it, so bucketing
  -- those members as 'not_started' would put contacted people in the very row that claims to be the
  -- untouched baseline — the one comparison the whole panel rests on.
  contacted as (
    select distinct mem.user_id
    from private_user_messages pm
      join private_user_message_channel_members mem
        on mem.channel_id = pm.channel_id
       and mem.user_id != pm.user_id
    where pm.user_id = $(adminId)
      and pm.visibility != 'system_status'
  ),
  -- The same population the queue works from, minus its two size caps: banned and disabled accounts
  -- are out, everyone else is in exactly one bucket. 'excluded' stays in, as its own row — the count of
  -- people deliberately outside outreach is worth seeing, and dropping it silently would make the
  -- member total disagree with the directory.
  members as (
    select u.id,
           u.username,
           coalesce(oc.stage,
                    case when ct.user_id is not null then 'opened' else 'not_started' end) as stage
    from users u
      left join profiles p on p.user_id = u.id
      left join outreach_contacts oc on oc.user_id = u.id
      left join contacted ct on ct.user_id = u.id
    where u.id != $(adminId)
      and not coalesce(u.is_banned_from_posting, false)
      and not coalesce(p.disabled, false)
  ),
  outcomes as (
    select m.id,
           m.stage,
           (r.user_id is not null)  as replied_to_us,
           (s.user_id is not null)  as messaged_member,
           (h.user_id is not null)  as heard_from_member,
           (b.username is not null) as brought_someone
    from members m
      left join replied_to_us r on r.user_id = m.id
      left join messaged_member s on s.user_id = m.id
      left join heard_from_member h on h.user_id = m.id
      left join brought_someone b on b.username = m.username
  )
  select 'stage:' || o.stage                                as bucket,
         count(*)                                           as members,
         count(*) filter (where o.replied_to_us)            as replied_to_us,
         count(*) filter (where o.messaged_member)          as messaged_member,
         count(*) filter (where o.heard_from_member)        as heard_from_member,
         count(*) filter (where o.brought_someone)          as brought_someone
  from outcomes o
  group by o.stage
  union all
  -- The automated half. A member can appear under a stage and under a send both, on purpose: the
  -- question these rows answer is what an automated message converts at next to a written one, and
  -- that comparison needs the same person counted in whichever buckets they belong to.
  select 'send:' || sd.kind                                 as bucket,
         count(*)                                           as members,
         count(*) filter (where o.replied_to_us)            as replied_to_us,
         count(*) filter (where o.messaged_member)          as messaged_member,
         count(*) filter (where o.heard_from_member)        as heard_from_member,
         count(*) filter (where o.brought_someone)          as brought_someone
  from outreach_sends sd
    join outcomes o on o.id = sd.user_id
  group by sd.kind
`

export const getOutreachStats: APIHandler<'get-outreach-stats'> = async (_props, auth) => {
  // Same bar as the queue: these are one person's working notes, scored against their own threads.
  if (!isAdminId(auth.uid)) throw APIErrors.forbidden('Admin only')

  const pg = createSupabaseDirectClient()

  const rows = await pg.any<StatsQueryRow>(STATS_SQL, {adminId: auth.uid})
  const byBucket = keyBy(rows, 'bucket')

  // Every stage is returned whether or not anyone is in it: an empty stage is a fact about the funnel
  // ("nothing has ever reached `suggestions_sent`"), and a table whose rows come and go is one whose
  // columns have to be re-read every time.
  return {
    stages: OUTREACH_STAGES.map((stage) => ({
      stage,
      ...toOutcomes(byBucket[`stage:${stage}`]),
    })),
    // Send kinds, by contrast, are dropped when nothing has gone out — an automated message that has
    // never been sent has no rate to compare, only a row of zeroes pretending it lost.
    sends: OUTREACH_SEND_KINDS.map((kind) => ({
      kind,
      ...toOutcomes(byBucket[`send:${kind}`]),
    })).filter((row) => row.members > 0),
  }
}

const toOutcomes = (row: StatsQueryRow | undefined): OutreachOutcomes => ({
  members: Number(row?.members ?? 0),
  repliedToUs: Number(row?.replied_to_us ?? 0),
  messagedMember: Number(row?.messaged_member ?? 0),
  heardFromMember: Number(row?.heard_from_member ?? 0),
  broughtSomeone: Number(row?.brought_someone ?? 0),
})
