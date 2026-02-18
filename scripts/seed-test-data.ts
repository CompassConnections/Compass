// TODO: add test data to firebase emulator as well (see example below, but user IDs from supabase and firebase need to the same)

import {createSupabaseDirectClient} from "shared/lib/supabase/init";
import UserAccountInformation from "../tests/e2e/backend/utils/userInformation";
import {seedDatabase} from "../tests/e2e/utils/seedDatabase";

import axios from 'axios';
import {config} from '../tests/e2e/web/SPEC_CONFIG.js';
import {tryCatch} from "common/lib/util/try-catch";
import {insert} from "shared/lib/supabase/utils";

async function createAuth(email: string, password: string) {
  const base = 'http://localhost:9099/identitytoolkit.googleapis.com/v1';

  try {
    const response = await axios.post(`${base}/accounts:signUp?key=fake-api-key`, {
      email: email,
      password: password,
      returnSecureToken: true
    })
    const userId = response.data.localId
    console.log('User created in Firebase Auth:', email, userId)
    return userId
  } catch (err: any) {
    if (err.response?.status === 400 || err.response?.data?.error?.message?.includes('EMAIL_EXISTS')) {
      return;
    }
    if (err.code === 'ECONNREFUSED') throw Error('Firebase emulator not running. Start it with:\n  yarn test:e2e:services\n')
    console.log(err);
    throw err
  }
}


async function seedCompatibilityPrompts(pg: any, userId: string = null) {
  // Need some prompts to prevent the onboarding from stopping once it reaches them (just after profile creation)
  const question = "What is your favorite color?"
  const multiple_choice_options = {"Blue": 0, "Green": 1, "Red": 2}
  const {data, error} = await tryCatch(
    insert(pg, 'compatibility_prompts', {
      creator_id: userId,
      question,
      answer_type: 'compatibility_multiple_choice',
      multiple_choice_options,
    })
  )
  console.log('Compatibility prompts created', {data, error})
}

type ProfileType = 'basic' | 'medium' | 'full'

(async () => {
  const pg = createSupabaseDirectClient()

  await seedCompatibilityPrompts(pg)

  //Edit the count seedConfig to specify the amount of each profiles to create
  const seedConfig = [
    {count: 1, profileType: 'basic' as ProfileType},
    {count: 1, profileType: 'medium' as ProfileType},
    {count: 1, profileType: 'full' as ProfileType},
  ]

  for (const {count, profileType} of seedConfig) {
    for (let i = 0; i < count; i++) {
      const userInfo = new UserAccountInformation()
      if (i == 0 && profileType === 'full') {
        // Seed the first profile with deterministic data for the e2e tests
        userInfo.name = 'Franklin Buckridge'
        userInfo.email = config.USERS.DEV_1.EMAIL
        userInfo.password = config.USERS.DEV_1.PASSWORD
      }
      userInfo.user_id = await createAuth(userInfo.email, userInfo.password)
      if (userInfo.user_id) {
        console.log('User created in Supabase:', userInfo)
        await seedDatabase(pg, userInfo, profileType)
      }
    }
  }

  process.exit(0)
})()