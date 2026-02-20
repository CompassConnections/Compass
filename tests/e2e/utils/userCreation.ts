//Run with:
// export ENVIRONMENT=DEV && npx tsx userCreation.ts

import {createSupabaseDirectClient} from 'shared/supabase/init'

import UserAccountInformation from '../backend/utils/userInformation'
import {seedDatabase} from './seedDatabase'

type ProfileType = 'basic' | 'medium' | 'full'
;(async () => {
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
      if (i == 0) {
        // Seed the first profile with deterministic data for the e2e tests
        userInfo.name = 'Franklin Buckridge'
      }
      await seedDatabase(pg, userInfo, profileType)
    }
  }
  process.exit(0)
})()
