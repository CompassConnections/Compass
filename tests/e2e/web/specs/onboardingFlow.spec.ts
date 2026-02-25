import {test, expect} from '../fixtures/base'
import { userInformationFromDb } from "../../utils/databaseUtils";


test.describe('when given valid input', () => {
  test('should successfully complete the onboarding flow', async ({
    homePage,
    onboardingPage,
    signUpPage,
    authPage,
    profilePage,
    testAccount,
  }) => {
    await homePage.gotToHomePage();
    await homePage.clickSignUpButton();
    await authPage.fillEmailField(testAccount.email);
    await authPage.fillPasswordField(testAccount.password);
    await authPage.clickSignUpWithEmailButton();
    await onboardingPage.clickContinueButton(); //First continue
    await onboardingPage.clickContinueButton(); //Second continue
    await onboardingPage.clickGetStartedButton();
    await signUpPage.fillDisplayName(testAccount.display_name);
    await signUpPage.fillUsername(testAccount.username + Date.now().toString());
    await signUpPage.clickNextButton();
    await signUpPage.fillBio(testAccount.bio);
    await signUpPage.clickNextButton();
    await signUpPage.chooseGender(testAccount.gender);
    await signUpPage.fillAge(testAccount.age);
    await signUpPage.fillHeight({
      feet: testAccount.height?.feet,
      inches: testAccount.height?.inches,
    });
    await signUpPage.fillEthnicity(testAccount.ethnicity_origin);
    await signUpPage.fillInterestedInConnectingWith(testAccount.interested_in);
    await signUpPage.fillAgeRangeInterest(
      testAccount.Interested_in_ages?.min,
      testAccount.Interested_in_ages?.max,
    );
    await signUpPage.setConnectionType(testAccount.connection_type);
    await signUpPage.setRelationshipStatus(testAccount.relationship_status);
    await signUpPage.setRelationshipStyle(testAccount.relationship_style);
    await signUpPage.fillCurrentNumberOfChildren(testAccount.number_of_kids);
    await signUpPage.setWantChildrenExpectation(testAccount.children_expectation);
    await signUpPage.setInterests(testAccount.interests);
    await signUpPage.setCauses(testAccount.causes);
    await signUpPage.setHighestEducationLevel(testAccount.education_level);
    await signUpPage.fillUniversity(testAccount.university);
    await signUpPage.fillJobTitle(testAccount.job_title);
    await signUpPage.fillCompany(testAccount.company);
    await signUpPage.setWorkArea(testAccount.work_area);
    await signUpPage.setPoliticalBeliefs(
      testAccount.beliefs?.political?.belief,
      testAccount.beliefs?.political?.details,
    );
    await signUpPage.setReligiousBeliefs(
      testAccount.beliefs?.religious?.belief,
      testAccount.beliefs?.religious?.details,
    );
    await signUpPage.setPersonalityType(testAccount.personality_type);
    await signUpPage.setOpennessPersonalityValue(testAccount.big_five_personality_traits?.openness);
    await signUpPage.setDietType(testAccount.diet);
    await signUpPage.setIsSmoker(testAccount.is_smoker);
    await signUpPage.fillAlcoholPerMonth(testAccount.alcohol_consumed_per_month);
    await signUpPage.setLanguages(testAccount.languages);
    await signUpPage.addSocialMediaPlatform(testAccount.social_media);
    await signUpPage.clickNextButton();
    await profilePage.clickCloseButton();
    await onboardingPage.clickRefineProfileButton();
    
    //Verify information is correct
    await profilePage.verifyDisplayNameAndAge(testAccount.display_name, testAccount.age);
    await profilePage.verifyGenderLocationHeight(
      testAccount.gender,
      undefined,
      testAccount.height?.feet,
      testAccount.height?.inches,
    );
    await profilePage.verifyIntrestedInConnectingWith(
      testAccount.interested_in,
      testAccount.Interested_in_ages?.min,
      testAccount.Interested_in_ages?.max,
    );
    await profilePage.verifyRelationShipTypeAndInterest(
      testAccount.connection_type,
      testAccount.relationship_style,
    );
    await profilePage.verifyRelationshipStatus(testAccount.relationship_status);
    await profilePage.verifyCurrentNumberOfKids(testAccount.number_of_kids);
    await profilePage.verifyWantChildrenExpectation(testAccount.children_expectation);
    await profilePage.verifyInterests(testAccount.interests);
    await profilePage.verifyCauses(testAccount.causes);
    await profilePage.verifyEducationLevelAndUniversity(
      testAccount.education_level,
      testAccount.university,
    );
    await profilePage.verifyJobInformation(testAccount.job_title, testAccount.company);
    await profilePage.verifyWorkArea(testAccount.work_area);
    await profilePage.verifyPoliticalBeliefs(
      testAccount.beliefs?.political?.belief,
      testAccount.beliefs?.political?.details,
    );
    await profilePage.verifyReligiousBeliefs(
      testAccount.beliefs?.religious?.belief,
      testAccount.beliefs?.religious?.details,
    );
    await profilePage.verifyPersonalityType(testAccount.personality_type);
    await profilePage.verifyBigFivePersonalitySection(testAccount.big_five_personality_traits);
    await profilePage.verifyDiet(testAccount.diet);
    await profilePage.verifySmoker(testAccount.is_smoker);
    await profilePage.verifyDrinksPerMonth(testAccount.alcohol_consumed_per_month);
    await profilePage.verifyLanguages(testAccount.languages);
    await profilePage.verifySocialMedia(testAccount.social_media);

    //Verify Database Information
    const dbInfo = await userInformationFromDb(testAccount);
    console.log(dbInfo);

    await expect(dbInfo.user.name).toBe(testAccount.display_name);
    await expect(dbInfo.user.username).toContain(testAccount.username);
    // await expect(dbInfo.profile.bio).toContain(testAccount.bio); //Need to sort out the bio locator
    await expect(dbInfo.profile.gender).toEqual(`female`);
    await expect(String(dbInfo.profile.age)).toEqual(testAccount.age);
    await expect(dbInfo.profile.height_in_inches).toEqual(Number(testAccount.height?.feet) * 12);
    await expect(dbInfo.profile.ethnicity).toContain('south_asian');
    await expect(dbInfo.profile.pref_gender).toContain('male');
    await expect(String(dbInfo.profile.pref_age_min)).toContain(testAccount.Interested_in_ages?.min);
    await expect(String(dbInfo.profile.pref_age_max)).toContain(testAccount.Interested_in_ages?.max);
    await expect(dbInfo.profile.pref_relation_styles).toContain(`${testAccount.connection_type}`.toLowerCase());
    await expect(dbInfo.profile.relationship_status).toContain(`open`);
    await expect(dbInfo.profile.pref_romantic_styles).toContain(`open`);
    await expect(dbInfo.profile.has_kids).toEqual(Number(testAccount.number_of_kids));
    await expect(dbInfo.profile.wants_kids_strength).toEqual(testAccount.children_expectation?.[1]);
    await expect(dbInfo.profile.education_level).toContain(`${testAccount.education_level}`.toLowerCase());
    await expect(dbInfo.profile.university).toContain(testAccount.university);
    await expect(dbInfo.profile.occupation_title).toContain(testAccount.job_title);
    await expect(dbInfo.profile.company).toContain(testAccount.company);
    await expect(dbInfo.profile.political_beliefs).toContain('green');
    await expect(dbInfo.profile.political_details).toContain(testAccount.beliefs?.political?.details);
    await expect(dbInfo.profile.religion).toContain('shinto');
    await expect(dbInfo.profile.religious_beliefs).toContain(testAccount.beliefs?.religious?.details);
    await expect(dbInfo.profile.mbti).toContain(`${testAccount.personality_type}`.toLowerCase());
    await expect(dbInfo.profile.big5_openness).toEqual(testAccount.big_five_personality_traits?.openness);
    await expect(dbInfo.profile.diet).toContain(`${testAccount.diet}`.toLowerCase());
    await expect(dbInfo.profile.is_smoker).toEqual(testAccount.is_smoker);
    await expect(dbInfo.profile.languages).toHaveLength(2);
    await expect(dbInfo.profile.languages).toEqual(
      expect.arrayContaining(testAccount.languages?.map(l => l.toLowerCase()) ?? [])
    );
    await expect(String(dbInfo.profile.drinks_per_month)).toEqual(testAccount.alcohol_consumed_per_month);
    
  });
  
  test('should successfully skip the onboarding flow', async ({
    homePage,
    onboardingPage,
    signUpPage,
    authPage,
    profilePage,
    fakerAccount,
  }) => {
    await homePage.gotToHomePage()
    await homePage.clickSignUpButton()
    await authPage.fillEmailField(fakerAccount.email)
    await authPage.fillPasswordField(fakerAccount.password)
    await authPage.clickSignUpWithEmailButton()
    await onboardingPage.clickSkipOnboardingButton()
    await signUpPage.fillDisplayName(fakerAccount.display_name)
    await signUpPage.fillUsername(fakerAccount.username)
    await signUpPage.clickNextButton()
    await signUpPage.clickNextButton() //Skip bio
    await signUpPage.clickNextButton() //Skip optional information
    await profilePage.clickCloseButton();
    await onboardingPage.clickRefineProfileButton();

    const dbInfo = await userInformationFromDb(fakerAccount);

    await expect(dbInfo.user.name).toContain(fakerAccount.display_name);
    await expect(dbInfo.user.username).toContain(fakerAccount.username);

  });

  test.describe('should successfully complete the onboarding flow after using the back button', () => {
    test.beforeEach(async ({homePage, authPage, fakerAccount}) => {
      await homePage.gotToHomePage()
      await homePage.clickSignUpButton()
      await authPage.fillEmailField(fakerAccount.email)
      await authPage.fillPasswordField(fakerAccount.password)
      await authPage.clickSignUpWithEmailButton()
    });

    test('the first time its an option', async ({
      onboardingPage,
      signUpPage,
      profilePage,
      fakerAccount,
    }) => {
      await onboardingPage.clickContinueButton();
      await onboardingPage.clickBackButton();
      await onboardingPage.clickContinueButton();
      await onboardingPage.clickContinueButton();
      await onboardingPage.clickGetStartedButton();
      await signUpPage.fillDisplayName(fakerAccount.display_name)
      await signUpPage.fillUsername(fakerAccount.username)
      await signUpPage.clickNextButton()
      await signUpPage.clickNextButton() //Skip bio
      await signUpPage.clickNextButton() //Skip optional information
      await profilePage.clickCloseButton();
      await onboardingPage.clickRefineProfileButton();
  
      const dbInfo = await userInformationFromDb(fakerAccount);
  
      await expect(dbInfo.user.name).toContain(fakerAccount.display_name);
      await expect(dbInfo.user.username).toContain(fakerAccount.username);
    });

    test('the second time its an option', async ({
      onboardingPage,
      signUpPage,
      profilePage,
      fakerAccount,
    }) => {
      await onboardingPage.clickContinueButton();
      await onboardingPage.clickContinueButton();
      await onboardingPage.clickBackButton();
      await onboardingPage.clickContinueButton();
      await onboardingPage.clickGetStartedButton();
      await signUpPage.fillDisplayName(fakerAccount.display_name)
      await signUpPage.fillUsername(fakerAccount.username)
      await signUpPage.clickNextButton()
      await signUpPage.clickNextButton() //Skip bio
      await signUpPage.clickNextButton() //Skip optional information
      await profilePage.clickCloseButton();
      await onboardingPage.clickRefineProfileButton();
  
      const dbInfo = await userInformationFromDb(fakerAccount);
  
      await expect(dbInfo.user.name).toContain(fakerAccount.display_name);
      await expect(dbInfo.user.username).toContain(fakerAccount.username);
    });
  });
});

test.describe('when an error occurs', () => {
  test('placeholder', async () => {});
});
