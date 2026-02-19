import {sign} from 'jsonwebtoken'
import {APIError, APIHandler} from './helpers/endpoint'
import {ENV_CONFIG} from 'common/envs/constants'

export const getSupabaseToken: APIHandler<'get-supabase-token'> = async (_, auth) => {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET
  if (jwtSecret == null) {
    throw new APIError(500, "No SUPABASE_JWT_SECRET; couldn't sign token.")
  }
  const instanceId = ENV_CONFIG.supabaseInstanceId
  if (!instanceId) {
    throw new APIError(500, 'No Supabase instance ID in config.')
  }
  const payload = {role: 'anon'} // postgres role
  return {
    jwt: sign(payload, jwtSecret, {
      algorithm: 'HS256', // same as what supabase uses for its auth tokens
      expiresIn: '1d',
      audience: instanceId,
      issuer: ENV_CONFIG.firebaseConfig.projectId,
      subject: auth.uid,
    }),
  }
}
