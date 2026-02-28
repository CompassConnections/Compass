import {faker} from '@faker-js/faker'

import {
  Gender,
  InterestedIn,
  ChildrenExpectation,
  Interests,
  Causes,
  Platforms,
  PoliticalBeliefs,
  RelationshipStatus,
  RelationshipStyle,
  Religion,
} from '../pages/signUpPage'
import {
  ConnectionTypeKey,
  RelationshipStatusKey,
  RelationshipStyleKey,
  PoliticalBeliefsKey,
  DietKey,
  EducationKey,
  ReligionKey,
  LanguageKey,
  EthnicityKey,
  PersonalityKey,
} from 'common/choices'

export type OnboardingUser = {
  email: string
  password: string
  display_name: string
  username: string
  bio?: string
  gender?: Gender
  age?: string
  height?: Height
  ethnicity_origin?: EthnicityKey
  interested_in?: InterestedIn
  Interested_in_ages?: InterestedInAges
  connection_type?: ConnectionTypeKey
  relationship_status?: RelationshipStatusKey
  relationship_style?: RelationshipStyleKey
  number_of_kids?: string
  children_expectation?: ChildrenExpectation
  interests?: (Interests | string)[]
  causes?: (Causes | string)[]
  education_level?: EducationKey
  university?: string
  job_title?: string
  company?: string
  work_area?: string[]
  beliefs?: BeliefDetails
  personality_type?: PersonalityKey
  big_five_personality_traits?: FiveBigPersonalityTraits
  diet?: DietKey
  is_smoker?: boolean
  alcohol_consumed_per_month?: string
  languages?: LanguageKey[]
  social_media?: Socials[]
}

type Height = {
  feet: string
  inches: string
  centimeters: string
}

type InterestedInAges = {
  min: string
  max?: string
}

type BeliefDetails = {
  political?: {
    belief?: PoliticalBeliefsKey
    details?: string
  }
  religious?: {
    belief?: ReligionKey
    details?: string
  }
}

export type Socials = {
  platform: Platforms
  urlOrUsername: string
}

type FiveBigPersonalityTraits = {
  openness?: number
  conscientiousness?: number
  extraversion?: number
  agreeableness?: number
  neuroticism?: number
}

type OnboardingConfig = {
  faker_account: () => OnboardingUser
  account_one: () => OnboardingUser
}

export const onboarding: OnboardingConfig = {
  // Use a function so email is unique per test call
  faker_account: () => ({
    email: `faker+${crypto.randomUUID()}@test.com`,
    password: faker.internet.password(),
    display_name: faker.internet.displayName(),
    username: `user_${crypto.randomUUID().slice(0, 8)}`,
  }),

  account_one: () => ({
    // Use a non-real TLD like @test.compass to make it obvious these are test accounts and prevent accidental emails
    email: `onboarding+${crypto.randomUUID()}@test.compass`,
    password: 'CompassTest',
    display_name: 'Compass Onboarding',
    username: `TheGreatOnboarding_${crypto.randomUUID().slice(0, 8)}`,
    bio: 'Born beneath twin moons, this wanderer maps forgotten roads, trades riddles for shelter, and keeps stories in glass bottles. Drawn to ancient libraries and glowing forests, they seek lost spells, quiet taverns, and adventures that rewrite fate. Their compass points to wonder. Ever onward. Always. Go',
    gender: 'Woman',
    age: '25',
    height: {
      feet: '6',
      inches: '0',
      centimeters: '182.88',
    },
    ethnicity_origin: 'South/Southeast Asian',
    interested_in: 'Men',
    Interested_in_ages: {
      min: '20',
      max: '30',
    },
    connection_type: 'Relationship',
    relationship_status: 'In open relationship',
    relationship_style: 'Open Relationship',
    number_of_kids: '2',
    children_expectation: ['Neutral', 2],
    interests: ['Chess', 'Eating'],
    causes: ['Animal Rights', 'Free Spotify'],
    education_level: 'Bachelors',
    university: 'Open-Source University',
    job_title: 'Unemployed',
    company: 'Home',
    work_area: ['Living Room', 'University'],
    beliefs: {
      political: {
        belief: 'Green / Eco-Socialist',
        details: 'This will be details',
      },
      religious: {
        belief: 'Shinto',
        details: 'This will be details',
      },
    },
    personality_type: 'ENFJ',
    big_five_personality_traits: {
      openness: 43,
    },
    diet: 'Omnivore',
    is_smoker: false,
    alcohol_consumed_per_month: '4',
    languages: ['Akan', 'Cebuano'],
    social_media: [
      {
        platform: 'Bluesky',
        urlOrUsername: 'TheGreatConnection',
      },
    ],
  }),
}
