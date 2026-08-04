// Info about one member and someone else's interaction with them, as markdown
// Run with:
//   export ENVIRONMENT=PROD && npx tsx backend/scripts/member_context.ts <username>
//
// Options (env vars):
//   USERNAME=ana            the member (or pass as the first argument)
//   ME=Martin               whose side of the conversation is "me"
//   OUT=../../martin/context.md    also write to a file (default: stdout only)

import chalk from 'chalk'
import {writeFileSync} from 'fs'

import {debug} from 'common/logger'
import {
  DORMANT_AFTER_DAYS,
  EMPTY_ROOM_MAX_NEARBY,
  getOutreachTier,
  getProfileCompleteness,
  OUTREACH_RADIUS_KM,
} from 'common/outreach/outreach'
import {richTextToString} from 'common/util/parse'
import {convertPrivateChatMessage} from 'shared/supabase/messages'
import {getLocalDensity} from 'shared/outreach/local-density'

import {runScript} from './run-script'

const USERNAME = process.argv[2] ?? process.env.USERNAME
const ME = process.env.ME ?? 'Martin'
const OUT = process.env.OUT

const MS_PER_DAY = 24 * 60 * 60 * 1000

const daysSince = (ts: string | Date | null | undefined): number | null =>
  ts ? Math.floor((Date.now() - new Date(ts).valueOf()) / MS_PER_DAY) : null

/** `2026-08-04 15:48`, matching how I quote conversations by hand. */
const stamp = (ms: number) => {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes(),
  )}`
}

const day = (ts: string | Date | null | undefined) =>
  ts ? new Date(ts).toISOString().slice(0, 10) : '—'

const list = (values: unknown): string => {
  if (Array.isArray(values)) return values.length ? values.join(', ') : '—'
  return values === null || values === undefined || values === '' ? '—' : String(values)
}

/** Only the fields worth a line. A dump of every column buries the two facts worth writing about. */
const field = (label: string, value: unknown) => `- **${label}**: ${list(value)}`

/**
 * For tables that may not exist yet on whichever database this is pointed at — outreach tables reach
 * dev later than prod. Missing table means missing section, not a dead script.
 */
const optional = async <T>(query: Promise<T>, fallback: T): Promise<T> => {
  try {
    return await query
  } catch (e: any) {
    if (e?.code === '42P01') return fallback
    throw e
  }
}

runScript(async ({pg}) => {
  if (!USERNAME) throw new Error('Usage: npx tsx backend/scripts/member_context.ts <username>')

  const me = await pg.oneOrNone<{id: string; name: string}>(
    `select id, name from users where username ilike $1`,
    [ME],
  )
  if (!me) throw new Error(`No user with username "${ME}"`)

  const user = await pg.oneOrNone<any>(
    `select u.id,
            u.name,
            u.username,
            u.created_time,
            u.is_banned_from_posting,
            ua.last_online_time,
            pu.data ->> 'email' as email
     from users u
              left join user_activity ua on ua.user_id = u.id
              left join private_users pu on pu.id = u.id
     where u.username ilike $1`,
    [USERNAME],
  )
  if (!user) throw new Error(`No user with username "${USERNAME}"`)

  const profile = await pg.oneOrNone<any>(`select * from profiles where user_id = $1`, [user.id])

  const options = profile
    ? await pg.manyOrNone<{kind: string; name: string}>(
        `select 'interest' as kind, i.name from profile_interests pi join interests i on i.id = pi.option_id where pi.profile_id = $1
         union all
         select 'cause', c.name from profile_causes pc join causes c on c.id = pc.option_id where pc.profile_id = $1
         union all
         select 'work', w.name from profile_work pw join work w on w.id = pw.option_id where pw.profile_id = $1
         order by kind, name`,
        [profile.id],
      )
    : []
  const named = (kind: string) => options.filter((o) => o.kind === kind).map((o) => o.name)

  // The prose answers, not the multiple-choice ones: these are where the specific observation that
  // Contact #1 needs actually lives.
  const promptAnswers = await pg.manyOrNone<{question: string; free_response: string | null}>(
    `select cp.question, af.free_response
     from compatibility_answers_free af
              join compatibility_prompts cp on cp.id = af.question_id
     where af.creator_id = $1
       and coalesce(af.free_response, '') <> ''
     order by af.created_time`,
    [user.id],
  )

  const answerCount = await pg.one<{count: string}>(
    `select count(*) from compatibility_answers where creator_id = $1`,
    [user.id],
  )

  const searches = await pg.manyOrNone<any>(
    `select id, search_name, search_filters, location, created_time, last_notified_at
     from bookmarked_searches
     where creator_id = $1
     order by created_time desc`,
    [user.id],
  )

  const outreach = await optional<any>(
    pg.oneOrNone<any>(
      `select stage, next_action, updated_time from outreach_contacts where user_id = $1`,
      [user.id],
    ),
    null,
  )

  const referred = await pg.manyOrNone<{name: string; username: string; created_time: string}>(
    `select u.name, u.username, u.created_time
     from profiles p
              join users u on u.id = p.user_id
     where p.referred_by_username = $1
     order by u.created_time desc`,
    [user.username],
  )

  // Engagement with other members. Counted, never read — and admin messages are excluded, because a
  // founder DM is not the platform working and counting it would make every thread look successful.
  const engagement = await pg.one<{sent: string; received: string; partners: string}>(
    `select count(*) filter (where pm.user_id = $(id))                       as sent,
            count(*) filter (where pm.user_id <> $(id))                      as received,
            count(distinct other.user_id)                                    as partners
     from private_user_messages pm
              join private_user_message_channel_members mine
                   on mine.channel_id = pm.channel_id and mine.user_id = $(id)
              join private_user_message_channel_members other
                   on other.channel_id = pm.channel_id and other.user_id <> $(id)
     where pm.visibility <> 'system_status'
       and not coalesce(pm.deleted, false)
       and other.user_id <> $(adminId)`,
    {id: user.id, adminId: me.id},
  )

  const likes = await pg.one<{given: string; received: string}>(
    `select (select count(*) from profile_likes where creator_id = $1) as given,
            (select count(*) from profile_likes where target_id = $1)  as received`,
    [user.id],
  )

  // My own thread with them, decrypted — the one conversation I am entitled to read back.
  const thread = await pg.map(
    `select m.*
     from private_user_messages m
              join private_user_message_channel_members mine
                   on mine.channel_id = m.channel_id and mine.user_id = $(adminId)
              join private_user_message_channel_members theirs
                   on theirs.channel_id = m.channel_id and theirs.user_id = $(id)
     where m.visibility <> 'system_status'
       and not coalesce(m.deleted, false)
     order by m.created_time`,
    {adminId: me.id, id: user.id},
    convertPrivateChatMessage,
  )

  const density = await getLocalDensity(user.id, {pg})

  const completeness = getProfileCompleteness({
    bioLength: profile?.bio_length ?? null,
    headline: profile?.headline ?? null,
    photoCount: profile?.photo_urls?.length ?? 0,
    pinnedUrl: profile?.pinned_url ?? null,
    occupation: profile?.occupation ?? null,
    educationLevel: profile?.education_level ?? null,
    politicalBeliefs: profile?.political_beliefs ?? null,
    diet: profile?.diet ?? null,
    languages: profile?.languages ?? null,
    city: profile?.city ?? null,
    prefGender: profile?.pref_gender ?? null,
    interestCount: named('interest').length,
    causeCount: named('cause').length,
    compatibilityAnswerCount: Number(answerCount.count),
    hasBig5: profile?.big5_openness !== null && profile?.big5_openness !== undefined,
  })

  const daysSinceLastOnline = daysSince(user.last_online_time)
  const repliedToMe = thread.some((m: any) => m.userId === user.id)
  const tier = getOutreachTier({
    completeness: completeness.score,
    daysSinceLastOnline,
    repliedToUs: repliedToMe,
    savedSearchCount: searches.length,
  })

  const lastFromMe = [...thread].reverse().find((m: any) => m.userId === me.id)
  const daysSinceMyLast = lastFromMe ? daysSince(new Date((lastFromMe as any).createdTime)) : null
  const awaitingMyReply = thread.length > 0 && (thread[thread.length - 1] as any).userId === user.id

  // The triggers, minus the profile-view one, which needs view logging that does not exist.
  const alertFired = searches.some((s) => !!s.last_notified_at)
  const triggers = [
    alertFired && 'search alert fired',
    Number(engagement.received) > 0 && 'got a reply from another member',
    Number(engagement.sent) > 0 && 'wrote to another member',
    density !== null && density.count < EMPTY_ROOM_MAX_NEARBY && 'empty room (few nearby)',
    daysSinceLastOnline !== null &&
      daysSinceLastOnline >= DORMANT_AFTER_DAYS &&
      'dormant — gone quiet',
  ].filter(Boolean) as string[]

  // Whether the local number is even their problem. Most members search far wider than their city,
  // and quoting them a 322km count they never asked about invents a complaint they do not have.
  const searchesLocally = searches.some((s) => !!s.location)

  const out: string[] = [
    `# ${user.name} (@${user.username})`,
    '',
    '## Where they stand',
    '',
    field('Tier', tier),
    field(
      'Profile completeness',
      `${completeness.filled}/${completeness.total}` +
        (completeness.missing.length ? ` — missing: ${completeness.missing.join(', ')}` : ''),
    ),
    field('Outreach stage', outreach?.stage ?? 'not_started'),
    field('Next action (my note)', outreach?.next_action),
    field('Signed up', `${day(user.created_time)} (${daysSince(user.created_time)} days ago)`),
    field(
      'Last online',
      user.last_online_time
        ? `${day(user.last_online_time)} (${daysSinceLastOnline} days ago)`
        : '—',
    ),
    field(
      'Messages with me',
      `${thread.length} total, they replied: ${repliedToMe ? 'yes' : 'no'}`,
    ),
    field(
      'Thread state',
      thread.length === 0
        ? 'never contacted'
        : awaitingMyReply
          ? '**they wrote last — I owe a reply**'
          : `waiting on them for ${daysSinceMyLast} days`,
    ),
    field('Triggers', triggers.length ? triggers.join('; ') : 'none'),
    field(
      `Members within ${OUTREACH_RADIUS_KM}km`,
      density === null
        ? 'unknown — no city set'
        : `${density.count}${density.city ? ` (${density.city})` : ''}` +
            (density.nearby.length
              ? ` — nearest: ${density.nearby.map((n) => `${n.name} (@${n.username})`).join(', ')}`
              : ''),
    ),
    field(
      'Searching locally?',
      searchesLocally
        ? 'yes — a saved search has a location filter, so the local number is fair game'
        : searches.length
          ? 'no location filter on any saved search — **do not lead with the local number**'
          : 'unknown — no saved searches to read it off. Ask before assuming distance is their problem',
    ),
    field('Banned', user.is_banned_from_posting ? 'yes' : 'no'),
    field('Email', user.email),
    '',
  ]

  if (!profile) {
    out.push('## Profile', '', '_No profile row._', '')
  } else {
    out.push(
      '## Profile',
      '',
      field('Headline', profile.headline),
      field('City', [profile.city, profile.country].filter(Boolean).join(', ')),
      field(
        'Raised in',
        [profile.raised_in_city, profile.raised_in_country].filter(Boolean).join(', '),
      ),
      field('Age / gender', [profile.age, profile.gender].filter(Boolean).join(' / ')),
      field('Orientation', profile.orientation),
      field('Relationship status', profile.relationship_status),
      field('Looking for', profile.pref_gender),
      field('Connection goal', profile.pref_relation_styles),
      field(
        'Age range wanted',
        [profile.pref_age_min, profile.pref_age_max].filter((v) => v !== null).join('–'),
      ),
      field(
        'Occupation',
        [profile.occupation_title, profile.occupation, profile.company].filter(Boolean).join(' · '),
      ),
      field('Education', [profile.education_level, profile.university].filter(Boolean).join(' · ')),
      field('Languages', profile.languages),
      field('Diet', profile.diet),
      field(
        'Politics',
        [list(profile.political_beliefs), profile.political_details]
          .filter((v) => v && v !== '—')
          .join(' · '),
      ),
      field('Religion', profile.religion),
      field('Neurotype', profile.neurotype),
      field('MBTI', profile.mbti),
      field(
        'Kids',
        `has: ${list(profile.has_kids)}, wants (strength): ${list(profile.wants_kids_strength)}`,
      ),
      field(
        'Smoker / drinks per month',
        `${list(profile.is_smoker)} / ${list(profile.drinks_per_month)}`,
      ),
      field('Exercise', profile.exercise),
      field('Photos', profile.photo_urls?.length ?? 0),
      field('Links', profile.links ? JSON.stringify(profile.links) : '—'),
      field('Keywords', profile.keywords),
      field('Open to matches', profile.looking_for_matches ? 'yes' : 'no'),
      field('Referred by', profile.referred_by_username),
      field('Profile last edited', day(profile.last_modification_time)),
      '',
      '### Bio',
      '',
      profile.bio_text?.trim() || '_empty_',
      '',
    )
  }

  out.push(
    '### Interests, causes, work',
    '',
    field('Interests', named('interest')),
    field('Causes', named('cause')),
    field('Work', named('work')),
    '',
    '## Prompt answers',
    '',
  )
  if (!promptAnswers.length) out.push('_None written._', '')
  for (const a of promptAnswers) {
    out.push(`**${a.question}**`, '', a.free_response?.trim() ?? '', '')
  }
  out.push(field('Multiple-choice compatibility answers', Number(answerCount.count)), '')

  out.push('## Saved searches', '')
  if (!searches.length) {
    out.push(
      '_None._ Nothing to point at when Contact #3a says "your saved search is live" — setting one up for them is itself a give.',
      '',
    )
  }
  for (const s of searches) {
    out.push(
      `- **${s.search_name ?? `search ${s.id}`}** — created ${day(s.created_time)}, ` +
        `last fired ${s.last_notified_at ? day(s.last_notified_at) : 'never'}`,
      `  - filters: \`${JSON.stringify(s.search_filters)}\``,
      `  - location: ${s.location ? `\`${JSON.stringify(s.location)}\`` : 'none — they are searching everywhere'}`,
    )
  }
  out.push('')

  out.push(
    '## Referrals and engagement',
    '',
    field(
      'People they brought',
      referred.length
        ? referred.map((r) => `${r.name} (@${r.username}, ${day(r.created_time)})`)
        : '—',
    ),
    field('Messages to other members', engagement.sent),
    field('Messages received from other members', engagement.received),
    field('Distinct people messaged with (excluding me)', engagement.partners),
    field('Likes given / received', `${likes.given} / ${likes.received}`),
    '',
    '## Conversation with me',
    '',
  )
  if (!thread.length) out.push('_Never contacted._', '')
  for (const m of thread) {
    const text = richTextToString((m as any).content).trim()
    if (!text) continue
    const who = (m as any).userId === me.id ? me.name : user.name
    out.push(`[${stamp((m as any).createdTime)}] ${who}: ${text}`, '')
  }

  const markdown = out.join('\n')
  // Printed rather than logged: this is the artefact, not a progress message.
  process.stdout.write(markdown + '\n')

  if (OUT) {
    writeFileSync(OUT, markdown)
    debug(`[member_context] Wrote @${user.username} to ${chalk.yellow(OUT)}`)
  }
})
