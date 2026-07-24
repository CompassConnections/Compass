import {getMessagesCount} from 'api/get-messages-count'
import {CountryCount, DEMOGRAPHIC_FIELDS, DemographicField, Distribution} from 'common/stats'
import {HOUR_MS} from 'common/util/time'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

// Server-side cache for stats data
let cachedData: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION_MS = HOUR_MS

// Below this many respondents a field is not published at all. A distribution drawn from a handful of
// people is noise, and naming the one member in a rare category is the kind of soft de-anonymisation a
// public transparency page should not do. Mirrors the spirit of MIN_COUNTRIES on the frontend.
const MIN_RESPONSES = 4
// The long tail past this is dropped — these are small fixed enums, so the head carries the shape.
const TOP_PER_FIELD = 7

// One breakdown for one profile column, labelled and ordered on the frontend. `$1~` is pg-promise name
// escaping, so the column name is injected as a quoted identifier, never string-concatenated; the values
// only ever come from DEMOGRAPHIC_FIELDS, never from the request.
async function fieldDistribution(
  pg: SupabaseDirectClient,
  field: DemographicField,
  multi: boolean,
): Promise<Distribution | null> {
  const rows = multi
    ? await pg.manyOrNone(
        `with answered as (
           select id, unnest($1~) as v
           from profiles
           where $1~ is not null and array_length($1~, 1) > 0
         )
         select v as value,
                count(*)::int as count,
                (select count(distinct id)::int from answered) as base
         from answered
         where v is not null and v <> ''
         group by v
         order by count desc, v asc`,
        [field],
      )
    : await pg.manyOrNone(
        `select $1~ as value,
                count(*)::int as count,
                (sum(count(*)) over ())::int as base
         from profiles
         where $1~ is not null and $1~ <> ''
         group by $1~
         order by count desc, value asc`,
        [field],
      )

  const base = rows[0]?.base ?? 0
  if (base < MIN_RESPONSES) return null

  return {
    base,
    multi,
    items: rows.slice(0, TOP_PER_FIELD).map((r: any) => ({value: r.value, count: r.count})),
  }
}

// Age is the one numeric field, so it is bucketed into ordinal ranges rather than grouped raw, and kept
// in age order instead of by size — a histogram, not a ranking.
async function ageDistribution(pg: SupabaseDirectClient): Promise<Distribution | null> {
  const rows = await pg.manyOrNone(
    `select bucket as value,
            count(*)::int as count,
            (sum(count(*)) over ())::int as base
     from (
       select case
                when age < 25 then '18–24'
                when age < 35 then '25–34'
                when age < 45 then '35–44'
                else '45+'
              end as bucket,
              case
                when age < 25 then 1
                when age < 35 then 2
                when age < 45 then 3
                else 4
              end as ord
       from profiles
       where age is not null and age >= 18
     ) t
     group by bucket, ord
     order by ord`,
  )

  const base = rows[0]?.base ?? 0
  if (base < MIN_RESPONSES) return null

  return {base, multi: false, items: rows.map((r: any) => ({value: r.value, count: r.count}))}
}

export const stats: APIHandler<'stats'> = async (_, _auth) => {
  const now = Date.now()

  // Return cached data if still valid
  if (cachedData && now - cacheTimestamp < CACHE_DURATION_MS) {
    return cachedData
  }

  const pg = createSupabaseDirectClient()

  // Each profile-field breakdown is its own query; run them alongside the headline counts. All of it
  // sits behind the hour-long cache, so this whole block runs at most once an hour regardless of traffic.
  const demographicFields = Object.entries(DEMOGRAPHIC_FIELDS) as [
    DemographicField,
    {multi: boolean},
  ][]

  const [
    userCount,
    profileCount,
    eventsCount,
    messagesCount,
    conversationCount,
    genderStats,
    countryStats,
    demographicResults,
  ] = await Promise.all([
    pg.one(`SELECT COUNT(*)::int as count FROM users`),
    pg.one(`SELECT COUNT(*)::int as count FROM profiles`),
    pg.one(
      `SELECT COUNT(*)::int as count FROM events WHERE event_start_time > now() and status = 'active'`,
    ),
    getMessagesCount(),
    // Counted off the messages table rather than the channels table: a channel that was created but
    // never written in isn't a conversation anyone had.
    pg.one(`select count(distinct channel_id)::int as count from private_user_messages`),
    pg.manyOrNone(
      `SELECT gender, COUNT(*)::int as count FROM profiles WHERE gender IS NOT NULL GROUP BY gender`,
    ),
    // Grouped in full rather than limited in SQL: the about page shows a top-N bar list but also
    // needs the total number of distinct countries, and both come off the same small result set.
    pg.manyOrNone(
      `select country, count(*)::int as count
         from profiles
         where country is not null and country <> ''
         group by country
         order by count desc, country asc`,
    ),
    Promise.all(
      demographicFields.map(([field, {multi}]) =>
        field === 'age' ? ageDistribution(pg) : fieldDistribution(pg, field, multi),
      ),
    ),
  ])

  // Drop the fields that came back null (too few respondents) and key the rest by field name.
  const demographics: Partial<Record<DemographicField, Distribution>> = {}
  demographicFields.forEach(([field], i) => {
    const dist = demographicResults[i]
    if (dist) demographics[field] = dist
  })

  // Calculate gender ratios
  const genderRatio: Record<string, number> = {}
  let totalWithGender = 0

  genderStats?.forEach((stat: any) => {
    if (!['male', 'female'].includes(stat.gender)) return
    genderRatio[stat.gender] = stat.count
    totalWithGender += stat.count
  })

  // Convert to percentages
  const genderPercentage: Record<string, number> = {}
  Object.entries(genderRatio).forEach(([gender, count]) => {
    genderPercentage[gender] = Math.round((count / totalWithGender) * 100)
  })

  const countries: CountryCount[] = (countryStats ?? []).map((row: any) => ({
    country: row.country,
    count: row.count,
  }))

  const result = {
    users: userCount.count,
    profiles: profileCount.count,
    upcomingEvents: eventsCount.count,
    messages: messagesCount.count,
    conversations: conversationCount.count,
    genderRatio: genderPercentage,
    genderCounts: genderRatio,
    // The full ranked list, not a top-N: the /stats world map colours every country with members, and
    // the ranked list under it slices its own head. Still a small payload (one row per country present).
    countries,
    countryCount: countries.length,
    demographics,
  }

  // Update cache
  cachedData = result
  cacheTimestamp = now

  return result
}
