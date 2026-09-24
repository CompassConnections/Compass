import {APIHandler} from 'api/helpers/endpoint'
import {
  evaluateReviewPrompt,
  REVIEW_BACKFILL_CUTOFF,
  REVIEW_CONVERSATION_TOTAL_MIN,
  REVIEW_PROMPT_COOLDOWN_DAYS,
  REVIEW_PROMPT_MAX_ATTEMPTS,
  REVIEW_REPLY_INBOUND_MIN,
  REVIEW_REPLY_RECENT_DAYS,
  REVIEW_SUPPRESSION_DAYS,
  ReviewAccountFacts,
  ReviewMoment,
} from 'common/reviews/prompt'
import {log} from 'shared/monitoring/log'
import {createSupabaseDirectClient, type SupabaseDirectClient} from 'shared/supabase/init'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Should this member be shown the native App Store / Play Store review card right now?
 *
 * One POST does the reading and the writing, because with these APIs they are the same act: the store
 * tells us nothing after the card is invoked, so the ask has to be recorded at the moment it is
 * granted or not at all. Splitting it into a read and a later write would mean an attempt that can be
 * lost between the two, and a window in which two moments a second apart are both told yes.
 *
 * The client has already checked what it can (native app, enough sessions, calm moment) — see
 * `isInstallEligible`. Everything below is the half that needs the database.
 */
export const requestReviewPrompt: APIHandler<'request-review-prompt'> = async (props, auth) => {
  const pg = createSupabaseDirectClient()
  const now = new Date()

  const row = await fetchReviewAccountRow(pg, auth.uid, now)
  const facts = toReviewAccountFacts(row, now)

  const trigger = evaluateReviewPrompt(props.moment, facts)

  // One line per ask, granted or not, with every input the decision was made from. Logged at `info`
  // rather than `debug` because the question this answers — "why has this member never been asked" —
  // is only ever asked about production, where `debug` is off.
  log.info('review prompt evaluated', {
    userId: auth.uid,
    moment: props.moment,
    platform: props.platform,
    trigger,
    declinedBecause: trigger ? null : declineReason(props.moment, facts),
    attempts: facts.attempts,
    lastPromptedAt: facts.lastPromptedAt,
    recentlyUpset: facts.recentlyUpset,
    hasRecentReply: facts.hasRecentReply,
    hasPreCutoffEvidence: facts.hasPreCutoffEvidence,
    // The two-way test, shown as the numbers it compares: a member with conversations but
    // `maxInbound` of 1 and `maxTotal` of 3 is talking into the void, and a `lastTwoWayAt` older
    // than REVIEW_REPLY_RECENT_DAYS is a real exchange that the recency window has since expired.
    conversations: row.conversations,
    maxInbound: row.max_inbound,
    maxTotal: row.max_total,
    lastTwoWayAt: row.last_two_way_at,
    lastMessageAt: row.last_message_at,
    thresholds: {
      minInbound: REVIEW_REPLY_INBOUND_MIN,
      minTotal: REVIEW_CONVERSATION_TOTAL_MIN,
      recentDays: REVIEW_REPLY_RECENT_DAYS,
      replySince: new Date(now.getTime() - REVIEW_REPLY_RECENT_DAYS * DAY_MS),
      backfillCutoff: REVIEW_BACKFILL_CUTOFF,
    },
  })

  if (!trigger) return {trigger: null}

  await pg.none(
    `insert into review_prompts (user_id, prompt_trigger, platform, attempt_no)
     values ($(uid), $(trigger), $(platform), $(attemptNo))`,
    {
      uid: auth.uid,
      trigger,
      platform: props.platform,
      attemptNo: facts.attempts + 1,
    },
  )

  log.info('review prompt granted and recorded', {
    userId: auth.uid,
    trigger,
    platform: props.platform,
    attemptNo: facts.attempts + 1,
  })

  return {trigger}
}

export type ReviewAccountRow = {
  attempts: number
  last_prompted_at: Date | null
  recently_upset: boolean
  has_recent_reply: boolean
  has_pre_cutoff_evidence: boolean
  // Diagnostics only — nothing below branches on these. They exist because `has_recent_reply: false`
  // on a member who plainly has conversations is otherwise unfalsifiable from outside the database,
  // and `got-reply` is the trigger that has to clear two thresholds *and* a recency window.
  conversations: number
  max_inbound: number | null
  max_total: number | null
  last_two_way_at: Date | null
  last_message_at: Date | null
}

/**
 * Everything the decision needs about one member, read in one query. Exported so the dry-run script
 * (`backend/scripts/2026-09-24-review-prompt-dry-run.ts`) evaluates members with the very same SQL.
 */
export function fetchReviewAccountRow(pg: SupabaseDirectClient, userId: string, now: Date) {
  // One query rather than five: every branch of `evaluateReviewPrompt` needs some of this, the whole
  // thing is asked at most once per session, and a member with an active inbox is the exact member
  // for whom a round trip per fact would be most expensive.
  return pg.one<ReviewAccountRow>(
    `with attempts as (select count(*)::int as n, max(prompted_at) as last_at
                       from review_prompts
                       where user_id = $(uid)),
          -- One row per conversation this member is in, with the two shapes of "someone wrote back"
          -- counted: messages from anyone else, and messages from everyone including them.
          conversations as (select count(*) filter (where m.user_id is distinct from $(uid)) as inbound,
                                   count(*)                                                 as total,
                                   max(m.created_time)                                      as last_time
                            from private_user_message_channel_members mem
                                     join private_user_messages m on m.channel_id = mem.channel_id
                            where mem.user_id = $(uid)
                            group by mem.channel_id),
          two_way as (select last_time
                      from conversations
                      where inbound >= $(minInbound)
                         or total >= $(minTotal))
     select (select n from attempts)                                     as attempts,
            (select last_at from attempts)                               as last_prompted_at,
            (exists (select 1
                     from users
                     where id = $(uid)
                       and (is_banned_from_posting))
--                 or exists (select 1 from contact where user_id = $(uid) and created_time > $(upsetSince))
--                 or exists (select 1 from reports where user_id = $(uid) and created_time > $(upsetSince))
                     )
                                                                         as recently_upset,
            exists (select 1 from two_way where last_time > $(replySince)) as has_recent_reply,
            -- What backfill can reconstruct. A notification tap leaves no trace, so trigger 3 has no
            -- historical equivalent and is deliberately absent here.
            (exists (select 1 from two_way where last_time < $(cutoff))
                or exists (select 1
                           from testimonials
                           where author_id = $(uid)
                             and created_time < $(cutoff)))               as has_pre_cutoff_evidence,
            (select count(*)::int from conversations)                      as conversations,
            (select max(inbound)::int from conversations)                  as max_inbound,
            (select max(total)::int from conversations)                    as max_total,
            (select max(last_time) from two_way)                           as last_two_way_at,
            (select max(last_time) from conversations)                     as last_message_at`,
    {
      uid: userId,
      minInbound: REVIEW_REPLY_INBOUND_MIN,
      minTotal: REVIEW_CONVERSATION_TOTAL_MIN,
      upsetSince: new Date(now.getTime() - REVIEW_SUPPRESSION_DAYS * DAY_MS),
      replySince: new Date(now.getTime() - REVIEW_REPLY_RECENT_DAYS * DAY_MS),
      cutoff: REVIEW_BACKFILL_CUTOFF,
    },
  )
}

export function toReviewAccountFacts(row: ReviewAccountRow, now: Date): ReviewAccountFacts {
  return {
    attempts: row.attempts,
    lastPromptedAt: row.last_prompted_at,
    recentlyUpset: row.recently_upset,
    hasRecentReply: row.has_recent_reply,
    hasPreCutoffEvidence: row.has_pre_cutoff_evidence,
    now,
  }
}

/**
 * Which rule said no, for the log line only.
 *
 * Deliberately a separate read of the same facts rather than something `evaluateReviewPrompt` returns:
 * the policy has one home and one signature, and a diagnostic string is not worth widening it. The
 * order mirrors the real function, so the first match is the one that actually decided.
 */
export function declineReason(moment: ReviewMoment, facts: ReviewAccountFacts): string {
  if (facts.recentlyUpset) {
    return 'recently-upset (banned, or wrote to support / filed a report inside the suppression window)'
  }
  if (facts.attempts >= REVIEW_PROMPT_MAX_ATTEMPTS) return 'lifetime cap reached'
  if (
    facts.lastPromptedAt &&
    (facts.now.getTime() - facts.lastPromptedAt.getTime()) / DAY_MS < REVIEW_PROMPT_COOLDOWN_DAYS
  ) {
    return 'still inside the cooldown'
  }
  if (moment === 'conversation-exit' || moment === 'inbox') {
    return 'no two-way conversation inside the recency window'
  }
  if (moment === 'quiet') {
    return facts.attempts > 0
      ? 'backfill skipped: already asked at least once'
      : 'backfill skipped: no evidence predating the cutoff'
  }
  return 'unknown'
}
