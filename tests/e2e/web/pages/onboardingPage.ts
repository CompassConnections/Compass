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
        this.exploreProfilesNowButton = page.getByRole('button', {});
        this.refineProfileButton = page.getByRole('button', {});
    };

    async clickContinueButton() {
        await expect(this.continueButton).toBeVisible();
        await this.continueButton.click();
    };

    async clickGetStartedButton() {
        await expect(this.getStartedButton).toBeVisible();
        await this.getStartedButton.click();
    };
};