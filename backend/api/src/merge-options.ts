import {APIHandler} from 'api/helpers/endpoint'
import {validateTable} from 'common/profiles/options'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {mergeOptions} from 'shared/supabase/options'

/**
 * Folds one option into another from `/admin/options`.
 *
 * Admin-only rather than mod-only, deliberately. Moderation is about taking down something one member
 * published; this rewrites what an arbitrary number of members said about themselves, and it cannot
 * be undone from the UI — the losing row is gone and only the alias remains.
 *
 * Existed as raw SQL and a one-off script before this. That is a bad place for a routine operation to
 * live: the merge is only correct if the holders are moved, the alias is recorded, and the row is
 * deleted, in that order and in one transaction — and a hand-written version that forgets the alias
 * produces a merge that the next person to type the dead name silently undoes.
 */
export const mergeOptionsEndpoint: APIHandler<'merge-options'> = async (props, auth) => {
  await throwErrorIfNotAdmin(auth.uid)
  const {table, fromId, intoId} = props
  validateTable(table)

  const pg = createSupabaseDirectClient()
  return await pg.tx(async (t) => await mergeOptions(t, table, fromId, intoId))
}
