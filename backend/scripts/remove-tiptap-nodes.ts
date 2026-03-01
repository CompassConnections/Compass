import {runScript} from './run-script'
import {from, renderSql, select, where} from 'shared/supabase/sql-builder'
import {type JSONContent} from '@tiptap/core'
import {debug} from 'common/logger'

const removeNodesOfType = (content: JSONContent, typeToRemove: string): JSONContent | null => {
  if (content.type === typeToRemove) {
    return null
  }

  if (content.content) {
    const newContent = content.content
      .map((node) => removeNodesOfType(node, typeToRemove))
      .filter((node) => node != null)

    return {...content, content: newContent}
  }

  // No content to process, return node as is
  return content
}

runScript(async ({pg}) => {
  const nodeType = 'linkPreview'

  debug('\nSearching comments for linkPreviews...')
  const commentQuery = renderSql(
    select('id, content'),
    from('profile_comments'),
    where(`jsonb_path_exists(content, '$.**.type ? (@ == "${nodeType}")')`),
  )
  const comments = await pg.manyOrNone(commentQuery)

  debug(`Found ${comments.length} comments with linkPreviews`)

  for (const comment of comments) {
    const newContent = removeNodesOfType(comment.content, nodeType)
    debug('before', comment.content)
    debug('after', newContent)

    await pg.none('update profile_comments set content = $1 where id = $2', [
      newContent,
      comment.id,
    ])
    debug('Updated comment:', comment.id)
  }

  debug('\nSearching private messages for linkPreviews...')
  const messageQuery = renderSql(
    select('id, content'),
    from('private_user_messages'),
    where(`jsonb_path_exists(content, '$.**.type ? (@ == "${nodeType}")')`),
  )
  const messages = await pg.manyOrNone(messageQuery)

  debug(`Found ${messages.length} messages with linkPreviews`)

  for (const msg of messages) {
    const newContent = removeNodesOfType(msg.content, nodeType)
    debug('before', JSON.stringify(msg.content, null, 2))
    debug('after', JSON.stringify(newContent, null, 2))

    await pg.none('update private_user_messages set content = $1 where id = $2', [
      newContent,
      msg.id,
    ])
    debug('Updated message:', msg.id)
  }
})
