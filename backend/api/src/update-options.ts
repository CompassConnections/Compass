import {APIError, APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {log} from 'shared/utils'
import {tryCatch} from 'common/util/try-catch'
import {OPTION_TABLES} from 'common/profiles/constants'

export const updateOptions: APIHandler<'update-options'> = async ({table, values}, auth) => {
  if (!OPTION_TABLES.includes(table)) throw new APIError(400, 'Invalid table')
  if (!values || !Array.isArray(values)) {
    throw new APIError(400, 'No ids provided')
  }

  const idsWithNumbers = values.map((id) => {
    const numberId = Number(id)
    return isNaN(numberId) ? {isNumber: false, v: id} : {isNumber: true, v: numberId}
  })
  const names: string[] = idsWithNumbers
    .filter((item) => !item.isNumber)
    .map((item) => item.v) as string[]
  const ids: number[] = idsWithNumbers
    .filter((item) => item.isNumber)
    .map((item) => item.v) as number[]

  log('Updating profile options', {table, ids, names})

  const pg = createSupabaseDirectClient()

  const profileIdResult = await pg.oneOrNone<{id: number}>(
    'SELECT id FROM profiles WHERE user_id = $1',
    [auth.uid],
  )
  if (!profileIdResult) throw new APIError(404, 'Profile not found')
  const profileId = profileIdResult.id

  const result = await tryCatch(
    pg.tx(async (t) => {
      const currentOptionsResult = await t.manyOrNone<{id: string}>(
        `SELECT option_id as id
       FROM profile_${table}
       WHERE profile_id = $1`,
        [profileId],
      )
      const currentOptions = currentOptionsResult.map((row) => row.id)
      if (currentOptions.sort().join(',') === ids.sort().join(',') && !names?.length) {
        log(`Skipping /update-${table} because they are already the same`)
        return undefined
      }

      // Add new options
      for (const name of names || []) {
        const row = await t.one<{id: number}>(
          `INSERT INTO ${table} (name, creator_id)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE
             SET name = ${table}.name
         RETURNING id`,
          [name, auth.uid],
        )
        ids.push(row.id)
      }

      // Delete old options for this profile
      await t.none(`DELETE FROM profile_${table} WHERE profile_id = $1`, [profileId])

      // Insert new option_ids
      if (ids.length > 0) {
        const values = ids.map((id, i) => `($1, $${i + 2})`).join(', ')
        await t.none(`INSERT INTO profile_${table} (profile_id, option_id) VALUES ${values}`, [
          profileId,
          ...ids,
        ])
      }

      return ids
    }),
  )

  if (result.error) {
    log('Error updating profile options', result.error)
    throw new APIError(500, 'Error updating profile options')
  }

  return {updatedIds: result.data}
}
