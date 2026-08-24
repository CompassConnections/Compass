import {APIHandler} from 'api/helpers/endpoint'
import {
  evaluateReviewPrompt,
  REVIEW_BACKFILL_CUTOFF,
  REVIEW_CONVERSATION_TOTAL_MIN,
  REVIEW_REPLY_INBOUND_MIN,
  REVIEW_REPLY_RECENT_DAYS,
  REVIEW_SUPPRESSION_DAYS,
  ReviewAccountFacts,
} from 'common/reviews/prompt'
import {createSupabaseDirectClient} from 'shared/supabase/init'

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

  // One query rather than five: every branch of `evaluateReviewPrompt` needs some of this, the whole
  // thing is asked at most once per session, and a member with an active inbox is the exact member
  // for whom a round trip per fact would be most expensive.
  const row = await pg.one<{
    attempts: number
    last_prompted_at: Date | null
    recently_upset: boolean
    has_recent_reply: boolean
    has_pre_cutoff_evidence: boolean
  }>(
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
                       and (is_banned_from_posting or ban_reason is not null))
                or exists (select 1 from contact where user_id = $(uid) and created_time > $(upsetSince))
                or exists (select 1 from reports where user_id = $(uid) and created_time > $(upsetSince)))
                                                                         as recently_upset,
            exists (select 1 from two_way where last_time > $(replySince)) as has_recent_reply,
            -- What backfill can reconstruct. A notification tap leaves no trace, so trigger 3 has no
            -- historical equivalent and is deliberately absent here.
            (exists (select 1 from two_way where last_time < $(cutoff))
                or exists (select 1
                           from testimonials
                           where author_id = $(uid)
                             and created_time < $(cutoff)))               as has_pre_cutoff_evidence`,
    {
      uid: auth.uid,
      minInbound: REVIEW_REPLY_INBOUND_MIN,
      minTotal: REVIEW_CONVERSATION_TOTAL_MIN,
      upsetSince: new Date(now.getTime() - REVIEW_SUPPRESSION_DAYS * DAY_MS),
      replySince: new Date(now.getTime() - REVIEW_REPLY_RECENT_DAYS * DAY_MS),
      cutoff: REVIEW_BACKFILL_CUTOFF,
    },
  )

  const facts: ReviewAccountFacts = {
    attempts: row.attempts,
    lastPromptedAt: row.last_prompted_at,
    recentlyUpset: row.recently_upset,
    hasRecentReply: row.has_recent_reply,
    hasPreCutoffEvidence: row.has_pre_cutoff_evidence,
    now,
  }

  const trigger = evaluateReviewPrompt(props.moment, facts)
  if (!trigger) return {trigger: null}

  // Raw SQL rather than the typed `insert` helper from shared/supabase/utils: that one is typed
  // against common/src/supabase/schema.ts, which is regenerated from the live database and does not
  // know about this table until the migration has been applied and the types re-pulled.
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

  return {trigger}
}
