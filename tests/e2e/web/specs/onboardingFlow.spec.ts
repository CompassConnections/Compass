import {userInformationFromDb} from '../../utils/databaseUtils'
import {expect, test} from '../fixtures/base'
import {
  deleteProfileFromSettings,
  registerWithEmail,
  skipOnboardingHeadToProfile
} from '../utils/testCleanupHelpers'

test.describe('when given valid input', () => {
  test('should successfully complete the onboarding flow with email', async ({
    homePage,
    onboardingPage,
    signUpPage,
    authPage,
    profilePage,
    onboardingAccount,
  }) => {
    console.log(
      `Starting "should successfully complete the onboarding flow with email" with ${onboardingAccount.username}`,
    )
    await registerWithEmail(homePage,authPage,onboardingAccount)
    await onboardingPage.clickContinueButton() //First continue
    await onboardingPage.clickContinueButton() //Second continue
    await onboardingPage.clickGetStartedButton()
    await signUpPage.fillDisplayName(onboardingAccount.display_name)
    await signUpPage.fillUsername(onboardingAccount.username)
    await signUpPage.clickNextButton()
    await signUpPage.chooseGender(onboardingAccount.gender)
    await signUpPage.fillAge(onboardingAccount.age)
    await signUpPage.fillHeight({
      feet: onboardingAccount.height?.feet,
      inches: onboardingAccount.height?.inches,
    })
    await signUpPage.fillEthnicity(onboardingAccount.ethnicity_origin)
    await signUpPage.fillHeadline(onboardingAccount.headline)
    await signUpPage.fillKeywords(onboardingAccount.keywords)
    await signUpPage.fillInterestedInConnectingWith(onboardingAccount.interested_in)
    await signUpPage.fillAgeRangeInterest(
      onboardingAccount.Interested_in_ages?.min,
      onboardingAccount.Interested_in_ages?.max,
    )
    await signUpPage.setConnectionType(onboardingAccount.connection_type)
    await signUpPage.setRelationshipStatus(onboardingAccount.relationship_status)
    await signUpPage.setRelationshipStyle(onboardingAccount.relationship_style)
    await signUpPage.fillCurrentNumberOfChildren(onboardingAccount.number_of_kids)
    await signUpPage.setWantChildrenExpectation(onboardingAccount.children_expectation)
    await signUpPage.setInterests(onboardingAccount.interests)
    await signUpPage.setCauses(onboardingAccount.causes)
    await signUpPage.setHighestEducationLevel(onboardingAccount.education_level)
    await signUpPage.fillUniversity(onboardingAccount.university)
    await signUpPage.fillJobTitle(onboardingAccount.job_title)
    await signUpPage.fillCompany(onboardingAccount.company)
    await signUpPage.setWorkArea(onboardingAccount.work_area)
    await signUpPage.setPoliticalBeliefs(
      onboardingAccount.beliefs?.political?.belief,
      onboardingAccount.beliefs?.political?.details,
    )
    await signUpPage.setReligiousBeliefs(
      onboardingAccount.beliefs?.religious?.belief,
      onboardingAccount.beliefs?.religious?.details,
    )
    await signUpPage.setPersonalityType(onboardingAccount.personality_type)
    await signUpPage.setOpennessPersonalityValue(
      onboardingAccount.big_five_personality_traits?.openness,
    )
    await signUpPage.setAgreeablenessPersonalityValue(
      onboardingAccount.big_five_personality_traits?.agreeableness,
    )
    await signUpPage.setConscientiousnessPersonalityValue(
      onboardingAccount.big_five_personality_traits?.conscientiousness,
    )
    await signUpPage.setExtraversionPersonalityValue(
      onboardingAccount.big_five_personality_traits?.extraversion,
    )
    await signUpPage.setNeuroticismPersonalityValue(
      onboardingAccount.big_five_personality_traits?.neuroticism,
    )
    await signUpPage.setDietType(onboardingAccount.diet)
    await signUpPage.setIsSmoker(onboardingAccount.is_smoker)
    await signUpPage.fillAlcoholPerMonth(onboardingAccount.alcohol_consumed_per_month)
    await signUpPage.setLanguages(onboardingAccount.languages)
    await signUpPage.addSocialMediaPlatform(onboardingAccount.social_media)
    await signUpPage.fillBio(onboardingAccount.bio)
    await signUpPage.clickNextButton()
    await profilePage.clickCloseButton()
    await onboardingPage.clickRefineProfileButton()
    await profilePage.clickAnswerQuestionsButton()
    const compatQuestionOne = await profilePage.answerCompatibilityQuestion(
      onboardingAccount.compatibility,
    )
    await profilePage.clickNextCompatibilityQuestionButton()
    await profilePage.clickSkipCompatibilityQuestionButton()
    await profilePage.clickSkipCompatibilityQuestionButton()

    await profilePage.clickCloseButton()

    //Verify information is correct
    await profilePage.verifyDisplayName(onboardingAccount.display_name)
    await profilePage.verifyHeadline(onboardingAccount.headline)
    await profilePage.verifyKeywords(onboardingAccount.keywords)
    await profilePage.verifyGenderLocationHeightAge(
      onboardingAccount.gender,
      undefined,
      onboardingAccount.height?.feet,
      onboardingAccount.height?.inches,
      onboardingAccount.age,
    )
    await profilePage.verifySeeking(
      onboardingAccount.interested_in,
      onboardingAccount.Interested_in_ages?.min,
      onboardingAccount.Interested_in_ages?.max,
      onboardingAccount.connection_type,
      onboardingAccount.relationship_style,
    )
    await profilePage.verifyRelationshipStatus(onboardingAccount.relationship_status)
    await profilePage.verifyCurrentNumberOfKids(onboardingAccount.number_of_kids)
    await profilePage.verifyWantChildrenExpectation(onboardingAccount.children_expectation)
    await profilePage.verifyInterests(onboardingAccount.interests)
    await profilePage.verifyCauses(onboardingAccount.causes)
    await profilePage.verifyEducationLevelAndUniversity(
      onboardingAccount.education_level,
      onboardingAccount.university,
    )
    await profilePage.verifyJobInformation(onboardingAccount.job_title, onboardingAccount.company)
    await profilePage.verifyWorkArea(onboardingAccount.work_area)
    await profilePage.verifyPoliticalBeliefs(
      onboardingAccount.beliefs?.political?.belief,
      onboardingAccount.beliefs?.political?.details,
    )
    await profilePage.verifyReligiousBeliefs(
      onboardingAccount.beliefs?.religious?.belief,
      onboardingAccount.beliefs?.religious?.details,
    )
    await profilePage.verifyPersonalityType(onboardingAccount.personality_type)
    await profilePage.verifyBigFivePersonalitySection(onboardingAccount.big_five_personality_traits)
    await profilePage.verifyDiet(onboardingAccount.diet)
    await profilePage.verifySmoker(onboardingAccount.is_smoker)
    await profilePage.verifyDrinksPerMonth(onboardingAccount.alcohol_consumed_per_month)
    await profilePage.verifyLanguages(onboardingAccount.languages)
    await profilePage.verifySocialMedia(onboardingAccount.social_media)
    await profilePage.verifyBio(onboardingAccount.bio)
    await profilePage.verifyCompatibilityAnswers(compatQuestionOne)

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
    homePage,
    onboardingPage,
    signUpPage,
    authPage,
    profilePage,
    googleAccountOne,
    headless,
  }) => {
    console.log(
      `Starting "should successfully complete the onboarding flow with google account" with ${googleAccountOne.username}`,
    )
    test.skip(headless, 'Google popup auth test requires headed mode')
    await homePage.goToRegisterPage()
    await authPage.fillPasswordField('') //The test only passes when this is added...something is weird here
    await authPage.signInToGoogleAccount(
      googleAccountOne.email,
      googleAccountOne.display_name,
      googleAccountOne.username,
    )
    await skipOnboardingHeadToProfile(onboardingPage, signUpPage, profilePage, googleAccountOne)

    //Verify displayed information is correct
    await profilePage.verifyDisplayName(googleAccountOne.display_name)

    //Verify database info
    const dbInfo = await userInformationFromDb(googleAccountOne)

    await expect(dbInfo.user.name).toContain(googleAccountOne.display_name)
    await expect(dbInfo.user.username).toContain(googleAccountOne.username)
  })

  test('should successfully skip the onboarding flow', async ({
    homePage,
    onboardingPage,
    signUpPage,
    authPage,
    profilePage,
    fakerAccount,
  }) => {
    console.log(
      `Starting "should successfully skip the onboarding flow" with ${fakerAccount.username}`,
    )
    await registerWithEmail(homePage, authPage, fakerAccount)
    await skipOnboardingHeadToProfile(onboardingPage, signUpPage, profilePage, fakerAccount)

    //Verify displayed information is correct
    await profilePage.verifyDisplayName(fakerAccount.display_name)

    //Verify database info
    const dbInfo = await userInformationFromDb(fakerAccount)

    await expect(dbInfo.user.name).toContain(fakerAccount.display_name)
    await expect(dbInfo.user.username).toContain(fakerAccount.username)
  })

  test('should successfully delete an account created via email and password', async ({
    homePage,
    onboardingPage,
    signUpPage,
    authPage,
    profilePage,
    settingsPage,
    fakerAccount,
  }) => {
    console.log(
      `Starting "should successfully delete an account created via email and password" with ${fakerAccount.username}`,
    )
    await registerWithEmail(homePage, authPage, fakerAccount)
    await skipOnboardingHeadToProfile(onboardingPage, signUpPage, profilePage, fakerAccount)

    //Verify displayed information is correct
    await profilePage.verifyDisplayName(fakerAccount.display_name)

    //Verify database info
    const dbInfo = await userInformationFromDb(fakerAccount)

    await expect(dbInfo.user.name).toContain(fakerAccount.display_name)
    await expect(dbInfo.user.username).toContain(fakerAccount.username)

    await deleteProfileFromSettings(homePage, settingsPage)
  })

  test('should successfully delete an account created via google auth', async ({
    homePage,
    onboardingPage,
    signUpPage,
    authPage,
    profilePage,
    settingsPage,
    googleAccountTwo,
    headless,
  }) => {
    console.log(
      `Starting "should successfully delete an account created via google auth" with ${googleAccountTwo.username}`,
    )
    test.skip(headless, 'Google popup auth test requires headed mode')
    await homePage.goToRegisterPage()
    await authPage.fillPasswordField('') //The test only passes when this is added...something is weird here
    await authPage.signInToGoogleAccount(
      googleAccountTwo.email,
      googleAccountTwo.display_name,
      googleAccountTwo.username,
    )
    await skipOnboardingHeadToProfile(onboardingPage, signUpPage, profilePage, googleAccountTwo)

    //Verify displayed information is correct
    await profilePage.verifyDisplayName(googleAccountTwo.display_name)

    //Verify database info
    const dbInfo = await userInformationFromDb(googleAccountTwo)

    await expect(dbInfo.user.name).toContain(googleAccountTwo.display_name)
    await expect(dbInfo.user.username).toContain(googleAccountTwo.username)

    await deleteProfileFromSettings(homePage, settingsPage)
  })

  test('should successfully enter optional information after completing flow', async ({
    homePage,
    onboardingPage,
    signUpPage,
    authPage,
    profilePage,
    fakerAccount,
  }) => {
    console.log(
      `Starting "should successfully enter optional information after completing flow" with ${fakerAccount.username}`,
    )
    await registerWithEmail(homePage, authPage, fakerAccount)
    await skipOnboardingHeadToProfile(onboardingPage, signUpPage,profilePage, fakerAccount)
    await profilePage.clickEditProfileButton()
    await signUpPage.chooseGender(fakerAccount.gender)
    await signUpPage.fillAge(fakerAccount.age)
    await signUpPage.fillHeight({
      feet: fakerAccount.height?.feet,
      inches: fakerAccount.height?.inches,
    })
    await signUpPage.saveProfileChanges()

    //Verify displayed information is correct
    await profilePage.verifyDisplayName(fakerAccount.display_name)
    await profilePage.verifyGenderLocationHeightAge(
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
    homePage,
    onboardingPage,
    signUpPage,
    authPage,
    profilePage,
    fakerAccount,
    onboardingAccount,
  }) => {
    console.log(
      `Starting "should successfully use the start answering option" with ${fakerAccount.username}`,
    )
    await registerWithEmail(homePage, authPage, fakerAccount)
    await onboardingPage.clickSkipOnboardingButton()
    await signUpPage.fillDisplayName(fakerAccount.display_name)
    await signUpPage.fillUsername(fakerAccount.username)
    await signUpPage.clickNextButton()
    await signUpPage.clickNextButton() //Skip optional information
    await profilePage.clickStartAnsweringButton()
    const compatTwoQuestionOne = await profilePage.answerCompatibilityQuestion(
      onboardingAccount.compatibility,
    )
    await profilePage.clickNextCompatibilityQuestionButton()
    await profilePage.clickCloseButton()
    await onboardingPage.clickRefineProfileButton()

    //Verify displayed information is correct
    await profilePage.verifyDisplayName(fakerAccount.display_name)
    await profilePage.verifyCompatibilityAnswers(compatTwoQuestionOne)

    //Verify database info
    const dbInfo = await userInformationFromDb(fakerAccount)

    await expect(dbInfo.user.name).toContain(fakerAccount.display_name)
    await expect(dbInfo.user.username).toContain(fakerAccount.username)
  })

  test.describe('should successfully complete the onboarding flow after using the back button', () => {
    test("the first time it's an option", async ({
      homePage,
      authPage,
      onboardingPage,
      signUpPage,
      profilePage,
      fakerAccount,
    }) => {
      console.log(`Starting "the first time its an option" with ${fakerAccount.username}`)
      await registerWithEmail(homePage, authPage, fakerAccount)
      await onboardingPage.clickContinueButton()
      await onboardingPage.clickBackButton()
      await onboardingPage.clickContinueButton()
      await onboardingPage.clickContinueButton()
      await onboardingPage.clickGetStartedButton()
      await signUpPage.fillDisplayName(fakerAccount.display_name)
      await signUpPage.fillUsername(fakerAccount.username)
      await signUpPage.clickNextButton()
      await signUpPage.clickNextButton() //Skip optional information
      await profilePage.clickCloseButton()
      await onboardingPage.clickRefineProfileButton()

      //Verify displayed information is correct
      await profilePage.verifyDisplayName(fakerAccount.display_name)

      //Verify database info
      const dbInfo = await userInformationFromDb(fakerAccount)

      await expect(dbInfo.user.name).toContain(fakerAccount.display_name)
      await expect(dbInfo.user.username).toContain(fakerAccount.username)
    })

    test("the second time it's an option", async ({
      homePage,
      authPage,
      onboardingPage,
      signUpPage,
      profilePage,
      fakerAccount,
    }) => {
      console.log(`Starting "the second time its an option" with ${fakerAccount.username}`)
      await registerWithEmail(homePage, authPage, fakerAccount)
      await onboardingPage.clickContinueButton()
      await onboardingPage.clickContinueButton()
      await onboardingPage.clickBackButton()
      await onboardingPage.clickContinueButton()
      await onboardingPage.clickGetStartedButton()
      await signUpPage.fillDisplayName(fakerAccount.display_name)
      await signUpPage.fillUsername(fakerAccount.username)
      await signUpPage.clickNextButton()
      await signUpPage.clickNextButton() //Skip optional information
      await profilePage.clickCloseButton()
      await onboardingPage.clickRefineProfileButton()

      //Verify displayed information is correct
      await profilePage.verifyDisplayName(fakerAccount.display_name)

      //Verify database info
      const dbInfo = await userInformationFromDb(fakerAccount)

      await expect(dbInfo.user.name).toContain(fakerAccount.display_name)
      await expect(dbInfo.user.username).toContain(fakerAccount.username)
    })
  })
})

test.describe('when an error occurs', () => {
  test('placeholder', async ({}) => {})
})
