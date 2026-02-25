import {expect, Locator, Page} from '@playwright/test'
import {LanguageTuple} from 'common/choices'
import {ImportanceTuple} from 'web/components/answers/answer-compatibility-question-content'

import {Compatibility, Socials} from '../utils/accountInformation'

type ProfileDropdownOptions = 'Public' | 'Private' | 'Disable'

export class ProfilePage {
  private readonly startAnsweringButton: Locator
  private readonly doThisLaterLink: Locator
  private readonly closeButton: Locator
  private readonly shareButton: Locator
  private readonly editProfileButton: Locator
  private readonly profileOptionsDropdown: Locator
  private readonly listProfilePubliclyDropdownOption: Locator
  private readonly limitProfileToMembersDropdownOption: Locator
  private readonly disableProfileDropdownOption: Locator
  private readonly displayNameAndAgeSection: Locator
  private readonly genderLocationHightInInchesSection: Locator
  private readonly headlineSection: Locator
  private readonly keywordsSection: Locator
  private readonly politicalAboutSection: Locator
  private readonly relegiousAboutSection: Locator
  private readonly interestsAboutSection: Locator
  private readonly causesAboutSection: Locator
  private readonly personalityAboutSection: Locator
  private readonly ethnicityAboutSection: Locator
  private readonly dietAboutSection: Locator
  private readonly languagesAboutSection: Locator
  private readonly seekingAboutSection: Locator
  private readonly relationshipTypeAboutSection: Locator
  private readonly relationshipStatusAboutSection: Locator
  private readonly educationAboutSection: Locator
  private readonly occupationAboutSection: Locator
  private readonly workAreaAboutSection: Locator
  private readonly smokerAboutSection: Locator
  private readonly notDrinkerAboutSection: Locator
  private readonly drinkerAboutSection: Locator
  private readonly wantsKidsAboutSection: Locator
  private readonly lastOnlineAboutSection: Locator
  private readonly bigFivePersonalityTraitsAboutSection: Locator
  private readonly hasKidsAboutSection: Locator
  private readonly socialMediaSection: Locator
  private readonly bioSection: Locator
  private readonly bioOptionsDropdown: Locator
  private readonly editDropdownOptions: Locator
  private readonly deleteDropdownOptions: Locator
  private readonly answerCoreQuestionsButton: Locator
  private readonly viewQuestionListButton: Locator
  private readonly compatibilityQuestion: Locator
  private readonly compatibilityQuestionYourChoices: Locator
  private readonly compatibilityQuestionAnswersYouAccept: Locator
  private readonly compatibilityQuestionSkipButton: Locator
  private readonly compatibilityQuestionNextButton: Locator
  private readonly compatibilityQuestionFinishButton: Locator
  private readonly compatibilityQuestionThoughts: Locator
  private readonly profileCompatibilitySection: Locator
  private readonly profileCompatibilityQuestion: Locator
  private readonly profileCompatibilityImportance: Locator
  private readonly profileCompatibilityDropdown: Locator
  private readonly profileCompatibilityAnswer: Locator
  private readonly profileCompatibilityAcceptableAnswer: Locator
  private readonly profileCompatibilityExplanation: Locator

  constructor(public readonly page: Page) {
    this.startAnsweringButton = page.getByRole('button', {});
    this.doThisLaterLink = page.getByRole('button', {});
    this.closeButton = page.getByRole('button', {name: 'Close'});
    this.shareButton = page.getByRole('button', {name: 'Share'});
    this.editProfileButton = page.getByTestId('profile-edit');
    this.profileOptionsDropdown = page.getByTestId('profile-options');
    this.listProfilePubliclyDropdownOption = page.getByText('List Profile Publicly', {exact: true});
    this.limitProfileToMembersDropdownOption = page.getByText('Limit to Members Only', {
      exact: true,
    })
    this.disableProfileDropdownOption = page.getByText('Disable profile', {exact: true})
    this.headlineSection = page.getByTestId('profile-headline')
    this.keywordsSection = page.getByTestId('profile-keywords')
    this.displayNameAndAgeSection = page.getByTestId('profile-display-name-age')
    this.genderLocationHightInInchesSection = page.getByTestId(
      'profile-gender-location-height-inches',
    )
    this.politicalAboutSection = page.getByTestId('profile-about-political')
    this.relegiousAboutSection = page.getByTestId('profile-about-religious')
    this.interestsAboutSection = page.getByTestId('profile-about-interests')
    this.causesAboutSection = page.getByTestId('profile-about-causes')
    this.personalityAboutSection = page.getByTestId('profile-about-personality')
    this.ethnicityAboutSection = page.getByTestId('profile-about-ethnicity')
    this.dietAboutSection = page.getByTestId('profile-about-diet')
    this.languagesAboutSection = page.getByTestId('profile-about-languages')
    this.seekingAboutSection = page.getByTestId('profile-about-seeking')
    this.relationshipTypeAboutSection = page.getByTestId('profile-about-relationship-type')
    this.relationshipStatusAboutSection = page.getByTestId('profile-about-relationship-status')
    this.educationAboutSection = page.getByTestId('profile-about-education')
    this.occupationAboutSection = page.getByTestId('profile-about-occupation')
    this.workAreaAboutSection = page.getByTestId('profile-about-work-area')
    this.smokerAboutSection = page.getByTestId('profile-about-smoker')
    this.notDrinkerAboutSection = page.getByTestId('profile-about-not-drink')
    this.drinkerAboutSection = page.getByTestId('profile-about-drinker')
    this.wantsKidsAboutSection = page.getByTestId('profile-about-wants-kids')
    this.lastOnlineAboutSection = page.getByTestId('profile-about-wants-last-online')
    this.bigFivePersonalityTraitsAboutSection = page.getByTestId(
      'profile-about-big-five-personality-traits',
    )
    this.hasKidsAboutSection = page.getByTestId('profile-about-has-kids')
    this.socialMediaSection = page.getByTestId('profile-social-media-accounts')
    this.bioSection = page.getByTestId('profile-bio')
    this.bioOptionsDropdown = page.getByTestId('profile-bio-options')
    this.editDropdownOptions = page.getByText('Edit', {exact: true})
    this.deleteDropdownOptions = page.getByText('Delete', {exact: true})
    this.answerCoreQuestionsButton = page.getByRole('button', {name: 'Answer Core Questions'})
    this.viewQuestionListButton = page.getByRole('link', {name: 'View List of Questions'})
    this.compatibilityQuestion = page.getByTestId('compatibility-question')
    this.compatibilityQuestionYourChoices = page.getByTestId('compatibility-question-your-answer')
    this.compatibilityQuestionAnswersYouAccept = page.getByTestId(
      'compatibility-answers-you-accept',
    )
    this.compatibilityQuestionThoughts = page.getByTestId('compatibility-question-thoughts')
    this.compatibilityQuestionSkipButton = page.getByRole('button', {name: 'Skip'})
    this.compatibilityQuestionNextButton = page.getByText('Next', {exact: true})
    this.compatibilityQuestionFinishButton = page.getByRole('button', {name: 'Finish'})
    this.profileCompatibilitySection = page.getByTestId('profile-compatibility-section')
    this.profileCompatibilityQuestion = page.getByTestId('profile-compatibility-question')
    this.profileCompatibilityImportance = page.getByTestId('profile-compatibility-importance')
    this.profileCompatibilityAnswer = page.getByTestId('profile-compatibility-question-answer')
    this.profileCompatibilityAcceptableAnswer = page.getByTestId(
      'profile-compatibility-question-acceptable-answer',
    )
    this.profileCompatibilityExplanation = page.getByTestId(
      'profile-compatibility-question-answer-explanation',
    )
    this.profileCompatibilityDropdown = page.getByTestId('profile-compatibility-dropdown')
  }

  async answerCompatibilityQuestion(compatibility: Compatibility | undefined) {
    if (!compatibility) return
    await expect(this.compatibilityQuestion).toBeVisible()
    const question = await this.compatibilityQuestion.textContent()

    await expect(this.compatibilityQuestionYourChoices).toBeVisible()
    await expect(
      this.page.getByTestId(`compatibility-your-answer-${compatibility.answer}`),
    ).toBeVisible()
    const myAnswer = await this.page
      .getByTestId(`compatibility-your-answer-${compatibility.answer}`)
      .textContent()
    await this.page.getByTestId(`compatibility-your-answer-${compatibility.answer}`).click()

    await expect(this.compatibilityQuestionAnswersYouAccept).toBeVisible()
    const answersYouAccept = []
    for (const answer of compatibility.acceptableAnswers) {
      await expect(
        this.page.getByTestId(`compatibility-answers-you-accept-${answer}`),
      ).toBeVisible()
      const textContent = await this.page
        .getByTestId(`compatibility-answers-you-accept-${answer}`)
        .textContent()
      await this.page.getByTestId(`compatibility-answers-you-accept-${answer}`).click()
      answersYouAccept.push(textContent)
    }

    await expect(
      this.page.getByTestId(`compatibility-question-importance-${compatibility.importance[1]}`),
    ).toBeVisible()
    await this.page
      .getByTestId(`compatibility-question-importance-${compatibility.importance[1]}`)
      .click()

    await expect(this.compatibilityQuestionThoughts).toBeVisible()
    await this.compatibilityQuestionThoughts.fill(compatibility.explanation)

    return {
      question,
      my_answer: myAnswer,
      explanation: compatibility.explanation,
      answers_you_accept: answersYouAccept,
      importance: compatibility.importance,
    }
  }

  async verifyCompatibilityAnswers(
    compatInfo:
      | {
          question: string | null
          my_answer: string | null
          answers_you_accept: (string | null)[]
          importance: ImportanceTuple
          explanation: string
        }
      | undefined,
  ) {
    if (!compatInfo) return
    const questionIndex = await this.profileCompatibilitySection.count()
    await expect(questionIndex).toBeGreaterThan(0)
    const target = compatInfo.question ?? ''
    let matchIndex = -1
    for (let i = 0; i < questionIndex; i++) {
      const element = (await this.profileCompatibilitySection.nth(i).textContent()) ?? ''
      if (target && element.includes(target)) {
        matchIndex = i
        break
      }
    }

    await expect(matchIndex).toBeGreaterThanOrEqual(0)
    await expect(this.profileCompatibilitySection.nth(matchIndex)).toBeVisible()

    const question = await this.profileCompatibilitySection
      .nth(matchIndex)
      .getByTestId('profile-compatibility-question')
      .textContent()
    await expect(question).toContain(compatInfo.question)

    const importance = await this.profileCompatibilitySection
      .nth(matchIndex)
      .getByTestId('profile-compatibility-importance')
      .textContent()
    await expect(importance).toContain(compatInfo.importance[0])

    const answer = await this.profileCompatibilitySection
      .nth(matchIndex)
      .getByTestId('profile-compatibility-question-answer')
      .textContent()
    await expect(answer).toContain(compatInfo.my_answer)

    const answerExplanation = await this.profileCompatibilitySection
      .nth(matchIndex)
      .getByTestId('profile-compatibility-question-answer-explanation')
      .textContent()
    await expect(answerExplanation).toContain(compatInfo.explanation)

    const acceptableAnswer = await this.profileCompatibilitySection
      .nth(matchIndex)
      .getByTestId('profile-compatibility-question-acceptable-answer')
      .textContent()

    for (const item of compatInfo.answers_you_accept) {
      await expect(acceptableAnswer).toContain(item)
    }
  }

  async setCompatibilityQuestionImportance(importance: ImportanceTuple) {
    await expect(
      this.page.getByTestId(`compatibility-question-importance-${importance[1]}`),
    ).toBeVisible()
    await this.page.getByTestId(`compatibility-question-importance-${importance[1]}`).click()
  }

  async clickSkipCompatibilityQuestionButton() {
    await expect(this.compatibilityQuestionSkipButton).toBeVisible()
    await this.compatibilityQuestionSkipButton.click()
  }

  async clickNextCompatibilityQuestionButton() {
    await expect(this.compatibilityQuestionNextButton).toBeVisible()
    await this.compatibilityQuestionNextButton.click()
  }

  async clickFinishCompatibilityQuestionButton() {
    await expect(this.compatibilityQuestionFinishButton).toBeVisible()
    await this.compatibilityQuestionFinishButton.click()
  }

  async clickCloseButton() {
    await expect(this.closeButton).toBeInViewport()
    await this.closeButton.click()
  }

  async fillQuestionThoughts(thoughts: string | undefined) {
    if (!thoughts) return
    await expect(this.compatibilityQuestionThoughts).toBeVisible()
    await this.compatibilityQuestionThoughts.fill(thoughts)
  }

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
    await expect(this.editProfileButton).toBeVisible()
    await this.editProfileButton.click()
  }

  async clickAnswerQuestionsButton() {
    await expect(this.answerCoreQuestionsButton).toBeVisible()
    await this.answerCoreQuestionsButton.click()
  }

  async clickViewQuestionListButton() {
    await expect(this.viewQuestionListButton).toBeVisible()
    await this.viewQuestionListButton.click()
  }

  async selectOptionFromProfileDropdown(option: ProfileDropdownOptions) {
    await expect(this.profileOptionsDropdown).toBeVisible();
    await this.profileOptionsDropdown.click();

    if (option === 'Public') {
      await expect(this.listProfilePubliclyDropdownOption).toBeVisible();
      await this.listProfilePubliclyDropdownOption.click();
    } else if (option === 'Disable') {
      await expect(this.disableProfileDropdownOption).toBeVisible();
      await this.disableProfileDropdownOption.click();
    } else if (option === 'Private') {
      await expect(this.limitProfileToMembersDropdownOption).toBeVisible();
      await this.limitProfileToMembersDropdownOption.click();
    };
  };

  async verifyDisplayName(displayName?: string) {
    await expect(this.displayNameAndAgeSection).toBeVisible()
    const textContent = await this.displayNameAndAgeSection.textContent()
    if (displayName) await expect(textContent?.toLowerCase()).toContain(displayName.toLowerCase())
  }

  async verifyGenderLocationHeightAge(
    gender?: string[],
    location?: string,
    heightFeet?: string,
    heightInches?: string,
    age?: string,
  ) {
    await expect(this.genderLocationHightInInchesSection).toBeVisible()
    const textContent = await this.genderLocationHightInInchesSection.textContent()
    if (gender) await expect(textContent?.toLowerCase()).toContain(gender[0].toLowerCase())
    if (location) await expect(textContent?.toLowerCase()).toContain(location.toLowerCase())
    if (heightFeet) await expect(textContent?.toLowerCase()).toContain(heightFeet.toLowerCase())
    if (heightInches) await expect(textContent?.toLowerCase()).toContain(heightInches.toLowerCase())
    if (age) await expect(textContent?.toLowerCase()).toContain(age.toLowerCase())
  }

  async verifyEthnicityOrigin(origin: string) {
    await expect(this.ethnicityAboutSection).toBeVisible()
    const textContent = await this.ethnicityAboutSection.textContent()
    await expect(textContent?.toLowerCase()).toContain(origin.toLowerCase())
  }

  async verifyInterestedInConnectingWith(gender?: string[], minAge?: string, maxAge?: string) {
    await expect(this.seekingAboutSection).toBeVisible()
    const textContent = await this.seekingAboutSection.textContent()
    if (gender) await expect(textContent?.toLowerCase()).toContain(gender[0].toLowerCase())
    if (minAge) await expect(textContent?.toLowerCase()).toContain(minAge.toLowerCase())
    if (maxAge) await expect(textContent?.toLowerCase()).toContain(maxAge.toLowerCase())
  }

  async verifyRelationShipTypeAndInterest(type?: string[], interest?: string[]) {
    await expect(this.relationshipTypeAboutSection).toBeVisible()
    const textContent = await this.relationshipTypeAboutSection.textContent()
    if (type) await expect(textContent?.toLowerCase()).toContain(type[0].toLowerCase())
    if (interest) await expect(textContent?.toLowerCase()).toContain(interest[0].toLowerCase())
  }

  async verifyRelationshipStatus(status: string[] | undefined) {
    if (!status) return
    await expect(this.relationshipStatusAboutSection).toBeVisible()
    const textContent = await this.relationshipStatusAboutSection.textContent()
    await expect(textContent?.toLowerCase()).toContain(status[0].toLowerCase())
  }

  async verifyCurrentNumberOfKids(numberOfKids: string | undefined) {
    if (!numberOfKids) return
    await expect(this.hasKidsAboutSection).toBeVisible()
    const textContent = await this.hasKidsAboutSection.textContent()
    await expect(textContent?.toLowerCase()).toContain(numberOfKids.toLowerCase())
  }

  async verifyWantChildrenExpectation(expectation: [string, number] | undefined) {
    if (!expectation) return
    const [label, _value] = expectation
    await expect(this.wantsKidsAboutSection).toBeVisible()
    const textContent = await this.wantsKidsAboutSection.textContent()
    await expect(textContent?.toLowerCase()).toContain(label.toLowerCase())
  }

  async verifyInterests(interest: string[] | undefined) {
    if (!interest || interest.length === 0) return
    await expect(this.interestsAboutSection).toBeVisible()
    const textContent = await this.interestsAboutSection.textContent()
    for (let i = 0; i < interest.length; i++) {
      await expect(textContent?.toLowerCase()).toContain(interest[i].toLowerCase())
    }
  }

  async verifyCauses(causes: string[] | undefined) {
    if (!causes || causes.length === 0) return
    await expect(this.causesAboutSection).toBeVisible()
    const textContent = await this.causesAboutSection.textContent()
    for (let i = 0; i < causes.length; i++) {
      await expect(textContent?.toLowerCase()).toContain(causes[i].toLowerCase())
    }
  }

  async verifyWorkArea(workArea: string[] | undefined) {
    if (!workArea || workArea.length === 0) return
    await expect(this.workAreaAboutSection).toBeVisible()
    for (let i = 0; i < workArea.length; i++) {
      await expect(this.workAreaAboutSection).toContainText(workArea[i], {ignoreCase: true})
    }
  }

  async verifyEducationLevelAndUniversity(educationLevel?: string[], university?: string) {
    await expect(this.educationAboutSection).toBeVisible()
    const textContent = await this.educationAboutSection.textContent()
    if (educationLevel)
      await expect(textContent?.toLowerCase()).toContain(educationLevel[0].toLowerCase())
    if (university) await expect(textContent?.toLowerCase()).toContain(university.toLowerCase())
  }

  async verifyJobInformation(jobTitle?: string, company?: string) {
    await expect(this.occupationAboutSection).toBeVisible()
    const textContent = await this.occupationAboutSection.textContent()
    if (jobTitle) await expect(textContent?.toLowerCase()).toContain(jobTitle.toLowerCase())
    if (company) await expect(textContent?.toLowerCase()).toContain(company.toLowerCase())
  }

  async verifyPoliticalBeliefs(belief?: string[], details?: string) {
    await expect(this.politicalAboutSection).toBeVisible()
    const textContent = await this.politicalAboutSection.textContent()
    if (belief) await expect(textContent?.toLowerCase()).toContain(belief[0].toLowerCase())
    if (details) await expect(textContent?.toLowerCase()).toContain(details.toLowerCase())
  }

  async verifyReligiousBeliefs(belief?: string[], details?: string) {
    await expect(this.relegiousAboutSection).toBeVisible()
    const textContent = await this.relegiousAboutSection.textContent()
    if (belief) await expect(textContent?.toLowerCase()).toContain(belief[0].toLowerCase())
    if (details) await expect(textContent?.toLowerCase()).toContain(details.toLowerCase())
  }

  async verifyPersonalityType(personalityType: string | undefined) {
    if (!personalityType) return
    await expect(this.personalityAboutSection).toBeVisible()
    const textContent = await this.personalityAboutSection.textContent()
    await expect(textContent?.toLowerCase()).toContain(personalityType.toLowerCase())
  }

  async verifyBigFivePersonalitySection(personalityType: Record<string, number> | undefined) {
    if (!personalityType) return
    await expect(this.bigFivePersonalityTraitsAboutSection).toBeVisible()
    const textContent = await this.bigFivePersonalityTraitsAboutSection.textContent()
    for (const [key, value] of Object.entries(personalityType)) {
      await expect(textContent?.toLowerCase()).toContain(key.toLowerCase())
      await expect(textContent?.toLowerCase()).toContain(String(value))
    }
  }

  async verifyDiet(diet: string[] | undefined) {
    if (!diet) return
    await expect(this.dietAboutSection).toBeVisible()
    const textContent = await this.dietAboutSection.textContent()
    await expect(textContent?.toLowerCase()).toContain(diet[0].toLowerCase())
  }

  async verifySmoker(smoker: boolean | undefined) {
    await expect(this.smokerAboutSection).toBeVisible()
    const textContent = await this.smokerAboutSection.textContent()
    if (smoker === true) await expect(textContent?.toLowerCase()).toContain('Smokes'.toLowerCase())
    if (smoker === false)
      await expect(textContent?.toLowerCase()).toContain("Doesn't smoke".toLowerCase())
  }

  async verifyDrinksPerMonth(drinks: string | undefined) {
    await expect(this.drinkerAboutSection).toBeVisible()
    const textContent = await this.drinkerAboutSection.textContent()
    await expect(textContent?.toLowerCase()).toContain(drinks)
  }

  async verifyLanguages(languages: LanguageTuple[] | undefined) {
    if (!languages || languages.length === 0) return
    await expect(this.languagesAboutSection).toBeVisible()
    const textContent = await this.languagesAboutSection.textContent()
    for (const language of languages) {
      await expect(textContent?.toLowerCase()).toContain(language[0].toLowerCase())
    }
  }

  async verifySocialMedia(socialMedia: Socials[] | undefined) {
    if (!socialMedia || socialMedia.length === 0) return
    await expect(this.socialMediaSection).toBeVisible()
    const textContent = await this.socialMediaSection.textContent()
    for (const {urlOrUsername} of socialMedia) {
      await expect(textContent?.toLowerCase()).toContain(urlOrUsername.toLowerCase())
    }
  }

  async verifyBio(bio: string | undefined) {
    if (!bio) return
    await expect(this.bioSection).toBeVisible()
    await expect(this.bioSection).toContainText(bio)
  }

  async verifyHeadline(headline: string | undefined) {
    if (!headline) return
    await expect(this.headlineSection).toBeVisible()
    await expect(this.headlineSection).toContainText(headline)
  }

  async verifyKeywords(keywords: string | undefined) {
    if (!keywords) return
    console.log(this.keywordsSection.textContent())
    const keywordsArr = keywords.split(', ')
    await expect(this.keywordsSection).toBeVisible()
    for (const word of keywordsArr) {
      await expect(this.keywordsSection).toContainText(word)
    }
  }
}
