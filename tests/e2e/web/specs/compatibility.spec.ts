import {seedCompatibilityAnswers, setProfileColumns} from '../../utils/databaseUtils'
import {expect, test} from '../fixtures/signInFixture'
import {testAccounts} from '../utils/accountInformation'

test.describe('compatibility', () => {
  test('a score appears on another profile once both have answered', async ({
    app,
    signedInAccount: account,
    signedOutAccount: other,
  }) => {
    // Seeded profiles are random, and a dealbreaker between them would mean no score at all.
    const mutual = {
      pref_relation_styles: ['relationship'],
      pref_romantic_styles: ['mono'],
      wants_kids_strength: 2,
    }
    await setProfileColumns(account.username, {...mutual, gender: 'male', pref_gender: ['female']})
    await setProfileColumns(other.username, {...mutual, gender: 'female', pref_gender: ['male']})
    await seedCompatibilityAnswers(other.username)
    const breakdown = app.page.getByRole('button', {name: 'See the breakdown'})

    await app.profile.goTo(other.username)
    await expect(app.page.getByTestId('compatibility-overview')).toBeVisible()
    await expect(breakdown).toHaveCount(0)

    await app.profile.goTo(account.username)
    await app.profile.clickAnswerQuestionsButton()
    await app.profile.answerCompatibilityQuestion(
      testAccounts.email_account_all_info().compatibility,
    )
    await app.profile.clickNextCompatibilityQuestionButton()

    await app.profile.goTo(other.username)
    await expect(breakdown).toBeVisible()
  })
})
