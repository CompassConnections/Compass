import { test as base } from "@playwright/test";
import { deleteUser } from "../utils/deleteUser";
import { onboarding, OnboardingUser } from "../utils/accountInformation";
import { OnboardingPage } from "../pages/onboardingPage";
import { HomePage } from "../pages/homePage";
import { ProfilePage } from "../pages/profilePage";
import { SignUpPage } from "../pages/signUpPage";
import { AuthPage } from "../pages/AuthPage";

export const test = base.extend<{
    homePage: HomePage,
    onboardingPage: OnboardingPage,
    signUpPage: SignUpPage,
    profilePage: ProfilePage,
    authPage: AuthPage,
    cleanUpUsers: void;
    testAccount: OnboardingUser
}>({
    testAccount: async({}, use) => {
        await use(onboarding.account_one)
    },
    onboardingPage: async ({page}, use) => {
        const onboardingPage = new OnboardingPage(page);
        await use(onboardingPage);
    },
    homePage: async ({page}, use) => {
        const homePage = new HomePage(page);
        await use(homePage);
    },
    signUpPage: async ({page}, use) => {
        const signUpPage = new SignUpPage(page);
        await use(signUpPage);
    },
    authPage: async ({page}, use) => {
        const authPage = new AuthPage(page);
        await use(authPage);
    },
    profilePage: async ({page}, use) => {
        const profilePage = new ProfilePage(page);
        await use(profilePage);
    },
    cleanUpUsers: [
        async ({ }, use) => {
            await use();

            await deleteUser(onboarding.account_one.email, onboarding.account_one.password);
        },
        { auto: true },
    ],
});

export { expect } from "@playwright/test"