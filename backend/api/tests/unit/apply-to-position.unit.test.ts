jest.mock('common/discord/core')
jest.mock('shared/supabase/init')

import {applyToPosition, splitForDiscord} from 'api/apply-to-position'
import {AuthedUser} from 'api/helpers/endpoint'
import {sendDiscordMessage} from 'common/discord/core'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'

describe('applyToPosition', () => {
  let mockPg: any
  const auth = {uid: '321'} as AuthedUser
  const req = {} as any
  const props = {
    position: 'community-growth-lead' as const,
    about: 'I run a newsletter.',
    plan: 'Talk to three organisers.',
    rate: '30 EUR',
    availability: '4 hours, CET',
  }
  const updatedTime = new Date('2026-11-13T10:00:00Z')

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      oneOrNone: jest.fn().mockResolvedValue({name: 'Humphrey Mocker', username: 'humphrey'}),
      one: jest.fn().mockResolvedValue({updated_time: updatedTime, is_new: true}),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })

  it('stores the application under the token user and notifies the contact channel', async () => {
    const result: any = await applyToPosition(props, auth, req)

    expect(mockPg.one).toBeCalledWith(sqlMatch('insert into job_applications'), [
      auth.uid,
      props.position,
      props.about,
      props.plan,
      props.rate,
      props.availability,
    ])
    expect(result.application).toEqual({...props, updatedTime: updatedTime.toISOString()})
    expect(sendDiscordMessage).toBeCalledTimes(1)
    const [message, channel] = (sendDiscordMessage as jest.Mock).mock.calls[0]
    expect(channel).toBe('contact')
    expect(message).toContain('New application: Community Growth Lead')
    expect(message).toContain('[@Humphrey Mocker](https://')
    expect(message).toContain(props.plan)
  })

  it('announces a second submission as an update', async () => {
    mockPg.one.mockResolvedValue({updated_time: updatedTime, is_new: false})

    await applyToPosition(props, auth, req)

    expect((sendDiscordMessage as jest.Mock).mock.calls[0][0]).toContain('Updated application')
  })

  it('refuses a token with no account behind it, before writing anything', async () => {
    mockPg.oneOrNone.mockResolvedValue(null)

    await expect(applyToPosition(props, auth, req)).rejects.toMatchObject({code: 403})
    expect(mockPg.one).not.toBeCalled()
    expect(sendDiscordMessage).not.toBeCalled()
  })

  it('still succeeds when Discord fails, because the application is saved', async () => {
    ;(sendDiscordMessage as jest.Mock).mockRejectedValue(new Error('discord down'))

    const result: any = await applyToPosition(props, auth, req)

    expect(result.application.position).toBe(props.position)
  })

  it('sends long answers as several messages Discord accepts', async () => {
    const long = {...props, about: 'a'.repeat(1500), plan: 'p'.repeat(2500)}

    await applyToPosition(long, auth, req)

    const messages = (sendDiscordMessage as jest.Mock).mock.calls.map((c) => c[0] as string)
    expect(messages.length).toBeGreaterThan(1)
    expect(messages.every((m) => m.length <= 2000)).toBe(true)
    expect(messages.join('')).toContain(long.plan)
  })
})

describe('splitForDiscord', () => {
  it('leaves a short message whole', () => {
    expect(splitForDiscord('hello')).toEqual(['hello'])
  })

  it('breaks at a line end when there is one', () => {
    expect(splitForDiscord('aaaa\nbbbb\ncccc', 10)).toEqual(['aaaa\nbbbb', 'cccc'])
  })

  it('cuts a line that is itself too long', () => {
    expect(splitForDiscord('abcdefghij', 4)).toEqual(['abcd', 'efgh', 'ij'])
  })
})
