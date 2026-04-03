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
  return response
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
    // throw Error('Firebase emulator not running. Start it with:\n  yarn test:e2e:services\n')
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
