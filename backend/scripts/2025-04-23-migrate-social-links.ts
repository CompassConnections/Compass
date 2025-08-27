import { removeUndefinedProps } from 'common/util/object'
import { runScript } from './run-script'
import { log } from 'shared/monitoring/log'
import { createSupabaseDirectClient } from 'shared/supabase/init'
import { bulkUpdateData } from 'shared/supabase/utils'
import { chunk } from 'lodash'

runScript(async ({ pg }) => {
  const directClient = createSupabaseDirectClient()

  // Get all users and their corresponding lovers
  const users = await directClient.manyOrNone(`
    select u.id, u.data, l.twitter
    from users u
    left join lovers l on l.user_id = u.id
  `)

  log('Found', users.length, 'users to migrate')

  const updates = [] as { id: string; link: {} }[]

  for (const { id, data, twitter } of users) {
    const add = removeUndefinedProps({
      discord: data.discordHandle,
      manifold: data.manifoldHandle,
      x: (twitter || data.twitterHandle)
        ?.trim()
        .replace(/^(https?:\/\/)?(www\.)?(twitter|x)(\.com\/)/, '')
        .replace(/^@/, '')
        .replace(/\/$/, ''),
      site: data.website?.trim().replace(/^(https?:\/\/)/, ''),
    })

    if (Object.keys(add).length) {
      updates.push({ id, link: { ...add, ...(data.link || {}) } })
    }
  }

  // console.log('updates', updates.slice(0, 10))
  // return

  let count = 0
  for (const u of chunk(updates, 100)) {
    log('updating users ', (count += u.length))
    await bulkUpdateData(pg, 'users', u)
  }

  log('initializing the other users')
  await pg.none(
    `update users
    set data = jsonb_set(
      data,
      '{link}',
      COALESCE((data -> 'link'), '{}'::jsonb),
      true
    )
    where data -> 'link' is null`
  )
})
