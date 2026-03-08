import {getMessagesCount} from 'api/get-messages-count'
import {HOUR_MS} from 'common/util/time'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

// Server-side cache for stats data
let cachedData: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION_MS = HOUR_MS

export const stats: APIHandler<'stats'> = async (_, _auth) => {
  const now = Date.now()

  // Return cached data if still valid
  if (cachedData && now - cacheTimestamp < CACHE_DURATION_MS) {
    console.log('cached stats')
    console.log(cachedData)
    return cachedData
  }

  const pg = createSupabaseDirectClient()

  const [userCount, profileCount, eventsCount, messagesCount, genderStats] = await Promise.all([
    pg.one(`SELECT COUNT(*)::int as count FROM users`),
    pg.one(`SELECT COUNT(*)::int as count FROM profiles`),
    pg.one(`SELECT COUNT(*)::int as count FROM events WHERE event_start_time > now()`),
    getMessagesCount(),
    pg.manyOrNone(
      `SELECT gender, COUNT(*)::int as count FROM profiles WHERE gender IS NOT NULL GROUP BY gender`,
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

  const result = {
    users: userCount.count,
    profiles: profileCount.count,
    upcomingEvents: eventsCount.count,
    messages: messagesCount.count,
    genderRatio: genderPercentage,
    genderCounts: genderRatio,
  }

  // Update cache
  cachedData = result
  cacheTimestamp = now

  return result
}
