jest.mock('shared/supabase/messages')
jest.mock('shared/supabase/users')
jest.mock('common/discord/core')
// The model is stubbed; the mapping from verdict to action stays real.
jest.mock('shared/moderation/opener-review', () => ({
  ...jest.requireActual('shared/moderation/opener-review'),
  reviewOpener: jest.fn(),
}))

import {assertAcceptableOpener, isOpener, previousOpeners} from 'api/helpers/first-message'
import {sendDiscordMessage} from 'common/discord/core'
import {AUTO_BAN_UNDER_REVIEW_CODE} from 'common/moderation/ban'
import {
  FIRST_MESSAGE_REJECTED_CODE,
  MIN_FIRST_MESSAGE_CHARS,
  OPENER_REVIEW_REJECTED_CODE,
} from 'common/moderation/first-message'
import {sqlMatch} from 'common/test-utils'
import {User} from 'common/user'
import {reviewOpener} from 'shared/moderation/opener-review'
import {getDecryptedMessage} from 'shared/supabase/messages'
import {updateUser} from 'shared/supabase/users'

const doc = (text: string) => ({
  type: 'doc',
  content: [{type: 'paragraph', content: [{type: 'text', text}]}],
})

const sender = {id: 'sender', name: 'Sam Sender', username: 'sam'} as User

const recipient = {
  name: 'Julie Dupont',
  username: 'julied',
  created_time: new Date('2026-01-01'),
  headline: 'Philosophy nerd who climbs',
  keywords: ['climbing', 'moral philosophy', 'animal welfare'],
  bio_text:
    'I spend most weekends climbing in the Ardennes and most evenings reading moral philosophy. ' +
    'I left a career in consulting to work on animal welfare, and I am looking for someone who ' +
    'takes ideas seriously but can also laugh at them. Vegetarian, slowly turning vegan.',
  bio: null,
  interests: ['Piano'],
  causes: null,
  work: null,
  prompt_answers: null,
  details: {age: 31, pref_relation_styles: ['friendship']},
}

// Long enough, and anchored on two things Julie wrote.
const goodOpener =
  'Moral philosophy and climbing in one profile is rare. Which philosophers do you keep coming ' +
  'back to, and does the climbing ever feel like the same kind of problem-solving? I moved from ' +
  'engineering to animal welfare work two years ago and am still working out what I think about it.'

describe('isOpener', () => {
  it('is true only when the channel has no messages yet', async () => {
    const pg = {one: jest.fn().mockResolvedValue({count: '0'})} as any
    expect(await isOpener(pg, 7)).toBe(true)
    expect(pg.one).toBeCalledWith(sqlMatch('select count(*) as count from private_user_messages'), [
      7,
    ])
    ;(pg.one as jest.Mock).mockResolvedValue({count: '3'})
    expect(await isOpener(pg, 7)).toBe(false)
  })
})

describe('previousOpeners', () => {
  it('keeps only the openers the member wrote, newest first, decrypted to text', async () => {
    const rows = [
      {user_id: 'sender', ciphertext: 'a', iv: 'a', tag: 'a', created_time: new Date('2026-10-01')},
      {user_id: 'other', ciphertext: 'b', iv: 'b', tag: 'b', created_time: new Date('2026-10-05')},
      {user_id: 'sender', ciphertext: 'c', iv: 'c', tag: 'c', created_time: new Date('2026-10-09')},
    ]
    const pg = {manyOrNone: jest.fn().mockResolvedValue(rows)} as any
    ;(getDecryptedMessage as jest.Mock).mockImplementation((r: any) => doc(`text ${r.ciphertext}`))

    expect(await previousOpeners(pg, 'sender')).toEqual(['text c', 'text a'])
    expect(pg.manyOrNone).toBeCalledWith(expect.stringContaining("role = 'creator'"), [
      'sender',
      expect.any(Number),
    ])
  })

  it('drops an opener it cannot decrypt rather than failing the send', async () => {
    const rows = [
      {user_id: 'sender', ciphertext: 'a', iv: 'a', tag: 'a', created_time: new Date('2026-10-01')},
    ]
    const pg = {manyOrNone: jest.fn().mockResolvedValue(rows)} as any
    ;(getDecryptedMessage as jest.Mock).mockImplementation(() => {
      throw new Error('bad tag')
    })
    expect(await previousOpeners(pg, 'sender')).toEqual([])
  })
})

describe('assertAcceptableOpener', () => {
  let pg: any
  beforeEach(() => {
    jest.resetAllMocks()
    pg = {
      oneOrNone: jest.fn().mockResolvedValue(recipient),
      manyOrNone: jest.fn().mockResolvedValue([]),
    }
  })

  it('rejects a message under the minimum length', async () => {
    const error = await assertAcceptableOpener(pg, sender, 'julie', doc('Hi Julie!')).catch(
      (e) => e,
    )
    expect(error.message).toContain(`at least ${MIN_FIRST_MESSAGE_CHARS} characters`)
    expect(error.details).toMatchObject({context: FIRST_MESSAGE_REJECTED_CODE})
    // A fixed rule, not the model's call: no "this check is new" note.
    expect(JSON.stringify(error.details)).not.toContain(OPENER_REVIEW_REJECTED_CODE)
    // Nothing was looked up: the length alone decided it.
    expect(pg.oneOrNone).not.toBeCalled()
  })

  it('lets through a long message that says nothing about the recipient, for the model to judge', async () => {
    // The word-matching check is advisory: the composer warns, and only the model review can
    // refuse a generic opener. The stubbed model gives no verdict here, so it goes through.
    const generic =
      'Hey Julie, I came across your profile and really liked what I saw. I think we would get ' +
      'along well and I would love to get to know you better. What are you looking for on here, ' +
      'and what does a good week look like for you? Hope to hear from you soon!'
    await expect(assertAcceptableOpener(pg, sender, 'julie', doc(generic))).resolves.toBeUndefined()
    expect(updateUser).not.toBeCalled()
  })

  it('accepts a message anchored on the profile when nothing like it was sent before', async () => {
    ;(getDecryptedMessage as jest.Mock).mockImplementation(() => doc('an unrelated earlier opener'))
    pg.manyOrNone.mockResolvedValue([
      {user_id: 'sender', ciphertext: 'x', iv: 'x', tag: 'x', created_time: new Date()},
    ])
    await expect(
      assertAcceptableOpener(pg, sender, 'julie', doc(goodOpener)),
    ).resolves.toBeUndefined()
    expect(updateUser).not.toBeCalled()
  })

  it('puts the account on hold and reports it when the opener is a copy of an earlier one', async () => {
    // The same opener sent to someone else, with the name swapped.
    const earlier = goodOpener.replace('Julie', 'Anna')
    ;(getDecryptedMessage as jest.Mock).mockImplementation(() => doc(earlier))
    pg.manyOrNone.mockResolvedValue([
      {user_id: 'sender', ciphertext: 'x', iv: 'x', tag: 'x', created_time: new Date()},
    ])
    ;(sendDiscordMessage as jest.Mock).mockResolvedValue(null)

    const error = await assertAcceptableOpener(pg, sender, 'julie', doc(goodOpener)).catch((e) => e)
    expect(error.details).toMatchObject({context: AUTO_BAN_UNDER_REVIEW_CODE})
    expect(error.message).toContain('nearly the same as one you already sent')
    expect(updateUser).toBeCalledWith('sender', {
      isBannedFromPosting: true,
      banReason: 'auto_rate_limit',
    })
    expect(sendDiscordMessage).toBeCalledWith(
      expect.stringContaining('Auto-hold: copy-pasted opener'),
      'reports',
    )
  })

  it('still holds the account when the Discord post fails', async () => {
    ;(getDecryptedMessage as jest.Mock).mockImplementation(() => doc(goodOpener))
    pg.manyOrNone.mockResolvedValue([
      {user_id: 'sender', ciphertext: 'x', iv: 'x', tag: 'x', created_time: new Date()},
    ])
    ;(sendDiscordMessage as jest.Mock).mockRejectedValue(new Error('Discord down'))
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const error = await assertAcceptableOpener(pg, sender, 'julie', doc(goodOpener)).catch((e) => e)
    expect(error.details).toMatchObject({context: AUTO_BAN_UNDER_REVIEW_CODE})
    expect(updateUser).toBeCalledTimes(1)
    expect(errorSpy).toBeCalled()
    errorSpy.mockRestore()
  })

  it('falls back to the rich-text bio when the plain-text column is empty', async () => {
    pg.oneOrNone.mockResolvedValue({...recipient, bio_text: null, bio: doc(recipient.bio_text)})
    await expect(
      assertAcceptableOpener(pg, sender, 'julie', doc(goodOpener)),
    ).resolves.toBeUndefined()
  })

  describe('the model review', () => {
    const verdict = {
      engagement: 0.9,
      looksBased: false,
      scamRisk: 0,
      ignoresBoundary: false,
      contradictsOwnProfile: false,
      summary: '',
    }

    it('asks the model with both profiles and the account age', async () => {
      ;(reviewOpener as jest.Mock).mockResolvedValue(verdict)
      await assertAcceptableOpener(pg, sender, 'julie', doc(goodOpener))
      expect(reviewOpener).toBeCalledWith({
        opener: expect.stringContaining('Moral philosophy and climbing'),
        sender: expect.objectContaining({name: recipient.name, accountAgeDays: expect.any(Number)}),
        recipient: expect.objectContaining({
          name: recipient.name,
          keywords: recipient.keywords,
          interests: recipient.interests,
          details: recipient.details,
        }),
      })
    })

    it('delivers when the model has no verdict', async () => {
      ;(reviewOpener as jest.Mock).mockResolvedValue(null)
      await expect(
        assertAcceptableOpener(pg, sender, 'julie', doc(goodOpener)),
      ).resolves.toBeUndefined()
    })

    it('sends a generic message back to the sender with the model’s reason', async () => {
      ;(reviewOpener as jest.Mock).mockResolvedValue({
        ...verdict,
        engagement: 0.1,
        summary: 'Nothing here is about what Julie wrote.',
      })
      ;(sendDiscordMessage as jest.Mock).mockResolvedValue(null)
      const error = await assertAcceptableOpener(pg, sender, 'julie', doc(goodOpener)).catch(
        (e) => e,
      )
      expect(error.code).toBe(400)
      expect(error.message).toBe('Nothing here is about what Julie wrote.')
      // Tagged as the model's call, so the composer says the check is new and can be contested.
      expect(error.details).toEqual([
        {context: FIRST_MESSAGE_REJECTED_CODE},
        {context: OPENER_REVIEW_REJECTED_CODE},
      ])
      expect(updateUser).not.toBeCalled()
    })

    it('holds the account on a scam, without naming the signal to the sender', async () => {
      ;(reviewOpener as jest.Mock).mockResolvedValue({
        ...verdict,
        scamRisk: 0.95,
        summary: 'Asks to move to Telegram and mentions crypto.',
      })
      ;(sendDiscordMessage as jest.Mock).mockResolvedValue(null)
      const error = await assertAcceptableOpener(pg, sender, 'julie', doc(goodOpener)).catch(
        (e) => e,
      )
      expect(error.details).toMatchObject({context: AUTO_BAN_UNDER_REVIEW_CODE})
      expect(error.message).not.toContain('Telegram')
      expect(updateUser).toBeCalledWith('sender', {
        isBannedFromPosting: true,
        banReason: 'auto_rate_limit',
      })
      expect(sendDiscordMessage).toBeCalledWith(
        expect.stringContaining('Asks to move to Telegram'),
        'reports',
      )
    })

    it('delivers a flagged message and only tells the moderators', async () => {
      ;(reviewOpener as jest.Mock).mockResolvedValue({...verdict, ignoresBoundary: true})
      ;(sendDiscordMessage as jest.Mock).mockResolvedValue(null)
      await expect(
        assertAcceptableOpener(pg, sender, 'julie', doc(goodOpener)),
      ).resolves.toBeUndefined()
      expect(updateUser).not.toBeCalled()
      expect(sendDiscordMessage).toBeCalledWith(
        expect.stringContaining('delivered, worth a look'),
        'reports',
      )
    })
  })
})
