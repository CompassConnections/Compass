import {API, APIGenericSchema, APIParams, APIPath, APIResponse} from 'common/api/schema'
import {APIError, getApiUrl} from 'common/api/utils'
import {removeUndefinedProps} from 'common/util/object'
import {User} from 'firebase/auth'
import {forEach} from 'lodash'

// export function unauthedApi<P extends APIPath>(path: P, params: APIParams<P>) {
//   return typedAPICall(path, params, null)
// }

export async function typedAPICall<P extends APIPath>(
  path: P,
  params: APIParams<P>,
  user: User | null,
) {
  const definition = API[path] as APIGenericSchema
  const method = definition.method

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
    let json = (await resp.json()) as {[k: string]: any}

    // Use Zod to parse the JSON. This triggers the z.coerce.date() transformation.
    if (definition.returns && typeof definition.returns.parse === 'function') {
      json = definition.returns.parse(json)
    }

    if (!resp.ok) {
      throw new APIError(resp.status as any, json?.message, json?.details)
    }
    return json
  }) as APIResponse<P>
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
