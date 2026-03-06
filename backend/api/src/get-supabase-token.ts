import {ENV_CONFIG} from 'common/envs/constants'
import {sign} from 'jsonwebtoken'

import {APIErrors, APIHandler} from './helpers/endpoint'

export const getSupabaseToken: APIHandler<'get-supabase-token'> = async (_, auth) => {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET
  if (jwtSecret == null) {
    throw APIErrors.internalServerError("No SUPABASE_JWT_SECRET; couldn't sign token.")
  }
  const instanceId = ENV_CONFIG.supabaseInstanceId
  if (!instanceId) {
    throw APIErrors.internalServerError('No Supabase instance ID in config.')
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
