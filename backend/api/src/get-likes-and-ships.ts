import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Likes given, likes received and ships involving one member.
 *
 * No endpoint exposes this any more. The `get-likes-and-ships` handler that used to wrap it accepted
 * any `userId` from any signed-in member, which handed out who likes whom for the whole site; the
 * web stopped calling it long before. The query lives on for `get-user-data-export`, where the
 * member asking is the member it is about.
 *
 * So nothing is filtered: the other person being banned, without a photo or not looking changes what a
 * page would show, not what the member's own data is.
 */
export const getLikesAndShipsMain = async (userId: string) => {
  const pg = createSupabaseDirectClient()

  const likesGiven = await pg.map<{
    user_id: string
    created_time: number
  }>(
    `
      select target_id, created_time
      from profile_likes
      where creator_id = $1
      order by created_time desc
    `,
    [userId],
    (r) => ({
      user_id: r.target_id,
      created_time: new Date(r.created_time).getTime(),
    }),
  )

  const likesReceived = await pg.map<{
    user_id: string
    created_time: number
  }>(
    `
      select creator_id, created_time
      from profile_likes
      where target_id = $1
      order by created_time desc
    `,
    [userId],
    (r) => ({
      user_id: r.creator_id,
      created_time: new Date(r.created_time).getTime(),
    }),
  )

  const ships = await pg.map<{
    creator_id: string
    target_id: string
    target1_id: string
    target2_id: string
    created_time: number
  }>(
    `
    select 
      target1_id, target2_id, creator_id, created_time,
      target1_id as target_id
    from profile_ships
    where target2_id = $1

    union all

    select
      target1_id, target2_id, creator_id, created_time,
      target2_id as target_id
    from profile_ships
    where target1_id = $1
    `,
    [userId],
    (r) => ({
      ...r,
      created_time: new Date(r.created_time).getTime(),
    }),
  )

  return {
    likesGiven,
    likesReceived,
    ships,
  }
}
