import {getUser} from 'api/get-user'

import {type APIHandler} from './helpers/endpoint'

export const getMe: APIHandler<'me'> = async (_, auth) => {
  return getUser({id: auth.uid})
}
