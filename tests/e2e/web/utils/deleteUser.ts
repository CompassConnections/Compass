import {deleteFromDb} from '../../utils/databaseUtils'
import {deleteAccount, firebaseLoginEmailPassword} from '../../utils/firebaseUtils'
import {UserAccountInformation} from './accountInformation'
import {AuthObject} from './networkUtils'

type AuthType = 'Email/Password' | 'Google'
export async function deleteUser(
  authType: AuthType,
  account?: UserAccountInformation,
  authInfo?: AuthObject,
) {
  try {
    let loginInfo
    if (authType === 'Email/Password') {
      loginInfo = await firebaseLoginEmailPassword(account?.email, account?.password)
      await deleteAccount(loginInfo?.data.idToken)
      await deleteFromDb(loginInfo?.data.localId)
    } else if (authType === 'Google' && authInfo) {
      await deleteAccount(authInfo.idToken)
      await deleteFromDb(authInfo.localId)
    }
  } catch (err: any) {
    // Skip deletion if user doesn't exist or other auth errors occur
    if (
      err.response?.status === 400 ||
      err.response?.data?.error?.message?.includes('EMAIL_NOT_FOUND')
    ) {
      console.log(`Email not found, skipping user deletion for ${account?.email}`)
      return
    }
    console.log(err)
  }
}
