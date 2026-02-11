import { expect, Locator, Page } from "@playwright/test";

export class ProfilePage {
    private readonly startAnsweringButton: Locator;
    private readonly doThisLaterLink: Locator;
    private readonly closeButton: Locator;

    constructor(public readonly page: Page) {
        this.startAnsweringButton = page.getByRole('button', {});
        this.doThisLaterLink = page.getByRole('button', {});
        this.closeButton = page.getByRole('button', { name: 'Close' });
    };
};