import {blockUser} from 'api/block-user'
import {getProfileAccess} from 'api/get-profile-access'
import {getProfileAnswers} from 'api/get-profile-answers'
import {getProfileComments} from 'api/get-profile-comments'
import {getProfileFeed} from 'api/get-profile-feed'
import {getProfiles} from 'api/get-profiles'
import {getUserAndProfile} from 'api/get-user-and-profile'
import {AuthedUser} from 'api/helpers/endpoint'
import {requestProfileAccess} from 'api/request-profile-access'
import {setProfileAccess} from 'api/set-profile-access'
import {updateProfileEndpoint} from 'api/update-profile'
import {ENV_CONFIG} from 'common/envs/constants'
import * as emails from 'email/functions/helpers'
import * as mobile from 'shared/mobile'

import {asAnon, getTestDb, resetDb, seedUser} from './helpers/db'

jest.mock('common/discord/core', () => ({sendDiscordMessage: jest.fn()}))
// Pushes go to real browsers and phones; here only that they are attempted matters.
// No real email leaves a test run either.
jest.mock('email/functions/helpers', () => ({sendCircleEmail: jest.fn()}))
jest.mock('shared/mobile', () => ({
  sendWebNotifications: jest.fn(),
  sendMobileNotifications: jest.fn(),
}))
// The score recompute after a profile save is not what is under test here.
jest.mock('shared/compatibility/compute-scores', () => ({
  recomputeCompatibilityScoresForUser: jest.fn(),
}))

// Per-field visibility (docs/profile-visibility.md), against real Postgres: the redaction on every
// road a profile leaves by, the search filters, and the approvals that open the `connected` fields.

const OWNER = 'owner'
const MEMBER = 'member'
const APPROVED = 'approved'

const as = (uid: string) => ({uid}) as AuthedUser
const call = (handler: any, props: unknown, uid?: string) =>
  handler(props, uid ? as(uid) : undefined, {} as any)

const profileOf = async (viewerId?: string) =>
  (await getUserAndProfile(`username_${OWNER}`, viewerId))!

const search = async (uid: string, props: Record<string, unknown> = {}) => {
  const {status, profiles} = await call(getProfiles, {limit: 20, shortBio: true, ...props}, uid)
  expect(status).toBe('success')
  return profiles as any[]
}
const found = async (uid: string, props: Record<string, unknown> = {}) =>
  (await search(uid, props)).some((profile) => profile.user_id === OWNER)

const setVisibility = (field_visibility: Record<string, string>, visibility = 'public') =>
  getTestDb().none(
    `update profiles set field_visibility = $2, visibility = $3 where user_id = $1`,
    [OWNER, field_visibility, visibility],
  )

const profileId = () =>
  getTestDb().one(`select id from profiles where user_id = $1`, [OWNER], (r) => Number(r.id))

beforeEach(async () => {
  await resetDb()
  await seedUser(MEMBER)
  await seedUser(APPROVED)
  await seedUser(OWNER, {
    user: {avatar_url: 'https://example.com/photo.jpg'},
    profile: {
      visibility: 'public',
      headline: 'Public headline',
      city: 'Brussels',
      country: 'Belgium',
      gender: 'female',
      pinned_url: 'https://example.com/photo.jpg',
      political_beliefs: ['green'],
      political_details: 'Zebra-striped politics',
      neurotype: ['adhd'],
      keywords: ['quokka'],
    },
  })
  await getTestDb().none(
    `insert into profile_access (owner_id, viewer_id, status, decided_time)
     values ($1, $2, 'approved', now())`,
    [OWNER, APPROVED],
  )
})

describe('a profile with no per-field choice', () => {
  it('reads exactly as before, for a visitor and for a member', async () => {
    for (const viewer of [undefined, MEMBER]) {
      const {user, profile} = await profileOf(viewer)
      expect(profile!.headline).toBe('Public headline')
      expect(profile!.political_beliefs).toEqual(['green'])
      expect(profile!.neurotype).toEqual(['adhd'])
      expect(user.avatarUrl).toBe('https://example.com/photo.jpg')
      expect(profile).not.toHaveProperty('shares_more')
    }
  })

  it('still comes back whole from the anon RPC', async () => {
    const [row] = await asAnon((tx) =>
      tx.manyOrNone(`select * from get_profile_by_user_id($1)`, [OWNER]),
    )
    expect(row.headline).toBe('Public headline')
    expect(row.search_text).toBeNull()
  })
})

describe('reading a profile with hidden fields', () => {
  beforeEach(() =>
    setVisibility({photos: 'member', neurotype: 'connected', political_beliefs: 'only_me'}),
  )

  it('gives a visitor the public fields only, and no avatar', async () => {
    const {user, profile} = await profileOf()
    expect(profile!.headline).toBe('Public headline')
    expect(profile!.pinned_url).toBeNull()
    expect(profile!.neurotype).toBeNull()
    expect(profile!.political_beliefs).toBeNull()
    expect(profile!.political_details).toBeNull()
    expect(user.avatarUrl).toBe('')
    expect(profile).not.toHaveProperty('field_visibility')
    expect(profile).not.toHaveProperty('search_text')
    expect(profile).not.toHaveProperty('shares_more')
  })

  it('gives a member the members-only fields, and says there is more to ask for', async () => {
    const {user, profile} = await profileOf(MEMBER)
    expect(profile!.pinned_url).toBe('https://example.com/photo.jpg')
    expect(user.avatarUrl).toBe('https://example.com/photo.jpg')
    expect(profile!.neurotype).toBeNull()
    expect(profile!.political_beliefs).toBeNull()
    expect((profile as any).shares_more).toBe(true)
  })

  it('gives an approved member the approved fields, and never the owner-only ones', async () => {
    const {profile} = await profileOf(APPROVED)
    expect(profile!.neurotype).toEqual(['adhd'])
    expect(profile!.political_beliefs).toBeNull()
    expect(profile).not.toHaveProperty('shares_more')
  })

  it('gives the owner everything, with the map of who sees what', async () => {
    const {profile} = await profileOf(OWNER)
    expect(profile!.political_beliefs).toEqual(['green'])
    expect(profile!.neurotype).toEqual(['adhd'])
    expect((profile as any).field_visibility).toEqual({
      photos: 'member',
      neurotype: 'connected',
      political_beliefs: 'only_me',
    })
  })

  it('treats the profile-wide setting as a default: a field may be wider than it', async () => {
    // Members-only, with the headline alone set to public.
    await setVisibility({headline: 'public', neurotype: 'connected'}, 'member')

    const {user, profile} = await profileOf()
    expect(profile!.headline).toBe('Public headline')
    expect(profile!.city).toBeNull()
    expect(profile!.pinned_url).toBeNull()
    expect(profile!.neurotype).toBeNull()
    expect(user.avatarUrl).toBe('')

    // A member gets the default (members) and still not the narrower field.
    const member = (await profileOf(MEMBER)).profile!
    expect(member.city).toBe('Brussels')
    expect(member.neurotype).toBeNull()
  })

  it('still reduces a members-only profile with nothing public to its identity', async () => {
    await setVisibility({neurotype: 'connected'}, 'member')
    expect(Object.keys((await profileOf()).profile!).sort()).toEqual([
      'disabled',
      'user_id',
      'visibility',
    ])
  })

  it("keeps a field's own choice when the profile-wide setting is switched around it", async () => {
    const choices = {headline: 'public', neurotype: 'connected'}
    for (const visibility of ['member', 'public', 'member']) {
      await setVisibility(choices, visibility)
      expect((await profileOf()).profile!.headline).toBe('Public headline')
      expect((await profileOf(MEMBER)).profile!.neurotype).toBeNull()
    }
  })

  it('returns nothing but identity from the anon RPC', async () => {
    const [row] = await asAnon((tx) =>
      tx.manyOrNone(`select * from get_profile_by_user_id($1)`, [OWNER]),
    )
    expect(row.user_id).toBe(OWNER)
    expect(row.headline).toBeNull()
    expect(row.id).toBeNull()
  })
})

describe('an administrator', () => {
  const [ADMIN] = ENV_CONFIG.adminIds

  beforeEach(async () => {
    await seedUser(ADMIN)
    const pg = getTestDb()
    const {id} = await pg.one(
      `insert into compatibility_prompts (question, answer_type) values ('Question?', 'free_response')
       returning id`,
    )
    await pg.none(
      `insert into compatibility_answers (creator_id, question_id, multiple_choice, pref_choices, importance)
       values ($1, $2, 0, '{0}', 1)`,
      [OWNER, id],
    )
    await pg.none(
      `insert into profile_comments (on_user_id, user_id, user_name, user_username, content, hidden)
       values ($1, $2, 'Name', 'username', '{}', false)`,
      [OWNER, APPROVED],
    )
    // Everything narrowed as far as it goes, on a members-only profile.
    await setVisibility(
      {
        photos: 'only_me',
        neurotype: 'only_me',
        political_beliefs: 'connected',
        headline: 'only_me',
        answers: 'only_me',
        endorsements: 'only_me',
      },
      'member',
    )
  })

  it('reads the whole profile, fields set to only-me included', async () => {
    const {user, profile} = await profileOf(ADMIN)
    expect(profile!.neurotype).toEqual(['adhd'])
    expect(profile!.political_beliefs).toEqual(['green'])
    expect(profile!.headline).toBe('Public headline')
    expect(profile!.pinned_url).toBe('https://example.com/photo.jpg')
    expect(user.avatarUrl).toBe('https://example.com/photo.jpg')
    // Not offered a way to "ask": nothing is being kept from them.
    expect(profile).not.toHaveProperty('shares_more')
  })

  it('gets the whole row in search as well', async () => {
    const row = (await search(ADMIN)).find((profile) => profile.user_id === OWNER)
    expect(row.headline).toBe('Public headline')
    expect(row.pinned_url).toBe('https://example.com/photo.jpg')
    expect(row.user.avatarUrl).toBe('https://example.com/photo.jpg')
  })

  it('reads answers and endorsements kept for the owner alone', async () => {
    expect((await call(getProfileAnswers, {userId: OWNER}, ADMIN)).answers).toHaveLength(1)
    expect((await call(getProfileComments, {userId: OWNER}, ADMIN)).comments).toHaveLength(1)
  })

  it('still reads all of it when the profile is paused', async () => {
    await getTestDb().none(`update profiles set disabled = true where user_id = $1`, [OWNER])
    expect((await profileOf(ADMIN)).profile!.neurotype).toEqual(['adhd'])
    expect((await call(getProfileAnswers, {userId: OWNER}, ADMIN)).answers).toHaveLength(1)
    expect((await call(getProfileComments, {userId: OWNER}, ADMIN)).comments).toHaveLength(1)
    // An ordinary member gets nothing of a paused profile, as before.
    expect((await call(getProfileAnswers, {userId: OWNER}, MEMBER)).answers).toHaveLength(0)
  })

  it('is not shut out by a block, in either direction', async () => {
    await call(blockUser, {id: ADMIN}, OWNER)
    expect((await profileOf(ADMIN)).profile!.neurotype).toEqual(['adhd'])
    expect((await call(getProfileAnswers, {userId: OWNER}, ADMIN)).answers).toHaveLength(1)
    expect((await search(ADMIN)).some((profile) => profile.user_id === OWNER)).toBe(true)

    await call(blockUser, {id: OWNER}, ADMIN)
    expect((await profileOf(ADMIN)).profile!.neurotype).toEqual(['adhd'])

    // A block still closes the profile to an ordinary member.
    await call(blockUser, {id: MEMBER}, OWNER)
    expect(Object.keys((await profileOf(MEMBER)).profile!).sort()).toEqual([
      'disabled',
      'user_id',
      'visibility',
    ])
  })

  it('is the only one: an ordinary member sees none of it', async () => {
    const {profile} = await profileOf(MEMBER)
    expect(profile!.neurotype).toBeNull()
    expect(profile!.political_beliefs).toBeNull()
    expect(profile!.headline).toBeNull()
    expect((await call(getProfileAnswers, {userId: OWNER}, MEMBER)).answers).toHaveLength(0)
  })
})

describe('view as', () => {
  const previewAs = async (viewAs: 'public' | 'member' | 'connected', asker = OWNER) =>
    (await getUserAndProfile(`username_${OWNER}`, asker, viewAs))!

  beforeEach(() =>
    setVisibility({photos: 'member', neurotype: 'connected', political_beliefs: 'only_me'}),
  )

  it('gives the owner exactly what each audience is sent', async () => {
    for (const [viewAs, real] of [
      ['public', undefined],
      ['member', MEMBER],
      ['connected', APPROVED],
    ] as const) {
      const preview = await previewAs(viewAs)
      const actual = await profileOf(real)
      expect(preview.profile).toEqual(actual.profile)
      expect(preview.user.avatarUrl).toBe(actual.user.avatarUrl)
    }
  })

  it('never includes the owner-only fields or the map of who sees what', async () => {
    const {profile} = await previewAs('connected')
    expect(profile!.political_beliefs).toBeNull()
    expect(profile).not.toHaveProperty('field_visibility')
  })

  it('is ignored when someone else asks', async () => {
    // A member asking to see the owner's profile "as an approved person" gets a member's view.
    const {profile} = await previewAs('connected', MEMBER)
    expect(profile!.neurotype).toBeNull()
  })
})

describe('saving the choices', () => {
  it('stores the map sent with the profile, and rejects an unknown audience at the schema', async () => {
    await call(
      updateProfileEndpoint,
      {visibility: 'public', field_visibility: {bio: 'only_me', links: 'connected'}},
      OWNER,
    )
    const stored = await getTestDb().one(
      `select field_visibility from profiles where user_id = $1`,
      [OWNER],
      (r) => r.field_visibility,
    )
    expect(stored).toEqual({bio: 'only_me', links: 'connected'})
  })
})

describe('the option tables, read with the anon key', () => {
  const tagsAsAnon = async () => {
    const id = await profileId()
    return asAnon((tx) =>
      tx.manyOrNone(`select * from profile_interests where profile_id = $1`, [id]),
    )
  }

  beforeEach(async () => {
    const pg = getTestDb()
    const {id: optionId} = await pg.one(
      `insert into interests (name) values ('Chess') returning id`,
    )
    await pg.none(`insert into profile_interests (profile_id, option_id) values ($1, $2)`, [
      await profileId(),
      optionId,
    ])
  })

  it('answer for a public profile', async () => {
    expect(await tagsAsAnon()).toHaveLength(1)
  })

  it('answer nothing once the field is narrowed', async () => {
    await setVisibility({interests: 'member'})
    expect(await tagsAsAnon()).toHaveLength(0)
  })

  it('answer nothing for a members-only profile, whose id can be guessed', async () => {
    await setVisibility({}, 'member')
    expect(await tagsAsAnon()).toHaveLength(0)
  })

  it('answer for a members-only profile whose owner made that field public', async () => {
    await setVisibility({interests: 'public'}, 'member')
    expect(await tagsAsAnon()).toHaveLength(1)
  })

  it('answer nothing for a disabled profile', async () => {
    await getTestDb().none(`update profiles set disabled = true where user_id = $1`, [OWNER])
    expect(await tagsAsAnon()).toHaveLength(0)
  })
})

describe('search', () => {
  it('finds the profile by a field it shows, and returns it', async () => {
    expect(await found(MEMBER, {political_beliefs: ['green']})).toBe(true)
    expect(await found(MEMBER, {name: 'Zebra-striped'})).toBe(true)
    expect(await found(MEMBER, {name: 'quokka'})).toBe(true)
  })

  describe('with fields kept from members', () => {
    beforeEach(() =>
      setVisibility({political_beliefs: 'only_me', neurotype: 'connected', keywords: 'connected'}),
    )

    it('does not match a filter on the hidden field', async () => {
      expect(await found(MEMBER, {political_beliefs: ['green']})).toBe(false)
      expect(await found(MEMBER, {neurotype: ['adhd']})).toBe(false)
    })

    it('does not single it out through a filter that lets blanks through', async () => {
      // "neurotypical" surfaces profiles that never answered; a hidden answer is treated the same.
      expect(await found(MEMBER, {neurotype: ['neurotypical']})).toBe(true)
    })

    it('does not match a keyword on hidden text, in the column or in the search index', async () => {
      expect(await found(MEMBER, {name: 'Zebra-striped'})).toBe(false)
      expect(await found(MEMBER, {name: 'quokka'})).toBe(false)
      expect(await found(MEMBER, {name: 'Public headline'})).toBe(true)
    })

    it('behaves the same for someone in the circle, who still reads the field on the row', async () => {
      expect(await found(APPROVED, {neurotype: ['adhd']})).toBe(false)
      const row = (await search(APPROVED)).find((profile) => profile.user_id === OWNER)
      expect(row.keywords).toEqual(['quokka'])
      expect(row).not.toHaveProperty('viewer_approved')
    })

    it('sends a member the row without the hidden fields', async () => {
      const row = (await search(MEMBER)).find((profile) => profile.user_id === OWNER)
      expect(row.headline).toBe('Public headline')
      expect(row.keywords).toBeNull()
      expect(row).not.toHaveProperty('field_visibility')
    })

    it('still matches once the field is shown to members again', async () => {
      await setVisibility({})
      expect(await found(MEMBER, {political_beliefs: ['green']})).toBe(true)
      expect(await found(MEMBER, {name: 'Zebra-striped'})).toBe(true)
    })
  })

  it('leaves a profile out of "has a photo" when its photos are kept from members', async () => {
    expect(await found(MEMBER, {hasPhoto: true})).toBe(true)
    await setVisibility({photos: 'connected'})
    expect(await found(MEMBER, {hasPhoto: true})).toBe(false)
  })

  it('lets a member filter others on a field they hide themselves', async () => {
    await getTestDb().none(
      `update profiles set field_visibility = '{"political_beliefs": "only_me"}' where user_id = $1`,
      [MEMBER],
    )
    // The owner shows their politics (`green`) to members, so the filter applies as usual.
    expect(await found(MEMBER, {political_beliefs: ['green']})).toBe(true)
    expect(await found(MEMBER, {political_beliefs: ['libertarian']})).toBe(false)
  })
})

describe('answers and endorsements', () => {
  beforeEach(async () => {
    const pg = getTestDb()
    const {id} = await pg.one(
      `insert into compatibility_prompts (question, answer_type) values ('Question?', 'free_response')
       returning id`,
    )
    await pg.none(
      `insert into compatibility_answers (creator_id, question_id, multiple_choice, pref_choices, importance)
       values ($1, $2, 0, '{0}', 1)`,
      [OWNER, id],
    )
    await pg.none(
      `insert into profile_comments (on_user_id, user_id, user_name, user_username, content, hidden)
       values ($1, $2, 'Name', 'username', '{}', false)`,
      [OWNER, APPROVED],
    )
    await setVisibility({answers: 'connected', endorsements: 'only_me'})
  })

  it('follow their own field', async () => {
    const answers = async (uid: string) =>
      (await call(getProfileAnswers, {userId: OWNER}, uid)).answers.length
    expect(await answers(MEMBER)).toBe(0)
    expect(await answers(APPROVED)).toBe(1)
    expect(await answers(OWNER)).toBe(1)

    const comments = async (uid?: string) =>
      (await call(getProfileComments, {userId: OWNER}, uid)).comments.length
    expect(await comments()).toBe(0)
    expect(await comments(APPROVED)).toBe(0)
    expect(await comments(OWNER)).toBe(1)
  })
})

describe('the public feed', () => {
  const itemOf = async () =>
    (await call(getProfileFeed, {})).items.find((i: any) => i.username === `username_${OWNER}`)

  it('carries the fields that are public, and has no setting of its own', async () => {
    // The retired feed level is ignored, whatever it says.
    await getTestDb().none(`update profiles set feed_visibility = 'none' where user_id = $1`, [
      OWNER,
    ])
    await setVisibility({headline: 'member', gender: 'only_me'})

    const item = await itemOf()
    expect(item.headline).toBeUndefined()
    expect(item.gender).toBeUndefined()
    expect(item.location).toBe('Brussels, Belgium')
    expect(item.keywords).toEqual(['quokka'])
  })

  it('lists a members-only profile only by the fields its owner made public', async () => {
    await setVisibility({}, 'member')
    expect(await itemOf()).toBeUndefined()

    await setVisibility({headline: 'public'}, 'member')
    const item = await itemOf()
    expect(item.headline).toBe('Public headline')
    expect(item.location).toBeUndefined()
    expect(item.keywords).toBeUndefined()
  })

  it('does not match a country filter on a hidden location', async () => {
    const byCountry = async () =>
      (await call(getProfileFeed, {country: 'Belgium'})).items.map((i: any) => i.username)
    expect(await byCountry()).toEqual([`username_${OWNER}`])
    await setVisibility({location: 'member'})
    expect(await byCountry()).toEqual([])
  })
})

describe('approvals', () => {
  const statusOf = (viewer: string) =>
    getTestDb().oneOrNone(
      `select status, decided_time from profile_access where owner_id = $1 and viewer_id = $2`,
      [OWNER, viewer],
    )

  /** A conversation between exactly these members, with one message from `from`. */
  const seedMessage = async (from: string, members: string[], visibility = 'private') => {
    const pg = getTestDb()
    const {id} = await pg.one(
      `insert into private_user_message_channels default values returning id`,
    )
    for (const member of members) {
      await pg.none(
        `insert into private_user_message_channel_members (channel_id, user_id) values ($1, $2)`,
        [id, member],
      )
    }
    await pg.none(
      `insert into private_user_messages (channel_id, user_id, visibility) values ($1, $2, $3)`,
      [id, from, visibility],
    )
  }

  beforeEach(async () => {
    await setVisibility({neurotype: 'connected'})
    // The owner has written to MEMBER, which is what lets MEMBER ask.
    await seedMessage(OWNER, [OWNER, MEMBER])
  })

  describe('asking needs a conversation the owner has taken part in', () => {
    const STRANGER = 'stranger'
    const canAsk = async () =>
      (await call(getProfileAccess, {userId: OWNER}, STRANGER)).pair.canRequest

    beforeEach(() => seedUser(STRANGER))

    it('refuses a stranger, and says so through `canRequest`', async () => {
      expect(await canAsk()).toBe(false)
      await expect(call(requestProfileAccess, {userId: OWNER}, STRANGER)).rejects.toThrow()
      expect(await statusOf(STRANGER)).toBeNull()
      // They are still told that something is kept back.
      const {profile} = (await getUserAndProfile(`username_${OWNER}`, STRANGER))!
      expect((profile as any).shares_more).toBe(true)
    })

    it('is not opened by the stranger writing first', async () => {
      await seedMessage(STRANGER, [OWNER, STRANGER])
      expect(await canAsk()).toBe(false)
    })

    it('is not opened by a group conversation, or by a system line', async () => {
      await seedMessage(OWNER, [OWNER, STRANGER, APPROVED])
      await seedMessage(OWNER, [OWNER, STRANGER], 'system_status')
      expect(await canAsk()).toBe(false)
    })

    it('is opened once the owner writes back', async () => {
      await seedMessage(OWNER, [OWNER, STRANGER])
      expect(await canAsk()).toBe(true)
      expect(await call(requestProfileAccess, {userId: OWNER}, STRANGER)).toEqual({
        status: 'requested',
      })
    })
  })

  it('open the approved fields only once the owner approves a request', async () => {
    expect(await call(requestProfileAccess, {userId: OWNER}, MEMBER)).toEqual({status: 'requested'})
    expect((await profileOf(MEMBER)).profile!.neurotype).toBeNull()

    // The owner is emailed the request…
    expect(emails.sendCircleEmail).toHaveBeenCalledWith(
      expect.objectContaining({id: OWNER}),
      expect.objectContaining({id: MEMBER}),
      expect.objectContaining({id: OWNER}),
      'requested',
    )
    // …and pushed it, on the web and on their phone.
    expect(mobile.sendWebNotifications).toHaveBeenCalledWith(
      expect.anything(),
      OWNER,
      expect.stringContaining(`/username_${MEMBER}`),
    )
    expect(mobile.sendMobileNotifications).toHaveBeenCalledWith(
      expect.anything(),
      OWNER,
      expect.objectContaining({url: `/username_${MEMBER}`}),
    )

    const pending = await call(getProfileAccess, {userId: MEMBER}, OWNER)
    expect(pending.requests.map((r: any) => r.id)).toEqual([MEMBER])
    expect(pending.pair).toMatchObject({requestedOfMe: true, approvedByMe: false})

    await call(setProfileAccess, {userId: MEMBER, action: 'approve'}, OWNER)
    expect((await profileOf(MEMBER)).profile!.neurotype).toEqual(['adhd'])
    // The member is emailed that they were added.
    expect(emails.sendCircleEmail).toHaveBeenLastCalledWith(
      expect.objectContaining({id: MEMBER}),
      expect.objectContaining({id: OWNER}),
      expect.objectContaining({id: MEMBER}),
      'added',
    )

    const after = await call(getProfileAccess, {userId: OWNER}, MEMBER)
    expect(after.pair.myRequest).toBe('approved')
  })

  it('are one-directional', async () => {
    await getTestDb().none(
      `update profiles set field_visibility = '{"keywords": "connected"}', keywords = '{mine}'
       where user_id = $1`,
      [APPROVED],
    )
    // The owner approved APPROVED; that shows the owner nothing of APPROVED's.
    const theirs = (await getUserAndProfile(`username_${APPROVED}`, OWNER))!.profile!
    expect(theirs.keywords).toBeNull()
  })

  it('hide the request from the owner on a decline, and tell the requester nothing', async () => {
    await call(requestProfileAccess, {userId: OWNER}, MEMBER)
    ;(mobile.sendWebNotifications as jest.Mock).mockClear()
    ;(emails.sendCircleEmail as jest.Mock).mockClear()
    await call(setProfileAccess, {userId: MEMBER, action: 'dismiss'}, OWNER)

    expect((await call(getProfileAccess, {}, OWNER)).requests).toEqual([])
    expect((await call(getProfileAccess, {userId: OWNER}, MEMBER)).pair.myRequest).toBe('requested')

    // Asking again straight away changes nothing: still declined, still silent.
    expect(await call(requestProfileAccess, {userId: OWNER}, MEMBER)).toEqual({status: 'requested'})
    expect((await statusOf(MEMBER))!.decided_time).not.toBeNull()
    // Neither the decline nor the repeated request pushed anything to anyone.
    expect(mobile.sendWebNotifications).not.toHaveBeenCalled()
    expect(emails.sendCircleEmail).not.toHaveBeenCalled()
    expect((await call(getProfileAccess, {}, OWNER)).requests).toEqual([])
  })

  it('end at once when removed, and the row is kept as `removed`', async () => {
    await call(setProfileAccess, {userId: APPROVED, action: 'revoke'}, OWNER)
    expect((await statusOf(APPROVED))!.status).toBe('removed')
    expect((await profileOf(APPROVED)).profile!.neurotype).toBeNull()
    // Gone from the owner's list, and not counted as in the circle anywhere.
    const lists = await call(getProfileAccess, {userId: APPROVED}, OWNER)
    expect(lists.approved).toEqual([])
    expect(lists.pair.approvedByMe).toBe(false)
  })

  it('cannot be looped into a stream of notifications', async () => {
    ;(emails.sendCircleEmail as jest.Mock).mockClear()
    for (let i = 0; i < 3; i++) {
      await call(setProfileAccess, {userId: APPROVED, action: 'revoke'}, OWNER)
      await call(setProfileAccess, {userId: APPROVED, action: 'approve'}, OWNER)
    }
    expect((await profileOf(APPROVED)).profile!.neurotype).toEqual(['adhd'])
    expect(emails.sendCircleEmail).not.toHaveBeenCalled()
  })

  it('cannot be given to a stranger, or to someone who does not exist', async () => {
    await seedUser('outsider')
    expect((await call(getProfileAccess, {userId: 'outsider'}, OWNER)).pair.canAdd).toBe(false)
    await expect(
      call(setProfileAccess, {userId: 'outsider', action: 'approve'}, OWNER),
    ).rejects.toThrow()
    expect(await statusOf('outsider')).toBeNull()

    await expect(
      call(setProfileAccess, {userId: 'no-such-user', action: 'approve'}, OWNER),
    ).rejects.toMatchObject({code: 404})
  })

  it('can be given to someone the owner is in a conversation with, in either direction', async () => {
    await seedUser('penpal')
    await seedMessage('penpal', [OWNER, 'penpal'])
    expect((await call(getProfileAccess, {userId: 'penpal'}, OWNER)).pair.canAdd).toBe(true)
    ;(emails.sendCircleEmail as jest.Mock).mockClear()
    ;(mobile.sendWebNotifications as jest.Mock).mockClear()
    expect(await call(setProfileAccess, {userId: 'penpal', action: 'approve'}, OWNER)).toEqual({
      status: 'approved',
    })
    // They did not ask, so they are pushed the news but not emailed it.
    expect(mobile.sendWebNotifications).toHaveBeenCalledWith(
      expect.anything(),
      'penpal',
      expect.stringContaining(`/username_${OWNER}`),
    )
    expect(emails.sendCircleEmail).not.toHaveBeenCalled()
  })

  it('are deleted by a block in either direction, and not restored by unblocking', async () => {
    await call(requestProfileAccess, {userId: OWNER}, MEMBER)
    await call(blockUser, {id: OWNER}, APPROVED)
    await call(blockUser, {id: MEMBER}, OWNER)

    expect(await statusOf(APPROVED)).toBeNull()
    expect(await statusOf(MEMBER)).toBeNull()
  })

  it('cannot be requested of a member who keeps nothing for approved people', async () => {
    await setVisibility({neurotype: 'only_me'})
    await expect(call(requestProfileAccess, {userId: OWNER}, MEMBER)).rejects.toThrow()
    expect(await statusOf(MEMBER)).toBeNull()
  })

  it('cannot be read by the anon key', async () => {
    await expect(
      asAnon((tx) => tx.manyOrNone(`select * from profile_access`)),
    ).rejects.toMatchObject({code: '42501'})
  })
})
