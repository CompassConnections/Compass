import {APIErrors, type APIHandler} from 'api/helpers/endpoint'
import {isStaff, ownProfileGateIssues} from 'api/helpers/profile-gate'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getUser} from 'shared/utils'

/**
 * Whether the caller may start a conversation yet, and if not, what their own profile is missing.
 * The composer asks this the moment it opens, so a member whose profile is not written yet is sent
 * to fix it before writing a message — not after. The same check runs again, server-side, when the
 * conversation is actually created (`create-private-user-message-channel.ts`); this is the preview.
 */
export const getProfileGate: APIHandler<'get-profile-gate'> = async (_props, auth) => {
  const user = await getUser(auth.uid)
  if (!user) throw APIErrors.unauthorized('Your account was not found')
  if (isStaff(user)) return {issues: null}
  const pg = createSupabaseDirectClient()
  return {issues: await ownProfileGateIssues(pg, auth.uid)}
}
