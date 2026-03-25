import {faker} from '@faker-js/faker'
import {
  CANNABIS_CHOICES,
  DIET_CHOICES,
  EDUCATION_CHOICES,
  POLITICAL_CHOICES,
  PSYCHEDELICS_CHOICES,
  RACE_CHOICES,
  RELATIONSHIP_CHOICES,
  RELIGION_CHOICES,
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
  gender = ['Female', 'Male', 'Other']

  pref_gender = ['Female', 'Male', 'Other']

  pref_age = {
    min: faker.number.int({min: 18, max: 27}),
    max: faker.number.int({min: 36, max: 68}),
  }

  pref_relation_styles = Object.values(RELATIONSHIP_CHOICES)
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

  cannabis = Object.values(CANNABIS_CHOICES)
  psychedelics = Object.values(PSYCHEDELICS_CHOICES)
  cannabis_intention = Object.values(SUBSTANCE_INTENTION_CHOICES)
  cannabis_pref = Object.values(SUBSTANCE_PREFERENCE_CHOICES)
  psychedelics_intention = Object.values(SUBSTANCE_INTENTION_CHOICES)
  psychedelics_pref = Object.values(SUBSTANCE_PREFERENCE_CHOICES)

  randomElement(array: Array<string>) {
    return array[Math.floor(Math.random() * array.length)].toLowerCase()
  }
}

export default UserAccountInformationForSeeding
