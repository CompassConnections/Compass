import { APIError, APIHandler } from './helpers/endpoint'
import { createSupabaseDirectClient } from 'shared/supabase/init'
import { tryCatch } from 'common/util/try-catch'
import { insert } from 'shared/supabase/utils'

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

  return { success: true }
}
