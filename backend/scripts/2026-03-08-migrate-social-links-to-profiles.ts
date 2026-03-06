import {runScript} from './run-script'
import {log} from 'shared/monitoring/log'
import {bulkUpdate} from 'shared/supabase/utils'
import {chunk} from 'lodash'
import {removeUndefinedProps} from 'common/util/object'

runScript(async ({pg}) => {
  const users = await pg.manyOrNone(`
    select u.data, u.id, p.id as pid
    from users u
           left join profiles p on p.user_id = u.id
  `)

  log('Found', users.length, 'users to migrate')

  const userUpdates: {id: string; avatar_url: string; is_banned_from_posting: boolean}[] = []
  const profileUpdates: {id: string; links: Record<string, string>}[] = []

  for (const {id, pid, data} of users) {
    const {link: links, avatarUrl: avatar_url, isBannedFromPosting: is_banned_from_posting} = data

    if (avatar_url || is_banned_from_posting) {
      userUpdates.push(
        removeUndefinedProps({
          id,
          avatar_url: avatar_url ?? null,
          is_banned_from_posting,
        }),
      )
    }

    if (links && pid) {
      profileUpdates.push({id: pid, links})
    } else if (links && !pid) {
      log('Warning: user has links but no profile', id)
    }
  }

  log(`Migrating ${userUpdates.length} users, ${profileUpdates.length} profiles`)

  let userCount = 0
  for (const batch of chunk(userUpdates, 100)) {
    await bulkUpdate(pg, 'users', ['id'], batch)
    log('Updated users', (userCount += batch.length))
  }

  let profileCount = 0
  for (const batch of chunk(profileUpdates, 100)) {
    // If not, write the profiles update directly:
    await pg.none(`
      UPDATE profiles SET links = v.links::jsonb
      FROM (VALUES ${batch.map((r) => `(${r.id}, '${JSON.stringify(r.links)}')`).join(',')}) 
        AS v(id, links)
      WHERE profiles.id = v.id::bigint
    `)
    log('Updated profiles', (profileCount += batch.length))
  }

  // Strip migrated fields from the JSON blob
  await pg.none(`
    update users
    set data = data - '{link,avatarUrl,isBannedFromPosting}'::text[]
  `)

  log('Migration complete')

  process.exit(0)
})
