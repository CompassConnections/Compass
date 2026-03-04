import {faker} from '@faker-js/faker'
import {
  ConnectionTypeTuple,
  DietTuple,
  EducationTuple,
  EthnicityTuple,
  GenderTuple,
  InterestedInGenderTuple,
  LanguageTuple,
  PersonalityKey,
  PoliticalTuple,
  RelationshipStatusTuple,
  RelationshipStyleTuple,
  ReligionTuple,
} from 'common/choices'
import {ImportanceTuple} from 'web/components/answers/answer-compatibility-question-content'

import {Causes, ChildrenExpectation, Interests, Platforms} from '../pages/signUpPage'

export type UserAccountInformation = {
  email: string
  password: string
  display_name: string
  username: string
  current_location?: string
  birth_location?: string
  headline?: string
  keywords?: string
  bio?: string
  gender?: GenderTuple
  age?: string
  height?: Height
  ethnicity_origin?: EthnicityTuple
  interested_in?: InterestedInGenderTuple
  Interested_in_ages?: InterestedInAges
  connection_type?: ConnectionTypeTuple
  relationship_status?: RelationshipStatusTuple
  relationship_style?: RelationshipStyleTuple
  number_of_kids?: string
  children_expectation?: ChildrenExpectation
  interests?: (Interests | string)[]
  causes?: (Causes | string)[]
  education_level?: EducationTuple
  university?: string
  job_title?: string
  company?: string
  work_area?: string[]
  beliefs?: BeliefDetails
  personality_type?: PersonalityKey
  big_five_personality_traits?: FiveBigPersonalityTraits
  diet?: DietTuple
  is_smoker?: boolean
  alcohol_consumed_per_month?: string
  languages?: LanguageTuple[]
  social_media?: Socials[]
  compatibility?: Compatibility
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

export type Compatibility = {
  answer: string | null
  acceptableAnswers: (string | null)[]
  importance: ImportanceTuple
  explanation: string
}
type BeliefDetails = {
  political?: {
    belief?: PoliticalTuple
    details?: string
  }
  religious?: {
    belief?: ReligionTuple
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

type AccountConfig = {
  faker_account: () => UserAccountInformation
  spec_account: () => UserAccountInformation
  dev_one_account: () => UserAccountInformation
  dev_two_account: () => UserAccountInformation
  google_account_one: () => UserAccountInformation
  google_account_two: () => UserAccountInformation
  email_account_all_info: () => UserAccountInformation
}

export const testAccounts: AccountConfig = {
  // Use a function so email is unique per test call
  faker_account: () => {
    const id = crypto.randomUUID().slice(0, 6)
    return {
      email: `faker${id}@test.com`,
      password: faker.internet.password(),
      display_name: faker.internet.displayName(),
      username: `user_${id}`,
      gender: ['Man', 'male'],
      age: '35',
      height: {
        feet: '5',
        inches: '0',
        centimeters: '152.4',
      },
    }
  },

  spec_account: () => {
    const id = crypto.randomUUID().slice(0, 6)
    return {
      email: `spec${id}@compass.com`,
      password: 'compassConnections1!',
      display_name: 'Spec.Compass',
      username: `Spec.Connections_${id}`,
    }
  },

  dev_one_account: () => {
    const id = crypto.randomUUID().slice(0, 6)
    return {
      email: `dev_1@compass.com`,
      password: 'dev_1Password',
      display_name: 'Dev1.Compass',
      username: `Dev1.Connections`,
    }
  },

  dev_two_account: () => {
    const id = crypto.randomUUID().slice(0, 6)
    return {
      email: 'dev_2@compass.com',
      password: 'dev_2Password',
      display_name: 'Dev2.Compass',
      username: `Dev2.Connections_`,
    }
  },

  google_account_one: () => {
    const id = crypto.randomUUID().slice(0, 6)
    return {
      email: `g1_compass_${id}@gmail.com`,
      password: 'G_oneCompassTest',
      display_name: 'Google_one_Compass',
      username: `G1_Connect_${id}`,
    }
  },

  google_account_two: () => {
    const id = crypto.randomUUID().slice(0, 6)
    return {
      email: `g2_compass_${id}@gmail.com`,
      password: 'G_twoCompassTest',
      display_name: 'Google_two_Compass',
      username: `G2_Connect_${id}`,
    }
  },

  email_account_all_info: () => {
    const id = crypto.randomUUID().slice(0, 6)
    return {
      // Use a non-real TLD like @test.compass to make it obvious these are test accounts and prevent accidental emails
      email: `testAccounts${id}@test.compass`,
      password: 'CompassTest',
      display_name: 'Compass Onboarding',
      username: `TheGreatOnboarding_${id}`, // username max length is 25 (see /create-user)
      keywords: 'Spicey noodles, Chocolate milk',
      headline:
        'I went out before dawn to hunt the mantis shrimp, the small bright terror that cracked shells like glass and watched me with colors no man could name. In the quiet water, I felt its strikes through the line as if the sea itself were warning me.',
      bio: 'Born beneath twin moons, this wanderer maps forgotten roads, trades riddles for shelter, and keeps stories in glass bottles. Drawn to ancient libraries and glowing forests, they seek lost spells, quiet taverns, and adventures that rewrite fate. Their compass points to wonder. Ever onward. Always. Go',
      gender: ['Woman', 'female'],
      age: '25',
      height: {
        feet: '6',
        inches: '0',
        centimeters: '182.88',
      },
      ethnicity_origin: ['South/Southeast Asian', 'south_asian'],
      interested_in: ['Men', 'male'],
      Interested_in_ages: {
        min: '20',
        max: '30',
      },
      connection_type: ['Relationship', 'relationship'],
      relationship_status: ['In open relationship', 'open'],
      relationship_style: ['Open Relationship', 'open'],
      number_of_kids: '2',
      children_expectation: ['Neutral', 2],
      interests: ['Chess', 'Eating'],
      causes: ['Animal Rights', 'Free Spotify'],
      education_level: ['Bachelors', 'bachelors'],
      university: 'Open-Source University',
      job_title: 'Unemployed',
      company: 'Home',
      work_area: ['Engineering', 'Academia'],
      beliefs: {
        political: {
          belief: ['Green / Eco-Socialist', 'green'],
          details: 'This will be details',
        },
        religious: {
          belief: ['Shinto', 'shinto'],
          details: 'This will be details',
        },
      },
      personality_type: 'ENFJ',
      big_five_personality_traits: {
        openness: 43,
        agreeableness: 20,
        conscientiousness: 32,
        extraversion: 63,
        neuroticism: 12,
      },
      diet: ['Omnivore', 'omnivore'],
      is_smoker: false,
      alcohol_consumed_per_month: '4',
      languages: [
        ['Akan', 'akan'],
        ['Cebuano', 'cebuano'],
      ],
      social_media: [
        {
          platform: 'Bluesky',
          urlOrUsername: 'TheGreatConnection',
        },
      ],
      compatibility: {
        answer: '1',
        acceptableAnswers: ['0', '2'],
        importance: ['Important', 2],
        explanation: 'This is my explanation one',
      },
    }
  },
}