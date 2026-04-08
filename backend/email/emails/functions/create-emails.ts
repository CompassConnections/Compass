import {PrivateUser, User} from 'common/user'
import {sleep} from 'common/util/time'
import {sendShareCompassEmail} from 'email/functions/helpers'
import {keyBy} from 'lodash'
import {getAllPrivateUsers, getAllUsers, getUser} from 'shared/utils'

export const createEmails = async (
  sendEmail: (toUser: User, privateUser: PrivateUser) => Promise<any>,
  {ids, startIndex, n}: {ids: string[]; startIndex: number; n: number},
) => {
  let users = []
  if (ids.length) {
    for (const id of ids) {
      const u = await getUser(id)
      if (u) users.push(u)
    }
  } else {
    users = await getAllUsers()
  }

  if (startIndex) {
    users = users.slice(startIndex)
  }

  if (n) {
    users = users.slice(0, n)
  }

  const _privateUsers = await getAllPrivateUsers()
  const privateUsers = keyBy(_privateUsers, 'id')

  for (const user of users) {
    try {
      const privateUser = privateUsers[user.id]
      if (!privateUser) {
        throw new Error(`Private user not found for user ${user.id}`)
      }
      await sendEmail(user, privateUser)
      await sleep(2000)
    } catch (e) {
      console.error('Failed to create notification', e, user)
    }
  }

  return {
    success: true,
  }
}

export const createShareCompassEmails = async (options: any) => {
  return await createEmails(sendShareCompassEmail, options)
}
