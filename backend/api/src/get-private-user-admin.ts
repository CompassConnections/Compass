import {APIHandler} from 'api/helpers/endpoint'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {getPrivateUser, log} from 'shared/utils'

export const getPrivateUserAdmin: APIHandler<'get-private-user-admin'> = async (body, auth) => {
  await throwErrorIfNotAdmin(auth.uid)
  log('admin viewed private user', {adminId: auth.uid, userId: body.userId})
  const privateUser = await getPrivateUser(body.userId)
  return {privateUser}
}
