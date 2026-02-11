import { test, expect } from "../fixtures/base";

test.describe('when given valid input', () => {
    test('should successfully complete the onboarding flow', async ({
        homePage,
        onboardingPage,
        signUpPage,
        authPage,
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
    });
});

test.describe('when an error occurs', () => {
    test('placeholder', async () => {});
});