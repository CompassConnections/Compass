import { expect, Locator, Page } from '@playwright/test';

//sets up of all the functions that signin tests will use.
export class AuthPage{
private readonly signInLink: Locator;
private readonly signUpButton: Locator;
private readonly emailField: Locator;
private readonly passwordField: Locator;
private readonly signInWithEmailButton: Locator;
private readonly signInWithGoogleButton: Locator;
private readonly signUpWithEmailButton: Locator;

constructor(public readonly page: Page) {
    this.signInLink=page.getByRole('link', { name: 'Sign in' });
    this.signUpButton=page.getByRole('button', {name: 'Sign up'});
    this.emailField=page.getByLabel('Email');
    this.passwordField=page.getByLabel('Password');
    this.signInWithEmailButton=page.getByRole('button', {name: 'Sign in with Email'});
    this.signInWithGoogleButton=page.getByRole('button', {name: 'Google'});
    this.signUpWithEmailButton=page.getByRole('button', {name: 'Sign up with Email'});
}

async clickSignInLink() {
    await this.signInLink.click();
}

async clickSignUpButton() {
    await this.signUpButton.click();
}

async clickSignInWithEmailButton() {
    await this.signInWithEmailButton.click();
}

async clickSignInWithGoogleButton() {
    await this.signInWithGoogleButton.click();
}

async clickSignUpWithEmailButton() {
    await this.signUpWithEmailButton.click();
}

async fillEmailField(email: string) {
    await expect(this.emailField).toBeVisible();
    await this.emailField.fill(email);
}

async fillPasswordField(password: string) {
    await expect(this.passwordField).toBeVisible();
    await this.passwordField.fill(password);
}

}

