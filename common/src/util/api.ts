import {API, APIParams, APIPath, APIResponse} from 'common/api/schema'
import {APIError, getApiUrl} from 'common/api/utils'
import {forEach} from 'lodash'
import {removeUndefinedProps} from 'common/util/object'
import {User} from 'firebase/auth'

export function unauthedApi<P extends APIPath>(path: P, params: APIParams<P>) {
  return typedAPICall(path, params, null)
}

export const typedAPICall = <P extends APIPath>(
  path: P,
  params: APIParams<P>,
  user: User | null,
) => {
  // parse any params that should part of the path (like market/:id)
  const newParams: any = {}
  let url = getApiUrl(path)
  forEach(params, (v, k) => {
    if (url.includes(`:${k}`)) {
      url = url.replace(`:${k}`, v + '')
    } else {
      newParams[k] = v
    }
  })

  return baseApiCall({
    url,
    method: API[path].method,
    params: newParams,
    user,
  }) as Promise<APIResponse<P>>
}

function appendQuery(url: string, props: Record<string, any>) {
  const [base, query] = url.split(/\?(.+)/)
  const params = new URLSearchParams(query)
  forEach(removeUndefinedProps(props ?? {}), (v, k) => {
    if (Array.isArray(v)) {
      v.forEach((item) => params.append(k, item))
    } else {
      params.set(k, v)
    }
  })
  return `${base}?${params.toString()}`
}

export async function baseApiCall(props: {
  url: string
  method: 'POST' | 'PUT' | 'GET'
  params: any
  user: User | null
}) {
  const {url, method, params, user} = props

  const actualUrl = method === 'POST' ? url : appendQuery(url, params)
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (user) {
    const token = await user.getIdToken()
    headers.Authorization = `Bearer ${token}`
  }
  const req = new Request(actualUrl, {
    headers,
    method: method,
    body: params == null || method === 'GET' ? undefined : JSON.stringify(params),
  })
  // console.log('Request', req)
  return fetch(req).then(async (resp) => {
    const json = (await resp.json()) as {[k: string]: any}
    if (!resp.ok) {
      throw new APIError(resp.status as any, json?.message, json?.details)
    }
    return json
  })
}
