import {expect, Locator, Page} from '@playwright/test'
import {
  ConnectionTypeTuple,
  DietTuple,
  EducationTuple,
  EthnicityTuple,
  GenderTuple,
  InterestedInGenderTuple,
  LanguageTuple,
  PersonalityKey,
  PoliticalTuple,
  RelationshipStatusTuple,
  RelationshipStyleTuple,
  ReligionTuple,
} from 'common/choices'
import {birthYearFromStatedAge} from 'common/profiles/birth-date'

import {clickCheckbox, optionChip, optionChipInput} from '../utils/optionChip'

export type ChildrenExpectation =
  | ['Strongly against', 0]
  | ['Against', 1]
  | ['Neutral', 2]
  | ['For', 3]
  | ['Strongly for', 4]
export type Interests = 'Chess' | 'Games' | 'Joy' | 'Livres'
export type Causes = 'Animal Rights' | 'Feminism'
export type Platforms =
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

export class SignUpPage {
  private readonly displayNameField: Locator
  private readonly displayNameError: Locator
  private readonly usernameField: Locator
  private readonly usernameError: Locator
  private readonly nextButton: Locator
  private readonly bioField: Locator
  private readonly locationField: Locator
  // private readonly birthPlaceField: Locator
  private readonly headlineField: Locator
  private readonly keywordsField: Locator
  private readonly ageField: Locator
  private readonly feetHeightField: Locator
  private readonly inchesHeightField: Locator
  private readonly centimetersHeightField: Locator
  private readonly interestedInWomenCheckbox: Locator
  private readonly interestedInMenCheckbox: Locator
  private readonly interestedInOtherCheckbox: Locator
  private readonly minAgeOption: Locator
  private readonly maxAgeOption: Locator
  private readonly currentNumberOfKidsField: Locator
  private readonly stronglyDisagreeOnWantingKids: Locator
  private readonly disagreeOnWantingKids: Locator
  private readonly neutralOnWantingKids: Locator
  private readonly agreeOnWantingKids: Locator
  private readonly stronglyAgreeOnWantingKids: Locator
  private readonly addInterestsField: Locator
  private readonly addInterestsButton: Locator
  private readonly addCausesField: Locator
  private readonly addCausesButton: Locator
  private readonly universityField: Locator
  private readonly jobTitleField: Locator
  private readonly companyField: Locator
  private readonly universityCheckbox: Locator
  private readonly interestsSection: Locator
  private readonly causesSection: Locator
  private readonly workAreaSection: Locator
  private readonly addWorkAreaField: Locator
  private readonly addWorkAreaButton: Locator
  private readonly politicalBeliefDetailsField: Locator
  private readonly religiousBeliefsDetailsField: Locator
  private readonly opennessPersonalitySlider: Locator
  private readonly opennessPersonalityValue: Locator
  private readonly conscientiousnessPersonalitySlider: Locator
  private readonly conscientiousnessPersonalityValue: Locator
  private readonly extraversionPersonalitySlider: Locator
  private readonly extraversionPersonalityValue: Locator
  private readonly agreeablenessPersonalitySlider: Locator
  private readonly agreeablenessPersonalityValue: Locator
  private readonly neuroticismPersonalitySlider: Locator
  private readonly neuroticismPersonalityValue: Locator
  private readonly smokerField: Locator
  private readonly nonSmokerField: Locator
  private readonly alcoholConsumedPerMonthField: Locator
  private readonly socialPlatformSelectionField: Locator
  private readonly socialPlatformSearchField: Locator
  private readonly addSocialPlatformField: Locator
  private readonly addSocialPlatformButton: Locator
  private readonly photoUploadButton: Locator
  private readonly saveButton: Locator

  constructor(public readonly page: Page) {
    this.displayNameField = page.getByPlaceholder('Display name')
    this.displayNameError = page.getByTestId('signup-display-name')
    this.usernameField = page.getByPlaceholder('Username')
    this.usernameError = page.getByTestId('signup-username')
    this.nextButton = page.getByRole('button', {name: 'Next', exact: true})
    // Anchored on the editor itself rather than on markup around the "Bio" heading: the heading now
    // sits inside its own `data-form-section` wrapper, so it no longer has the editor as a sibling.
    this.bioField = page.getByTestId('signup-bio').locator('.tiptap')
    this.locationField = page.getByPlaceholder('Search city...')
    this.headlineField = page.getByTestId('headline')
    this.keywordsField = page.getByTestId('keywords')
    this.ageField = page.getByTestId('birth-year')
    this.feetHeightField = page.getByTestId('height-feet')
    this.inchesHeightField = page.getByTestId('height-inches')
    this.centimetersHeightField = page.getByTestId('height-centimeters')
    this.interestedInWomenCheckbox = page.getByRole('checkbox', {name: 'Women', exact: true})
    this.interestedInMenCheckbox = page.getByRole('checkbox', {name: 'Men', exact: true})
    this.interestedInOtherCheckbox = page.getByRole('checkbox', {name: 'Other'}).nth(1)
    this.minAgeOption = page.getByTestId('pref-age-min')
    this.maxAgeOption = page.getByTestId('pref-age-max')
    this.currentNumberOfKidsField = page.getByTestId('current-number-of-kids')
    this.stronglyDisagreeOnWantingKids = page.getByRole('radio', {name: 'Strongly disagree'})
    this.disagreeOnWantingKids = page.getByRole('radio', {name: 'Disagree'})
    this.neutralOnWantingKids = page.getByRole('radio', {name: 'Neutral'})
    this.agreeOnWantingKids = page.getByRole('radio', {name: 'Agree'})
    this.stronglyAgreeOnWantingKids = page.getByRole('radio', {name: 'Strongly agree'})
    // Scoped to their own section rather than picked off the page by index: Work Area, Causes and
    // Interests are all `AddOptionEntry`s with an identically-labelled "Search or add" field, and the
    // positional locators had interests and work the wrong way round — so custom interests were being
    // typed into Work Area, which is how "Chess" ended up an option in both sections.
    this.interestsSection = page.getByTestId('option-entry-interests')
    this.causesSection = page.getByTestId('option-entry-causes')
    this.workAreaSection = page.getByTestId('option-entry-work')
    this.addInterestsField = this.interestsSection.getByRole('textbox', {name: 'Search or add'})
    this.addInterestsButton = this.interestsSection.getByRole('button', {name: 'Add'})
    this.addCausesField = this.causesSection.getByRole('textbox', {name: 'Search or add'})
    this.addCausesButton = this.causesSection.getByRole('button', {name: 'Add'})
    this.universityField = page.getByTestId('university')
    this.jobTitleField = page.getByTestId('job-title')
    this.companyField = page.getByTestId('company')
    this.universityCheckbox = page.getByRole('checkbox', {name: 'University'})
    this.addWorkAreaField = this.workAreaSection.getByRole('textbox', {name: 'Search or add'})
    this.addWorkAreaButton = this.workAreaSection.getByRole('button', {name: 'Add'})
    this.politicalBeliefDetailsField = page.getByTestId('political-belief-details')
    this.religiousBeliefsDetailsField = page.getByTestId('religious-belief-details')
    this.opennessPersonalitySlider = page.getByRole('slider').first()
    this.opennessPersonalityValue = page.getByTestId('openness-value')
    this.conscientiousnessPersonalitySlider = page.getByRole('slider').nth(1)
    this.conscientiousnessPersonalityValue = page.getByTestId('conscientiousness-value')
    this.extraversionPersonalitySlider = page.getByRole('slider').nth(2)
    this.extraversionPersonalityValue = page.getByTestId('extraversion-value')
    this.agreeablenessPersonalitySlider = page.getByRole('slider').nth(3)
    this.agreeablenessPersonalityValue = page.getByTestId('agreeableness-value')
    this.neuroticismPersonalitySlider = page.getByRole('slider').nth(4)
    this.neuroticismPersonalityValue = page.getByTestId('neuroticism-value')
    this.smokerField = page.getByText('Yes', {exact: true})
    this.nonSmokerField = page.getByText('No', {exact: true})
    this.alcoholConsumedPerMonthField = page.getByTestId('alcohol-consumed-per-month')
    this.socialPlatformSelectionField = page.getByRole('button', {name: 'Website'})
    this.socialPlatformSearchField = page.getByRole('textbox', {name: 'Search...'})
    this.addSocialPlatformField = page.getByRole('textbox', {name: 'URL'})
    this.addSocialPlatformButton = page.locator('button').filter({hasText: 'Add'}).nth(3)
    this.photoUploadButton = page.getByTestId('profile-upload-photo')
    this.saveButton = page.getByRole('button', {name: 'Save'})
  }

  get nextButtonLocator(): Locator {
    return this.nextButton
  }

  async fillUsername(username: string) {
    await expect(this.usernameField).toBeVisible()
    await this.usernameField.fill(username)
  }

  async fillDisplayName(displayName: string) {
    await expect(this.displayNameField).toBeVisible()
    await this.displayNameField.fill(displayName)
  }

  async fillBio(bio: string | undefined) {
    if (!bio) return
    await expect(this.bioField).toBeVisible()
    await this.bioField.fill(bio)
  }

  async fillLocation(location: string | undefined) {
    if (!location) return
    await expect(this.locationField).toBeVisible()
    await this.locationField.fill(location)
  }

  async chooseGender(gender: GenderTuple | undefined) {
    if (!gender) return
    await expect(this.page.locator(`:text-is("${gender[0]}")`)).toBeVisible()
    await this.page.locator(`:text-is("${gender[0]}")`).click()
    await expect(this.page.locator(`:text-is("${gender[0]}")`)).toBeChecked()
  }

  /**
   * The form asks for a year of birth rather than an age, so that a profile does not go stale a year
   * after it is filled in — and never for a full date of birth. The fixtures still describe people
   * by age, so translate with the same rule the app uses, which keeps the assertions downstream
   * comparing the saved `age` with the fixture's age exact whatever time of year the suite runs.
   */
  async fillAge(age: string | undefined) {
    if (!age) return
    await expect(this.ageField).toBeVisible()
    await this.ageField.fill(String(birthYearFromStatedAge(Number(age))))
  }

  async fillHeight(height: {feet?: string; inches?: string; centimeters?: string}) {
    const {feet, inches, centimeters} = height

    if ((!feet || !inches) && !centimeters) return

    if (centimeters) {
      await expect(this.centimetersHeightField).toBeVisible()
      await this.centimetersHeightField.fill(centimeters)
    } else if (feet && inches) {
      await expect(this.feetHeightField).toBeVisible()
      await expect(this.inchesHeightField).toBeVisible()
      await this.feetHeightField.fill(feet)
      await this.inchesHeightField.fill(inches)
    }
  }

  async fillHeightFeetInches(feet: string | undefined, inches: string | undefined) {
    if (!feet || !inches) return
    await expect(this.feetHeightField).toBeVisible()
    await expect(this.inchesHeightField).toBeVisible()
    await this.feetHeightField.fill(feet)
    await this.inchesHeightField.fill(inches)
  }

  async fillHeightCentimeters(centimeters: string | undefined) {
    if (!centimeters) return
    await expect(this.centimetersHeightField).toBeVisible()
    await this.centimetersHeightField.fill(centimeters)
  }

  async fillEthnicity(ethnicity: EthnicityTuple | undefined) {
    if (!ethnicity) return
    if (ethnicity[0] === 'Other') {
      await expect(
        this.page
          .locator('label')
          .filter({hasText: `${ethnicity[0]}`})
          .first(),
      ).toBeVisible()
      await this.page
        .locator('label')
        .filter({hasText: `${ethnicity[0]}`})
        .first()
        .click()
      await expect(
        this.page
          .locator('label')
          .filter({hasText: `${ethnicity[0]}`})
          .first(),
      ).toBeChecked()
    } else {
      await expect(this.page.getByText(`${ethnicity[0]}`, {exact: true})).toBeVisible()
      await this.page.getByText(`${ethnicity[0]}`, {exact: true}).click()
      await expect(this.page.getByText(`${ethnicity[0]}`, {exact: true})).toBeChecked()
    }
  }

  async fillInterestedInConnectingWith(interestedIn: InterestedInGenderTuple | undefined) {
    if (!interestedIn) return
    if (interestedIn[0] === 'Men') {
      await expect(this.interestedInMenCheckbox).toBeVisible()
      await clickCheckbox(this.interestedInMenCheckbox)
      await expect(this.interestedInMenCheckbox).toBeChecked()
    } else if (interestedIn[0] === 'Women') {
      await expect(this.interestedInWomenCheckbox).toBeVisible()
      await clickCheckbox(this.interestedInWomenCheckbox)
      await expect(this.interestedInWomenCheckbox).toBeChecked()
    } else {
      await expect(this.interestedInOtherCheckbox).toBeVisible()
      await clickCheckbox(this.interestedInOtherCheckbox)
      await expect(this.interestedInOtherCheckbox).toBeChecked()
    }
  }

  async fillAgeRangeInterest(min: string | undefined, max?: string | undefined) {
    if (!min || !max) return
    await expect(this.minAgeOption).toBeVisible()
    await expect(this.maxAgeOption).toBeVisible()
    await this.minAgeOption.selectOption(min)
    if (max) {
      await this.maxAgeOption.selectOption(max)
    }
  }

  async setConnectionType(type: ConnectionTypeTuple | undefined) {
    if (!type) return
    await expect(optionChip(this.page, type[0])).toBeVisible()
    await optionChip(this.page, type[0]).click()
    await expect(optionChipInput(this.page, type[0])).toBeChecked()
  }

  async setRelationshipStatus(status: RelationshipStatusTuple | undefined) {
    if (!status) return
    await expect(optionChip(this.page, status[0])).toBeVisible()
    await optionChip(this.page, status[0]).click()
    await expect(optionChipInput(this.page, status[0])).toBeChecked()
  }

  async setRelationshipStyle(style: RelationshipStyleTuple | undefined) {
    if (!style) return
    await expect(optionChip(this.page, style[0])).toBeVisible()
    await optionChip(this.page, style[0]).click()
    await expect(optionChipInput(this.page, style[0])).toBeChecked()
  }

  async fillCurrentNumberOfChildren(numberOfKids: string | undefined) {
    if (!numberOfKids) return
    await expect(this.currentNumberOfKidsField).toBeVisible()
    await this.currentNumberOfKidsField.fill(numberOfKids)
  }

  async setWantChildrenExpectation(expectation: ChildrenExpectation | undefined) {
    if (!expectation) return
    const [label, value] = expectation
    if (label === 'Strongly against') {
      await expect(this.stronglyDisagreeOnWantingKids).toBeVisible()
      await this.stronglyDisagreeOnWantingKids.click()
      await expect(this.stronglyDisagreeOnWantingKids).toBeChecked()
    } else if (label === 'Against') {
      await expect(this.disagreeOnWantingKids).toBeVisible()
      await this.disagreeOnWantingKids.click()
      await expect(this.disagreeOnWantingKids).toBeChecked()
    } else if (label === 'Neutral') {
      await expect(this.neutralOnWantingKids).toBeVisible()
      await this.neutralOnWantingKids.click()
      await expect(this.neutralOnWantingKids).toBeChecked()
    } else if (label === 'For') {
      await expect(this.agreeOnWantingKids).toBeVisible()
      await this.agreeOnWantingKids.click()
      await expect(this.agreeOnWantingKids).toBeChecked()
    } else {
      await expect(this.stronglyAgreeOnWantingKids).toBeVisible()
      await this.stronglyAgreeOnWantingKids.click()
      await expect(this.stronglyAgreeOnWantingKids).toBeChecked()
    }
  }

  async setInterests(interest: (Interests | string)[] | undefined) {
    if (!interest || interest.length === 0) return

    for (let i = 0; i < interest.length; i++) {
      const checkbox = this.interestsSection.getByRole('checkbox', {name: `${interest[i]}`})
      const isExisting = (await checkbox.count()) > 0

      if (isExisting) {
        await expect(checkbox).toBeVisible()
        await clickCheckbox(checkbox)
      } else {
        await expect(this.addInterestsField).toBeVisible()
        await expect(this.addInterestsButton).toBeVisible()
        await this.addInterestsField.fill(interest[i])
        await this.addInterestsButton.click()
      }
      await expect(checkbox).toBeVisible()
      await expect(checkbox).toBeChecked()
    }
  }

  async setCauses(cause: (Causes | string)[] | undefined) {
    if (!cause || cause?.length === 0) return

    for (let i = 0; i < cause.length; i++) {
      const checkbox = this.causesSection.getByRole('checkbox', {name: `${cause[i]}`})
      const isExisting = (await checkbox.count()) > 0

      if (isExisting) {
        await expect(checkbox).toBeVisible()
        await clickCheckbox(checkbox)
      } else {
        await expect(this.addCausesField).toBeVisible()
        await expect(this.addCausesButton).toBeVisible()
        await this.addCausesField.fill(cause[i])
        await this.addCausesButton.click()
      }
      await expect(checkbox).toBeVisible()
      await expect(checkbox).toBeChecked()
    }
  }

  async setHighestEducationLevel(education: EducationTuple | undefined) {
    if (!education) return
    await expect(this.page.getByText(`${education[0]}`, {exact: true})).toBeVisible()
    await this.page.getByText(`${education[0]}`, {exact: true}).click()
    await expect(this.page.getByText(`${education[0]}`, {exact: true})).toBeChecked()
  }

  async fillUniversity(university: string | undefined) {
    if (!university) return
    await expect(this.universityField).toBeVisible()
    await this.universityField.fill(university)
  }

  async fillJobTitle(jobTitle: string | undefined) {
    if (!jobTitle) return
    await expect(this.jobTitleField).toBeVisible()
    await this.jobTitleField.fill(jobTitle)
  }

  async fillCompany(company: string | undefined) {
    if (!company) return
    await expect(this.companyField).toBeVisible()
    await this.companyField.fill(company)
  }

  async setWorkArea(workArea: string[] | undefined) {
    if (!workArea || workArea?.length === 0) return

    for (let i = 0; i < workArea.length; i++) {
      const chip = optionChip(this.workAreaSection, workArea[i])
      const isExisting = (await chip.count()) > 0

      if (isExisting) {
        await expect(chip).toBeVisible()
        await chip.click()
        await this.page.waitForTimeout(500)
      } else {
        await expect(this.addWorkAreaField).toBeVisible()
        await expect(this.addWorkAreaButton).toBeVisible()
        await this.addWorkAreaField.fill(workArea[i])
        await this.addWorkAreaButton.click()
        await this.page.waitForTimeout(500)
      }
      await expect(chip).toBeVisible()
      await expect(optionChipInput(this.workAreaSection, workArea[i])).toBeChecked()
    }
  }

  async setPoliticalBeliefs(
    politicalBeliefs?: PoliticalTuple | undefined,
    details?: string | undefined,
  ) {
    if (politicalBeliefs) {
      await expect(this.page.getByRole('checkbox', {name: `${politicalBeliefs[0]}`})).toBeVisible()
      await clickCheckbox(this.page.getByRole('checkbox', {name: `${politicalBeliefs[0]}`}))
      await expect(this.page.getByRole('checkbox', {name: `${politicalBeliefs[0]}`})).toBeChecked()
    }

    if (details) {
      await expect(this.politicalBeliefDetailsField).toBeVisible()
      await this.politicalBeliefDetailsField.fill(details)
    }
  }

  async setReligiousBeliefs(
    religiousBeliefs?: ReligionTuple | undefined,
    details?: string | undefined,
  ) {
    if (!religiousBeliefs) return
    if (religiousBeliefs[0] === 'Other') {
      await expect(
        this.page
          .locator('label')
          .filter({hasText: `${religiousBeliefs[0]}`})
          .nth(3),
      ).toBeVisible()
      await this.page
        .locator('label')
        .filter({hasText: `${religiousBeliefs[0]}`})
        .nth(3)
        .click()
      await expect(
        this.page
          .locator('label')
          .filter({hasText: `${religiousBeliefs[0]}`})
          .nth(3),
      ).toBeChecked()
    } else {
      await expect(this.page.getByRole('checkbox', {name: `${religiousBeliefs[0]}`})).toBeVisible()
      await clickCheckbox(this.page.getByRole('checkbox', {name: `${religiousBeliefs[0]}`}))
      await expect(this.page.getByRole('checkbox', {name: `${religiousBeliefs[0]}`})).toBeChecked()
    }

    if (details) {
      await expect(this.religiousBeliefsDetailsField).toBeVisible()
      await this.religiousBeliefsDetailsField.fill(details)
    }
  }

  async setPersonalityType(personalityType: PersonalityKey | undefined) {
    await expect(this.page.getByText(`${personalityType}`, {exact: true})).toBeVisible()
    await this.page.getByText(`${personalityType}`, {exact: true}).click()
    await expect(this.page.getByText(`${personalityType}`, {exact: true})).toBeChecked()
  }

  /**
   * Walk a Big Five slider to `value` with arrow keys.
   *
   * The value label reads "–", not a number, until the trait has been touched — the form
   * deliberately distinguishes "unset" from 50 (see `Big5Slider` in optional-profile-form.tsx).
   * Clicking the thumb doesn't clear that: Radix only emits onValueChange when the value actually
   * changes, and the thumb already sits at the default. So nudge it with a key press first,
   * otherwise `parseInt('–')` is NaN, every comparison below is false, and the trait is silently
   * left unset — which then shows up much later as a missing Big Five section on the profile.
   */
  private async setBig5Value(slider: Locator, valueLabel: Locator, value: number | undefined) {
    if (!value) return
    await expect(slider).toBeVisible()
    await expect(valueLabel).toBeVisible()
    await slider.click()

    const readValue = async () => parseInt((await valueLabel.textContent()) ?? '')
    if (isNaN(await readValue())) await slider.press('ArrowRight')

    const MAX_ITERATIONS = 200
    for (let i = 0; ; i++) {
      if (i > MAX_ITERATIONS) {
        throw new Error(`Big Five slider did not reach ${value} within ${MAX_ITERATIONS} presses`)
      }
      const actual = await readValue()
      if (isNaN(actual)) throw new Error('Big Five slider has no numeric value')
      if (actual === value) return
      await slider.press(actual < value ? 'ArrowRight' : 'ArrowLeft')
    }
  }

  async setOpennessPersonalityValue(value: number | undefined) {
    await this.setBig5Value(this.opennessPersonalitySlider, this.opennessPersonalityValue, value)
  }

  async setConscientiousnessPersonalityValue(value: number | undefined) {
    await this.setBig5Value(
      this.conscientiousnessPersonalitySlider,
      this.conscientiousnessPersonalityValue,
      value,
    )
  }

  async setExtraversionPersonalityValue(value: number | undefined) {
    await this.setBig5Value(
      this.extraversionPersonalitySlider,
      this.extraversionPersonalityValue,
      value,
    )
  }

  async setAgreeablenessPersonalityValue(value: number | undefined) {
    await this.setBig5Value(
      this.agreeablenessPersonalitySlider,
      this.agreeablenessPersonalityValue,
      value,
    )
  }

  async setNeuroticismPersonalityValue(value: number | undefined) {
    await this.setBig5Value(
      this.neuroticismPersonalitySlider,
      this.neuroticismPersonalityValue,
      value,
    )
  }

  async setDietType(dietType: DietTuple | undefined) {
    if (!dietType) return
    if (dietType[0] === 'Other') {
      await expect(this.page.locator('label').filter({hasText: 'Other'}).nth(4)).toBeVisible()
      await this.page.locator('label').filter({hasText: 'Other'}).nth(4).click()
      await expect(this.page.locator('label').filter({hasText: 'Other'}).nth(4)).toBeChecked()
    } else {
      await expect(this.page.getByRole('checkbox', {name: `${dietType[0]}`})).toBeVisible()
      await clickCheckbox(this.page.getByRole('checkbox', {name: `${dietType[0]}`}))
      await expect(this.page.getByRole('checkbox', {name: `${dietType[0]}`})).toBeChecked()
    }
  }

  async setIsSmoker(bool: boolean | undefined) {
    if (bool) {
      await expect(this.smokerField).toBeVisible()
      await this.smokerField.click()
      await expect(this.smokerField).toBeChecked()
    } else {
      await expect(this.nonSmokerField).toBeVisible()
      await this.nonSmokerField.click()
      await expect(this.nonSmokerField).toBeChecked()
    }
  }

  async fillAlcoholPerMonth(amount: string | undefined) {
    if (!amount) return
    await expect(this.alcoholConsumedPerMonthField).toBeVisible()
    await this.alcoholConsumedPerMonthField.fill(amount)
  }

  async setLanguages(language: LanguageTuple[] | undefined) {
    if (!language || language.length === 0) return
    await clickCheckbox(this.page.getByRole('checkbox', {name: `English`}))
    for (let i = 0; i < language.length; i++) {
      await expect(this.page.getByRole('checkbox', {name: `${language[i][0]}`})).toBeVisible()
      await clickCheckbox(this.page.getByRole('checkbox', {name: `${language[i][0]}`}))
      await expect(this.page.getByRole('checkbox', {name: `${language[i][0]}`})).toBeChecked()
    }
  }

  async addSocialMediaPlatform(
    socialMedia: {platform: Platforms; urlOrUsername: string}[] | undefined,
  ) {
    if (!socialMedia) return
    for (let i = 0; i < socialMedia.length; i++) {
      await expect(this.socialPlatformSelectionField).toBeVisible()
      await this.socialPlatformSelectionField.click()
      await expect(this.socialPlatformSearchField).toBeVisible()
      await this.socialPlatformSearchField.fill(socialMedia[i].platform)
      await expect(this.page.getByText(`${socialMedia[i].platform}`, {exact: true})).toBeVisible()
      await this.page.getByText(`${socialMedia[i].platform}`, {exact: true}).click()
      await this.addSocialPlatformField.fill(socialMedia[i].urlOrUsername)
      await this.addSocialPlatformButton.click()
      await expect(this.page.getByText(`${socialMedia[i].platform}`, {exact: true})).toBeVisible()
      await expect(
        this.page.locator(`input[value='${socialMedia[i].urlOrUsername}']`),
      ).toBeVisible()
    }
  }

  async clickNextButton() {
    await expect(this.nextButton).toBeVisible()
    await this.nextButton.click()
  }

  async uploadProfilePhoto() {
    await expect(this.photoUploadButton).toBeVisible()
    await this.photoUploadButton.click()
  }

  async saveProfileChanges() {
    await expect(this.saveButton).toBeVisible()
    await this.saveButton.click()
  }

  async fillHeadline(headline: string | undefined) {
    if (!headline) return
    await expect(this.headlineField).toBeVisible()
    await this.headlineField.fill(headline)
  }

  async fillKeywords(keywords: string | undefined) {
    if (!keywords) return
    await expect(this.keywordsField).toBeVisible()
    await this.keywordsField.fill(keywords)
  }

  async verifyDisplayNameError() {
    await expect(this.displayNameError).toBeVisible()
  }

  async verifyUsernameError() {
    await expect(this.usernameError).toBeVisible()
  }
}
