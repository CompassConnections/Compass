import axios from 'axios'

import {config} from '../web/SPEC_CONFIG'

export async function firebaseLoginEmailPassword(
  email: string | undefined,
  password: string | undefined,
) {
  const login = await axios.post(
    `${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.SIGN_IN_PASSWORD}`,
    {
      email,
      password,
      returnSecureToken: true,
    },
  )
  return login
}

export async function getUserId(email: string, password: string) {
  try {
    const loginInfo = await firebaseLoginEmailPassword(email, password)
    return loginInfo.data.localId
  } catch {
    return
  }
}

export async function findUser(idToken: string) {
  const response = await axios.post(
    `${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.ACCOUNT_LOOKUP}`,
    {
      idToken,
    },
  )
  if (response?.data?.users?.length > 0) {
    return response.data.users[0]
  }
}

export async function sendVerificationEmail(idToken: string) {
  await axios.post(`${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.SEND_EMAIL_VERIFICATION}`, {
    requestType: 'VERIFY_EMAIL',
    idToken,
  })
}
export async function getOobCode(oobCodes: any[], email: string) {
  return oobCodes.find((item) => item.email.toLowerCase() === email.toLowerCase())?.oobCode
}

export async function verifyEmail(email: string, password: string) {
  try {
    const loginInfo = await firebaseLoginEmailPassword(email, password)
    await sendVerificationEmail(loginInfo.data.idToken)
    const oobResponse = await axios.get(`${config.FIREBASE_URL.FIREBASE_EMULATOR_API}`)
    const oobCode = await getOobCode(oobResponse.data.oobCodes, email)
    if (!oobCode) throw new Error(`No verification OOB code found for email: ${email}`)

    const response = await axios.post(
      `${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.CONFIRM_EMAIL_VERIFICATION}`,
      {
        oobCode,
      },
    )
  } catch (err: any) {
    console.log(err)
    throw err
  }
}

export async function firebaseSignUp(email: string, password: string) {
  try {
    const response = await axios.post(`${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.SIGNUP}`, {
      email,
      password,
      returnSecureToken: true,
    })
    const userId = response.data.localId
    console.log('User created in Firebase Auth:', {email, userId})
    return userId
  } catch (err: any) {
    if (
      err.response?.status === 400 ||
      err.response?.data?.error?.message?.includes('EMAIL_EXISTS')
    ) {
      return await getUserId(email, password)
    }
    if (err.code === 'ECONNREFUSED') return
    // throw Error('Firebase emulator not running. Start it with:\n  yarn dev:isolated\n')
    console.log(err)
    throw err
  }
}

export async function deleteAccount(idToken: any) {
  try {
    await axios.post(`${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.DELETE}`, {
      idToken: idToken,
    })
  } catch (err: any) {
    if (err.response?.data?.error?.message?.includes('USER_NOT_FOUND')) {
      return
    }
    throw err
  }
}

/**
 * Check if a Firebase user exists by email
 * Returns userId if exists, undefined if not found
 */
export async function firebaseUserExists(
  email: string,
  password: string,
): Promise<string | undefined> {
  try {
    const login = await firebaseLoginEmailPassword(email, password)
    return login.data.localId
  } catch {
    return undefined
  }
}
