import { expect, Locator, Page } from "@playwright/test";
import {
    RELATIONSHIP_CHOICES,
    RELATIONSHIP_STATUS_CHOICES,
    ROMANTIC_CHOICES,
    POLITICAL_CHOICES,
    DIET_CHOICES,
    EDUCATION_CHOICES,
    RELIGION_CHOICES,
    LANGUAGE_CHOICES,
    RACE_CHOICES,
    MBTI_CHOICES,
} from "../../../../web/components/filters/choices";

type Gender = 'Woman' | 'Man' | 'Other';
type ConnectionType = keyof typeof RELATIONSHIP_CHOICES;
type RelationshipStatus = keyof typeof RELATIONSHIP_STATUS_CHOICES;
type RelationshipStyle = keyof typeof ROMANTIC_CHOICES;
type PoliticalBeliefs = keyof typeof POLITICAL_CHOICES;
type Diet = keyof typeof DIET_CHOICES;
type Education = keyof typeof EDUCATION_CHOICES;
type Religion = keyof typeof RELIGION_CHOICES;
type Language = keyof typeof LANGUAGE_CHOICES;
type Ethnicity = keyof typeof RACE_CHOICES;
type Personality = keyof typeof MBTI_CHOICES;
type Interests = 'Chess' | 'Games' | 'Joy' | 'Livres';
type Causes = 'Animal Rights' | 'Feminism';
type Platforms = 
    | 'Website'
    | 'Twitter/X'
    | 'Discord'
    | 'Bluesky'
    | 'Mastodon'
    | 'Substack'
    | 'Paypal'
    | 'Instagram'
    | 'GitHub'
    | 'LinkedIn'
    | 'Facebook'
    | 'Patreon'
    | 'OkCupid'
    | 'Calendly'
    | 'Dating Doc'
    | 'Friendship Doc'
    | 'Connection Doc'
    | 'Work Doc'
    | 'Spotify'

export class OnboardingPage {
    private readonly displayNameField: Locator;
    private readonly usernameField: Locator;
    private readonly nextButton: Locator;
    private readonly bioField: Locator;
    private readonly locationField: Locator;
    private readonly ageField: Locator;
    private readonly feetHeightField: Locator;
    private readonly inchesHeightField: Locator;
    private readonly centimetersHeightField: Locator;
    private readonly interestedInWomenCheckbox: Locator;
    private readonly interestedInMenCheckbox: Locator;
    private readonly interestedInOtherCheckbox: Locator;
    private readonly minAgeOption: Locator;
    private readonly maxAgeOption: Locator;
    private readonly currentNumberOfKidsField: Locator;
    private readonly stronglyDisagreeOnWantingKids: Locator;
    private readonly disagreeOnWantingKids: Locator;
    private readonly neutralOnWantingKids: Locator;
    private readonly agreeOnWantingKids: Locator;
    private readonly stronglyAgreeOnWantingKids: Locator;
    private readonly addInterestsField: Locator;
    private readonly addInterestsButton: Locator;
    private readonly addCausesField: Locator;
    private readonly addCausesButton: Locator;
    private readonly universityField: Locator;
    private readonly jobTitleField: Locator;
    private readonly companyField: Locator;
    private readonly universityCheckbox: Locator;
    private readonly addWorkAreaField: Locator;
    private readonly addWorkAreaButton: Locator;
    private readonly politicalBeliefDetailsField: Locator;
    private readonly religiousBeliefsDetailsField: Locator;
    private readonly smokerField: Locator;
    private readonly nonSmokerField: Locator;
    private readonly alcoholConsumedPerMonthField: Locator;
    private readonly socialPlatformSearchField: Locator;
    private readonly addSocialPlatformField: Locator;
    private readonly addSocialPlatformButton: Locator;
    private readonly photoUploadButton: Locator;

    constructor(public readonly page: Page) {
        this.displayNameField = page.getByPlaceholder('Display name');
        this.usernameField = page.getByPlaceholder('Username');
        this.nextButton = page.getByRole('button', { name: 'Next',  exact: true });
        this.bioField = page.locator('//div[@contenteditable="true"]/p'); //Very brittle needs data-test attribute
        this.locationField = page.getByPlaceholder('Search city...');
        this.ageField = page.getByRole('textbox', { name: 'Age' });
        this.feetHeightField = page.getByTestId('height-feet');
        this.inchesHeightField = page.getByTestId('height-inches');
        this.centimetersHeightField = page.getByTestId('height-centimeters');
        this.interestedInWomenCheckbox = page.getByRole('checkbox', { name: 'Women',  exact: true });
        this.interestedInMenCheckbox = page.getByRole('checkbox', { name: 'Men',  exact: true });
        this.interestedInOtherCheckbox = page.locator('div').filter({ hasText: 'Other' }).first(); //Very brittle needs data-test attribute
        this.minAgeOption = page.getByTestId('pref-age-min');
        this.maxAgeOption = page.getByTestId('pref-age-max');
        this.currentNumberOfKidsField = page.getByTestId('current-number-of-kids');
        this.stronglyDisagreeOnWantingKids = page.locator('#headlessui-radiogroup-option-\:rgh\:');
        this.disagreeOnWantingKids = page.locator('#headlessui-radiogroup-option-\:rgj\:');
        this.neutralOnWantingKids = page.locator('#headlessui-radiogroup-option-\:rgl\:');
        this.agreeOnWantingKids = page.locator('#headlessui-radiogroup-option-\:rgn\:');
        this.stronglyAgreeOnWantingKids = page.locator('#headlessui-radiogroup-option-\:rgp\:');
        this.addInterestsField = page.getByRole('textbox', { name: 'Search or add' }).first();
        this.addInterestsButton = page.getByRole('button', { name: 'Add' }).first();
        this.addCausesField = page.getByRole('textbox', { name: 'Search or add' }).nth(1);
        this.addCausesButton = page.getByRole('button', { name: 'Add' }).nth(1);
        this.universityField = page.getByTestId('university');
        this.jobTitleField = page.getByTestId('job-title');
        this.companyField = page.getByTestId('company');
        this.universityCheckbox = page.getByRole('checkbox', { name: 'University' });
        this.addWorkAreaField = page.getByRole('textbox', { name: 'Search or add' }).nth(2);
        this.addWorkAreaButton = page.getByRole('button', { name: 'Add' }).nth(2);
        this.politicalBeliefDetailsField = page.getByTestId('political-belief-details');
        this.religiousBeliefsDetailsField = page.getByTestId('religious-belief-details');
        this.smokerField = page.getByText('Yes', { exact: true });
        this.nonSmokerField = page.getByText('No', { exact: true });
        this.alcoholConsumedPerMonthField = page.getByTestId('alcohol-consumed-per-month');
        this.socialPlatformSearchField = page.getByRole('textbox', { name: 'Search...' });
        this.addSocialPlatformField = page.getByRole('textbox', { name: 'URL' });
        this.addSocialPlatformButton = page.locator('button').filter({ hasText: 'Add' }).nth(3);
        this.photoUploadButton = page.locator("label[for='photo-upload']");
    };
    
    async fillUsername(username: string) {
        await expect(this.usernameField).toBeVisible();
        await this.usernameField.fill(username);
    };

    async fillDisplayName(displayName: string) {
        await expect(this.displayNameField).toBeVisible();
        await this.displayNameField.fill(displayName);
    };

    async fillBio(bio: string) {
        await expect(this.bioField).toBeVisible();
        await this.bioField.fill(bio);
    };

    async fillLocation(location: string) {
        await expect(this.locationField).toBeVisible();
        await this.locationField.fill(location);
    };
    
    async chooseGender(gender: Gender) {
        await expect(this.page.locator(`span:has-text("${gender}")`)).toBeVisible();
        await this.page.locator(`span:has-text("${gender}")`).click();
        await expect(this.page.locator(`span:has-text("${gender}")`)).toBeChecked();
    };

    async fillAge(age: string) {
        await expect(this.ageField).toBeVisible();
        await this.ageField.fill(age);
    };

    async fillHeightFeetInches(feet: string, inches: string) {
        await expect(this.feetHeightField).toBeVisible();
        await expect(this.inchesHeightField).toBeVisible();
        await this.feetHeightField.fill(feet);
        await this.inchesHeightField.fill(inches);
    };

    async fillHeightCentimeters(centimeters: string) {
        await expect(this.centimetersHeightField).toBeVisible();
        await this.centimetersHeightField.fill(centimeters);
    };

    async fillEthnicity(ethnicity: Ethnicity) {
        if (ethnicity === 'Other') {
            await expect(this.page.locator('label').filter({ hasText: `${ethnicity}` }).first()).toBeVisible();
            await this.page.locator('label').filter({ hasText: `${ethnicity}` }).first().click();
            await expect(this.page.locator('label').filter({ hasText: `${ethnicity}` }).first()).toBeChecked();
        } else {
            await expect(this.page.getByText(`${ethnicity}`, { exact: true })).toBeVisible();
            await this.page.getByText(`${ethnicity}`, { exact: true }).click();
            await expect(this.page.getByText(`${ethnicity}`, { exact: true })).toBeChecked();
        };
    };

    async interestedInWomen() {
        await expect(this.interestedInWomenCheckbox).toBeVisible();
        await this.interestedInWomenCheckbox.click()
        await expect(this.interestedInWomenCheckbox).toBeChecked();
    };

    async interestedInMen() {
        await expect(this.interestedInMenCheckbox).toBeVisible();
        await this.interestedInMenCheckbox.click()
        await expect(this.interestedInMenCheckbox).toBeChecked();
    };

    async interestedInOther() {
        await expect(this.interestedInOtherCheckbox).toBeVisible();
        await this.interestedInOtherCheckbox.click()
        await expect(this.interestedInOtherCheckbox).toBeChecked();
    };

    async fillAgeRangeInterest(min: string, max: string) {
        await expect(this.minAgeOption).toBeVisible();
        await expect(this.maxAgeOption).toBeVisible();
        await this.minAgeOption.selectOption(min);
        await this.maxAgeOption.selectOption(max);
    };

    async setConnectionType(type: ConnectionType) {
        await expect(this.page.getByRole('checkbox', { name: `${type}` })).toBeVisible();
        await this.page.getByRole('checkbox', { name: `${type}` }).click();
        await expect(this.page.getByRole('checkbox', { name: `${type}` })).toBeChecked();
    };

    async setRelationshipStatus(status: RelationshipStatus) {
        await expect(this.page.getByRole('checkbox', { name: `${status}` })).toBeVisible();
        await this.page.getByRole('checkbox', { name: `${status}` }).click();
        await expect(this.page.getByRole('checkbox', { name: `${status}` })).toBeChecked();
    };

    async setRelationshipStyle(style: RelationshipStyle) {
        await expect(this.page.getByRole('checkbox', { name: `${style}` })).toBeVisible();
        await this.page.getByRole('checkbox', { name: `${style}` }).click();
        await expect(this.page.getByRole('checkbox', { name: `${style}` })).toBeChecked();
    };

    async fillCurrentNumberOfChildren(numberOfKids: string) {
        await expect(this.currentNumberOfKidsField).toBeVisible();
        await this.currentNumberOfKidsField.fill(numberOfKids);
    };

    async stronglyDontWantChildren() {
        await expect(this.stronglyDisagreeOnWantingKids).toBeVisible();
        await this.stronglyDisagreeOnWantingKids.click();
        await expect(this.stronglyDisagreeOnWantingKids).toBeChecked();
    };

    async DontWantChildren() {
        await expect(this.disagreeOnWantingKids).toBeVisible();
        await this.disagreeOnWantingKids.click();
        await expect(this.disagreeOnWantingKids).toBeChecked();
    };

    async neutralOnWantChildren() {
        await expect(this.neutralOnWantingKids).toBeVisible();
        await this.neutralOnWantingKids.click();
        await expect(this.neutralOnWantingKids).toBeChecked();
    };

    async WantChildren() {
        await expect(this.agreeOnWantingKids).toBeVisible();
        await this.agreeOnWantingKids.click();
        await expect(this.agreeOnWantingKids).toBeChecked();
    };

    async stronglyWantChildren() {
        await expect(this.stronglyAgreeOnWantingKids).toBeVisible();
        await this.stronglyAgreeOnWantingKids.click();
        await expect(this.stronglyAgreeOnWantingKids).toBeChecked();
    };

    async setInterests(interests: Interests) {
        await expect(this.page.getByRole('checkbox', { name: `${interests}` })).toBeVisible();
        await this.page.getByRole('checkbox', { name: `${interests}` }).click();
        await expect(this.page.getByRole('checkbox', { name: `${interests}` })).toBeChecked();
    };

    async addInterest(interest: string) {
        await expect(this.addInterestsField).toBeVisible();
        await expect(this.addInterestsButton).toBeVisible();
        await this.addInterestsField.fill(interest);
        await this.addInterestsButton.click();
        await expect(this.page.getByRole('checkbox', { name: `${interest}` })).toBeVisible();
        await expect(this.page.getByRole('checkbox', { name: `${interest}` })).toBeChecked();
    };

    async setCauses(causes: Causes) {
        await expect(this.page.getByRole('checkbox', { name: `${causes}` })).toBeVisible();
        await this.page.getByRole('checkbox', { name: `${causes}` }).click();
        await expect(this.page.getByRole('checkbox', { name: `${causes}` })).toBeChecked();
    };

    async addCause(cause: string) {
        await expect(this.addCausesField).toBeVisible();
        await expect(this.addCausesButton).toBeVisible();
        await this.addCausesField.fill(cause);
        await this.addCausesButton.click();
        await expect(this.page.getByRole('checkbox', { name: `${cause}` })).toBeVisible();
        await expect(this.page.getByRole('checkbox', { name: `${cause}` })).toBeChecked();
    };

    async setHighestEducationLevel(education: Education) {
        await expect(this.page.getByText(`${education}`, { exact: true })).toBeVisible();
        await this.page.getByText(`${education}`, { exact: true }).click();
        await expect(this.page.getByText(`${education}`, { exact: true })).toBeChecked();
    };

    async fillUniversity(university: string) {
        await expect(this.universityField).toBeVisible();
        await this.universityField.fill(university);
    };

    async fillJobTitle(jobTitle: string) {
        await expect(this.jobTitleField).toBeVisible();
        await this.jobTitleField.fill(jobTitle);
    };

    async fillCompany(company: string) {
        await expect(this.companyField).toBeVisible();
        await this.companyField.fill(company);
    };

    async setWorkAreaUniversity(company: string) {
        await expect(this.universityCheckbox).toBeVisible();
        await this.universityCheckbox.click();
        await expect(this.universityCheckbox).toBeChecked();
    };

    async addWorkArea(workArea: string) {
        await expect(this.addWorkAreaField).toBeVisible();
        await expect(this.addWorkAreaButton).toBeVisible();
        await this.addWorkAreaField.fill(workArea);
        await this.addWorkAreaButton.click();
        await expect(this.page.getByRole('checkbox', { name: `${workArea}` })).toBeVisible();
        await expect(this.page.getByRole('checkbox', { name: `${workArea}` })).toBeChecked();
    };

    async setPoliticalBeliefs(politicalBeliefs: PoliticalBeliefs) {
        await expect(this.page.getByRole('checkbox', { name: `${politicalBeliefs}` })).toBeVisible();
        await this.page.getByRole('checkbox', { name: `${politicalBeliefs}` }).click();
        await expect(this.page.getByRole('checkbox', { name: `${politicalBeliefs}` })).toBeChecked();
    };

    async fillPoliticalBeliefDetails(details: string) {
        await expect(this.politicalBeliefDetailsField).toBeVisible();
        await this.politicalBeliefDetailsField.fill(details);
    };

    async setReligiousBeliefs(religiousBeliefs: Religion) {
        if (religiousBeliefs === 'Other') {
            await expect(this.page.locator('label').filter({ hasText: `${religiousBeliefs}` }).nth(3)).toBeVisible();
            await this.page.locator('label').filter({ hasText: `${religiousBeliefs}` }).nth(3).click();
            await expect(this.page.locator('label').filter({ hasText: `${religiousBeliefs}` }).nth(3)).toBeChecked();
        } else {
            await expect(this.page.getByRole('checkbox', { name: `${religiousBeliefs}` })).toBeVisible();
            await this.page.getByRole('checkbox', { name: `${religiousBeliefs}` }).click();
            await expect(this.page.getByRole('checkbox', { name: `${religiousBeliefs}` })).toBeChecked();
        };
    };

    async fillReligiousBeliefDetails(details: string) {
        await expect(this.religiousBeliefsDetailsField).toBeVisible();
        await this.religiousBeliefsDetailsField.fill(details);
    };

    async setPersonalityType(personalityType: Personality) {
        await expect(this.page.getByText(`${personalityType}`, { exact: true })).toBeVisible();
        await this.page.getByText(`${personalityType}`, { exact: true }).click();
        await expect(this.page.getByText(`${personalityType}`, { exact: true })).toBeChecked();
    };

    async setDietType(dietType: Diet) {
        if (dietType === 'Other') {
            await expect(this.page.locator('label').filter({ hasText: 'Other' }).nth(4)).toBeVisible();
            await this.page.locator('label').filter({ hasText: 'Other' }).nth(4).click();
            await expect(this.page.locator('label').filter({ hasText: 'Other' }).nth(4)).toBeChecked();
        } else {
            await expect(this.page.getByRole('checkbox', { name: `${dietType}` })).toBeVisible();
            await this.page.getByRole('checkbox', { name: `${dietType}` }).click();
            await expect(this.page.getByRole('checkbox', { name: `${dietType}` })).toBeChecked();
        };
    };

    async setIsSmoker(bool: boolean) {
        if (bool) {
            await expect(this.smokerField).toBeVisible();
            await this.smokerField.click();
            await expect(this.smokerField).toBeChecked();
        } else {
            await expect(this.nonSmokerField).toBeVisible();
            await this.nonSmokerField.click();
            await expect(this.nonSmokerField).toBeChecked();
        };
    };

    async fillAlcoholPerMonth(amount: string) {
        await expect(this.alcoholConsumedPerMonthField).toBeVisible();
        await this.alcoholConsumedPerMonthField.fill(amount);
    };

    async setLanguages(language: Language) {
        await expect(this.page.getByRole('checkbox', { name: `${language}` })).toBeVisible();
        await this.page.getByRole('checkbox', { name: `${language}` }).click();
        await expect(this.page.getByRole('checkbox', { name: `${language}` })).toBeChecked();
    };

    async addSocialMediaPlatform(platform: Platforms, urlOrUsername: string) {
        await expect(this.socialPlatformSearchField).toBeVisible();
        await this.socialPlatformSearchField.fill(platform);
        await expect(this.page.getByText(`${platform}`, { exact: true })).toBeVisible();
        await this.page.getByText(`${platform}`, { exact: true }).click();
        await this.addSocialPlatformField.fill(urlOrUsername);
        await this.addSocialPlatformButton.click();
        await expect(this.page.getByText(`${platform}`, { exact: true })).toBeVisible();
        await expect(this.page.locator(`input[value='${urlOrUsername}']`)).toBeVisible();
    };

    async goToNextPage() {
        await expect(this.nextButton).toBeVisible();
        await this.nextButton.click();
    };
};