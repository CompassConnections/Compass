import { runScript } from './run-script'
import {
  renderSql,
  select,
  from,
  where,
} from 'shared/supabase/sql-builder'
import { type JSONContent } from '@tiptap/core'

const removeNodesOfType = (
  content: JSONContent,
  typeToRemove: string
): JSONContent | null => {
  if (content.type === typeToRemove) {
    return null
  }

  if (content.content) {
    const newContent = content.content
      .map((node) => removeNodesOfType(node, typeToRemove))
      .filter((node) => node != null)

    return { ...content, content: newContent }
  }

  // No content to process, return node as is
  return content
}

runScript(async ({ pg }) => {
  const nodeType = 'linkPreview'

  console.debug('\nSearching comments for linkPreviews...')
  const commentQuery = renderSql(
    select('id, content'),
    from('profile_comments'),
    where(`jsonb_path_exists(content, '$.**.type ? (@ == "${nodeType}")')`)
  )
  const comments = await pg.manyOrNone(commentQuery)

  console.debug(`Found ${comments.length} comments with linkPreviews`)

  for (const comment of comments) {
    const newContent = removeNodesOfType(comment.content, nodeType)
    console.debug('before', comment.content)
    console.debug('after', newContent)

    await pg.none('update profile_comments set content = $1 where id = $2', [
      newContent,
      comment.id,
    ])
    console.debug('Updated comment:', comment.id)
  }

  console.debug('\nSearching private messages for linkPreviews...')
  const messageQuery = renderSql(
    select('id, content'),
    from('private_user_messages'),
    where(`jsonb_path_exists(content, '$.**.type ? (@ == "${nodeType}")')`)
  )
  const messages = await pg.manyOrNone(messageQuery)

  console.debug(`Found ${messages.length} messages with linkPreviews`)

  for (const msg of messages) {
    const newContent = removeNodesOfType(msg.content, nodeType)
    console.debug('before', JSON.stringify(msg.content, null, 2))
    console.debug('after', JSON.stringify(newContent, null, 2))

    await pg.none(
      'update private_user_messages set content = $1 where id = $2',
      [newContent, msg.id]
    )
    console.debug('Updated message:', msg.id)
  }
})
