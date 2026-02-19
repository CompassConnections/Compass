import {APIError, APIHandler} from './helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insert} from 'shared/supabase/utils'
import {tryCatch} from 'common/util/try-catch'
import {sendDiscordMessage} from 'common/discord/core'
import {jsonToMarkdown} from 'common/md'

// Stores a contact message into the `contact` table
// Web sends TipTap JSON in `content`; we store it as string in `description`.
// If optional content metadata is provided, we include it; otherwise we fall back to user-centric defaults.
export const contact: APIHandler<'contact'> = async ({content, userId}, _auth) => {
  const pg = createSupabaseDirectClient()

  const {error} = await tryCatch(
    insert(pg, 'contact', {
      user_id: userId,
      content: JSON.stringify(content),
    }),
  )

  if (error) throw new APIError(500, 'Failed to submit contact message')

  const continuation = async () => {
    try {
      let user = null
      if (userId) {
        user = await pg.oneOrNone(` select name from users where id = $1 `, [userId])
      }
      const md = jsonToMarkdown(content)
      const tile = user ? `New message from ${user.name}` : 'New message'
      const message: string = `**${tile}**\n${md}`
      await sendDiscordMessage(message, 'contact')
    } catch (e) {
      console.error('Failed to send discord contact', e)
    }
  }

  return {
    success: true,
    result: {},
    continue: continuation,
  }
}
