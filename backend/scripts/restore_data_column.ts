import {runScript} from './run-script'
import {log} from 'shared/monitoring/log'
import {chunk} from 'lodash'
import {Client} from 'pg'

runScript(async ({pg}) => {
  // Connect to local Supabase emulator
  const localClient = new Client({
    host: '127.0.0.1',
    port: 54322,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  })
  await localClient.connect()
  log('Connected to local emulator')

  // Read all user data from the backup
  let {rows} = await localClient.query<{id: string; data: object}>(`SELECT id, data FROM users`)
  await localClient.end()

  // rows = rows.slice(0, 5)
  // log(rows)

  log(`Found ${rows.length} users in backup`)

  // Update remote in batches
  let count = 0
  for (const batch of chunk(rows, 100)) {
    await pg.none(
      `UPDATE users AS target
       SET data = v.data::jsonb
       FROM (VALUES ${batch.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}) 
         AS v(id, data)
       WHERE target.id = v.id`,
      batch.flatMap((r) => [r.id, JSON.stringify(r.data)]),
    )
    log(`Restored data for ${(count += batch.length)} / ${rows.length} users`)
  }

  log('Done restoring data column from backup')
})
