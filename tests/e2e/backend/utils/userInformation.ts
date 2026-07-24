import {faker} from '@faker-js/faker'
import {
  CANNABIS_CHOICES,
  DIET_CHOICES,
  EDUCATION_CHOICES,
  GENDERS,
  LANGUAGE_CHOICES,
  MBTI_CHOICES,
  NEUROTYPE_CHOICES,
  ORIENTATION_CHOICES,
  POLITICAL_CHOICES,
  PSYCHEDELICS_CHOICES,
  RACE_CHOICES,
  RELATIONSHIP_CHOICES,
  RELATIONSHIP_STATUS_CHOICES,
  RELIGION_CHOICES,
  ROMANTIC_CHOICES,
  SUBSTANCE_INTENTION_CHOICES,
  SUBSTANCE_PREFERENCE_CHOICES,
} from 'common/choices'

class UserAccountInformationForSeeding {
  name = faker.person.fullName()
  userName = faker.internet.displayName()
  email = faker.internet.email()
  user_id = faker.string.alpha(28)
  password = faker.internet.password()
  ip = faker.internet.ip()
  age = faker.number.int({min: 18, max: 100})
  bio = faker.lorem.words({min: 200, max: 350})
  born_in_location = faker.location.country()
  gender = Object.values(GENDERS)
  pref_gender = Object.values(GENDERS)
  orientation = Array.from(
    {length: faker.number.int({min: 1, max: 2})},
    () =>
      Object.values(ORIENTATION_CHOICES)[
        faker.number.int({min: 0, max: Object.values(ORIENTATION_CHOICES).length - 1})
      ],
  )
  neurotype = Array.from(
    {length: faker.number.int({min: 1, max: 2})},
    () =>
      Object.values(NEUROTYPE_CHOICES)[
        faker.number.int({min: 0, max: Object.values(NEUROTYPE_CHOICES).length - 1})
      ],
  )
  accessibility_notes = faker.lorem.sentence()
  pref_age = {
    min: faker.number.int({min: 18, max: 27}),
    max: faker.number.int({min: 36, max: 68}),
  }
  has_kids = faker.number.int({min: 0, max: 5})
  wants_kids_strength = faker.number.int({min: 0, max: 4})
  is_smoker = faker.datatype.boolean()
  relationship_status = Object.values(RELATIONSHIP_STATUS_CHOICES)
  pref_relation_styles = Object.values(RELATIONSHIP_CHOICES)
  pref_romantic_styles = Object.values(ROMANTIC_CHOICES)
  languages = Object.values(LANGUAGE_CHOICES)
  political_beliefs = Object.values(POLITICAL_CHOICES)
  religion = Object.values(RELIGION_CHOICES)
  diet = Object.values(DIET_CHOICES)
  drinks_per_month = faker.number.int({min: 4, max: 40})
  height_in_inches = faker.number.float({min: 56, max: 78, fractionDigits: 2})
  ethnicity = Object.values(RACE_CHOICES)
  education_level = Object.values(EDUCATION_CHOICES)
  company = faker.company.name()
  occupation_title = faker.person.jobTitle()
  university = faker.company.name()
  keywords = faker.lorem.word()
  headline = faker.lorem.words({min: 8, max: 16})

  cannabis = Object.values(CANNABIS_CHOICES)
  psychedelics = Object.values(PSYCHEDELICS_CHOICES)
  cannabis_intention = Object.values(SUBSTANCE_INTENTION_CHOICES)
  cannabis_pref = Object.values(SUBSTANCE_PREFERENCE_CHOICES)
  psychedelics_intention = Object.values(SUBSTANCE_INTENTION_CHOICES)
  psychedelics_pref = Object.values(SUBSTANCE_PREFERENCE_CHOICES)
  mbti = Object.values(MBTI_CHOICES)
  big5_openness = faker.number.int({min: 0, max: 100})
  big5_conscientiousness = faker.number.int({min: 0, max: 100})
  big5_extraversion = faker.number.int({min: 0, max: 100})
  big5_agreeableness = faker.number.int({min: 0, max: 100})
  big5_neuroticism = faker.number.int({min: 0, max: 100})

  randomElement(array: Array<string>) {
    return array[Math.floor(Math.random() * array.length)].toLowerCase()
  }
}

export default UserAccountInformationForSeeding
