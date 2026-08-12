import {log} from 'shared/monitoring/log'
import {SupabaseDirectClient} from 'shared/supabase/init'

/**
 * Move `profiles.age` on for everyone whose birthday has just passed.
 *
 * `birth_date` is the stored truth and `age` is a cache of it that the database keeps in step on
 * write (see `20260812_add_birth_date_to_profiles.sql`). Writes are the only thing a trigger can
 * catch, though, and a birthday is not a write — so once a day something has to ask. Everything that
 * reads or filters on age goes through the cached column, which is why it is worth the daily pass
 * rather than computing the age per row per query.
 *
 * Idempotent and cheap: it only touches rows whose cached age is actually wrong, and the
 * `last_modification_time` trigger deliberately ignores an age-only update, so a birthday never
 * looks like a profile edit.
 */
export const refreshProfileAges = async (pg: SupabaseDirectClient) => {
  const updated = await pg.one<number>('select refresh_profile_ages() as updated', [], (r) =>
    Number(r.updated),
  )
  if (updated) log.info(`Aged ${updated} profile(s) whose birthday has passed`)
  return updated
}
