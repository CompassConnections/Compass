import {API, APIParams, APIPath} from 'common/api/schema'
import {APIError} from 'common/api/utils'
import {debug} from 'common/logger'
import {typedAPICall} from 'common/util/api'
import {sleep} from 'common/util/time'

import {auth} from './firebase/users'

export async function api<P extends APIPath>(path: P, params: APIParams<P> = {}) {
  const {authed} = API[path]

  try {
    if (authed) {
      if (auth.currentUser === undefined) {
        // Auth hasn't resolved yet — this is a bug in the caller, not a recoverable state
        console.error(
          `api('${path}') called before auth resolved — check the calling hook/component`,
        )
        throw new APIError(401, 'Auth not resolved yet')
      }

      if (auth.currentUser === null) {
        // User is definitely not logged in
        console.error(`api('${path}') called while unauthenticated`)
        throw new APIError(401, 'Not authenticated')
      }
    }
  } catch (e) {
    // Remove try / catch once all hooks/components are fixed
    console.error('Need to fix this before removing try / catch', e)
    let i = 0
    while (!auth.currentUser) {
      i++
      await sleep(i * 500)
      if (i > 5) {
        console.error('User did not load after 5 iterations')
        throw new APIError(401, 'Not authenticated')
      }
    }
  }

  return typedAPICall(path, params, auth.currentUser)
}

function curriedAPI<P extends APIPath>(path: P) {
  return (params: APIParams<P>) => api(path, params)
}

export const updateProfile = curriedAPI('update-profile')
export const updateUser = curriedAPI('me/update')
export const report = curriedAPI('report')

export const updateBackendLocale = (newLocale: string) => {
  if (!auth.currentUser) return
  debug('Updating backend locale to', newLocale)
  api('update-user-locale', {locale: newLocale}).catch((error) => {
    console.error('Failed to update user locale:', error)
  })
}
