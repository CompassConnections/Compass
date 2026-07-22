import {getMessagesCount} from 'api/get-messages-count'
import {CountryCount} from 'common/stats'
import {HOUR_MS} from 'common/util/time'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

// Server-side cache for stats data
let cachedData: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION_MS = HOUR_MS

// How many countries the breakdown returns. The about page shows a short ranked list, so a long tail
// would be payload nobody renders; `countryCount` still reports the full spread.
const TOP_COUNTRIES = 8

export const stats: APIHandler<'stats'> = async (_, _auth) => {
  const now = Date.now()

  // Return cached data if still valid
  if (cachedData && now - cacheTimestamp < CACHE_DURATION_MS) {
    console.log('cached stats')
    console.log(cachedData)
    return cachedData
  }

  const pg = createSupabaseDirectClient()

  const [
    userCount,
    profileCount,
    eventsCount,
    messagesCount,
    conversationCount,
    genderStats,
    countryStats,
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
  ])

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
    countries: countries.slice(0, TOP_COUNTRIES),
    countryCount: countries.length,
  }

  // Update cache
  cachedData = result
  cacheTimestamp = now

  return result
}
