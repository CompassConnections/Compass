import {createSupabaseDirectClient, SupabaseDirectClient,} from 'shared/supabase/init'
import {convertPrivateUser, convertUser} from 'common/supabase/users'
import {log, type Logger} from 'shared/monitoring/log'
import {metrics} from 'shared/monitoring/metrics'

export {metrics}
export {log, type Logger}

export const getUser = async (
  userId: string,
  pg: SupabaseDirectClient = createSupabaseDirectClient()
) => {
  return await pg.oneOrNone(
    `select *
     from users
     where id = $1
     limit 1`,
    [userId],
    convertUser
  )
}

export const getPrivateUser = async (
  userId: string,
  pg: SupabaseDirectClient = createSupabaseDirectClient()
) => {
  return await pg.oneOrNone(
    `select *
     from private_users
     where id = $1
     limit 1`,
    [userId],
    convertPrivateUser
  )
}

export const getUserByUsername = async (
  username: string,
  pg: SupabaseDirectClient = createSupabaseDirectClient()
) => {
  const res = await pg.oneOrNone(
    `select *
     from users
     where username = $1`,
    username
  )

  return res ? convertUser(res) : null
}

export const getPrivateUserByKey = async (
  apiKey: string,
  pg: SupabaseDirectClient = createSupabaseDirectClient()
) => {
  return await pg.oneOrNone(
    `select *
     from private_users
     where data ->> 'apiKey' = $1
     limit 1`,
    [apiKey],
    convertPrivateUser
  )
}
