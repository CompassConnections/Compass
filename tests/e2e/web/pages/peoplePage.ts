import {expect, Locator, Page} from '@playwright/test'
import {
  ConnectionTypeTuple,
  EducationTuple,
  DietTuple,
  PsychedelicsTuple,
  CannabisTuple,
  LanguageTuple,
  PoliticalTuple,
  ReligionTuple,
  PersonalityKey,
  LastActiveTuple,
  InterestedInGenderTuple,
} from 'common/choices'
import {MinMaxNumbers} from '../utils/accountInformation'

export type BackgroundFilter = {
  location?: string
  education?: EducationTuple
  work?: string
}

export type LifestyleFilter = {
  interest?: string
  cause?: string
  diet?: DietTuple
  alcohol?: MinMaxNumbers
  smoker?: 'Yes' | 'No' | 'Either'
  psychedelics?: PsychedelicsTuple
  cannabis?: CannabisTuple
  language?: LanguageTuple
}

export type BeliefsFilter = {
  political?: PoliticalTuple
  religious?: ReligionTuple
}

export type PersonalityFilter = {
  mbti?: PersonalityKey
  bigFive?: BigFive
}

type BigFive = {
  openness?: MinMaxNumbers
  conscientiousness?: MinMaxNumbers
  extraversion?: MinMaxNumbers
  agreeableness?: MinMaxNumbers
  neuroticism?: MinMaxNumbers
}

export type AdvancedFilter = {
  lastActive?: LastActiveTuple
  photos?: boolean
}

export type DisplayFilter = {
  cardSize?: 'Small' | 'Medium' | 'Large'
  filters?: {
    Gender?: boolean
    City?: boolean
    Age?: boolean
    Headline?: boolean
    Keywords?: boolean
    'What they seek'?: boolean
    Work?: boolean
    Interests?: boolean
    Causes?: boolean
    Diet?: boolean
    Smoking?: boolean
    Drinks?: boolean
    MBTI?: boolean
    Languages?: boolean
    Bio?: boolean
    'Profile photo'?: boolean
  }
}

export type PeoplePageFilter = {
  connectionFilter?: ConnectionTypeTuple
  ageFilter?: MinMaxNumbers
  genderFilter?: InterestedInGenderTuple
  backgroundFilter?: BackgroundFilter
  lifestyleFilter?: LifestyleFilter
  valuesAndBeliefsFilter?: BeliefsFilter
  personalityFilter?: PersonalityFilter
}

export class PeoplePage {
  private readonly peopleHeading: Locator
  private readonly savedPeopleHeading: Locator
  private readonly savedPeopleList: Locator
  private readonly searchBox: Locator
  private readonly savedPeopleButton: Locator
  private readonly profileCount: Locator
  private readonly resetFilters: Locator
  private readonly yourFiltersCheckbox: Locator
  private readonly incompleteProfilesCheckbox: Locator
  private readonly connectionTypeDropdown: Locator
  private readonly locationDropdown: Locator
  private readonly ageRangeDropdown: Locator
  private readonly genderDropdown: Locator
  private readonly backgroundDropdown: Locator
  private readonly backgroundLocation: Locator
  private readonly backgroundEducation: Locator
  private readonly backgroundWork: Locator
  private readonly lifestyleDropdown: Locator
  private readonly lifestyleInterests: Locator
  private readonly lifestyleCauses: Locator
  private readonly lifestyleDiet: Locator
  private readonly lifestyleAlcohol: Locator
  private readonly lifestyleSmoker: Locator
  private readonly lifestylePsychedelics: Locator
  private readonly lifestyleCannabis: Locator
  private readonly lifestyleLanguages: Locator
  private readonly valuesAndBeliefsDropdown: Locator
  private readonly valuesAndBeliefsPolitics: Locator
  private readonly valuesAndBeliefsReligion: Locator
  private readonly personalityDropdown: Locator
  private readonly personalityMbti: Locator
  private readonly personalityBigFive: Locator
  private readonly advancedDropdown: Locator
  private readonly advancedActive: Locator
  private readonly advancedPhotos: Locator
  private readonly displayDropdown: Locator
  private readonly profileGrid: Locator
  private readonly profileResults: Locator
  private readonly profileHide: Locator
  private readonly profileStar: Locator
  private readonly profileMessage: Locator
  private readonly messageInput: Locator
  private readonly profileName: Locator
  private readonly profileAgeGender: Locator
  private readonly profileSeeking: Locator

  constructor(public readonly page: Page) {
    this.peopleHeading = page.getByRole('heading', {name: 'People'})
    this.savedPeopleHeading = page.getByRole('heading', {name: 'Saved People'})
    this.savedPeopleList = page.getByTestId('saved-person')
    this.searchBox = page.getByRole('textbox', {name: 'Search anything...'})
    this.savedPeopleButton = page.getByRole('button', {name: 'Saved People'})
    this.profileCount = page.getByTestId('people-profile-count')
    this.resetFilters = page.getByRole('button', {name: 'Reset filters'})
    this.yourFiltersCheckbox = page.getByText('Your filters', {exact: true})
    this.incompleteProfilesCheckbox = page.getByText('Include incomplete profiles', {exact: true})
    this.connectionTypeDropdown = page.getByRole('button', {name: 'Any connection'})
    this.locationDropdown = page.getByRole('button', {name: 'Living anywhere'})
    this.ageRangeDropdown = page.getByRole('button', {name: 'Any age'})
    this.genderDropdown = page.getByRole('button', {name: 'Any gender'})
    this.backgroundDropdown = page.getByRole('button', {name: 'Background'})
    this.backgroundLocation = page.getByRole('button', {name: 'Grew up anywhere'})
    this.backgroundEducation = page.getByText('Any education', {exact: true})
    this.backgroundWork = page.getByText('Any work', {exact: true})
    this.lifestyleDropdown = page.getByRole('button', {name: 'Lifestyle'})
    this.lifestyleInterests = page.getByRole('button', {name: 'Any interests'})
    this.lifestyleCauses = page.getByRole('button', {name: 'Any causes'})
    this.lifestyleDiet = page.getByRole('button', {name: 'Any diet'})
    this.lifestyleAlcohol = page.getByRole('button', {name: 'Any drinks'})
    this.lifestyleSmoker = page.getByTestId('lifestyle-smoker')
    this.lifestylePsychedelics = page.getByRole('button', {name: 'Any psychedelics'})
    this.lifestyleCannabis = page.getByRole('button', {name: 'Any cannabis'})
    this.lifestyleLanguages = page.getByRole('button', {name: 'Any language'})
    this.valuesAndBeliefsDropdown = page.getByRole('button', {name: 'Values & Beliefs'})
    this.valuesAndBeliefsPolitics = page.getByRole('button', {name: 'Any politics'})
    this.valuesAndBeliefsReligion = page.getByRole('button', {name: 'Any religion'})
    this.personalityDropdown = page.getByRole('button', {name: 'Personality'})
    this.personalityMbti = page.getByRole('button', {name: 'Any MBTI'})
    this.personalityBigFive = page.getByRole('button', {name: 'Any Big 5'})
    this.advancedDropdown = page.getByRole('button', {name: 'Advanced'})
    this.advancedActive = page.getByTestId('advanced-active')
    this.advancedPhotos = page.getByText('Photos', {exact: true})
    this.displayDropdown = page.getByRole('button', {name: 'Display'})
    this.profileGrid = page.getByTestId('people-profile-grid')
    this.profileResults = page.getByTestId('people-profile-results')
    this.profileHide = page.getByTestId('hide-profile-button')
    this.profileStar = page.getByTestId('star-profile-button')
    this.profileMessage = page.getByTestId('message-profile-button')
    this.messageInput = page.locator('.tiptap')
    this.profileName = page.getByTestId('people-profile-name')
    this.profileAgeGender = page.getByTestId('people-profile-age-gender')
    this.profileSeeking = page.getByTestId('people-profile-seeking')
  }

  get profileCountLocator(): Locator {
    return this.profileCount
  }
  get profileNameLocator(): Locator {
    return this.profileName
  }
  get profileAgeGenderLocator(): Locator {
    return this.profileAgeGender
  }
  get profileSeekingLocator(): Locator {
    return this.profileSeeking
  }

  async sliderHelper(range: MinMaxNumbers, locator?: Locator) {
    let minSlider
    let maxSlider
    if (locator) {
      minSlider = await locator.getByRole('slider', {name: 'Minimum'})
      maxSlider = await locator.getByRole('slider', {name: 'Maximum'})
    } else {
      minSlider = await this.page.getByRole('slider', {name: 'Minimum'})
      maxSlider = await this.page.getByRole('slider', {name: 'Maximum'})
    }

    await expect(minSlider).toBeVisible()
    await expect(maxSlider).toBeVisible()
    if (range.min === null || range.max === null) return

    const minRange = Number(range.min)
    const maxRange = Number(range.max)
    const currentMinValue = Number(await minSlider.getAttribute('aria-valuenow'))
    const currentMaxValue = Number(await maxSlider.getAttribute('aria-valuenow'))

    if (isNaN(currentMinValue) || isNaN(currentMaxValue)) return

    if (minRange > currentMinValue) {
      await minSlider.click()
      let iterations = 0
      const MAX_ITERATIONS = 100
      while (true) {
        if (iterations++ > MAX_ITERATIONS) {
          throw new Error(`Slider adjustment exceeded ${MAX_ITERATIONS} iterations`)
        }
        const changedMinValue = Number(await minSlider.getAttribute('aria-valuenow'))

        if (isNaN(changedMinValue)) break
        if (minRange <= changedMinValue) break
        await this.page.keyboard.press('ArrowRight')
      }
    }

    if (maxRange < currentMaxValue) {
      await maxSlider.click()
      let iterations = 0
      const MAX_ITERATIONS = 100
      while (true) {
        if (iterations++ > MAX_ITERATIONS) {
          throw new Error(`Slider adjustment exceeded ${MAX_ITERATIONS} iterations`)
        }
        const changedMaxValue = Number(await maxSlider.getAttribute('aria-valuenow'))
        if (isNaN(changedMaxValue)) break
        if (maxRange >= changedMaxValue) break
        await this.page.keyboard.press('ArrowLeft')
      }
    }
  }

  async selectOption(trigger: Locator, label: string) {
    await expect(trigger).toBeVisible()
    await trigger.click()

    const option = this.page.getByLabel(label, {exact: true})
    await expect(option).toBeVisible()
    await option.click()
  }

  async verifyPeoplePage() {
    await expect(this.peopleHeading).toBeVisible()
  }

  async clickSavedPeopleButton() {
    await expect(this.savedPeopleButton).toBeVisible()
    await this.savedPeopleButton.click()
  }

  async useSearch(item: string) {
    await expect(this.searchBox).toBeVisible()
    await this.searchBox.click()
    await this.searchBox.fill(item)
    await this.page.waitForTimeout(1000)
  }

  async resetFilter() {
    await expect(this.resetFilters).toBeVisible()
    await this.resetFilters.click()
  }

  async setYourFilters() {
    await expect(this.yourFiltersCheckbox).toBeVisible()
    await this.yourFiltersCheckbox.click()
  }

  async setIncludeIncompleteProfiles() {
    await expect(this.incompleteProfilesCheckbox).toBeVisible()
    await this.incompleteProfilesCheckbox.click()
  }

  async setConnectionTypeFilter(connectionType: ConnectionTypeTuple) {
    await this.selectOption(this.connectionTypeDropdown, connectionType[0])
    // await expect(this.connectionTypeDropdown).toBeVisible()
    // await this.connectionTypeDropdown.click()
    // await expect(this.page.getByLabel(connectionType[0])).toBeVisible()
    // await this.page.getByLabel(connectionType[0]).click()
  }

  async setLocationFilter(location: string) {
    await expect(this.locationDropdown).toBeVisible()
    await this.locationDropdown.click()
    await expect(this.page.getByRole('textbox', {name: 'Search city...'})).toBeVisible()
    await this.page.getByRole('textbox', {name: 'Search city...'}).fill(location)
  }

  async setAgeRangeFilter(ageRange: MinMaxNumbers) {
    await expect(this.ageRangeDropdown).toBeVisible()
    await this.ageRangeDropdown.click()
    await this.sliderHelper(ageRange)
  }

  async setGenderTypeFilter(genderType: InterestedInGenderTuple) {
    await this.selectOption(this.genderDropdown, genderType[0])
    // await expect(this.genderDropdown).toBeVisible()
    // await this.genderDropdown.click()
    // await expect(this.page.getByLabel(genderType[0], {exact: true})).toBeVisible()
    // await this.page.getByLabel(genderType[0], {exact: true}).click()
  }

  async setBackgroundFilter(background: BackgroundFilter) {
    await expect(this.backgroundDropdown).toBeVisible()
    await this.backgroundDropdown.click()
    if (background.location) {
      await expect(this.backgroundLocation).toBeVisible()
      await this.backgroundLocation.click()
      await this.page.getByPlaceholder('Search city...', {exact: true}).fill(background.location)
    }

    if (background.education) {
      await expect(this.backgroundEducation).toBeVisible()
      await this.backgroundEducation.click()
      await expect(this.page.getByLabel(background.education[0], {exact: true})).toBeVisible()
      await this.page.getByLabel(background.education[0], {exact: true}).click()
    }

    if (background.work) {
      await expect(this.backgroundWork).toBeVisible()
      await this.backgroundWork.click()
      await expect(this.page.getByLabel(background.work, {exact: true})).toBeVisible()
      await this.page.getByLabel(background.work, {exact: true}).click()
    }
  }

  async setLifestyleFilter(lifestyle: LifestyleFilter) {
    await expect(this.lifestyleDropdown).toBeVisible()
    await this.lifestyleDropdown.click()

    if (lifestyle.interest) await this.selectOption(this.lifestyleInterests, lifestyle.interest)
    if (lifestyle.cause) await this.selectOption(this.lifestyleCauses, lifestyle.cause)
    if (lifestyle.diet) await this.selectOption(this.lifestyleDiet, lifestyle.diet[0])

    if (lifestyle.alcohol) {
      await expect(this.lifestyleAlcohol).toBeVisible()
      await this.lifestyleAlcohol.click()
      await this.sliderHelper(lifestyle.alcohol)
    }

    if (lifestyle.smoker) {
      await expect(this.lifestyleSmoker).toBeVisible()
      await this.lifestyleSmoker.click()
      await expect(this.page.getByText(lifestyle.smoker, {exact: true})).toBeVisible()
      await this.page.getByText(lifestyle.smoker, {exact: true}).click()
    }

    if (lifestyle.psychedelics)
      await this.selectOption(this.lifestylePsychedelics, lifestyle.psychedelics[0])
    if (lifestyle.cannabis) await this.selectOption(this.lifestyleCannabis, lifestyle.cannabis[0])
    if (lifestyle.language) await this.selectOption(this.lifestyleLanguages, lifestyle.language[0])
  }

  async setValuesAndBeliefsFilter(values: BeliefsFilter) {
    await expect(this.valuesAndBeliefsDropdown).toBeVisible()
    await this.valuesAndBeliefsDropdown.click()

    if (values.political)
      await this.selectOption(this.valuesAndBeliefsPolitics, values.political[0])
    if (values.religious)
      await this.selectOption(this.valuesAndBeliefsReligion, values.religious[0])
  }

  async setPersonalityFilter(personality: PersonalityFilter) {
    await expect(this.personalityDropdown).toBeVisible()
    await this.personalityDropdown.click()

    if (personality.mbti) await this.selectOption(this.personalityMbti, personality.mbti)

    if (personality.bigFive) {
      await this.personalityBigFive.click()
      if (personality.bigFive?.openness) {
        await this.sliderHelper(
          personality.bigFive.openness,
          this.page.getByTestId('big-five-openness'),
        )
      }
      if (personality.bigFive?.conscientiousness) {
        await this.sliderHelper(
          personality.bigFive.conscientiousness,
          this.page.getByTestId('big-five-conscientiousness'),
        )
      }
      if (personality.bigFive?.extraversion) {
        await this.sliderHelper(
          personality.bigFive.extraversion,
          this.page.getByTestId('big-five-extraversion'),
        )
      }
      if (personality.bigFive?.agreeableness) {
        await this.sliderHelper(
          personality.bigFive.agreeableness,
          this.page.getByTestId('big-five-agreeableness'),
        )
      }
      if (personality.bigFive?.neuroticism) {
        await this.sliderHelper(
          personality.bigFive.neuroticism,
          this.page.getByTestId('big-five-neuroticism'),
        )
      }
    }
  }

  async setAdvancedFilter(advanced: AdvancedFilter) {
    await expect(this.advancedDropdown).toBeVisible()
    await this.advancedDropdown.click()

    if (advanced.lastActive) {
      await this.advancedActive.click()
      await this.page.getByRole('button', {name: `${advanced.lastActive[1]}`}).click()
    }

    if (advanced.photos) {
      await this.advancedPhotos.click()
      await this.page.getByRole('checkbox', {name: 'Has photos'}).click()
    }
  }

  async setDisplayFilter(display: DisplayFilter) {
    await expect(this.displayDropdown).toBeVisible()
    await this.displayDropdown.click()

    if (display.cardSize) await this.page.getByRole('button', {name: `${display.cardSize}`}).click()

    if (!display.filters) return
    if (display.filters) {
      for (const [name, shouldBeChecked] of Object.entries(display.filters)) {
        const filter = await this.page.getByRole('checkbox', {name, exact: true})
        await expect(filter).toBeVisible()
        const isChecked = await filter.isChecked()

        if (shouldBeChecked && !isChecked) await filter.click()
        if (!shouldBeChecked && isChecked) await filter.click()
      }
    }
  }

  async getProfileInfo() {
    await expect(this.profileGrid).toBeVisible()
    const totalResults = await this.profileResults.count()
    const chosenProfileNumber = Math.floor(Math.random() * totalResults)
    const chosenProfile = await this.profileResults.nth(chosenProfileNumber)
    const profileName = await chosenProfile.getByTestId('people-profile-name').textContent()
    const ageGender = await chosenProfile.getByTestId('people-profile-age-gender').textContent()
    const seekingInfo = await chosenProfile.getByTestId('people-profile-seeking').textContent()
    const hideProfile = await chosenProfile.getByTestId('hide-profile-button')
    const starProfile = await chosenProfile.getByTestId('star-profile-button')
    const messageProfile = await chosenProfile.getByTestId('message-profile-button')

    return {
      profile: chosenProfile ?? '',
      name: profileName ?? '',
      ageGender: ageGender ?? '',
      seeking: seekingInfo ?? '',
      hide: hideProfile ?? '',
      star: starProfile ?? '',
      message: messageProfile ?? '',
    }
  }

  async verifyProfileCount(totalProfiles: string) {
    const exists = (await this.profileCountLocator.count()) > 0

    if (exists) {
      const filterdProfiles = await this.profileCountLocator.textContent()

      if (!totalProfiles || !filterdProfiles) return
      await expect(parseInt(totalProfiles)).not.toEqual(parseInt(filterdProfiles))
    } else {
      const noProfilesFound = await this.page.getByText('No profiles found.', {exact: true})
      await expect(noProfilesFound).toBeVisible()
    }
  }

  async selectProfile(displayName: string) {
    await expect(this.profileGrid).toBeVisible()
    await this.profileName.getByText(displayName).click()
  }

  async messageProfile(displayName: string, message: string) {
    await expect(this.profileGrid).toBeVisible()
    const profiles = await this.profileResults.all()

    for (let i = 0; i < profiles.length; i++) {
      const profileName = await profiles[i].getByTestId('people-profile-name').textContent()
      if (profileName?.toLowerCase() === displayName.toLowerCase()) {
        await profiles[i].getByTestId('message-profile-button').click()
        await expect(this.messageInput).toBeVisible()
        await this.messageInput.fill(message)
        await this.page.getByTestId('conversation-message-submit').click()
      }
    }
  }

  async verifySavedPerson(displayName: string) {
    await expect(this.savedPeopleHeading).toBeVisible()
    const isThereSavedPeople = (await this.savedPeopleList.count()) > 0

    if (isThereSavedPeople) {
      const listOfPeople = await this.savedPeopleList.all()
      for (let i = 0; i < listOfPeople.length; i++) {
        await expect(listOfPeople[i]).toBeVisible()
        const profileName = await listOfPeople[i].textContent()
        if (profileName?.toLowerCase() === displayName.toLowerCase()) return true
      }
      return false
    } else {
      throw new Error('There are no profiles in the saved people list')
    }
  }
}
