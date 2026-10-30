import {type JSONContent} from '@tiptap/core'
import {APIError, APIErrors} from 'common/api/utils'
import {sendDiscordMessage} from 'common/discord/core'
import {duplicateOpenerDiscordMessage, openerReviewDiscordMessage} from 'common/discord/messages'
import {AUTO_BAN_REVIEW_HOURS, AUTO_BAN_UNDER_REVIEW_CODE} from 'common/moderation/ban'
import {
  DUPLICATE_OPENER_LOOKBACK_DAYS,
  DUPLICATE_OPENER_SAMPLE,
  findDuplicateOpener,
  FIRST_MESSAGE_REJECTED_CODE,
  MIN_FIRST_MESSAGE_CHARS,
  OPENER_REVIEW_REJECTED_CODE,
  profileVocabulary,
  referencesProfile,
} from 'common/moderation/first-message'
import {User} from 'common/user'
import {richTextToString} from 'common/util/parse'
import {
  decideOpener,
  OPENER_REVIEW_MODE,
  ProfileSummary,
  PromptAnswer,
  reviewOpener,
} from 'shared/moderation/opener-review'
import {log} from 'shared/monitoring/log'
import {SupabaseDirectClient} from 'shared/supabase/init'
import {getDecryptedMessage} from 'shared/supabase/messages'
import {updateUser} from 'shared/supabase/users'

/**
 * Whether this would be the first message in the channel. Who wrote it does not matter: in a 1:1
 * channel whoever writes first is opening the conversation, and the rules are about openers.
 */
export async function isOpener(pg: SupabaseDirectClient, channelId: number): Promise<boolean> {
  const {count} = await pg.one<{count: string}>(
    `select count(*) as count from private_user_messages where channel_id = $1`,
    [channelId],
  )
  return Number(count) === 0
}

/**
 * The plain text of the first message in each conversation this member opened recently, newest
 * first. Only messages the member wrote themselves count — a conversation someone else opened with
 * them says nothing about how they open.
 */
export async function previousOpeners(pg: SupabaseDirectClient, userId: string): Promise<string[]> {
  const rows = await pg.manyOrNone<{
    user_id: string
    ciphertext: string
    iv: string
    tag: string
    created_time: Date
  }>(
    `select distinct on (m.channel_id) m.user_id, m.ciphertext, m.iv, m.tag, m.created_time
     from private_user_messages m
     where m.channel_id in (select channel_id
                            from private_user_message_channel_members
                            where user_id = $1
                              and role = 'creator')
       and m.created_time > now() - $2 * interval '1 day'
     order by m.channel_id, m.created_time asc`,
    [userId, DUPLICATE_OPENER_LOOKBACK_DAYS],
  )
  return rows
    .filter((r) => r.user_id === userId)
    .sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime())
    .slice(0, DUPLICATE_OPENER_SAMPLE)
    .map((r) => {
      try {
        return richTextToString(getDecryptedMessage(r))
      } catch (e) {
        log.error('Could not decrypt an earlier opener', {userId, error: String(e)})
        return ''
      }
    })
    .filter(Boolean)
}

type MemberRow = {
  name: string
  username: string
  created_time: Date
  headline: string | null
  keywords: string[] | null
  bio_text: string | null
  bio: JSONContent | null
  interests: string[] | null
  causes: string[] | null
  work: string[] | null
  prompt_answers: PromptAnswer[] | null
  /** The rest of the profile row, minus the columns in `NOT_PROFILE_CONTENT`. */
  details: Record<string, unknown> | null
}

/**
 * Profile columns that are not something the member wrote about themselves: ids, coordinates,
 * search indexes, settings and consents, timestamps, photos. Everything else on the row goes to the
 * model. A deny-list on purpose, so a new profile field reaches the review without anyone having to
 * remember this file. `birth_date` is left out because `age` says the same with less.
 */
const NOT_PROFILE_CONTENT = [
  'id',
  'user_id',
  'bio',
  'bio_text',
  'bio_length',
  'bio_tsv',
  'search_text',
  'search_tsv',
  'headline',
  'keywords',
  'birth_date',
  'created_time',
  'last_modification_time',
  'city_latitude',
  'city_longitude',
  'geodb_city_id',
  'raised_in_lat',
  'raised_in_lon',
  'raised_in_radius',
  'raised_in_geodb_city_id',
  'photo_urls',
  'pinned_url',
  'referred_by_user_id',
  'referred_by_username',
  'visibility',
  'feed_visibility',
  'disabled',
  'looking_for_matches',
  'allow_direct_messaging',
  'allow_interest_indicating',
  'comments_enabled',
  'messaging_status',
  'social_media_consent',
  'spotlight_consent',
  'donor_badge_hidden',
]

/** Most prompt answers sent to the model per member, the explained and most important first. */
const MAX_PROMPT_ANSWERS = 30

/**
 * A member with everything on their profile a first message can be judged against: the profile
 * row, their interests, causes and work by name, and their compatibility answers as text.
 * One round trip — it runs on every first message, inside the request.
 */
async function memberRow(pg: SupabaseDirectClient, userId: string): Promise<MemberRow | null> {
  return pg.oneOrNone<MemberRow>(
    `select u.name,
            u.username,
            u.created_time,
            p.headline,
            p.keywords,
            p.bio_text,
            p.bio,
            to_jsonb(p) - $2::text[] as details,
            (select array_agg(o.name order by o.name)
             from profile_interests po
                      join interests o on o.id = po.option_id
             where po.profile_id = p.id) as interests,
            (select array_agg(o.name order by o.name)
             from profile_causes po
                      join causes o on o.id = po.option_id
             where po.profile_id = p.id) as causes,
            (select array_agg(o.name order by o.name)
             from profile_work po
                      join work o on o.id = po.option_id
             where po.profile_id = p.id) as work,
            (select jsonb_agg(a.answer)
             from (select jsonb_build_object(
                                  'question', cp.question,
                                  -- options are stored label -> index; the answer is the index
                                  'answer', (select key
                                             from jsonb_each(cp.multiple_choice_options)
                                             where value::int = ca.multiple_choice
                                             limit 1),
                                  'explanation', ca.explanation
                          ) as answer
                   from compatibility_answers ca
                            join compatibility_prompts cp on cp.id = ca.question_id
                   where ca.creator_id = u.id
                   order by (ca.explanation is null or ca.explanation = ''), ca.importance desc
                   limit $3) a) as prompt_answers
     from users u
              left join profiles p on p.user_id = u.id
     where u.id = $1`,
    [userId, NOT_PROFILE_CONTENT, MAX_PROMPT_ANSWERS],
  )
}

// `bio_text` is the trigger-maintained plain text of the bio; the rich-text document is the
// fallback for a profile the trigger has not rebuilt yet.
const bioTextOf = (row: MemberRow) => row.bio_text ?? (row.bio ? richTextToString(row.bio) : null)

const summaryOf = (row: MemberRow): ProfileSummary => ({
  name: row.name,
  headline: row.headline,
  keywords: row.keywords,
  bioText: bioTextOf(row),
  interests: row.interests,
  causes: row.causes,
  work: row.work,
  promptAnswers: row.prompt_answers,
  details: row.details,
})

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Refuses a first message that is too short, that is a copy of one the sender already opened
 * another conversation with, or that a model reading it next to both profiles finds generic,
 * looks-based or a scam. Whether it picks up a word from the recipient's profile is checked too,
 * but only logged: the composer shows the same result as a warning.
 *
 * The length and the model's "generic" case are the sender's to fix, so they come back as 400s
 * with the explanation the composer shows. A copy-pasted opener and a scam are the bulk-messaging
 * pattern itself: they put the account on the same provisional hold the new-conversation limit uses
 * and post to #reports, since there is nothing left for the sender to fix.
 *
 * Everything here runs before the message is stored, so the recipient is never told about a message
 * that does not get through. The composer shows the sender their message immediately meanwhile —
 * see `web/lib/pending-openers.ts`.
 */
export async function assertAcceptableOpener(
  pg: SupabaseDirectClient,
  sender: User,
  recipientId: string,
  content: JSONContent,
) {
  const text = richTextToString(content).replace(/\s+/g, ' ').trim()
  if (text.length < MIN_FIRST_MESSAGE_CHARS) {
    throw APIErrors.badRequest(
      `A first message is at least ${MIN_FIRST_MESSAGE_CHARS} characters. Say something about the person you're writing to.`,
      {context: FIRST_MESSAGE_REJECTED_CODE},
    )
  }

  const recipient = await memberRow(pg, recipientId)
  if (!recipient) throw APIErrors.notFound('The person you are writing to was not found')

  const vocabulary = profileVocabulary({
    name: recipient.name,
    username: recipient.username,
    headline: recipient.headline,
    keywords: recipient.keywords,
    bioText: bioTextOf(recipient),
  })
  // Advisory only. Word matching is too blunt to refuse on — a paraphrase of the bio shares none
  // of its words — so the composer warns and the model review below judges. Logged so the share of
  // openers that pick up nothing stays measurable (docs/first-messages.md).
  const anchored = referencesProfile(text, vocabulary)
  if (!anchored) {
    log.info('Opener references nothing from the profile', {
      senderId: sender.id,
      recipientId,
      vocabulary: vocabulary.length,
    })
  }

  const previous = await previousOpeners(pg, sender.id)
  const duplicate = findDuplicateOpener(text, previous)
  if (duplicate) {
    await updateUser(sender.id, {isBannedFromPosting: true, banReason: 'auto_rate_limit'})
    try {
      await sendDiscordMessage(
        duplicateOpenerDiscordMessage(sender, recipient, {
          similarity: duplicate.similarity,
          earlierOpeners: previous.length,
        }),
        'reports',
      )
    } catch (e) {
      console.error('Failed to send duplicate-opener discord report', e)
    }
    // Same code as the conversation limit, so the client shows the "on hold, being reviewed"
    // explanation rather than a bare refusal; most people who trip either are genuine.
    throw APIErrors.forbidden(
      `This first message is nearly the same as one you already sent to someone else, so your account is temporarily on hold. We do this automatically to protect our members from bulk messaging. Our team reviews every case within ${AUTO_BAN_REVIEW_HOURS} hours and restores accounts that look genuine — nothing you've written is lost.`,
      {
        context: AUTO_BAN_UNDER_REVIEW_CODE,
        resolution: 'Contact us at /contact if you want to tell us about your account.',
      },
    )
  }

  await reviewWithModel(pg, sender, recipient, text)
}

/**
 * The model's read of the message next to both profiles — `shared/moderation/opener-review.ts`.
 * No verdict (model off, unreachable, slow, or unparseable) means the message goes through: the
 * deterministic checks above still ran, and an outage must not stop every first message.
 */
async function reviewWithModel(
  pg: SupabaseDirectClient,
  sender: User,
  recipient: MemberRow,
  text: string,
) {
  if (OPENER_REVIEW_MODE === 'off') return
  const senderRow = await memberRow(pg, sender.id)
  if (!senderRow) return
  const verdict = await reviewOpener({
    opener: text,
    sender: {
      ...summaryOf(senderRow),
      accountAgeDays: Math.max(
        0,
        Math.floor((Date.now() - new Date(senderRow.created_time).getTime()) / DAY_MS),
      ),
    },
    recipient: summaryOf(recipient),
  })
  if (!verdict) return

  const decision = decideOpener(verdict)
  log.info('Opener review', {
    senderId: sender.id,
    action: decision.action,
    mode: OPENER_REVIEW_MODE,
    verdict,
  })
  if (decision.action === 'approve') return

  const shadow = OPENER_REVIEW_MODE === 'shadow'
  if (!shadow && decision.action === 'hold') {
    await updateUser(sender.id, {isBannedFromPosting: true, banReason: 'auto_rate_limit'})
  }
  try {
    await sendDiscordMessage(
      openerReviewDiscordMessage(sender, recipient, {
        action: decision.action,
        reason: decision.reason,
        shadow,
      }),
      'reports',
    )
  } catch (e) {
    console.error('Failed to send opener-review discord report', e)
  }
  if (shadow || decision.action === 'flag') return

  if (decision.action === 'reject') {
    // The second marker tells the composer this came from the model, not a fixed rule, so it can
    // say the check is new and may be wrong, and point to where to contest it.
    throw new APIError(400, decision.reason, [
      {context: FIRST_MESSAGE_REJECTED_CODE},
      {context: OPENER_REVIEW_REJECTED_CODE},
    ])
  }
  // A hold. Deliberately not saying what gave it away: naming the signal teaches the next account
  // to avoid it. The copy is the same provisional one the other automatic holds use.
  throw APIErrors.forbidden(
    `Your first message was flagged by our automatic checks, so your account is temporarily on hold. We do this to protect our members from scams and bulk messaging. Our team reviews every case within ${AUTO_BAN_REVIEW_HOURS} hours and restores accounts that look genuine — nothing you've written is lost.`,
    {
      context: AUTO_BAN_UNDER_REVIEW_CODE,
      resolution: 'Contact us at /contact if you want to tell us about your account.',
    },
  )
}
