import axios from 'axios'
import {config} from '../SPEC_CONFIG'

async function setup() {
  const results = await axios.post(`${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.SIGNUP}`, {
    email: 'trial_test@email.com',
    password: 'trialTestPassword',
    returnSecureToken: true,
  })

  console.log('Auth created: ', 'trial_test@email.com')
  console.log('Id: ', results.data.localId)
}

setup()
