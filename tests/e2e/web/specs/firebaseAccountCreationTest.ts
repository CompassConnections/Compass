import axios from 'axios'
import {config} from '../SPEC_CONFIG'
import {
  firebaseLoginEmailPassword,
  getOobCode,
  getUserId,
  sendVerificationEmail,
} from '../../utils/firebaseUtils'

async function setup() {
  const loginInfo = await firebaseLoginEmailPassword('AnotherTest@email.com', 'Password')
  await sendVerificationEmail(loginInfo.data.idToken)
  const oobResponse = await axios.get(`${config.FIREBASE_URL.FIREBASE_EMULATOR_API}`)
  const oobCode = await getOobCode(oobResponse.data.oobCodes, 'AnotherTest@email.com')
  console.log(oobCode)

  const response = await axios.post(
    `${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.CONFIRM_EMAIL_VERIFICATION}`,
    {
      oobCode,
    },
  )
  console.log(response)
  console.log(response.status)
}

setup()
