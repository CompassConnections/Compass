import {MIN_USERNAME_LENGTH, RESERVED_PATHS} from 'common/envs/constants'
import {debug} from 'common/logger'
import {cleanUsername} from 'common/util/clean-username'
import {randomString} from 'common/util/random'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

export type ValidationResult = {
  valid: boolean
  message?: string
  suggestedUsername?: string
}

export async function validateUsername(username: string): Promise<ValidationResult> {
  const pg = createSupabaseDirectClient()
  const cleanUsernameStr = cleanUsername(username)

  if (!cleanUsernameStr) {
    return {valid: false, message: 'Username cannot be empty'}
  }

  // No suggestion here on purpose: `create-user-and-profile` applies a suggestion silently, and a
  // too-short name is the person's to lengthen rather than ours to pad with random characters.
  if (cleanUsernameStr.length < MIN_USERNAME_LENGTH) {
    return {
      valid: false,
      message: `Username must be at least ${MIN_USERNAME_LENGTH} characters`,
    }
  }

  if (RESERVED_PATHS.has(cleanUsernameStr)) {
    const suggested = cleanUsernameStr + randomString(4)
    return {valid: false, message: 'This username is reserved', suggestedUsername: suggested}
  }

  const dupes = await pg.one<number>(
    `select count(*) from users where username ilike $1`,
    [cleanUsernameStr],
    (r) => r.count,
  )

  if (dupes > 0) {
    const suggested = cleanUsernameStr + randomString(4)
    return {valid: false, message: 'This username is already taken', suggestedUsername: suggested}
  }

  return {valid: true, suggestedUsername: cleanUsernameStr}
}

export const validateUsernameEndpoint: APIHandler<'validate-username'> = async (props) => {
  const {username} = props
  const result = await validateUsername(username)
  debug(result)
  return result
}
