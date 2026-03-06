import * as Sentry from '@sentry/nextjs'
import {API, APIParams, APIPath} from 'common/api/schema'
import {APIErrors} from 'common/api/utils'
import {debug} from 'common/logger'
import {typedAPICall} from 'common/util/api'
import {sleep} from 'common/util/time'

import {auth} from './firebase/users'

export async function api<P extends APIPath>(path: P, params: APIParams<P> = {}) {
  const {authed} = API[path]

  try {
    if (authed) {
      await auth.authStateReady()
      if (auth.currentUser === null) {
        // User is definitely not logged in
        console.error(`api('${path}') called while unauthenticated`)
        throw APIErrors.unauthorized('Not authenticated')
      }
    }
  } catch (e) {
    // Remove try / catch once all hooks/components are fixed
    console.error('Need to fix this before removing try / catch', e)
    Sentry.logger.error('Need to fix this before removing try / catch' + String(e))
    let i = 0
    while (!auth.currentUser) {
      i++
      await sleep(i * 500)
      if (i > 5) {
        console.error('User did not load after 5 iterations')
        throw APIErrors.unauthorized('Not authenticated')
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
