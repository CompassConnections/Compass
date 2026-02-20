import {expect, Locator, Page} from '@playwright/test'
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
} from 'common/choices'

export type Gender = 'Woman' | 'Man' | 'Other'
export type InterestedIn = 'Women' | 'Men' | 'Other'
export type ConnectionType = keyof typeof RELATIONSHIP_CHOICES
export type RelationshipStatus = keyof typeof RELATIONSHIP_STATUS_CHOICES
export type RelationshipStyle = keyof typeof ROMANTIC_CHOICES
export type ChildrenExpectation =
  | 'Strongly against'
  | 'Against'
  | 'Neutral'
  | 'For'
  | 'Strongly for'
export type PoliticalBeliefs = keyof typeof POLITICAL_CHOICES
export type Diet = keyof typeof DIET_CHOICES
export type Education = keyof typeof EDUCATION_CHOICES
export type Religion = keyof typeof RELIGION_CHOICES
export type Language = keyof typeof LANGUAGE_CHOICES
export type Ethnicity = keyof typeof RACE_CHOICES
export type Personality = keyof typeof MBTI_CHOICES
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
  private readonly usernameField: Locator
  private readonly nextButton: Locator
  private readonly bioField: Locator
  private readonly locationField: Locator
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
    this.usernameField = page.getByPlaceholder('Username')
    this.nextButton = page.getByRole('button', {name: 'Next', exact: true})
    this.bioField = page.getByRole('paragraph').filter({hasText: /^$/})
    this.locationField = page.getByPlaceholder('Search city...')
    this.ageField = page.getByPlaceholder('Age', {exact: true})
    this.feetHeightField = page.getByTestId('height-feet')
    this.inchesHeightField = page.getByTestId('height-inches')
    this.centimetersHeightField = page.getByTestId('height-centimeters')
    this.interestedInWomenCheckbox = page.getByRole('checkbox', {name: 'Women', exact: true})
    this.interestedInMenCheckbox = page.getByRole('checkbox', {name: 'Men', exact: true})
    this.interestedInOtherCheckbox = page.getByRole('checkbox', {name: 'Other'}).nth(1)
    this.minAgeOption = page.getByTestId('pref-age-min')
    this.maxAgeOption = page.getByTestId('pref-age-max')
    this.currentNumberOfKidsField = page.getByTestId('current-number-of-kids')
    this.stronglyDisagreeOnWantingKids = page.locator('[id="headlessui-radiogroup-option-:r49:"]')
    this.disagreeOnWantingKids = page.locator('[id="headlessui-radiogroup-option-:r4b:"]')
    this.neutralOnWantingKids = page.locator('[id="headlessui-radiogroup-option-:r4d:"]')
    this.agreeOnWantingKids = page.locator('[id="headlessui-radiogroup-option-:r4f:"]')
    this.stronglyAgreeOnWantingKids = page.locator('[id="headlessui-radiogroup-option-:r4h:"]')
    this.addInterestsField = page.getByRole('textbox', {name: 'Search or add'}).first()
    this.addInterestsButton = page.getByRole('button', {name: 'Add'}).first()
    this.addCausesField = page.getByRole('textbox', {name: 'Search or add'}).nth(1)
    this.addCausesButton = page.getByRole('button', {name: 'Add'}).nth(1)
    this.universityField = page.getByTestId('university')
    this.jobTitleField = page.getByTestId('job-title')
    this.companyField = page.getByTestId('company')
    this.universityCheckbox = page.getByRole('checkbox', {name: 'University'})
    this.addWorkAreaField = page.getByRole('textbox', {name: 'Search or add'}).nth(2)
    this.addWorkAreaButton = page.getByRole('button', {name: 'Add'}).nth(2)
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
    this.socialPlatformSelectionField = page.getByRole('button', {name: 'Platform'})
    this.socialPlatformSearchField = page.getByRole('textbox', {name: 'Search...'})
    this.addSocialPlatformField = page.getByRole('textbox', {name: 'URL'})
    this.addSocialPlatformButton = page.locator('button').filter({hasText: 'Add'}).nth(3)
    this.photoUploadButton = page.getByTestId('profile-upload-photo')
    this.saveButton = page.getByRole('button', {name: 'Save'})
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

  async chooseGender(gender: Gender | undefined) {
    await expect(this.page.locator(`span:has-text("${gender}")`)).toBeVisible()
    await this.page.locator(`span:has-text("${gender}")`).click()
    await expect(this.page.locator(`span:has-text("${gender}")`)).toBeChecked()
  }

  async fillAge(age: string | undefined) {
    if (!age) return
    await expect(this.ageField).toBeVisible()
    await this.ageField.fill(age)
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

  async fillEthnicity(ethnicity: Ethnicity | undefined) {
    if (ethnicity === 'Other') {
      await expect(
        this.page
          .locator('label')
          .filter({hasText: `${ethnicity}`})
          .first(),
      ).toBeVisible()
      await this.page
        .locator('label')
        .filter({hasText: `${ethnicity}`})
        .first()
        .click()
      await expect(
        this.page
          .locator('label')
          .filter({hasText: `${ethnicity}`})
          .first(),
      ).toBeChecked()
    } else {
      await expect(this.page.getByText(`${ethnicity}`, {exact: true})).toBeVisible()
      await this.page.getByText(`${ethnicity}`, {exact: true}).click()
      await expect(this.page.getByText(`${ethnicity}`, {exact: true})).toBeChecked()
    }
  }

  async fillInterestedInConnectingWith(interestedIn: InterestedIn | undefined) {
    if (interestedIn === 'Men') {
      await expect(this.interestedInMenCheckbox).toBeVisible()
      await this.interestedInMenCheckbox.click()
      await expect(this.interestedInMenCheckbox).toBeChecked()
    } else if (interestedIn === 'Women') {
      await expect(this.interestedInWomenCheckbox).toBeVisible()
      await this.interestedInWomenCheckbox.click()
      await expect(this.interestedInWomenCheckbox).toBeChecked()
    } else {
      await expect(this.interestedInOtherCheckbox).toBeVisible()
      await this.interestedInOtherCheckbox.click()
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

  async setConnectionType(type: ConnectionType | undefined) {
    await expect(this.page.getByLabel(`${type}`, {exact: true})).toBeVisible()
    await this.page.getByLabel(`${type}`, {exact: true}).click()
    await expect(this.page.getByLabel(`${type}`, {exact: true})).toBeChecked()
  }

  async setRelationshipStatus(status: RelationshipStatus | undefined) {
    await expect(this.page.getByLabel(`${status}`, {exact: true})).toBeVisible()
    await this.page.getByLabel(`${status}`, {exact: true}).click()
    await expect(this.page.getByLabel(`${status}`, {exact: true})).toBeChecked()
  }

  async setRelationshipStyle(style: RelationshipStyle | undefined) {
    await expect(this.page.getByLabel(`${style}`, {exact: true})).toBeVisible()
    await this.page.getByLabel(`${style}`, {exact: true}).click()
    await expect(this.page.getByLabel(`${style}`, {exact: true})).toBeChecked()
  }

  async fillCurrentNumberOfChildren(numberOfKids: string | undefined) {
    if (!numberOfKids) return
    await expect(this.currentNumberOfKidsField).toBeVisible()
    await this.currentNumberOfKidsField.fill(numberOfKids)
  }

  async setWantChildrenExpectation(expectation: ChildrenExpectation | undefined) {
    if (expectation === 'Strongly against') {
      await expect(this.stronglyDisagreeOnWantingKids).toBeVisible()
      await this.stronglyDisagreeOnWantingKids.click()
      await expect(this.stronglyDisagreeOnWantingKids).toBeChecked()
    } else if (expectation === 'Against') {
      await expect(this.disagreeOnWantingKids).toBeVisible()
      await this.disagreeOnWantingKids.click()
      await expect(this.disagreeOnWantingKids).toBeChecked()
    } else if (expectation === 'Neutral') {
      await expect(this.neutralOnWantingKids).toBeVisible()
      await this.neutralOnWantingKids.click()
      await expect(this.neutralOnWantingKids).toBeChecked()
    } else if (expectation === 'For') {
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
      const checkbox = this.page.getByRole('checkbox', {name: `${interest[i]}`})
      const isExisting = (await checkbox.count()) > 0

      if (isExisting) {
        await expect(this.page.getByRole('checkbox', {name: `${interest[i]}`})).toBeVisible()
        await this.page.getByRole('checkbox', {name: `${interest[i]}`}).click()
      } else {
        await expect(this.addInterestsField).toBeVisible()
        await expect(this.addInterestsButton).toBeVisible()
        await this.addInterestsField.fill(interest[i])
        await this.addInterestsButton.click()
      }
      await expect(this.page.getByRole('checkbox', {name: `${interest[i]}`})).toBeVisible()
      await expect(this.page.getByRole('checkbox', {name: `${interest[i]}`})).toBeChecked()
    }
  }

  async setCauses(cause: (Causes | string)[] | undefined) {
    if (!cause || cause?.length === 0) return

    for (let i = 0; i < cause.length; i++) {
      const checkbox = this.page.getByRole('checkbox', {name: `${cause[i]}`})
      const isExisting = (await checkbox.count()) > 0

      if (isExisting) {
        await expect(this.page.getByRole('checkbox', {name: `${cause[i]}`})).toBeVisible()
        await this.page.getByRole('checkbox', {name: `${cause[i]}`}).click()
      } else {
        await expect(this.addCausesField).toBeVisible()
        await expect(this.addCausesButton).toBeVisible()
        await this.addCausesField.fill(cause[i])
        await this.addCausesButton.click()
      }
      await expect(this.page.getByRole('checkbox', {name: `${cause[i]}`})).toBeVisible()
      await expect(this.page.getByRole('checkbox', {name: `${cause[i]}`})).toBeChecked()
    }
  }

  async setHighestEducationLevel(education: Education | undefined) {
    await expect(this.page.getByText(`${education}`, {exact: true})).toBeVisible()
    await this.page.getByText(`${education}`, {exact: true}).click()
    await expect(this.page.getByText(`${education}`, {exact: true})).toBeChecked()
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
      const checkbox = this.page.getByLabel(`${workArea[i]}`, {exact: true})
      const isExisting = (await checkbox.count()) > 0

      if (isExisting) {
        await expect(this.page.getByLabel(`${workArea[i]}`, {exact: true})).toBeVisible()
        await this.page.getByLabel(`${workArea[i]}`, {exact: true}).click()
      } else {
        await expect(this.addWorkAreaField).toBeVisible()
        await expect(this.addWorkAreaButton).toBeVisible()
        await this.addWorkAreaField.fill(workArea[i])
        await this.addWorkAreaButton.click()
      }
      await expect(this.page.getByLabel(`${workArea[i]}`, {exact: true})).toBeVisible()
      await expect(this.page.getByLabel(`${workArea[i]}`, {exact: true})).toBeChecked()
    }
  }

  async setPoliticalBeliefs(
    politicalBeliefs?: PoliticalBeliefs | undefined,
    details?: string | undefined,
  ) {
    if (politicalBeliefs) {
      await expect(this.page.getByRole('checkbox', {name: `${politicalBeliefs}`})).toBeVisible()
      await this.page.getByRole('checkbox', {name: `${politicalBeliefs}`}).click()
      await expect(this.page.getByRole('checkbox', {name: `${politicalBeliefs}`})).toBeChecked()
    }

    if (details) {
      await expect(this.politicalBeliefDetailsField).toBeVisible()
      await this.politicalBeliefDetailsField.fill(details)
    }
  }

  async setReligiousBeliefs(religiousBeliefs?: Religion | undefined, details?: string | undefined) {
    if (religiousBeliefs && religiousBeliefs === 'Other') {
      await expect(
        this.page
          .locator('label')
          .filter({hasText: `${religiousBeliefs}`})
          .nth(3),
      ).toBeVisible()
      await this.page
        .locator('label')
        .filter({hasText: `${religiousBeliefs}`})
        .nth(3)
        .click()
      await expect(
        this.page
          .locator('label')
          .filter({hasText: `${religiousBeliefs}`})
          .nth(3),
      ).toBeChecked()
    } else {
      await expect(this.page.getByRole('checkbox', {name: `${religiousBeliefs}`})).toBeVisible()
      await this.page.getByRole('checkbox', {name: `${religiousBeliefs}`}).click()
      await expect(this.page.getByRole('checkbox', {name: `${religiousBeliefs}`})).toBeChecked()
    }

    if (details) {
      await expect(this.religiousBeliefsDetailsField).toBeVisible()
      await this.religiousBeliefsDetailsField.fill(details)
    }
  }

  async setPersonalityType(personalityType: Personality | undefined) {
    await expect(this.page.getByText(`${personalityType}`, {exact: true})).toBeVisible()
    await this.page.getByText(`${personalityType}`, {exact: true}).click()
    await expect(this.page.getByText(`${personalityType}`, {exact: true})).toBeChecked()
  }

  async setOpennessPersonalityValue(value: number | undefined) {
    if (!value) return
    await expect(this.opennessPersonalitySlider).toBeVisible()
    await expect(this.opennessPersonalityValue).toBeVisible()
    await this.opennessPersonalitySlider.click()
    const originalValue = await this.opennessPersonalityValue.textContent()
    if (!originalValue) return
    if (parseInt(originalValue) < value) {
      while (true) {
        const actualValue = await this.opennessPersonalityValue.textContent()
        if (!actualValue) break

        if (parseInt(actualValue) >= value) {
          break
        }
        await this.page.keyboard.press('ArrowRight')
      }
    }
    if (parseInt(originalValue) > value) {
      while (true) {
        const actualValue = await this.opennessPersonalityValue.textContent()
        if (!actualValue) break

        if (parseInt(actualValue) <= value) {
          break
        }
        await this.page.keyboard.press('ArrowLeft')
      }
    }
  }

  async setConscientiousnessPersonalityValue(value: number | undefined) {
    if (!value) return
    await expect(this.conscientiousnessPersonalitySlider).toBeVisible()
    await expect(this.conscientiousnessPersonalityValue).toBeVisible()
    await this.conscientiousnessPersonalitySlider.click()
    const originalValue = await this.conscientiousnessPersonalityValue.textContent()
    if (!originalValue) return
    if (parseInt(originalValue) < value) {
      while (true) {
        const actualValue = await this.conscientiousnessPersonalityValue.textContent()
        if (!actualValue) break

        if (parseInt(actualValue) >= value) {
          break
        }
        await this.page.keyboard.press('ArrowRight')
      }
    }
    if (parseInt(originalValue) > value) {
      while (true) {
        const actualValue = await this.conscientiousnessPersonalityValue.textContent()
        if (!actualValue) break

        if (parseInt(actualValue) <= value) {
          break
        }
        await this.page.keyboard.press('ArrowLeft')
      }
    }
  }

  async setExtraversionPersonalityValue(value: number | undefined) {
    if (!value) return
    await expect(this.extraversionPersonalitySlider).toBeVisible()
    await expect(this.extraversionPersonalityValue).toBeVisible()
    await this.extraversionPersonalitySlider.click()
    const originalValue = await this.extraversionPersonalityValue.textContent()
    if (!originalValue) return
    if (parseInt(originalValue) < value) {
      while (true) {
        const actualValue = await this.extraversionPersonalityValue.textContent()
        if (!actualValue) break

        if (parseInt(actualValue) >= value) {
          break
        }
        await this.page.keyboard.press('ArrowRight')
      }
    }
    if (parseInt(originalValue) > value) {
      while (true) {
        const actualValue = await this.extraversionPersonalityValue.textContent()
        if (!actualValue) break

        if (parseInt(actualValue) <= value) {
          break
        }
        await this.page.keyboard.press('ArrowLeft')
      }
    }
  }

  async setAgreeablenessPersonalityValue(value: number | undefined) {
    if (!value) return
    await expect(this.agreeablenessPersonalitySlider).toBeVisible()
    await expect(this.agreeablenessPersonalityValue).toBeVisible()
    await this.agreeablenessPersonalitySlider.click()
    const originalValue = await this.agreeablenessPersonalityValue.textContent()
    if (!originalValue) return
    if (parseInt(originalValue) < value) {
      while (true) {
        const actualValue = await this.agreeablenessPersonalityValue.textContent()
        if (!actualValue) break

        if (parseInt(actualValue) >= value) {
          break
        }
        await this.page.keyboard.press('ArrowRight')
      }
    }
    if (parseInt(originalValue) > value) {
      while (true) {
        const actualValue = await this.agreeablenessPersonalityValue.textContent()
        if (!actualValue) break

        if (parseInt(actualValue) <= value) {
          break
        }
        await this.page.keyboard.press('ArrowLeft')
      }
    }
  }

  async setNeuroticismPersonalityValue(value: number | undefined) {
    if (!value) return
    await expect(this.neuroticismPersonalitySlider).toBeVisible()
    await expect(this.neuroticismPersonalityValue).toBeVisible()
    await this.neuroticismPersonalitySlider.click()
    const originalValue = await this.neuroticismPersonalityValue.textContent()
    if (!originalValue) return
    if (parseInt(originalValue) < value) {
      while (true) {
        const actualValue = await this.neuroticismPersonalityValue.textContent()
        if (!actualValue) break

        if (parseInt(actualValue) >= value) {
          break
        }
        await this.page.keyboard.press('ArrowRight')
      }
    }
    if (parseInt(originalValue) > value) {
      while (true) {
        const actualValue = await this.neuroticismPersonalityValue.textContent()
        if (!actualValue) break

        if (parseInt(actualValue) <= value) {
          break
        }
        await this.page.keyboard.press('ArrowLeft')
      }
    }
  }

  async setDietType(dietType: Diet | undefined) {
    if (dietType === 'Other') {
      await expect(this.page.locator('label').filter({hasText: 'Other'}).nth(4)).toBeVisible()
      await this.page.locator('label').filter({hasText: 'Other'}).nth(4).click()
      await expect(this.page.locator('label').filter({hasText: 'Other'}).nth(4)).toBeChecked()
    } else {
      await expect(this.page.getByRole('checkbox', {name: `${dietType}`})).toBeVisible()
      await this.page.getByRole('checkbox', {name: `${dietType}`}).click()
      await expect(this.page.getByRole('checkbox', {name: `${dietType}`})).toBeChecked()
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

  async setLanguages(language: Language[] | undefined) {
    if (!language || language.length === 0) return
    for (let i = 0; i < language.length; i++) {
      await expect(this.page.getByRole('checkbox', {name: `${language[i]}`})).toBeVisible()
      await this.page.getByRole('checkbox', {name: `${language[i]}`}).click()
      await expect(this.page.getByRole('checkbox', {name: `${language[i]}`})).toBeChecked()
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
}
