import {userInformationFromDb} from '../../utils/databaseUtils'
import {expect, test} from '../fixtures/base'

test.describe('when given valid input', () => {
  test('should successfully complete the onboarding flow with email', async ({
    app,
    onboardingAccount,
  }) => {
    await app.registerWithEmail(onboardingAccount)
    await app.onboarding.clickContinueButton() //First continue
    await app.onboarding.clickContinueButton() //Second continue
    await app.onboarding.clickGetStartedButton()
    await app.signUp.fillDisplayName(onboardingAccount.display_name)
    await app.signUp.fillUsername(onboardingAccount.username)
    await app.signUp.clickNextButton()
    await app.signUp.chooseGender(onboardingAccount.gender)
    await app.signUp.fillAge(onboardingAccount.age)
    await app.signUp.fillHeight({
      feet: onboardingAccount.height?.feet,
      inches: onboardingAccount.height?.inches,
    })
    await app.signUp.fillEthnicity(onboardingAccount.ethnicity_origin)
    await app.signUp.fillHeadline(onboardingAccount.headline)
    await app.signUp.fillKeywords(onboardingAccount.keywords)
    await app.signUp.fillInterestedInConnectingWith(onboardingAccount.interested_in)
    await app.signUp.fillAgeRangeInterest(
      onboardingAccount.Interested_in_ages?.min,
      onboardingAccount.Interested_in_ages?.max,
    )
    await app.signUp.setConnectionType(onboardingAccount.connection_type)
    await app.signUp.setRelationshipStatus(onboardingAccount.relationship_status)
    await app.signUp.setRelationshipStyle(onboardingAccount.relationship_style)
    await app.signUp.fillCurrentNumberOfChildren(onboardingAccount.number_of_kids)
    await app.signUp.setWantChildrenExpectation(onboardingAccount.children_expectation)
    await app.signUp.setInterests(onboardingAccount.interests)
    await app.signUp.setCauses(onboardingAccount.causes)
    await app.signUp.setHighestEducationLevel(onboardingAccount.education_level)
    await app.signUp.fillUniversity(onboardingAccount.university)
    await app.signUp.fillJobTitle(onboardingAccount.job_title)
    await app.signUp.fillCompany(onboardingAccount.company)
    await app.signUp.setWorkArea(onboardingAccount.work_area)
    await app.signUp.setPoliticalBeliefs(
      onboardingAccount.beliefs?.political?.belief,
      onboardingAccount.beliefs?.political?.details,
    )
    await app.signUp.setReligiousBeliefs(
      onboardingAccount.beliefs?.religious?.belief,
      onboardingAccount.beliefs?.religious?.details,
    )
    await app.signUp.setPersonalityType(onboardingAccount.personality_type)
    await app.signUp.setOpennessPersonalityValue(
      onboardingAccount.big_five_personality_traits?.openness,
    )
    await app.signUp.setAgreeablenessPersonalityValue(
      onboardingAccount.big_five_personality_traits?.agreeableness,
    )
    await app.signUp.setConscientiousnessPersonalityValue(
      onboardingAccount.big_five_personality_traits?.conscientiousness,
    )
    await app.signUp.setExtraversionPersonalityValue(
      onboardingAccount.big_five_personality_traits?.extraversion,
    )
    await app.signUp.setNeuroticismPersonalityValue(
      onboardingAccount.big_five_personality_traits?.neuroticism,
    )
    await app.signUp.setDietType(onboardingAccount.diet)
    await app.signUp.setIsSmoker(onboardingAccount.is_smoker)
    await app.signUp.fillAlcoholPerMonth(onboardingAccount.alcohol_consumed_per_month)
    await app.signUp.setLanguages(onboardingAccount.languages)
    await app.signUp.addSocialMediaPlatform(onboardingAccount.social_media)
    await app.signUp.fillBio(onboardingAccount.bio)
    await app.signUp.clickNextButton()
    await app.profile.clickCloseButton()
    await app.onboarding.clickRefineProfileButton()
    await app.profile.clickAnswerQuestionsButton()
    const compatQuestionOne = await app.profile.answerCompatibilityQuestion(
      onboardingAccount.compatibility,
    )
    await app.profile.clickNextCompatibilityQuestionButton()
    await app.profile.clickSkipCompatibilityQuestionButton()
    await app.profile.clickSkipCompatibilityQuestionButton()

    await app.profile.clickCloseButton()

    //Verify information is correct
    await app.profile.verifyDisplayName(onboardingAccount.display_name)
    await app.profile.verifyHeadline(onboardingAccount.headline)
    await app.profile.verifyKeywords(onboardingAccount.keywords)
    await app.profile.verifyGenderLocationHeightAge(
      onboardingAccount.gender,
      undefined,
      onboardingAccount.height?.feet,
      onboardingAccount.height?.inches,
      onboardingAccount.age,
    )
    await app.profile.verifySeeking(
      onboardingAccount.interested_in,
      onboardingAccount.Interested_in_ages?.min,
      onboardingAccount.Interested_in_ages?.max,
      onboardingAccount.connection_type,
      onboardingAccount.relationship_style,
    )
    await app.profile.verifyRelationshipStatus(onboardingAccount.relationship_status)
    await app.profile.verifyCurrentNumberOfKids(onboardingAccount.number_of_kids)
    await app.profile.verifyWantChildrenExpectation(onboardingAccount.children_expectation)
    await app.profile.verifyInterests(onboardingAccount.interests)
    await app.profile.verifyCauses(onboardingAccount.causes)
    await app.profile.verifyEducationLevelAndUniversity(
      onboardingAccount.education_level,
      onboardingAccount.university,
    )
    await app.profile.verifyJobInformation(onboardingAccount.job_title, onboardingAccount.company)
    await app.profile.verifyWorkArea(onboardingAccount.work_area)
    await app.profile.verifyPoliticalBeliefs(
      onboardingAccount.beliefs?.political?.belief,
      onboardingAccount.beliefs?.political?.details,
    )
    await app.profile.verifyReligiousBeliefs(
      onboardingAccount.beliefs?.religious?.belief,
      onboardingAccount.beliefs?.religious?.details,
    )
    await app.profile.verifyPersonalityType(onboardingAccount.personality_type)
    await app.profile.verifyBigFivePersonalitySection(onboardingAccount.big_five_personality_traits)
    await app.profile.verifyDiet(onboardingAccount.diet)
    await app.profile.verifySmoker(onboardingAccount.is_smoker)
    await app.profile.verifyDrinksPerMonth(onboardingAccount.alcohol_consumed_per_month)
    await app.profile.verifyLanguages(onboardingAccount.languages)
    await app.profile.verifySocialMedia(onboardingAccount.social_media)
    await app.profile.verifyBio(onboardingAccount.bio)
    await app.profile.verifyCompatibilityAnswers(compatQuestionOne)

    //Verify Database Information
    const dbInfo = await userInformationFromDb(onboardingAccount)
    console.log(dbInfo.profile)

    await expect(dbInfo.user.name).toBe(onboardingAccount.display_name)
    await expect(dbInfo.user.username).toBe(onboardingAccount.username)
    await expect(dbInfo.profile.bio_text).toBe(onboardingAccount.bio)
    await expect(dbInfo.profile.gender).toEqual(onboardingAccount.gender?.[1])
    await expect(dbInfo.profile.headline).toEqual(onboardingAccount.headline)
    await expect(dbInfo.profile.keywords).toEqual(
      expect.arrayContaining(onboardingAccount.keywords?.split(', ') ?? []),
    )
    await expect(String(dbInfo.profile.age)).toEqual(onboardingAccount.age)
    await expect(dbInfo.profile.height_in_inches).toEqual(
      Number(onboardingAccount.height?.feet) * 12,
    )
    await expect(dbInfo.profile.ethnicity).toContain(onboardingAccount.ethnicity_origin?.[1])
    await expect(dbInfo.profile.pref_gender).toContain(onboardingAccount.interested_in?.[1])
    await expect(String(dbInfo.profile.pref_age_min)).toContain(
      onboardingAccount.Interested_in_ages?.min,
    )
    await expect(String(dbInfo.profile.pref_age_max)).toContain(
      onboardingAccount.Interested_in_ages?.max,
    )
    await expect(dbInfo.profile.pref_relation_styles).toContain(
      `${onboardingAccount.connection_type?.[1]}`.toLowerCase(),
    )
    await expect(dbInfo.profile.relationship_status).toContain(
      onboardingAccount.relationship_status?.[1],
    )
    await expect(dbInfo.profile.pref_romantic_styles).toContain(
      onboardingAccount.relationship_style?.[1],
    )
    await expect(dbInfo.profile.has_kids).toEqual(Number(onboardingAccount.number_of_kids))
    await expect(dbInfo.profile.wants_kids_strength).toEqual(
      onboardingAccount.children_expectation?.[1],
    )
    await expect(dbInfo.profile.education_level).toContain(
      `${onboardingAccount.education_level?.[1]}`.toLowerCase(),
    )
    await expect(dbInfo.profile.university).toContain(onboardingAccount.university)
    await expect(dbInfo.profile.occupation_title).toContain(onboardingAccount.job_title)
    await expect(dbInfo.profile.company).toContain(onboardingAccount.company)
    await expect(dbInfo.profile.political_beliefs).toContain(
      onboardingAccount.beliefs?.political?.belief?.[1],
    )
    await expect(dbInfo.profile.political_details).toContain(
      onboardingAccount.beliefs?.political?.details,
    )
    await expect(dbInfo.profile.religion).toContain(
      onboardingAccount.beliefs?.religious?.belief?.[1],
    )
    await expect(dbInfo.profile.religious_beliefs).toContain(
      onboardingAccount.beliefs?.religious?.details,
    )
    await expect(dbInfo.profile.mbti).toContain(
      `${onboardingAccount.personality_type}`.toLowerCase(),
    )
    await expect(dbInfo.profile.big5_openness).toEqual(
      onboardingAccount.big_five_personality_traits?.openness,
    )
    await expect(dbInfo.profile.big5_conscientiousness).toEqual(
      onboardingAccount.big_five_personality_traits?.conscientiousness,
    )
    await expect(dbInfo.profile.big5_extraversion).toEqual(
      onboardingAccount.big_five_personality_traits?.extraversion,
    )
    await expect(dbInfo.profile.big5_agreeableness).toEqual(
      onboardingAccount.big_five_personality_traits?.agreeableness,
    )
    await expect(dbInfo.profile.big5_neuroticism).toEqual(
      onboardingAccount.big_five_personality_traits?.neuroticism,
    )
    await expect(dbInfo.profile.diet).toContain(onboardingAccount.diet?.[1].toLowerCase())
    await expect(dbInfo.profile.is_smoker).toEqual(onboardingAccount.is_smoker)
    await expect(dbInfo.profile.languages).toHaveLength(2)
    await expect(dbInfo.profile.languages).toEqual(
      expect.arrayContaining(onboardingAccount.languages?.map(([_, l]) => l.toLowerCase()) ?? []),
    )
    await expect(String(dbInfo.profile.drinks_per_month)).toEqual(
      onboardingAccount.alcohol_consumed_per_month,
    )
  })

  test('should successfully complete the onboarding flow with google account', async ({
    app,
    googleAccountOne,
    headless,
  }) => {
    test.skip(headless, 'Google popup auth test requires headed mode')
    await app.home.goToRegisterPage()
    await app.auth.signInToGoogleAccount(
      googleAccountOne.email,
      googleAccountOne.display_name,
      googleAccountOne.username,
    )
    await app.skipOnboardingHeadToProfile(googleAccountOne)

    //Verify displayed information is correct
    await app.profile.verifyDisplayName(googleAccountOne.display_name)

    //Verify database info
    const dbInfo = await userInformationFromDb(googleAccountOne)

    await expect(dbInfo.user.name).toContain(googleAccountOne.display_name)
    await expect(dbInfo.user.username).toContain(googleAccountOne.username)
  })

  test('should successfully skip the onboarding flow', async ({app, fakerAccount}) => {
    await app.registerWithEmail(fakerAccount)
    await app.skipOnboardingHeadToProfile(fakerAccount)

    //Verify displayed information is correct
    await app.profile.verifyDisplayName(fakerAccount.display_name)

    //Verify database info
    const dbInfo = await userInformationFromDb(fakerAccount)

    await expect(dbInfo.user.name).toContain(fakerAccount.display_name)
    await expect(dbInfo.user.username).toContain(fakerAccount.username)
  })

  test('should successfully enter optional information after completing flow', async ({
    app,
    fakerAccount,
  }) => {
    await app.registerWithEmail(fakerAccount)
    await app.skipOnboardingHeadToProfile(fakerAccount)
    await app.profile.clickEditProfileButton()
    await app.signUp.chooseGender(fakerAccount.gender)
    await app.signUp.fillAge(fakerAccount.age)
    await app.signUp.fillHeight({
      feet: fakerAccount.height?.feet,
      inches: fakerAccount.height?.inches,
    })
    await app.signUp.saveProfileChanges()

    //Verify displayed information is correct
    await app.profile.verifyDisplayName(fakerAccount.display_name)
    await app.profile.verifyGenderLocationHeightAge(
      fakerAccount.gender,
      undefined,
      fakerAccount.height?.feet,
      fakerAccount.height?.inches,
      fakerAccount.age,
    )

    //Verify database info
    const dbInfo = await userInformationFromDb(fakerAccount)

    await expect(dbInfo.user.name).toContain(fakerAccount.display_name)
    await expect(dbInfo.user.username).toContain(fakerAccount.username)
    await expect(dbInfo.profile.gender).toEqual(fakerAccount.gender?.[1])
    await expect(String(dbInfo.profile.age)).toEqual(fakerAccount.age)
    await expect(dbInfo.profile.height_in_inches).toEqual(Number(fakerAccount.height?.feet) * 12)
  })

  test('should successfully use the start answering option', async ({
    app,
    fakerAccount,
    onboardingAccount,
  }) => {
    await app.registerWithEmail(fakerAccount)
    await app.onboarding.clickSkipOnboardingButton()
    await app.signUp.fillDisplayName(fakerAccount.display_name)
    await app.signUp.fillUsername(fakerAccount.username)
    await app.signUp.clickNextButton()
    await app.signUp.clickNextButton() //Skip optional information
    await app.profile.clickStartAnsweringButton()
    const compatTwoQuestionOne = await app.profile.answerCompatibilityQuestion(
      onboardingAccount.compatibility,
    )
    await app.profile.clickNextCompatibilityQuestionButton()
    await app.profile.clickCloseButton()
    await app.onboarding.clickRefineProfileButton()

    //Verify displayed information is correct
    await app.profile.verifyDisplayName(fakerAccount.display_name)
    await app.profile.verifyCompatibilityAnswers(compatTwoQuestionOne)

    //Verify database info
    const dbInfo = await userInformationFromDb(fakerAccount)

    await expect(dbInfo.user.name).toContain(fakerAccount.display_name)
    await expect(dbInfo.user.username).toContain(fakerAccount.username)
  })

  test.describe('should successfully complete the onboarding flow after using the back button', () => {
    test("the first time it's an option", async ({app, fakerAccount}) => {
      await app.registerWithEmail(fakerAccount)
      await app.onboarding.clickContinueButton()
      await app.onboarding.clickBackButton()
      await app.onboarding.clickContinueButton()
      await app.onboarding.clickContinueButton()
      await app.onboarding.clickGetStartedButton()
      await app.signUp.fillDisplayName(fakerAccount.display_name)
      await app.signUp.fillUsername(fakerAccount.username)
      await app.signUp.clickNextButton()
      await app.signUp.clickNextButton() //Skip optional information
      await app.profile.clickCloseButton()
      await app.onboarding.clickRefineProfileButton()

      //Verify displayed information is correct
      await app.profile.verifyDisplayName(fakerAccount.display_name)

      //Verify database info
      const dbInfo = await userInformationFromDb(fakerAccount)

      await expect(dbInfo.user.name).toContain(fakerAccount.display_name)
      await expect(dbInfo.user.username).toContain(fakerAccount.username)
    })

    test("the second time it's an option", async ({app, fakerAccount}) => {
      await app.registerWithEmail(fakerAccount)
      await app.onboarding.clickContinueButton()
      await app.onboarding.clickContinueButton()
      await app.onboarding.clickBackButton()
      await app.onboarding.clickContinueButton()
      await app.onboarding.clickGetStartedButton()
      await app.signUp.fillDisplayName(fakerAccount.display_name)
      await app.signUp.fillUsername(fakerAccount.username)
      await app.signUp.clickNextButton()
      await app.signUp.clickNextButton() //Skip optional information
      await app.profile.clickCloseButton()
      await app.onboarding.clickRefineProfileButton()

      //Verify displayed information is correct
      await app.profile.verifyDisplayName(fakerAccount.display_name)

      //Verify database info
      const dbInfo = await userInformationFromDb(fakerAccount)

      await expect(dbInfo.user.name).toContain(fakerAccount.display_name)
      await expect(dbInfo.user.username).toContain(fakerAccount.username)
    })
  })
})

// test.describe('when an error occurs', () => {
//   test('placeholder', async ({}) => {})
// })
