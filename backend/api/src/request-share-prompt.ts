import {APIHandler} from 'api/helpers/endpoint'
import {
  REVIEW_CONVERSATION_TOTAL_MIN,
  REVIEW_REPLY_INBOUND_MIN,
  REVIEW_REPLY_RECENT_DAYS,
} from 'common/reviews/prompt'
import {evaluateSharePrompt, ShareAccountFacts} from 'common/share/prompt'
import {log} from 'shared/monitoring/log'
import {createSupabaseDirectClient} from 'shared/supabase/init'

const DAY_MS = 24 * 60 * 60 * 1000

type ShareAccountRow = {
  attempts: number
  last_prompted_at: Date | null
  suppressed: boolean
  has_recent_reply: boolean
  has_any_two_way: boolean
  has_testimonial: boolean
  testimonial_rating: number | null
}

/**
 * Should this member be shown the share-or-donate video right now?
 *
 * Same shape as `request-review-prompt`: one query for the facts, the pure rules in
 * `common/src/share/prompt.ts`, and the attempt recorded in the same call that grants it. The
 * two-way-conversation test reuses the review prompt's thresholds so "got a reply" means one thing.
 */
export const requestSharePrompt: APIHandler<'request-share-prompt'> = async (props, auth) => {
  const pg = createSupabaseDirectClient()
  const now = new Date()

  const row = await pg.one<ShareAccountRow>(
    `with attempts as (select count(*)::int as n, max(prompted_at) as last_at
                       from share_prompts
                       where user_id = $(uid)),
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
                         or total >= $(minTotal)),
          testimonial as (select rating
                          from testimonials
                          where author_id = $(uid)
                          order by created_time desc
                          limit 1)
     select (select n from attempts)                                        as attempts,
            (select last_at from attempts)                                  as last_prompted_at,
            exists (select 1 from users where id = $(uid) and is_banned_from_posting) as suppressed,
            exists (select 1 from two_way where last_time > $(replySince))  as has_recent_reply,
            exists (select 1 from two_way)                                  as has_any_two_way,
            exists (select 1 from testimonial)                              as has_testimonial,
            (select rating from testimonial)::int                           as testimonial_rating`,
    {
      uid: auth.uid,
      minInbound: REVIEW_REPLY_INBOUND_MIN,
      minTotal: REVIEW_CONVERSATION_TOTAL_MIN,
      replySince: new Date(now.getTime() - REVIEW_REPLY_RECENT_DAYS * DAY_MS),
    },
  )

  const facts: ShareAccountFacts = {
    attempts: row.attempts,
    lastPromptedAt: row.last_prompted_at,
    suppressed: row.suppressed,
    hasRecentReply: row.has_recent_reply,
    testimonialRating: row.has_testimonial ? row.testimonial_rating : undefined,
    hasAnyEvidence: row.has_any_two_way || row.has_testimonial,
    now,
  }

  const trigger = evaluateSharePrompt(props.moment, facts)

  log.info('share prompt evaluated', {
    userId: auth.uid,
    moment: props.moment,
    platform: props.platform,
    trigger,
    ...facts,
  })

  if (!trigger) return {trigger: null}

  await pg.none(
    `insert into share_prompts (user_id, prompt_trigger, platform, attempt_no)
     values ($(uid), $(trigger), $(platform), $(attemptNo))`,
    {uid: auth.uid, trigger, platform: props.platform, attemptNo: facts.attempts + 1},
  )

  return {trigger}
}
