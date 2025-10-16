import {APIError, APIHandler} from './helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {tryCatch} from 'common/util/try-catch'
import {insert} from 'shared/supabase/utils'
import {sendDiscordMessage} from "common/discord/core";
import {Row} from "common/supabase/utils";
import {DOMAIN} from "common/envs/constants";

// abusable: people can report the wrong person, that didn't write the comment
// but in practice we check it manually and nothing bad happens to them automatically
export const report: APIHandler<'report'> = async (body, auth) => {
  const {
    contentOwnerId,
    contentType,
    contentId,
    description,
    parentId,
    parentType,
  } = body

  const pg = createSupabaseDirectClient()

  const result = await tryCatch(
    insert(pg, 'reports', {
      user_id: auth.uid,
      content_owner_id: contentOwnerId,
      content_type: contentType,
      content_id: contentId,
      description,
      parent_id: parentId,
      parent_type: parentType,
    })
  )

  if (result.error) {
    throw new APIError(500, 'Failed to create report: ' + result.error.message)
  }

  const continuation = async () => {
    try {
      const {data: reporter, error} = await tryCatch(
        pg.oneOrNone<Row<'users'>>('select * from users where id = $1', [auth.uid])
      )
      if (error) {
        console.error('Failed to get user for report', error)
        return
      }
      const {data: reported, error: userError} = await tryCatch(
        pg.oneOrNone<Row<'users'>>('select * from users where id = $1', [contentOwnerId])
      )
      if (userError) {
        console.error('Failed to get reported user for report', userError)
        return
      }
      let message: string = `
      🚨 **New Report** 🚨
      **Type:** ${contentType}
      **Content ID:** ${contentId}
      **Reporter:** ${reporter?.name} ([@${reporter?.username}](https://www.${DOMAIN}/${reporter?.username}))
      **Reported:** ${reported?.name} ([@${reported?.username}](https://www.${DOMAIN}/${reported?.username}))
      `
      await sendDiscordMessage(message, 'reports')
    } catch (e) {
      console.error('Failed to send discord reports', e)
    }
  }

  return {
    success: true,
    result: {},
    continue: continuation,
  }
}
