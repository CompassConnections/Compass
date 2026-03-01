import {deleteFromDb} from '../../utils/databaseUtils'
import {deleteAccount, login} from '../../utils/firebaseUtils'

export async function deleteUser(email: string, password: string) {
  try {
    const loginInfo = await login(email, password)
    await deleteFromDb(loginInfo.data.localId)
    await deleteAccount(loginInfo)
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
