import {API, APIParams, APIPath} from 'common/api/schema'
import {debug} from 'common/logger'
import {typedAPICall} from 'common/util/api'
import {sleep} from 'common/util/time'

import {auth} from './firebase/users'

export async function api<P extends APIPath>(path: P, params: APIParams<P> = {}) {
  // If the api is authed and the user is not loaded, wait for the user to load.
  if (API[path].authed && !auth.currentUser) {
    let i = 0
    while (!auth.currentUser) {
      i++
      await sleep(i * 10)
      if (i > 300) {
        console.error('User did not load after 300 iterations')
        break
      }
    }
    debug('User loaded after', i, 'iterations')
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
