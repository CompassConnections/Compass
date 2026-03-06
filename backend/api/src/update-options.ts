import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {OPTION_TABLES} from 'common/profiles/constants'
import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'
import {log} from 'shared/utils'

function validateTable(table: 'interests' | 'causes' | 'work') {
  if (!OPTION_TABLES.includes(table)) throw APIErrors.badRequest('Invalid table')
}

export async function setProfileOptions(
  tx: SupabaseDirectClient,
  profileId: number,
  userId: string,
  table: 'interests' | 'causes' | 'work',
  values: string[] | undefined | null,
) {
  validateTable(table)

  values = values ?? []
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

  const currentOptionsResult = await tx.manyOrNone<{id: string}>(
    `SELECT option_id as id FROM profile_${table} WHERE profile_id = $1`,
    [profileId],
  )
  const currentOptions = currentOptionsResult.map((row) => row.id)

  const hasSameIds = currentOptions.sort().join(',') === ids.sort().join(',')
  if (hasSameIds && !names.length) {
    log(`Skipping /update-${table} because they are already the same`)
    return
  }

  // Add new options
  for (const name of names) {
    const row = await tx.one<{id: number}>(
      `INSERT INTO ${table} (name, creator_id)
     VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE
         SET name = ${table}.name
     RETURNING id`,
      [name, userId],
    )
    ids.push(row.id)
  }

  // Delete old options for this profile
  await tx.none(`DELETE FROM profile_${table} WHERE profile_id = $1`, [profileId])

  // Insert new option_ids
  if (ids.length > 0) {
    const valuesSql = ids.map((_, i) => `($1, $${i + 2})`).join(', ')
    await tx.none(`INSERT INTO profile_${table} (profile_id, option_id) VALUES ${valuesSql}`, [
      profileId,
      ...ids,
    ])
  }
}

export const updateOptions: APIHandler<'update-options'> = async ({table, values}, auth) => {
  validateTable(table)
  if (!values || !Array.isArray(values)) {
    throw APIErrors.badRequest('No ids provided')
  }

  const pg = createSupabaseDirectClient()

  const profileIdResult = await pg.oneOrNone<{id: number}>(
    'SELECT id FROM profiles WHERE user_id = $1',
    [auth.uid],
  )
  if (!profileIdResult) throw APIErrors.notFound('Profile not found')
  const profileId = profileIdResult.id

  const result = await tryCatch(
    pg.tx(async (t) => {
      await setProfileOptions(t, profileId, auth.uid, table, values)
      return true
    }),
  )

  if (result.error) {
    log('Error updating profile options', result.error)
    throw APIErrors.internalServerError('Error updating profile options')
  }

  return {updatedIds: true}
}
