import {runScript} from './run-script'
import {log} from 'shared/monitoring/log'
import {bulkUpdate} from 'shared/supabase/utils'
import {chunk} from 'lodash'
import {removeUndefinedProps} from 'common/util/object'

runScript(async ({pg}) => {
  const users = await pg.manyOrNone(`
    select u.id, p.pinned_url
    from users u
           left join profiles p on p.user_id = u.id
  `)

  log('Found', users.length, 'users to migrate')

  const userUpdates: {id: string; avatar_url: string}[] = []

  for (const {id, pinned_url} of users) {
    if (pinned_url) {
      userUpdates.push(
        removeUndefinedProps({
          id,
          avatar_url: pinned_url,
        }),
      )
    }
  }

  log(`Migrating ${userUpdates.length} users`)

  let userCount = 0
  for (const batch of chunk(userUpdates, 100)) {
    await bulkUpdate(pg, 'users', ['id'], batch)
    log('Updated users', (userCount += batch.length))
  }

  log('Migration complete')
})
