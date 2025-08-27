import { runScript } from './run-script'
import {
  renderSql,
  select,
  from,
  where,
} from '../shared/src/supabase/sql-builder'
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
  console.log(`\nSearching comments for ${nodeName}...`)
  const commentQuery = renderSql(
    select('id, user_id, on_user_id, content'),
    from('lover_comments'),
    where(`jsonb_path_exists(content, '$.**.type ? (@ == "${nodeName}")')`)
  )
  const comments = await pg.manyOrNone(commentQuery)

  console.log(`Found ${comments.length} comments:`)
  comments.forEach((comment) => {
    console.log('\nComment ID:', comment.id)
    console.log('From user:', comment.user_id)
    console.log('On user:', comment.on_user_id)
    console.log('Content:', JSON.stringify(comment.content))
  })

  console.log(`\nSearching private messages for ${nodeName}...`)
  const messageQuery = renderSql(
    select('id, user_id, channel_id, content'),
    from('private_user_messages'),
    where(`jsonb_path_exists(content, '$.**.type ? (@ == "${nodeName}")')`)
  )
  const messages = await pg.manyOrNone(messageQuery)

  console.log(`Found ${messages.length} private messages:`)
  messages.forEach((msg) => {
    console.log('\nMessage ID:', msg.id)
    console.log('From user:', msg.user_id)
    console.log('Channel:', msg.channel_id)
    console.log('Content:', JSON.stringify(msg.content))
  })

  console.log(`\nSearching profiles for ${nodeName}...`)
  const users = renderSql(
    select('user_id, bio'),
    from('lovers'),
    where(`jsonb_path_exists(bio::jsonb, '$.**.type ? (@ == "${nodeName}")')`)
  )

  const usersWithMentions = await pg.manyOrNone(users)
  console.log(`Found ${usersWithMentions.length} users:`)
  usersWithMentions.forEach((user) => {
    console.log('\nUser ID:', user.user_id)
    console.log('Bio:', JSON.stringify(user.bio))
  })
}
