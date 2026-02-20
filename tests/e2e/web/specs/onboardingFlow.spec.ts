import { test, expect } from "../fixtures/base";

test.describe('when given valid input', () => {
    test('should successfully complete the onboarding flow', async ({
        homePage,
        onboardingPage,
        signUpPage,
        authPage,
        profilePage,
        testAccount
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
        // TODO: fix?
        await signUpPage.fillUsername(testAccount.username + Date.now().toString());
        await signUpPage.clickNextButton();
        await signUpPage.fillBio(testAccount.bio);
        await signUpPage.clickNextButton();
        await signUpPage.chooseGender(testAccount.gender);
        await signUpPage.fillAge(testAccount.age);
        await signUpPage.fillHeight({feet: testAccount.height?.feet, inches: testAccount.height?.inches});
        await signUpPage.fillEthnicity(testAccount.ethnicity_origin);
        await signUpPage.fillInterestedInConnectingWith(testAccount.interested_in);
        await signUpPage.fillAgeRangeInterest(testAccount.Interested_in_ages?.min, testAccount.Interested_in_ages?.max);
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
        await signUpPage.setWorkArea(testAccount.work_area); //Is not displayed correctly
        await signUpPage.setPoliticalBeliefs(testAccount.beliefs?.political?.belief, testAccount.beliefs?.political?.details);
        await signUpPage.setReligiousBeliefs(testAccount.beliefs?.religious?.belief, testAccount.beliefs?.religious?.details);
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

        await profilePage.verifyDisplayNameAndAge(testAccount.display_name, testAccount.age);
        await profilePage.verifyGenderLocationHeight(
            testAccount.gender,
            undefined,
            testAccount.height?.feet,
            testAccount.height?.inches
        );
        await profilePage.verifyIntrestedInConnectingWith(
            testAccount.interested_in,
            testAccount.Interested_in_ages?.min,
            testAccount.Interested_in_ages?.max
        );
        await profilePage.verifyRelationShipTypeAndInterest(testAccount.connection_type, testAccount.relationship_style);
        await profilePage.verifyRelationshipStatus(testAccount.relationship_status);
        await profilePage.verifyCurrentNumberOfKids(testAccount.number_of_kids);
        await profilePage.verifyWantChildrenExpectation(testAccount.children_expectation);
        await profilePage.verifyInterests(testAccount.interests);
        await profilePage.verifyCauses(testAccount.causes);
        await profilePage.verifyEducationLevelAndUniversity(testAccount.education_level, testAccount.university);
        await profilePage.verifyJobInformation(testAccount.job_title, testAccount.company);
        await profilePage.verifyPoliticalBeliefs(testAccount.beliefs?.political?.belief, testAccount.beliefs?.political?.details);
        await profilePage.verifyReligiousBeliefs(testAccount.beliefs?.religious?.belief, testAccount.beliefs?.religious?.details);
        await profilePage.verifyPersonalityType(testAccount.personality_type);
        await profilePage.verifyBigFivePersonalitySection(testAccount.big_five_personality_traits);
        await profilePage.verifyDiet(testAccount.diet);
        await profilePage.verifySmoker(testAccount.is_smoker);
        await profilePage.verifyDrinksPerMonth(testAccount.alcohol_consumed_per_month);
        await profilePage.verifyLanguages(testAccount.languages);
        await profilePage.verifySocialMedia(testAccount.social_media);
    });
    test('should successfully skip the onboarding flow', async ({
        homePage,
        onboardingPage,
        signUpPage,
        authPage,
        profilePage,
        fakerAccount
    }) => {
        await homePage.gotToHomePage();
        await homePage.clickSignUpButton();
        await authPage.fillEmailField(fakerAccount.email);
        await authPage.fillPasswordField(fakerAccount.password);
        await authPage.clickSignUpWithEmailButton();
        await onboardingPage.clickSkipOnboardingButton();
        await signUpPage.fillDisplayName(fakerAccount.display_name);
        await signUpPage.fillUsername(fakerAccount.username);
        await signUpPage.clickNextButton();
        await signUpPage.clickNextButton(); //Skip bio
        await signUpPage.clickNextButton(); //Skip optional information
        // TODO: fix below
        // await profilePage.clickCloseButton();
        // await onboardingPage.clickRefineProfileButton();
    });
});

test.describe('when an error occurs', () => {
    test('placeholder', async () => {});
});