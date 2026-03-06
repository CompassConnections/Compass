import {toUserAPIResponse} from 'common/api/user-types'
import {APIErrors} from 'common/api/utils'
import {convertUser} from 'common/supabase/users'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const getUser = async (props: {id: string} | {username: string}) => {
  const pg = createSupabaseDirectClient()
  const user = await pg.oneOrNone(
    `select * from users
            where ${'id' in props ? 'id' : 'username'} = $1`,
    ['id' in props ? props.id : props.username],
    (r) => (r ? convertUser(r) : null),
  )
  if (!user) throw APIErrors.notFound('User not found')

  return toUserAPIResponse(user)
}

// export const getDisplayUser = async (
//   props: { id: string } | { username: string }
// ) => {
//   console.log('getDisplayUser', props)
//   const pg = createSupabaseDirectClient()
//   const liteUser = await pg.oneOrNone(
//     `select ${displayUserColumns}
//             from users
//             where ${'id' in props ? 'id' : 'username'} = $1`,
//     ['id' in props ? props.id : props.username]
//   )
//   if (!liteUser) throw APIErrors.notFound('User not found')
//
//   return removeNullOrUndefinedProps(liteUser)
// }
