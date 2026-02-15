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
        await signUpPage.fillUsername(testAccount.username);
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
        await signUpPage.setWorkArea(testAccount.work_area);
        await signUpPage.setPoliticalBeliefs(testAccount.beliefs?.political?.belief);
        await signUpPage.setReligiousBeliefs(testAccount.beliefs?.religious?.belief);
        await signUpPage.setPersonalityType(testAccount.personality_type);
        await signUpPage.setDietType(testAccount.diet);
        await signUpPage.setIsSmoker(testAccount.is_smoker);
        await signUpPage.fillAlcoholPerMonth(testAccount.alcohol_consumed_per_month);
        await signUpPage.setLanguages(testAccount.languages);
        await signUpPage.addSocialMediaPlatform(testAccount.social_media);
        await signUpPage.clickNextButton();
        await profilePage.clickCloseButton();
        await onboardingPage.clickRefineProfileButton();
        await expect(
            profilePage.page.getByText(
                `Interested in ${testAccount.interested_in?.toLowerCase()} between ${testAccount.Interested_in_ages?.min} - ${testAccount.Interested_in_ages?.max} years old`,
                { exact: true })).toBeVisible();
    });
});

test.describe('when an error occurs', () => {
    test('placeholder', async () => {});
});