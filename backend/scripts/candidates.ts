// Ranked candidate profiles for one member, as markdown — the "who should I hand them" half of
// `member_context.ts`.
//
// Run with:
//   export ENVIRONMENT=PROD && npx tsx backend/scripts/candidates.ts <username>
//
// Options (env vars):
//   USERNAME=evelynwagaman   the member to find candidates for (or pass as the first argument)
//   TARGET_FILE=../../martin/outreach/targets/dan.json
//                            rank for someone who is *not* a member — a date-me doc, a referral, anyone
//                            with no profile row. JSON of the profile fields this script reads; see
//                            OFF_PLATFORM_TARGET_FIELDS below. Mutually exclusive with USERNAME.
//   ME=Martin                whose thread with them is read to spot names already handed over
//   LIMIT=12                 how many to print in full (default 12)
//   NEARBY_KM=500            radius for the separate nearby list (default 500)
//   EXCLUDE=raskia,Joss_     extra usernames to leave out
//   OUT=../../martin/candidates.md   also write to a file (default: stdout only)
//
// What this is *not*: the site's own search. Search answers "who matches these filters"; this answers
// "who can I suggest". The difference is the
// caveats — dormant, empty bio, kids mismatch, members-only

import chalk from 'chalk'
import {readFileSync, writeFileSync} from 'fs'
import {countBy, uniq} from 'lodash'

import {debug} from 'common/logger'
import {DORMANT_AFTER_DAYS} from 'common/outreach/outreach'
import {
  areAgeCompatible,
  areGenderCompatible,
  areRelationshipStyleCompatible,
  areWantKidsCompatible,
} from 'common/profiles/compatibility-util'
import {ProfileRow} from 'common/profiles/profile'
import {richTextToString} from 'common/util/parse'
import {convertPrivateChatMessage} from 'shared/supabase/messages'

import {runScript} from './run-script'

const USERNAME = process.argv[2] ?? process.env.USERNAME
const TARGET_FILE = process.env.TARGET_FILE
const ME = process.env.ME ?? 'Martin'
const LIMIT = Number(process.env.LIMIT ?? 12)
const NEARBY_KM = Number(process.env.NEARBY_KM ?? 500)
const EXCLUDE = (process.env.EXCLUDE ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)
const OUT = process.env.OUT

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** A bio shorter than this is a page with nothing on it — clicking through costs the reader more than it gives. */
const MIN_READABLE_BIO = 300
/** Past this, a handed-over profile is a coin flip on whether anyone is still there to answer. */
const STALE_DAYS = 60

const daysSince = (ts: string | Date | null | undefined): number | null =>
  ts ? Math.floor((Date.now() - new Date(ts).valueOf()) / MS_PER_DAY) : null

const list = (values: unknown): string => {
  if (Array.isArray(values)) return values.length ? values.join(', ') : '—'
  return values === null || values === undefined || values === '' ? '—' : String(values)
}

const field = (label: string, value: unknown) => `- **${label}**: ${list(value)}`

/** `24–49`, `up to 38`, `any` — an unset bound is no bound, and printing it as "null" reads as a bug. */
const ageRange = (min: number | null, max: number | null) =>
  min === null && max === null
    ? 'any age'
    : min === null
      ? `up to ${max}`
      : max === null
        ? `${min}+`
        : `${min}–${max}`

const days = (n: number | null) => (n === null ? 'never' : n === 1 ? '1 day ago' : `${n} days ago`)

const overlap = (a: string[] | null | undefined, b: string[] | null | undefined) => {
  const set = new Set((b ?? []).map((v) => v.toLowerCase()))
  return uniq((a ?? []).filter((v) => set.has(v.toLowerCase())))
}

/**
 * Words that carry no signal about a person. Deliberately short: the distinctiveness filter below
 * drops common vocabulary on its own by document frequency, so this list only has to catch the
 * function words that survive a 4-character minimum.
 */
const STOPWORDS = new Set(
  `about above after again against also anything around because been before being below between both cannot
   could does doing down during each even ever every from further guess have having here here's how's into
   itself just like made make many more most much must myself never once only other ought ours ourselves out
   over own really same should some such than that their theirs them themselves then there there's these they
   this those through time to too under until very want was were what what's when when's where where's which
   while who who's whom why why's will with would your yours yourself yourselves someone something things
   would think thing lot bit way get got go going come coming look looking love loves like liked people
   person life live living work working world year years day days good great best better nice`
    .split(/\s+/)
    .filter(Boolean),
)

const tokenize = (text: string): string[] =>
  uniq(
    text
      .toLowerCase()
      .split(/[^a-zà-ÿ']+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w)),
  )

type Row = ProfileRow & {
  username: string
  name: string
  last_online_time: string | null
  profile_id: number
  distance_km: number | null
  is_banned_from_posting: boolean
}

/**
 * The fields a `TARGET_FILE` may set. Everything here is read by the scoring below; anything else in
 * the JSON is ignored rather than silently mattering. The four that decide *eligibility* — and so the
 * ones worth getting right in the file — are `gender`, `age`, `pref_gender` and the age bounds.
 */
const OFF_PLATFORM_TARGET_FIELDS = `name age gender pref_gender pref_age_min pref_age_max
   pref_relation_styles wants_kids_strength city country city_latitude city_longitude headline bio_text
   occupation occupation_title company keywords diet political_beliefs political_details
   religion languages mbti`

/**
 * A target with no profile row: a date-me doc, a referral, anyone not signed up. Scoring only ever
 * reads profile *fields*, so a plain object is enough — but `user_id` stays null, which is what the
 * two thread lookups below key off to skip themselves. There is no thread with someone who isn't here.
 */
const loadOffPlatformTarget = (path: string): Row => {
  const parsed = JSON.parse(readFileSync(path, 'utf8'))
  if (!parsed.gender || !parsed.age) {
    throw new Error(`${path}: needs at least "gender" and "age" — they gate mutual eligibility`)
  }
  return {
    username: parsed.username ?? 'off-platform',
    name: parsed.name ?? 'Off-platform target',
    user_id: null,
    profile_id: 0,
    last_online_time: null,
    distance_km: null,
    is_banned_from_posting: false,
    ...parsed,
  } as Row
}

runScript(async ({pg}) => {
  if (!USERNAME && !TARGET_FILE) {
    throw new Error(
      'Usage: npx tsx backend/scripts/candidates.ts <username>   (or TARGET_FILE=<profile.json>)',
    )
  }

  const me = await pg.oneOrNone<{id: string}>(`select id from users where username ilike $1`, [ME])

  const target = TARGET_FILE
    ? loadOffPlatformTarget(TARGET_FILE)
    : await pg.oneOrNone<Row>(
        `select u.username, u.name, u.id as user_id, ua.last_online_time, p.*, p.id as profile_id
     from users u
              join profiles p on p.user_id = u.id
              left join user_activity ua on ua.user_id = u.id
     where u.username ilike $1`,
        [USERNAME],
      )
  if (!target) throw new Error(`No member with username "${USERNAME}"`)

  /**
   * The pool is gated on *their* stated preferences, not on a guess. `pref_gender` and the age range
   * are theirs; the mutual half of each test is applied in TS below with the platform's own helpers,
   * so this script and the site can never disagree about who is eligible.
   *
   * Distance comes back on every row but gates nothing — most members here search far wider than their
   * city, and filtering on locality would silently hide the only good fit in the world from someone
   * who never asked to stay home.
   *
   * The origin is passed in rather than re-read from the target's row, so an off-platform target with
   * a city in its JSON still gets real distances. A null origin means no distances, not no pool.
   */
  const pool = await pg.manyOrNone<Row>(
    `select u.username,
            u.name,
            ua.last_online_time,
            u.is_banned_from_posting,
            p.*,
            p.id as profile_id,
            case
                when $(lat) is null or p.city_latitude is null then null
                else round(calculate_earth_distance_km($(lat)::double precision,
                                                       $(lon)::double precision,
                                                       p.city_latitude, p.city_longitude)::numeric)
                end as distance_km
     from users u
              join profiles p on p.user_id = u.id
              left join user_activity ua on ua.user_id = u.id
     where ($(userId) is null or p.user_id <> $(userId))
       and p.looking_for_matches
       and not coalesce(p.disabled, false)
       and not coalesce(u.is_banned_from_posting, false)
       and coalesce(u.data ->> 'userDeleted', 'false') <> 'true'`,
    {
      userId: target.user_id ?? null,
      lat: target.city_latitude ?? null,
      lon: target.city_longitude ?? null,
    },
  )

  // Interests, causes and work for everyone at once. Three round trips per candidate would be a
  // thousand queries for a pool this size.
  const optionRows = await pg.manyOrNone<{profile_id: number; kind: string; name: string}>(
    `select pi.profile_id, 'interest' as kind, i.name
     from profile_interests pi join interests i on i.id = pi.option_id
     union all
     select pc.profile_id, 'cause', c.name from profile_causes pc join causes c on c.id = pc.option_id
     union all
     select pw.profile_id, 'work', w.name from profile_work pw join work w on w.id = pw.option_id`,
  )
  const optionsByProfile = new Map<number, {kind: string; name: string}[]>()
  for (const o of optionRows) {
    const existing = optionsByProfile.get(o.profile_id)
    if (existing) existing.push(o)
    else optionsByProfile.set(o.profile_id, [o])
  }
  const named = (profileId: number, kind: string) =>
    (optionsByProfile.get(profileId) ?? []).filter((o) => o.kind === kind).map((o) => o.name)

  // Who they have already talked to. Not a reason to exclude — an existing thread is the strongest
  // possible signal of interest — but handing back a name they are mid-conversation with reads as
  // not having looked.
  const spokenTo = new Set(
    target.user_id
      ? (
          await pg.manyOrNone<{username: string}>(
            `select distinct u.username
         from private_user_message_channel_members mine
                  join private_user_message_channel_members other
                       on other.channel_id = mine.channel_id and other.user_id <> mine.user_id
                  join users u on u.id = other.user_id
         where mine.user_id = $(userId)`,
            {userId: target.user_id},
          )
        ).map((r) => r.username.toLowerCase())
      : [],
  )

  /**
   * Names already handed over, read out of my own thread with them rather than remembered. Every
   * contact after the first is judged on being better than the last one, and re-sending a profile
   * from two messages ago is the cheapest possible way to look like a template.
   */
  const alreadySent = new Set<string>()
  if (me && target.user_id) {
    const thread = await pg.map(
      `select m.*
       from private_user_messages m
                join private_user_message_channel_members mine
                     on mine.channel_id = m.channel_id and mine.user_id = $(adminId)
                join private_user_message_channel_members theirs
                     on theirs.channel_id = m.channel_id and theirs.user_id = $(id)
       where m.visibility <> 'system_status'
         and not coalesce(m.deleted, false)`,
      {adminId: me.id, id: target.user_id},
      convertPrivateChatMessage,
    )
    for (const message of thread) {
      const text = richTextToString((message as any).content)
      for (const m of text.matchAll(/compassmeet\.com\/([A-Za-z0-9_-]+)/g)) {
        alreadySent.add(m[1].toLowerCase())
      }
    }
  }

  const docOf = (row: Row, profileId: number) =>
    [
      row.headline ?? '',
      row.bio_text ?? '',
      row.political_details ?? '',
      row.occupation ?? '',
      row.occupation_title ?? '',
      row.company ?? '',
      (row.keywords ?? []).join(' '),
      named(profileId, 'interest').join(' '),
      named(profileId, 'cause').join(' '),
      named(profileId, 'work').join(' '),
    ].join(' \n ')

  // Which of their words are actually distinctive. A term everybody uses ("vegan" on a vegan-heavy
  // platform, "kind" everywhere) says nothing about a particular candidate; the rare shared word is
  // the one worth quoting in the message. This is why the script generalises to any member rather than
  // needing a hand-written list of things to look for.
  const poolTokens = new Map<string, string[]>()
  for (const row of pool) poolTokens.set(row.username, tokenize(docOf(row, row.profile_id)))
  const documentFrequency = countBy([...poolTokens.values()].flat())
  const poolSize = pool.length || 1
  const idf = (term: string) => Math.log(poolSize / (1 + (documentFrequency[term] ?? 0)))

  const targetTokens = new Set(tokenize(docOf(target, target.profile_id)))
  const targetInterests = named(target.profile_id, 'interest')
  const targetCauses = named(target.profile_id, 'cause')
  const targetWork = named(target.profile_id, 'work')

  const scored = pool.map((row) => {
    const profileId = row.profile_id
    const causes = overlap(targetCauses, named(profileId, 'cause'))
    const interests = overlap(targetInterests, named(profileId, 'interest'))
    const work = overlap(targetWork, named(profileId, 'work'))
    const diet = overlap(target.diet, row.diet)
    const politics = overlap(target.political_beliefs, row.political_beliefs)
    const religion = overlap(target.religion, row.religion)
    const keywords = overlap(target.keywords, row.keywords)
    const languages = overlap(target.languages, row.languages)

    const candidateTokens = poolTokens.get(row.username) ?? []
    const shared = candidateTokens
      .filter((t) => targetTokens.has(t))
      // A term more than a quarter of the pool uses is vocabulary, not a match.
      .filter((t) => (documentFrequency[t] ?? 0) <= poolSize / 4)
      .sort((a, b) => idf(b) - idf(a))
    const prose = shared.slice(0, 12)

    // Normalised by both document lengths, because otherwise the longest date-me doc on the platform
    // matches everyone: a 20,000-word bio shares some rare word with every profile alive, and an
    // unnormalised sum would rank people by how much they wrote rather than by what they share.
    const proseScore = Math.round(
      (20 * shared.reduce((sum, t) => sum + idf(t), 0)) /
        Math.sqrt(Math.max(candidateTokens.length, 1) * Math.max(targetTokens.size, 1)),
    )

    const kidsGap =
      target.wants_kids_strength !== null && row.wants_kids_strength !== null
        ? Math.abs(target.wants_kids_strength - row.wants_kids_strength)
        : null

    const offline = daysSince(row.last_online_time)
    const bioLength = row.bio_length ?? 0

    let score = 0
    score += 4 * causes.length
    score += 1 * interests.length
    score += 1 * work.length
    score += 4 * diet.length
    score += 2 * politics.length
    score += 1 * religion.length
    score += 3 * keywords.length
    score += proseScore
    if (kidsGap !== null) score += kidsGap === 0 ? 4 : kidsGap === 1 ? 1 : -3
    if (target.mbti && row.mbti && target.mbti === row.mbti) score += 1

    // Deliverability. Everything above is about fit; this is about whether a message sent there gets
    // read, and it is weighted to matter, because a perfect match who left in March is worth less to
    // hand over than a decent one who was here yesterday.
    if (offline === null || offline > 180) score -= 12
    else if (offline > DORMANT_AFTER_DAYS * 3) score -= 8
    else if (offline > STALE_DAYS) score -= 5
    else if (offline <= 7) score += 3
    if (bioLength < MIN_READABLE_BIO) score -= 6
    else if (bioLength > 1000) score += 2
    if ((row.photo_urls ?? []).length > 0) score += 1

    const caveats = [
      offline === null
        ? 'never seen online'
        : offline > STALE_DAYS
          ? `last online ${offline} days ago — say so, or don't send`
          : null,
      bioLength < MIN_READABLE_BIO
        ? `bio is ${bioLength} chars — nothing to read on the other end`
        : null,
      kidsGap !== null && kidsGap >= 2
        ? `kids: they're ${target.wants_kids_strength}, he/she is ${row.wants_kids_strength} — name it`
        : null,
      !areWantKidsCompatible(target, row)
        ? 'the site itself calls the kids gap incompatible'
        : null,
      row.visibility === 'member' ? 'members-only profile — the link only works signed in' : null,
      (row.photo_urls ?? []).length === 0 ? 'no photos' : null,
      target.languages?.length && row.languages?.length && !languages.length
        ? 'no language in common'
        : null,
      spokenTo.has(row.username.toLowerCase()) ? 'they have already messaged each other' : null,
      alreadySent.has(row.username.toLowerCase()) ? 'ALREADY SENT in my thread with them' : null,
    ].filter(Boolean) as string[]

    return {
      row,
      profileId,
      score,
      offline,
      bioLength,
      caveats,
      matched: {causes, interests, work, diet, politics, religion, keywords, prose},
      eligible:
        areGenderCompatible(target, row) &&
        areAgeCompatible(target, row) &&
        areRelationshipStyleCompatible(target, row),
    }
  })

  const eligible = scored
    .filter((s) => s.eligible)
    .filter((s) => !EXCLUDE.includes(s.row.username.toLowerCase()))
  const ranked = [...eligible].sort((a, b) => b.score - a.score)
  const sendable = eligible.filter(
    (s) => s.bioLength >= MIN_READABLE_BIO && s.offline !== null && s.offline <= STALE_DAYS,
  )

  const out: string[] = [
    `# Candidates for ${target.name} (@${target.username})`,
    '',
    field(
      'Their side',
      `${target.age ?? '?'} ${target.gender ?? '?'}, ${target.city || 'no city'}`,
    ),
    field(
      'They want',
      `${list(target.pref_gender)}, ${ageRange(target.pref_age_min, target.pref_age_max)}, ${list(target.pref_relation_styles)}`,
    ),
    field('Pool', `${pool.length} open to matches, ${eligible.length} mutually eligible`),
    field(
      'Of those, sendable',
      `${sendable.length} (bio ≥ ${MIN_READABLE_BIO} chars and online within ${STALE_DAYS} days)`,
    ),
    field(
      'Already handed over',
      alreadySent.size ? [...alreadySent].join(', ') : 'none found in the thread',
    ),
    '',
    "_Mutual eligibility uses the platform's own gender/age/relation-style helpers, so this list and the" +
      ' site agree. Distance and the kids gap are shown, never filtered — they are things to say out loud,' +
      ' not reasons to hide someone._',
    '',
    `## Top ${Math.min(LIMIT, ranked.length)}`,
  ]

  for (const s of ranked.slice(0, LIMIT)) {
    const r = s.row
    out.push(
      '',
      `### ${r.name} (@${r.username}) — score ${s.score}`,
      '',
      field(
        'Who',
        `${r.age ?? '?'}, ${r.city || 'no city'}${r.country ? `, ${r.country}` : ''}` +
          `${s.row.distance_km !== null ? ` (${s.row.distance_km} km)` : ''}` +
          `${r.occupation_title || r.occupation ? ` — ${r.occupation_title || r.occupation}` : ''}` +
          `${r.company ? ` @ ${r.company}` : ''}`,
      ),
      field(
        'Reachable',
        `last online ${days(s.offline)}, bio ${s.bioLength} chars, ` +
          `${(r.photo_urls ?? []).length} photos, ${r.visibility}`,
      ),
      field(
        'Wants',
        `${list(r.pref_gender)}, ${ageRange(r.pref_age_min, r.pref_age_max)}, ${list(r.pref_relation_styles)}, ` +
          `kids ${r.wants_kids_strength}`,
      ),
      field('Shared causes', s.matched.causes),
      field('Shared interests', s.matched.interests),
      field('Shared diet / politics / religion', [
        ...s.matched.diet,
        ...s.matched.politics,
        ...s.matched.religion,
      ]),
      field('Distinctive shared words', s.matched.prose),
      field('Caveats to state', s.caveats.length ? s.caveats.join(' · ') : 'none'),
      field('Headline', r.headline?.replace(/\s+/g, ' ').slice(0, 240)),
      `- **Link**: https://www.compassmeet.com/${r.username}`,
    )
  }

  /**
   * The honest count, broken down the way a message has to break it down. When this comes back small
   * the number itself is the give — a short list with the size of the pool beside it is worth more
   * than a long list padded with people who left.
   */
  out.push(
    '',
    '## The pool, said out loud',
    '',
    field('Mutually eligible', eligible.length),
    field(
      '… with a bio worth reading',
      eligible.filter((s) => s.bioLength >= MIN_READABLE_BIO).length,
    ),
    field('… online in the past 30 days', eligible.filter((s) => (s.offline ?? 999) <= 30).length),
    field('… both', sendable.length),
  )
  for (const value of uniq((target.diet ?? []).map((d) => d.toLowerCase()))) {
    const sharing = eligible.filter((s) =>
      (s.row.diet ?? []).some((d) => d.toLowerCase() === value),
    )
    out.push(
      field(
        `… sharing diet "${value}"`,
        `${sharing.length} total, ${sharing.filter((s) => s.bioLength >= MIN_READABLE_BIO && (s.offline ?? 999) <= STALE_DAYS).length} sendable`,
      ),
    )
  }
  if (target.wants_kids_strength !== null) {
    const aligned = eligible.filter(
      (s) =>
        s.row.wants_kids_strength !== null &&
        Math.abs(s.row.wants_kids_strength - target.wants_kids_strength!) <= 1,
    )
    out.push(
      field(
        '… wanting kids about as much as they do',
        `${aligned.length} total, ${aligned.filter((s) => s.bioLength >= MIN_READABLE_BIO && (s.offline ?? 999) <= STALE_DAYS).length} sendable`,
      ),
    )
  }

  const nearby = eligible
    .filter((s) => s.row.distance_km !== null && s.row.distance_km <= NEARBY_KM)
    .sort((a, b) => (a.row.distance_km ?? 0) - (b.row.distance_km ?? 0))

  out.push('', `## Within ${NEARBY_KM} km`, '')
  if (!target.city_latitude) {
    out.push(
      '_No city set on their profile, so there is no local number and none should be quoted._',
    )
  } else if (!nearby.length) {
    out.push('_Nobody eligible. This is Contact #E territory: the honest empty-room message._')
  } else {
    for (const s of nearby) {
      out.push(
        `- ${s.row.name} (@${s.row.username}) — ${s.row.distance_km} km, ${s.row.age}, score ${s.score}, ` +
          `online ${days(s.offline)}, bio ${s.bioLength} chars` +
          (s.caveats.length ? ` — ${s.caveats.join(' · ')}` : ''),
      )
    }
  }

  const markdown = out.join('\n')
  console.log(markdown)
  if (OUT) {
    writeFileSync(OUT, markdown)
    debug(chalk.green(`Wrote ${OUT}`))
  }
})
