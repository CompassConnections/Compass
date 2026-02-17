// TODO: add test data to firebase emulator as well (see example below, but user IDs from supabase and firebase need to the same)

import {createSupabaseDirectClient} from "shared/lib/supabase/init";
import UserAccountInformation from "../tests/e2e/backend/utils/userInformation";
import {seedDatabase} from "../tests/e2e/utils/seedDatabase";

import axios from 'axios';
import {config} from '../tests/e2e/web/SPEC_CONFIG.js';

async function createAuth(email: string, password: string) {
  const base = 'http://localhost:9099/identitytoolkit.googleapis.com/v1';

  await axios.post(`${base}/accounts:signUp?key=fake-api-key`, {
    email: email,
    password: password,
    returnSecureToken: true
  });

  console.log('Auth created', config.USERS.DEV_1.EMAIL)

  // TODY: retrieve real user ID from response
  const userId = Date.now().toString()

  return userId
}

// Can remove this later once we update tests/e2e/web/fixtures/signInFixture.ts
createAuth(config.USERS.DEV_1.EMAIL, config.USERS.DEV_1.PASSWORD)


type ProfileType = 'basic' | 'medium' | 'full'

(async () => {
  const pg = createSupabaseDirectClient()

  //Edit the count seedConfig to specify the amount of each profiles to create
  const seedConfig = [
    {count: 1, profileType: 'basic' as ProfileType},
    {count: 1, profileType: 'medium' as ProfileType},
    {count: 1, profileType: 'full' as ProfileType},
  ]

  for (const {count, profileType} of seedConfig) {
    for (let i = 0; i < count; i++) {
      const userInfo = new UserAccountInformation()
      userInfo.user_id = await createAuth(userInfo.email, userInfo.password)
      if (i == 0) {
        // Seed the first profile with deterministic data for the e2e tests
        userInfo.name = 'Franklin Buckridge'
      }
      console.log('Seeded user:', userInfo)
      await seedDatabase(pg, userInfo, profileType)
    }
  }
  process.exit(0)
})()