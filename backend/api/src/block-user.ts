import {createSupabaseDirectClient} from 'shared/supabase/init'
import {updatePrivateUser} from 'shared/supabase/users'
import {FieldVal} from 'shared/supabase/utils'

import {APIErrors, APIHandler} from './helpers/endpoint'

export const blockUser: APIHandler<'user/by-id/:id/block'> = async ({id}, auth) => {
  if (auth.uid === id) throw APIErrors.badRequest('You cannot block yourself')

  const pg = createSupabaseDirectClient()
  await pg.tx(async (tx) => {
    await updatePrivateUser(tx, auth.uid, {
      blockedUserIds: FieldVal.arrayConcat(id),
    })
    await updatePrivateUser(tx, id, {
      blockedByUserIds: FieldVal.arrayConcat(auth.uid),
    })
    // A block ends any approval between the two, in both directions, pending requests included
    // (docs/profile-visibility.md). Deleted rather than suspended: unblocking later should not
    // quietly hand back access to the fields kept for approved people.
    await tx.none(
      `delete from profile_access
       where (owner_id = $1 and viewer_id = $2) or (owner_id = $2 and viewer_id = $1)`,
      [auth.uid, id],
    )
  })
}

export const unblockUser: APIHandler<'user/by-id/:id/unblock'> = async ({id}, auth) => {
  const pg = createSupabaseDirectClient()
  await pg.tx(async (tx) => {
    await updatePrivateUser(tx, auth.uid, {
      blockedUserIds: FieldVal.arrayRemove(id),
    })
    await updatePrivateUser(tx, id, {
      blockedByUserIds: FieldVal.arrayRemove(auth.uid),
    })
  })
}
