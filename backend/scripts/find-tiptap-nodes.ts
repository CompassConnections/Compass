import {runScript} from './run-script'
import {from, renderSql, select, where} from 'shared/supabase/sql-builder'
import {SupabaseDirectClient} from 'shared/supabase/init'
import {debug} from 'common/logger'

runScript(async ({pg}) => {
  const tests = [
    'mention',
    'contract-mention',
    'tiptapTweet',
    'spoiler',
    'iframe',
    'linkPreview',
    'gridCardsComponent',
  ]

  for (const test of tests) {
    await getNodes(pg, test)
  }
})

const getNodes = async (pg: SupabaseDirectClient, nodeName: string) => {
  debug(`\nSearching comments for ${nodeName}...`)
  const commentQuery = renderSql(
    select('id, user_id, on_user_id, content'),
    from('profile_comments'),
    where(`jsonb_path_exists(content, '$.**.type ? (@ == "${nodeName}")')`),
  )
  const comments = await pg.manyOrNone(commentQuery)

  debug(`Found ${comments.length} comments:`)
  comments.forEach((comment) => {
    debug('\nComment ID:', comment.id)
    debug('From user:', comment.user_id)
    debug('On user:', comment.on_user_id)
    debug('Content:', JSON.stringify(comment.content))
  })

  debug(`\nSearching private messages for ${nodeName}...`)
  const messageQuery = renderSql(
    select('id, user_id, channel_id, content'),
    from('private_user_messages'),
    where(`jsonb_path_exists(content, '$.**.type ? (@ == "${nodeName}")')`),
  )
  const messages = await pg.manyOrNone(messageQuery)

  debug(`Found ${messages.length} private messages:`)
  messages.forEach((msg) => {
    debug('\nMessage ID:', msg.id)
    debug('From user:', msg.user_id)
    debug('Channel:', msg.channel_id)
    debug('Content:', JSON.stringify(msg.content))
  })

  debug(`\nSearching profiles for ${nodeName}...`)
  const users = renderSql(
    select('user_id, bio'),
    from('profiles'),
    where(`jsonb_path_exists(bio::jsonb, '$.**.type ? (@ == "${nodeName}")')`),
  )

  const usersWithMentions = await pg.manyOrNone(users)
  debug(`Found ${usersWithMentions.length} users:`)
  usersWithMentions.forEach((user) => {
    debug('\nUser ID:', user.user_id)
    debug('Bio:', JSON.stringify(user.bio))
  })
}
