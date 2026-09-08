import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {OptionTableKey} from 'common/profiles/constants'
import {normalizeOptionName, optionNameProblem} from 'common/profiles/option-name'
import {validateTable} from 'common/profiles/options'
import {tryCatch} from 'common/util/try-catch'
import {uniqBy} from 'lodash'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'
import {createOption, resolveOptionName} from 'shared/supabase/options'
import {log} from 'shared/utils'

export async function setProfileOptions(
  tx: SupabaseDirectClient,
  profileId: number,
  userId: string,
  table: OptionTableKey,
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

  // Names arriving here are raw strings a member typed, or that the profile extractor read off a web
  // page. Both used to be inserted verbatim behind `ON CONFLICT (name)`, which deduped on byte-exact
  // equality only — so " gaming" and "Gaming" became separate permanent options. Normalising and
  // resolving here rather than in the picker is deliberate: the picker is not the only writer, and
  // the extractor never passed through it at all.
  //
  // `uniqBy` on the normalised form matters because two entries in the same submission can collapse
  // onto one option ("AI" and "ai"), and inserting both would violate `(profile_id, option_id)`.
  const canonicalNames = uniqBy(
    names.map(normalizeOptionName).filter((name) => !optionNameProblem(name)),
    (name) => name.toLowerCase(),
  )
  const skipped = names.length - canonicalNames.length
  if (skipped > 0) log(`Dropped ${skipped} unusable ${table} name(s)`, {names})

  for (const name of canonicalNames) {
    // Alias resolution is what makes a merge permanent: after "Gaming" is folded into "Video games",
    // typing "Gaming" again lands on the surviving option instead of recreating the one that was
    // just merged away.
    const existing = await resolveOptionName(tx, table, name)
    const option = existing?.option ?? (await createOption(tx, table, name, userId))
    ids.push(Number(option.id))
  }

  // Delete old options for this profile
  await tx.none(`DELETE FROM profile_${table} WHERE profile_id = $1`, [profileId])

  // Insert new option_ids
  const uniqueIds = [...new Set(ids)]
  if (uniqueIds.length > 0) {
    const valuesSql = uniqueIds.map((_, i) => `($1, $${i + 2})`).join(', ')
    await tx.none(`INSERT INTO profile_${table} (profile_id, option_id) VALUES ${valuesSql}`, [
      profileId,
      ...uniqueIds,
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
