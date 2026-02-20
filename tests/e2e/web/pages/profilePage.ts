import { expect, Locator, Page } from "@playwright/test";
import { Socials } from "../utils/accountInformation";

type ProfileDropdownOptions =
    | "Public"
    | "Private"
    | "Disable";

export class ProfilePage {
    private readonly startAnsweringButton: Locator;
    private readonly doThisLaterLink: Locator;
    private readonly closeButton: Locator;
    private readonly shareButton: Locator;
    private readonly editProfileButton: Locator;
    private readonly profileOptionsDropdown: Locator;
    private readonly listProfilePubliclyDropdownOption: Locator;
    private readonly limitProfileToMembersDropdownOption: Locator;
    private readonly disableProfileDropdownOption: Locator;
    private readonly displayNameAndAgeSection: Locator;
    private readonly genderLocationHightInInchesSection: Locator;
    private readonly politicalAboutSection: Locator;
    private readonly relegiousAboutSection: Locator;
    private readonly interestsAboutSection: Locator;
    private readonly causesAboutSection: Locator;
    private readonly personalityAboutSection: Locator;
    private readonly ethnicityAboutSection: Locator;
    private readonly dietAboutSection: Locator;
    private readonly languagesAboutSection: Locator;
    private readonly seekingAboutSection: Locator;
    private readonly relationshipTypeAboutSection: Locator;
    private readonly relationshipStatusAboutSection: Locator;
    private readonly educationAboutSection: Locator;
    private readonly occupationAboutSection: Locator;
    private readonly workAreaAboutSection: Locator;
    private readonly smokerAboutSection: Locator;
    private readonly notDrinkerAboutSection: Locator;
    private readonly drinkerAboutSection: Locator;
    private readonly wantsKidsAboutSection: Locator;
    private readonly lastOnlineAboutSection: Locator;
    private readonly bigFivePersonalityTraitsAboutSection: Locator;
    private readonly hasKidsAboutSection: Locator;
    private readonly socialMediaSection: Locator;
    private readonly bioSection: Locator;
    private readonly bioOptionsDropdown: Locator;
    private readonly editBioDropdownOptions: Locator;
    private readonly deleteBioDropdownOptions: Locator;

    constructor(public readonly page: Page) {
        this.startAnsweringButton = page.getByRole('button', {});
        this.doThisLaterLink = page.getByRole('button', {});
        this.closeButton = page.getByRole('button', { name: 'Close' });
        this.shareButton = page.getByRole('button', { name: 'Share' });
        this.editProfileButton = page.getByTestId('profile-edit');
        this.profileOptionsDropdown = page.getByTestId('profile-options');
        this.listProfilePubliclyDropdownOption = page.getByText('List Profile Publicly', { exact: true });
        this.limitProfileToMembersDropdownOption = page.getByText('Limit to Members Only', { exact: true });
        this.disableProfileDropdownOption = page.getByText('Disable profile', { exact: true });
        this.displayNameAndAgeSection = page.getByTestId('profile-display-name-age');
        this.genderLocationHightInInchesSection = page.getByTestId('profile-gender-location-height-inches');
        this.politicalAboutSection = page.getByTestId('profile-about-political');
        this.relegiousAboutSection = page.getByTestId('profile-about-religious');
        this.interestsAboutSection = page.getByTestId('profile-about-interests');
        this.causesAboutSection = page.getByTestId('profile-about-causes');
        this.personalityAboutSection = page.getByTestId('profile-about-personality');
        this.ethnicityAboutSection = page.getByTestId('profile-about-ethnicity');
        this.dietAboutSection = page.getByTestId('profile-about-diet');
        this.languagesAboutSection = page.getByTestId('profile-about-languages');
        this.seekingAboutSection = page.getByTestId('profile-about-seeking');
        this.relationshipTypeAboutSection = page.getByTestId('profile-about-relationship-type');
        this.relationshipStatusAboutSection = page.getByTestId('profile-about-relationship-status');
        this.educationAboutSection = page.getByTestId('profile-about-education');
        this.occupationAboutSection = page.getByTestId('profile-about-occupation');
        this.workAreaAboutSection = page.getByTestId('profile-about-work-area');
        this.smokerAboutSection = page.getByTestId('profile-about-smoker');
        this.notDrinkerAboutSection = page.getByTestId('profile-about-not-drink');
        this.drinkerAboutSection = page.getByTestId('profile-about-drinker');
        this.wantsKidsAboutSection = page.getByTestId('profile-about-wants-kids');
        this.lastOnlineAboutSection = page.getByTestId('profile-about-wants-last-online');
        this.bigFivePersonalityTraitsAboutSection = page.getByTestId('profile-about-big-five-personality-traits');
        this.hasKidsAboutSection = page.getByTestId('profile-about-has-kids');
        this.socialMediaSection = page.getByTestId('profile-social-media-accounts');
        this.bioSection = page.getByTestId('profile-bio');
        this.bioOptionsDropdown = page.getByTestId('profile-bio-options');
        this.editBioDropdownOptions = page.getByText('Edit', { exact: true });
        this.deleteBioDropdownOptions = page.getByText('Delete', { exact: true });
    };

    async clickCloseButton() {
        await expect(this.closeButton).toBeInViewport();
        await this.closeButton.click();
    };

    async clickStartAnsweringButton() {
        await expect(this.startAnsweringButton).toBeVisible();
        await this.startAnsweringButton.click();
    };

    async clickDoThisLaterButton() {
        await expect(this.doThisLaterLink).toBeVisible();
        await this.doThisLaterLink.click();
    };
    
    async clickShareButton() {
        await expect(this.shareButton).toBeVisible();
        await this.shareButton.click();
    };
    
    async clickEditProfileButton() {
        await expect(this.editProfileButton).toBeVisible();
        await this.editProfileButton.click();
    };

    async selectOptionFromProfileDropdown(option: ProfileDropdownOptions) {
        await expect(this.profileOptionsDropdown).toBeVisible();
        await this.profileOptionsDropdown.click();
        
        if (option === "Public") {
            await expect(this.listProfilePubliclyDropdownOption).toBeVisible();
            await this.listProfilePubliclyDropdownOption.click();
        } else if (option === "Disable") {
            await expect(this.disableProfileDropdownOption).toBeVisible();
            await this.disableProfileDropdownOption.click();
        } else if (option === "Private") {
            await expect(this.limitProfileToMembersDropdownOption).toBeVisible();
            await this.limitProfileToMembersDropdownOption.click();
        }
    };

    async verifyDisplayNameAndAge(displayName?: string, age?: string) {
        await expect(this.displayNameAndAgeSection).toBeVisible()
        const textContent = await this.displayNameAndAgeSection.textContent();
        if (displayName) await expect(textContent?.toLowerCase()).toContain(displayName.toLowerCase());
        if (age) await expect(textContent?.toLowerCase()).toContain(age.toLowerCase());
    };

    async verifyGenderLocationHeight(gender?: string, location?: string, heightFeet?: string, heightInches?: string) {
        await expect(this.genderLocationHightInInchesSection).toBeVisible()
        const textContent = await this.genderLocationHightInInchesSection.textContent();
        if (gender) await expect(textContent?.toLowerCase()).toContain(gender.toLowerCase());
        if (location) await expect(textContent?.toLowerCase()).toContain(location.toLowerCase());
        if (heightFeet) await expect(textContent?.toLowerCase()).toContain(heightFeet.toLowerCase());
        if (heightInches) await expect(textContent?.toLowerCase()).toContain(heightInches.toLowerCase());
    };

    async verifyEthnicityOrigin(origin: string) {
        await expect(this.ethnicityAboutSection).toBeVisible()
        const textContent = await this.ethnicityAboutSection.textContent();
        await expect(textContent?.toLowerCase()).toContain(origin.toLowerCase());
    };

    async verifyIntrestedInConnectingWith(gender?: string, minAge?: string, maxAge?: string) {
        await expect(this.seekingAboutSection).toBeVisible()
        const textContent = await this.seekingAboutSection.textContent();
        if (gender) await expect(textContent?.toLowerCase()).toContain(gender.toLowerCase());
        if (minAge) await expect(textContent?.toLowerCase()).toContain(minAge.toLowerCase());
        if (maxAge) await expect(textContent?.toLowerCase()).toContain(maxAge.toLowerCase());
    };

    async verifyRelationShipTypeAndInterest(type?: string, interest?: string) {
        await expect(this.relationshipTypeAboutSection).toBeVisible()
        const textContent = await this.relationshipTypeAboutSection.textContent();
        if (type) await expect(textContent?.toLowerCase()).toContain(type.toLowerCase());
        if (interest) await expect(textContent?.toLowerCase()).toContain(interest.toLowerCase());
    };

    async verifyRelationshipStatus(status: string | undefined) {
        if (!status) return;
        await expect(this.relationshipStatusAboutSection).toBeVisible()
        const textContent = await this.relationshipStatusAboutSection.textContent();
        await expect(textContent?.toLowerCase()).toContain(status.toLowerCase());
    };

    async verifyCurrentNumberOfKids(numberOfKids: string | undefined) {
        if (!numberOfKids) return;
        await expect(this.hasKidsAboutSection).toBeVisible()
        const textContent = await this.hasKidsAboutSection.textContent();
        await expect(textContent?.toLowerCase()).toContain(numberOfKids.toLowerCase());
    };

    async verifyWantChildrenExpectation(expectation: string | undefined) {
        if (!expectation) return;
        await expect(this.wantsKidsAboutSection).toBeVisible()
        const textContent = await this.wantsKidsAboutSection.textContent();
        await expect(textContent?.toLowerCase()).toContain(expectation.toLowerCase());
    };

    async verifyInterests(interest: string[] | undefined) {
        if (!interest || interest.length === 0) return;
        await expect(this.interestsAboutSection).toBeVisible()
        const textContent = await this.interestsAboutSection.textContent();
        for (let i = 0; i < interest.length; i++) {
            await expect(textContent?.toLowerCase()).toContain(interest[i].toLowerCase());
        };
    };

    async verifyCauses(causes: string[] | undefined) {
        if (!causes || causes.length === 0) return;
        await expect(this.causesAboutSection).toBeVisible()
        const textContent = await this.causesAboutSection.textContent();
        for (let i = 0; i < causes.length; i++) {
            await expect(textContent?.toLowerCase()).toContain(causes[i].toLowerCase());
        };
    };

    async verifyEducationLevelAndUniversity(educationLevel?: string, university?: string) {
        await expect(this.educationAboutSection).toBeVisible()
        const textContent = await this.educationAboutSection.textContent();
        if (educationLevel) await expect(textContent?.toLowerCase()).toContain(educationLevel.toLowerCase());
        if (university) await expect(textContent?.toLowerCase()).toContain(university.toLowerCase());
    };

    async verifyJobInformation(jobTitle?: string, company?: string) {
        await expect(this.occupationAboutSection).toBeVisible()
        const textContent = await this.occupationAboutSection.textContent();
        if (jobTitle) await expect(textContent?.toLowerCase()).toContain(jobTitle.toLowerCase());
        if (company) await expect(textContent?.toLowerCase()).toContain(company.toLowerCase());
    };

    async verifyPoliticalBeliefs(belief?: string, details?: string) {
        await expect(this.politicalAboutSection).toBeVisible()
        const textContent = await this.politicalAboutSection.textContent();
        if (belief) await expect(textContent?.toLowerCase()).toContain(belief.toLowerCase());
        if (details) await expect(textContent?.toLowerCase()).toContain(details.toLowerCase());
    };

    async verifyReligiousBeliefs(belief?: string, details?: string) {
        await expect(this.relegiousAboutSection).toBeVisible()
        const textContent = await this.relegiousAboutSection.textContent();
        if (belief) await expect(textContent?.toLowerCase()).toContain(belief.toLowerCase());
        if (details) await expect(textContent?.toLowerCase()).toContain(details.toLowerCase());
    };

    async verifyPersonalityType(personalityType: string | undefined) {
        if (!personalityType) return;
        await expect(this.personalityAboutSection).toBeVisible()
        const textContent = await this.personalityAboutSection.textContent();
        await expect(textContent?.toLowerCase()).toContain(personalityType.toLowerCase());
    };

    async verifyBigFivePersonalitySection(personalityType: Record<string, number> | undefined) {
        if (!personalityType) return;
        await expect(this.bigFivePersonalityTraitsAboutSection).toBeVisible()
        const textContent = await this.bigFivePersonalityTraitsAboutSection.textContent();
        for (const [key, value] of Object.entries(personalityType)) {
            await expect(textContent?.toLowerCase()).toContain(key.toLowerCase());
            await expect(textContent?.toLowerCase()).toContain(`${value}`);
        };
    };

    async verifyDiet(diet: string | undefined) {
        if (!diet) return;
        await expect(this.dietAboutSection).toBeVisible()
        const textContent = await this.dietAboutSection.textContent();
        await expect(textContent?.toLowerCase()).toContain(diet.toLowerCase());
    };

    async verifySmoker(smoker: boolean | undefined) {
        await expect(this.smokerAboutSection).toBeVisible()
        const textContent = await this.smokerAboutSection.textContent();
        if (smoker === true) await expect(textContent?.toLowerCase()).toContain("Smokes".toLowerCase());
        if (smoker === false) await expect(textContent?.toLowerCase()).toContain("Doesn't smoke".toLowerCase());
    };

    async verifyDrinksPerMonth(drinks: string | undefined) {
        await expect(this.drinkerAboutSection).toBeVisible()
        const textContent = await this.drinkerAboutSection.textContent();
        await expect(textContent?.toLowerCase()).toContain(drinks);
    };

    async verifyLanguages(languages: string[] | undefined) {
        if (!languages || languages.length === 0) return;
        await expect(this.languagesAboutSection).toBeVisible()
        const textContent = await this.languagesAboutSection.textContent();
        for (let i = 0; i < languages.length; i++) {
            await expect(textContent?.toLowerCase()).toContain(languages[i].toLowerCase());
        };
    };

    async verifySocialMedia(socialMedia: Socials [] | undefined) {
        if (!socialMedia || socialMedia.length === 0) return;
        await expect(this.socialMediaSection).toBeVisible()
        const textContent = await this.socialMediaSection.textContent();
        for (let i = 0; i < socialMedia.length; i++) {
            await expect(textContent?.toLowerCase()).toContain(socialMedia[i].urlOrUsername.toLowerCase());
        };
    };
};