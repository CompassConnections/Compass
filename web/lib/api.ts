import {API, APIParams, APIPath} from 'common/api/schema'
import {typedAPICall} from 'common/util/api'
import {sleep} from 'common/util/time'
import {auth} from './firebase/users'
import {APIError} from "common/api/utils";
import toast from "react-hot-toast";

export async function api<P extends APIPath>(
  path: P,
  params: APIParams<P> = {}
) {
  // If the api is authed and the user is not loaded, wait for the user to load.
  if (API[path].authed && !auth.currentUser) {
    let i = 0
    while (!auth.currentUser) {
      i++
      await sleep(i * 10)
      if (i > 10) {
        console.error('User did not load after 10 iterations')
        break
      }
    }
  }

  return typedAPICall(path, params, auth.currentUser).catch((e) => {
    if (e instanceof APIError && e.code === 429) {}
      toast.error('Too many requests. Please try again later.')
    throw e
  })
}

function curriedAPI<P extends APIPath>(path: P) {
  return (params: APIParams<P>) => api(path, params)
}

export const updateProfile = curriedAPI('update-profile')
export const updateUser = curriedAPI('me/update')
export const report = curriedAPI('report')
