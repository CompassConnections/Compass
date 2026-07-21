import {tryCatch} from 'common/util/try-catch'
import {createSomeNotifications} from 'shared/create-notification'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insert} from 'shared/supabase/utils'

import {seedShowcaseUsers} from './seed-showcase'
import {
  seedUser,
  TEST_USER_DISPLAY_NAME,
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
  TEST_USER_USERNAME,
} from './seedDatabase'

async function seedCompatibilityPrompts(userId: string | null = null) {
  // Need some prompts to prevent the onboarding from stopping once it reaches them (just after profile creation)
  const compatibilityPrompts = [
    {
      question: 'What is your favorite color?',
      options: {Blue: 0, Green: 1, Red: 2},
    },
    {
      question: 'What is your favorite animal?',
      options: {Dog: 0, Cat: 1, Bird: 2},
    },
    {
      question: 'What is your preferred time of day?',
      options: {Morning: 0, Afternoon: 1, Night: 2},
    },
    {
      question: 'What type of movies do you enjoy most?',
      options: {Action: 0, Comedy: 1, Drama: 2},
    },
  ]
  const pg = createSupabaseDirectClient()
  for (let i = 0; i < compatibilityPrompts.length; i++) {
    const {data, error} = await tryCatch(
      insert(pg, 'compatibility_prompts', {
        creator_id: userId,
        question: compatibilityPrompts[i].question,
        answer_type: 'compatibility_multiple_choice',
        multiple_choice_options: compatibilityPrompts[i].options,
      }),
    )
    console.log('Compatibility prompts created', {data, error})
  }
}

async function seedNotifications() {
  await createSomeNotifications()
  console.log('Notifications created', {})
}

type ProfileType = 'basic' | 'medium' | 'full'
;(async () => {
  if (process.env.SHOWCASE === '1') {
    // Hand-authored personas with real prose and portraits, for marketing captures.
    // Needs no Firebase emulator, so it works against the remote dev DB on its own.
    await seedShowcaseUsers()
  } else {
    //Edit the count seedConfig to specify the amount of each profiles to create
    const seedConfig = [
      {count: 8, profileType: 'basic' as ProfileType},
      {count: 8, profileType: 'medium' as ProfileType},
      {count: 8, profileType: 'full' as ProfileType},
    ]

    for (const {count, profileType} of seedConfig) {
      for (let i = 0; i < count; i++) {
        await seedUser(undefined, undefined, profileType)
      }
    }

    // Used in some tests that require interaction with a permanent user
    await seedUser(
      TEST_USER_EMAIL,
      TEST_USER_PASSWORD,
      'full',
      TEST_USER_DISPLAY_NAME,
      TEST_USER_USERNAME,
    )
  }

  await seedCompatibilityPrompts()
  await seedNotifications()

  process.exit(0)
})()
