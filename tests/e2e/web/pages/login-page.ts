import { expect, Locator, Page } from '@playwright/test';

export class LoginPage{
private readonly signInLink: Locator;
private readonly emailField: Locator;
private readonly passwordField: Locator;
private readonly signInWithEmailButton: Locator;
private readonly signInWithGoogleButton: Locator;

constructor(public readonly page: Page) {
    this.signInLink=page.getByRole('link', { name: 'Sign in' });
    this.emailField=page.getByLabel('Email');
    this.passwordField=page.getByLabel('Password');
    this.signInWithEmailButton=page.getByRole('button',{name: 'Sign in With Email'});
    this.signInWithGoogleButton=page.getByRole('button',{name: 'Google'});
}

async clickSignInText() {
    await this.signInLink.click();
}

async clickSignInWithEmailButton() {
    await this.signInWithEmailButton.click();
}

async clickSignInWithEGoogleButton() {
    await this.signInWithGoogleButton.click();
}

async fillEmailField(email: string) {
    await expect(this.emailField).toBeVisible();
    await this.emailField.fill(email);
}

async fillPasswprdField(password: string) {
    await expect(this.passwordField).toBeVisible();
    await this.passwordField.fill(password);
}

}

