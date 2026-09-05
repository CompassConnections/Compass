import {CountryCount} from 'common/stats'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

/**
 * Distinct values of `profiles.country`, most populous first. Only countries that at least one member
 * lives in are returned, and each with the exact spelling stored on the profiles (see
 * `normalizeCountry`), so selecting one in the filter is guaranteed to match rows.
 */
export const getCountries: APIHandler<'get-countries'> = async () => {
  const pg = createSupabaseDirectClient()
  const countries = await pg.manyOrNone<CountryCount>(
    `select country, count(*)::int as count
       from profiles
       where country is not null and country <> ''
       group by country
       order by count desc, country asc`,
  )
  return {countries}
}
