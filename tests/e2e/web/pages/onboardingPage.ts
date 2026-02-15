import { expect, Locator, Page } from "@playwright/test";

export class OnboardingPage {
    private readonly continueButton: Locator;
    private readonly skipOnboardingLink: Locator;
    private readonly backButton: Locator;
    private readonly getStartedButton: Locator;
    private readonly exploreProfilesNowButton: Locator;
    private readonly refineProfileButton: Locator;

    constructor(public readonly page: Page) {
        this.continueButton = page.getByRole('button', { name: 'Continue', exact: true });
        this.skipOnboardingLink = page.getByRole('button', { name: 'Skip onboarding', exact: true });
        this.backButton = page.getByRole('button', { name: 'Back' });
        this.getStartedButton = page.getByRole('button', { name: 'Get started' });
        this.exploreProfilesNowButton = page.getByRole('button', { name: 'Explore Profiles Now', exact: true });
        this.refineProfileButton = page.getByRole('button', { name: 'Refine Profile', exact: true });
    };

    async clickContinueButton() {
        await expect(this.continueButton).toBeVisible();
        await this.continueButton.click();
    };

    async clickBackButton() {
        await expect(this.backButton).toBeVisible();
        await this.backButton.click();
    };

    async clickSkipOnboardingButton() {
        await expect(this.skipOnboardingLink).toBeVisible();
        await this.skipOnboardingLink.click();
    };

    async clickGetStartedButton() {
        await expect(this.getStartedButton).toBeVisible();
        await this.getStartedButton.click();
    };

    async clickExploreProfilesNowButton() {
        await expect(this.exploreProfilesNowButton).toBeVisible();
        await this.exploreProfilesNowButton.click();
    };

    async clickRefineProfileButton() {
        await expect(this.refineProfileButton).toBeVisible();
        await this.refineProfileButton.click();
    };
};