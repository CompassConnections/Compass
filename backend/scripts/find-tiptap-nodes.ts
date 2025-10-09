import { runScript } from './run-script'
import {
  renderSql,
  select,
  from,
  where,
} from 'shared/supabase/sql-builder'
import { SupabaseDirectClient } from 'shared/supabase/init'

runScript(async ({ pg }) => {
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
  console.debug(`\nSearching comments for ${nodeName}...`)
  const commentQuery = renderSql(
    select('id, user_id, on_user_id, content'),
    from('profile_comments'),
    where(`jsonb_path_exists(content, '$.**.type ? (@ == "${nodeName}")')`)
  )
  const comments = await pg.manyOrNone(commentQuery)

  console.debug(`Found ${comments.length} comments:`)
  comments.forEach((comment) => {
    console.debug('\nComment ID:', comment.id)
    console.debug('From user:', comment.user_id)
    console.debug('On user:', comment.on_user_id)
    console.debug('Content:', JSON.stringify(comment.content))
  })

  console.debug(`\nSearching private messages for ${nodeName}...`)
  const messageQuery = renderSql(
    select('id, user_id, channel_id, content'),
    from('private_user_messages'),
    where(`jsonb_path_exists(content, '$.**.type ? (@ == "${nodeName}")')`)
  )
  const messages = await pg.manyOrNone(messageQuery)

  console.debug(`Found ${messages.length} private messages:`)
  messages.forEach((msg) => {
    console.debug('\nMessage ID:', msg.id)
    console.debug('From user:', msg.user_id)
    console.debug('Channel:', msg.channel_id)
    console.debug('Content:', JSON.stringify(msg.content))
  })

  console.debug(`\nSearching profiles for ${nodeName}...`)
  const users = renderSql(
    select('user_id, bio'),
    from('profiles'),
    where(`jsonb_path_exists(bio::jsonb, '$.**.type ? (@ == "${nodeName}")')`)
  )

  const usersWithMentions = await pg.manyOrNone(users)
  console.debug(`Found ${usersWithMentions.length} users:`)
  usersWithMentions.forEach((user) => {
    console.debug('\nUser ID:', user.user_id)
    console.debug('Bio:', JSON.stringify(user.bio))
  })
}
