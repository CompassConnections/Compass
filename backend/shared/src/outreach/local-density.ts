import {LocalDensity, OUTREACH_RADIUS_KM} from 'common/outreach/outreach'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'

/** How many nearby members to name. Three is what the "link three profiles" ask asks for. */
const NEARBY_SAMPLE_SIZE = 3

type DensityRow = {
  city: string | null
  count: string
  nearby: {name: string; username: string}[] | null
}

/**
 * The honest local number for one member, plus a few of the people it is made of.
 *
 * This is the figure Contact #3a and Contact #E are both built on, and the reason it is one helper
 * rather than a count in each caller: the number a member is quoted must be the same number the
 * dashboard shows next to their name, or the founder ends up contradicting his own email.
 *
 * Returns null when the member has no city coordinates. That is not zero — zero is a claim about the
 * world, and "we don't know where you are" is a claim about the profile — and quoting a nearby count
 * of zero to someone who simply never set a city is the kind of wrong number that costs the candour
 * the whole approach runs on.
 */
export const getLocalDensity = async (
  userId: string,
  opts?: {radiusKm?: number; pg?: SupabaseDirectClient},
): Promise<LocalDensity | null> => {
  const pg = opts?.pg ?? createSupabaseDirectClient()
  const radiusKm = opts?.radiusKm ?? OUTREACH_RADIUS_KM

  const row = await pg.oneOrNone<DensityRow>(
    `
        with me as (select city, city_latitude as lat, city_longitude as lon
                    from profiles
                    where user_id = $(userId))
           , near as (select u.name, u.username
                      from profiles p
                               join users u on u.id = p.user_id
                               cross join me
                      where p.user_id != $(userId)
                        and p.looking_for_matches
                        and not coalesce(u.is_banned_from_posting, false)
                        and not coalesce(p.disabled, false)
                        and p.city_latitude is not null
                        and p.city_longitude is not null
                        and calculate_earth_distance_km(me.lat, me.lon, p.city_latitude,
                                                        p.city_longitude) < $(radiusKm)
                      -- Nearest first, so the handful we name are the ones actually worth writing to.
                      order by calculate_earth_distance_km(me.lat, me.lon, p.city_latitude,
                                                           p.city_longitude))
        select me.city,
               (select count(*) from near)                                     as count,
               (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
                from (select * from near limit $(sampleSize)) s)               as nearby
        from me
        where me.lat is not null
          and me.lon is not null
    `,
    {userId, radiusKm, sampleSize: NEARBY_SAMPLE_SIZE},
  )

  if (!row) return null

  return {count: Number(row.count), city: row.city, nearby: row.nearby ?? []}
}
