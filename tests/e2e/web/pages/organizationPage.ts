import {expect, Locator, Page} from '@playwright/test'

export class OrganizationPage {
  private readonly pageTitle: Locator
  private readonly aboutUsHeading: Locator
  private readonly proofAndTransparencyHeading: Locator
  private readonly contactAndSupportHeading: Locator
  private readonly trustAndLegalHeading: Locator
  private readonly aboutCompassLink: Locator
  private readonly constitutionLink: Locator
  private readonly keyMetricsLink: Locator
  private readonly pressLink: Locator
  private readonly financialTransparencyLink: Locator
  private readonly contactUsLink: Locator
  private readonly helpAndSupportLink: Locator
  private readonly securityLink: Locator
  private readonly termsAndConditionsLink: Locator
  private readonly privacyPolicyLink: Locator

  constructor(public readonly page: Page) {
    this.pageTitle = page.getByRole('heading', {name: 'Organization'})
    this.aboutUsHeading = page.getByRole('heading', {name: 'About us'})
    this.proofAndTransparencyHeading = page.getByRole('heading', {name: 'Proof & transparency'})
    this.contactAndSupportHeading = page.getByRole('heading', {name: 'Contact & support'})
    this.trustAndLegalHeading = page.getByRole('heading', {name: 'Trust & legal'})
    this.aboutCompassLink = page.getByRole('link', {name: 'About Compass'})
    this.constitutionLink = page.getByRole('link', {name: 'Our constitution'})
    this.keyMetricsLink = page.getByRole('link', {name: 'Key metrics & growth'})
    this.pressLink = page.getByRole('link', {name: 'Press'})
    this.financialTransparencyLink = page.getByRole('link', {name: 'Financial transparency'})
    this.contactUsLink = page.getByRole('link', {name: 'Contact us'})
    this.helpAndSupportLink = page.getByRole('link', {name: 'Help & support center'})
    this.securityLink = page.getByRole('link', {name: 'Security'})
    this.termsAndConditionsLink = page.getByRole('link', {name: 'Terms and conditions'})
    this.privacyPolicyLink = page.getByRole('link', {name: 'Privacy policy'})
  }

  async goToOrganizationPage() {
    await this.page.goto('/organization')
  }

  async verifyOrganizationPage() {
    await expect(this.page).toHaveURL(/\/organization$/)
    await expect(this.pageTitle).toBeVisible()
    await expect(this.aboutUsHeading).toBeVisible()
    await expect(this.proofAndTransparencyHeading).toBeVisible()
    await expect(this.contactAndSupportHeading).toBeVisible()
    await expect(this.trustAndLegalHeading).toBeVisible()

    await this.verifyOrganizationLinks()
  }

  async verifyOrganizationLinks() {
    await expect(this.aboutCompassLink).toBeVisible()
    await expect(this.aboutCompassLink).toHaveAttribute('href', '/about')

    await expect(this.constitutionLink).toBeVisible()
    await expect(this.constitutionLink).toHaveAttribute('href', '/constitution')

    await expect(this.keyMetricsLink).toBeVisible()
    await expect(this.keyMetricsLink).toHaveAttribute('href', '/stats')

    await expect(this.pressLink).toBeVisible()
    await expect(this.pressLink).toHaveAttribute('href', '/press')

    await expect(this.financialTransparencyLink).toBeVisible()
    await expect(this.financialTransparencyLink).toHaveAttribute('href', '/financials')

    await expect(this.contactUsLink).toBeVisible()
    await expect(this.contactUsLink).toHaveAttribute('href', '/contact')

    await expect(this.helpAndSupportLink).toBeVisible()
    await expect(this.helpAndSupportLink).toHaveAttribute('href', '/help')

    await expect(this.securityLink).toBeVisible()
    await expect(this.securityLink).toHaveAttribute('href', '/security')

    await expect(this.termsAndConditionsLink).toBeVisible()
    await expect(this.termsAndConditionsLink).toHaveAttribute('href', '/terms')

    await expect(this.privacyPolicyLink).toBeVisible()
    await expect(this.privacyPolicyLink).toHaveAttribute('href', '/privacy')
  }

  async clickAboutCompassLink() {
    await expect(this.aboutCompassLink).toBeVisible()
    await this.aboutCompassLink.click()
  }

  async clickConstitutionLink() {
    await expect(this.constitutionLink).toBeVisible()
    await this.constitutionLink.click()
  }

  async clickKeyMetricsLink() {
    await expect(this.keyMetricsLink).toBeVisible()
    await this.keyMetricsLink.click()
  }

  async clickPressLink() {
    await expect(this.pressLink).toBeVisible()
    await this.pressLink.click()
  }

  async clickFinancialTransparencyLink() {
    await expect(this.financialTransparencyLink).toBeVisible()
    await this.financialTransparencyLink.click()
  }

  async clickContactUsLink() {
    await expect(this.contactUsLink).toBeVisible()
    await this.contactUsLink.click()
  }

  async clickHelpAndSupportLink() {
    await expect(this.helpAndSupportLink).toBeVisible()
    await this.helpAndSupportLink.click()
  }

  async clickSecurityLink() {
    await expect(this.securityLink).toBeVisible()
    await this.securityLink.click()
  }

  async clickTermsAndConditionsLink() {
    await expect(this.termsAndConditionsLink).toBeVisible()
    await this.termsAndConditionsLink.click()
  }

  async clickPrivacyPolicyLink() {
    await expect(this.privacyPolicyLink).toBeVisible()
    await this.privacyPolicyLink.click()
  }
}
