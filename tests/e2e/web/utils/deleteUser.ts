import {deleteFromDb} from '../../utils/databaseUtils'
import {AuthObject} from './networkUtils'
import {deleteAccount, firebaseLoginEmailPassword} from '../../utils/firebaseUtils'

type AuthType = 'Email/Password' | 'Google'
export async function deleteUser(
  authType: AuthType,
  email?: string,
  password?: string,
  authInfo?: AuthObject,
) {
  try {
    let loginInfo
    if (authType === 'Email/Password') {
      loginInfo = await firebaseLoginEmailPassword(email, password)
      await deleteAccount(loginInfo?.data.idToken)
      await deleteFromDb(loginInfo?.data.localId)
    }
    if (authType === 'Google' && authInfo) {
      await deleteAccount(authInfo.idToken)
      await deleteFromDb(authInfo.localId)
    }
  } catch (err: any) {
    // Skip deletion if user doesn't exist or other auth errors occur
    if (
      err.response?.status === 400 ||
      err.response?.data?.error?.message?.includes('EMAIL_NOT_FOUND')
    ) {
      console.log(`Email not found, skipping user deletion for ${email}`)
      return
    }
    console.log(err)
  }
}
