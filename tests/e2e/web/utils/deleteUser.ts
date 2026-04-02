import {deleteFromDb, userInformationFromDb} from '../../utils/databaseUtils'
import {AuthObject} from './networkUtils'
import {deleteAccount, firebaseLoginEmailPassword, findUser} from '../../utils/firebaseUtils'
import { UserAccountInformation } from './accountInformation'

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
      try {
        const userDbCheck = await userInformationFromDb(account)
        if (userDbCheck) {
          await deleteAccount(loginInfo?.data.idToken)
          await deleteFromDb(loginInfo?.data.localId)
        }
      } catch (dbError) {
      }
      
    }
    if (authType === 'Google' && authInfo) {
      const googleAuthUser = await findUser(authInfo.idToken)
      if (!googleAuthUser) return

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
