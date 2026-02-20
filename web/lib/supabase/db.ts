import {ENV_CONFIG} from 'common/envs/constants'
import {createClient} from 'common/supabase/utils'

let currentToken: string | undefined

export function initSupabaseClient() {
  // Prefer explicit env overrides when available (useful for local Supabase via Docker)
  const urlOverride = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKeyOverride = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (urlOverride && anonKeyOverride) {
    console.log('Initializing Supabase client (env URL override)')
    return createClient(urlOverride, anonKeyOverride)
  }
  if (urlOverride || anonKeyOverride) {
    console.warn(
      'Supabase env override is partially set. Both URL and ANON_KEY are required. Falling back to ENV_CONFIG.'
    )
  }

  // Default: use instanceId and anon key from ENV_CONFIG
  // Note: createClient accepts either instanceId or full URL
  // console.debug('Initializing Supabase client', ENV_CONFIG.supabaseInstanceId)
  return createClient(ENV_CONFIG.supabaseInstanceId, ENV_CONFIG.supabaseAnonKey)
}

export function updateSupabaseAuth(token?: string) {
  if (currentToken != token) {
    currentToken = token
    if (token == null) {
      // db['rest'].headers['Authorization']
      db['realtime'].setAuth(null)
    } else {
      db['rest'].headers['Authorization'] = `Bearer ${token}`
      db['realtime'].setAuth(token)
    }
  }
}

export const db = initSupabaseClient()
