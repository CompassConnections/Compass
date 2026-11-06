import {blockUser, unblockUser} from 'api/block-user'
import {createComment} from 'api/create-comment'
import {createCompatibilityQuestion} from 'api/create-compatibility-question'
import {createEvent} from 'api/create-event'
import {createPrivateUserMessage} from 'api/create-private-user-message'
import {createVote} from 'api/create-vote'
import {getProfileAnswers} from 'api/get-profile-answers'
import {getProfileComments} from 'api/get-profile-comments'
import {getProfileFeed} from 'api/get-profile-feed'
import {getProfiles} from 'api/get-profiles'
import {getUserAndProfile} from 'api/get-user-and-profile'
import {AuthedUser} from 'api/helpers/endpoint'
import {likeProfile} from 'api/like-profile'
import {shipProfiles} from 'api/ship-profiles'
import {starProfile} from 'api/star-profile'
import {ENV_CONFIG} from 'common/envs/constants'

import {getTestDb, resetDb, seedUser} from './helpers/db'

jest.mock('common/discord/core', () => ({sendDiscordMessage: jest.fn()}))

const VIEWER = 'viewer'
const TARGET = 'target'
const THIRD = 'third'

const as = (uid: string) => ({uid}) as AuthedUser
const call = (handler: any, props: unknown, uid?: string) =>
  handler(props, uid ? as(uid) : undefined, {} as any)

const profileOf = async (id: string, viewerId?: string) =>
  (await getUserAndProfile(`username_${id}`, viewerId))!

const seedAnswer = async (userId: string) => {
  const pg = getTestDb()
  const {id} = await pg.one(
    `insert into compatibility_prompts (question, answer_type) values ('Question?', 'free_response')
     returning id`,
  )
  await pg.none(
    `insert into compatibility_answers (creator_id, question_id, multiple_choice, pref_choices, importance)
     values ($1, $2, 0, '{0}', 1)`,
    [userId, id],
  )
}

const seedComment = (onUserId: string, authorId: string, hidden = false) =>
  getTestDb().none(
    `insert into profile_comments (on_user_id, user_id, user_name, user_username, content, hidden)
     values ($1, $2, 'Name', 'username', '{}', $3)`,
    [onUserId, authorId, hidden],
  )

// `shortBio` lets in profiles without a full bio, which is all of these.
const searchAs = async (uid: string) => {
  const {status, profiles} = await call(getProfiles, {limit: 20, shortBio: true}, uid)
  expect(status).toBe('success')
  return profiles.map((profile: any) => profile.user_id)
}

const SECRETS = {
  headline: 'Secret headline',
  city: 'Secret city',
  gender: 'female',
  birth_date: '1990-07-01',
}
const VISIBLE_KEYS = ['disabled', 'user_id', 'visibility']

beforeEach(async () => {
  await resetDb()
  await seedUser(VIEWER)
  await seedUser(TARGET, {
    user: {avatar_url: 'https://example.com/photo.jpg'},
    profile: {visibility: 'member', ...SECRETS},
  })
})

describe('reading a profile', () => {
  describe('a members-only profile', () => {
    it('is redacted to its identity columns for an anonymous reader', async () => {
      const {user, profile} = await profileOf(TARGET)
      expect(Object.keys(profile!).sort()).toEqual(VISIBLE_KEYS)
      expect(user.avatarUrl).toBe('')
      expect(user.name).toBe(`Name ${TARGET}`)
    })

    it('is readable by a signed-in member', async () => {
      const {profile} = await profileOf(TARGET, VIEWER)
      expect(profile!.headline).toBe(SECRETS.headline)
    })
  })

  it('shows the birth date to its owner alone', async () => {
    expect((await profileOf(TARGET, TARGET)).profile!.birth_date).toBe(SECRETS.birth_date)
    expect((await profileOf(TARGET, VIEWER)).profile!.birth_date).toBeNull()
  })

  it('redacts a disabled profile for others but not for its owner', async () => {
    await getTestDb().none(`update profiles set disabled = true where user_id = $1`, [TARGET])

    expect(Object.keys((await profileOf(TARGET, VIEWER)).profile!).sort()).toEqual(VISIBLE_KEYS)
    expect((await profileOf(TARGET, TARGET)).profile!.headline).toBe(SECRETS.headline)
  })

  describe('a banned member', () => {
    beforeEach(async () => {
      await getTestDb().none(
        `update users set is_banned_from_posting = true where id = $1;
         update profiles set visibility = 'public' where user_id = $1`,
        [TARGET],
      )
    })

    it('is redacted for members and anonymous readers', async () => {
      expect(Object.keys((await profileOf(TARGET, VIEWER)).profile!).sort()).toEqual(VISIBLE_KEYS)
      expect(Object.keys((await profileOf(TARGET)).profile!).sort()).toEqual(VISIBLE_KEYS)
    })

    it('still says they are banned, which is what the page shows instead', async () => {
      expect((await profileOf(TARGET, VIEWER)).user.isBannedFromPosting).toBe(true)
    })

    it('stays readable by themselves', async () => {
      expect((await profileOf(TARGET, TARGET)).profile!.headline).toBe(SECRETS.headline)
    })

    // They decide the ban by reading the profile. Mods are the same list of ids today.
    it('stays readable by staff', async () => {
      const [adminId] = ENV_CONFIG.adminIds
      expect((await profileOf(TARGET, adminId)).profile!.headline).toBe(SECRETS.headline)
    })
  })

  // Known gap, see docs/test-coverage-plan.md. Once fixed, change this to a plain `it`.
  it.failing('does not tell other members why someone was banned', async () => {
    await getTestDb().none(
      `update users set is_banned_from_posting = true, ban_reason = 'confirmed_abuse' where id = $1`,
      [TARGET],
    )
    const {user} = await profileOf(TARGET, VIEWER)
    expect(user.banReason ?? null).toBeNull()
  })

  it('never returns private_users fields', async () => {
    const {user} = await profileOf(TARGET, VIEWER)
    expect(user).not.toHaveProperty('email')
    expect(user).not.toHaveProperty('blockedUserIds')
  })
})

describe('profile content', () => {
  beforeEach(async () => {
    await seedAnswer(TARGET)
    await seedComment(TARGET, VIEWER)
  })

  const answers = async (viewerId: string) =>
    (await call(getProfileAnswers, {userId: TARGET}, viewerId)).answers
  const comments = async (viewerId?: string) =>
    (await call(getProfileComments, {userId: TARGET}, viewerId)).comments

  it('is readable by a member, and by nobody when signed out of a members-only profile', async () => {
    expect(await answers(VIEWER)).toHaveLength(1)
    expect(await comments(VIEWER)).toHaveLength(1)
    expect(await comments()).toEqual([])
  })

  it.each([
    ['disabled', `update profiles set disabled = true where user_id = $1`],
    ['banned', `update users set is_banned_from_posting = true where id = $1`],
  ])('is empty for a %s member, except to themselves', async (_name, sql) => {
    await getTestDb().none(sql, [TARGET])

    expect(await answers(VIEWER)).toEqual([])
    expect(await comments(VIEWER)).toEqual([])
    expect(await answers(TARGET)).toHaveLength(1)
  })

  it('leaves out hidden comments', async () => {
    await seedUser(THIRD)
    await seedComment(TARGET, THIRD, true)
    expect(await comments(VIEWER)).toHaveLength(1)
  })
})

describe('blocks', () => {
  const block = (blocker: string, blocked: string) => call(blockUser, {id: blocked}, blocker)

  describe.each([
    ['the viewer blocked the target', VIEWER, TARGET],
    ['the target blocked the viewer', TARGET, VIEWER],
  ])('when %s', (_name, blocker, blocked) => {
    beforeEach(() => block(blocker, blocked))

    it('redacts the profile', async () => {
      expect(Object.keys((await profileOf(TARGET, VIEWER)).profile!).sort()).toEqual(VISIBLE_KEYS)
    })

    it('hides answers', async () => {
      await seedAnswer(TARGET)
      const {answers} = await call(getProfileAnswers, {userId: TARGET}, VIEWER)
      expect(answers).toEqual([])
    })

    it.each([
      ['like', likeProfile, {targetUserId: TARGET}],
      ['star', starProfile, {targetUserId: TARGET}],
      ['ship', shipProfiles, {targetUserId1: TARGET, targetUserId2: VIEWER}],
    ])('refuses a %s', async (_action, handler, props) => {
      await expect(call(handler, props, VIEWER)).rejects.toMatchObject({code: 403})
    })

    it('refuses a comment', async () => {
      const content = {type: 'doc', content: [{type: 'paragraph'}]}
      await expect(call(createComment, {userId: TARGET, content}, VIEWER)).rejects.toMatchObject({
        code: 403,
      })
    })

    it('refuses a message in an existing conversation', async () => {
      const pg = getTestDb()
      const {id} = await pg.one(
        `insert into private_user_message_channels default values returning id`,
      )
      await pg.none(
        `insert into private_user_message_channel_members (channel_id, user_id, role)
         values ($1, $2, 'member'), ($1, $3, 'member')`,
        [id, VIEWER, TARGET],
      )
      const content = {type: 'doc', content: [{type: 'paragraph'}]}
      await expect(
        call(createPrivateUserMessage, {channelId: id, content}, VIEWER),
      ).rejects.toMatchObject({code: 403})
    })

    it('removes each from the other in search', async () => {
      await seedUser(THIRD)
      expect(await searchAs(VIEWER)).toEqual([THIRD])
      expect(await searchAs(TARGET)).toEqual([THIRD])
    })
  })

  it('lifts when unblocked', async () => {
    await block(VIEWER, TARGET)
    await call(unblockUser, {id: TARGET}, VIEWER)

    expect((await profileOf(TARGET, VIEWER)).profile!.headline).toBe(SECRETS.headline)
    const {blocked_ids} = await getTestDb().one(
      `select data -> 'blockedUserIds' as blocked_ids from private_users where id = $1`,
      [VIEWER],
    )
    expect(blocked_ids).toEqual([])
  })
})

describe('a banned member', () => {
  const content = {type: 'doc', content: [{type: 'paragraph'}]}

  beforeEach(() =>
    getTestDb().none(`update users set is_banned_from_posting = true where id = $1`, [VIEWER]),
  )

  it.each([
    ['a like', likeProfile, {targetUserId: TARGET}],
    ['a star', starProfile, {targetUserId: TARGET}],
    ['a ship', shipProfiles, {targetUserId1: TARGET, targetUserId2: VIEWER}],
    ['a comment', createComment, {userId: TARGET, content}],
    ['a proposal', createVote, {title: 'Title', description: content, isAnonymous: false}],
    [
      'a compatibility prompt',
      createCompatibilityQuestion,
      {question: 'Q?', options: {A: 0, B: 1}},
    ],
    [
      'an event',
      createEvent,
      {
        title: 'Title',
        locationType: 'online',
        eventStartTime: new Date(Date.now() + 86400000).toISOString(),
      },
    ],
  ])('cannot publish %s', async (_name, handler, props) => {
    await expect(call(handler, props, VIEWER)).rejects.toMatchObject({code: 403})
  })

  it('is left out of search', async () => {
    await seedUser(THIRD)
    expect(await searchAs(TARGET)).toEqual([THIRD])
  })
})

describe('the public feed', () => {
  const feed = async () => (await call(getProfileFeed, {})).items.map((i: any) => i.username)
  const open = {visibility: 'public', feed_visibility: 'full', looking_for_matches: true}

  it('lists public profiles only', async () => {
    await seedUser('open', {profile: open})
    expect(await feed()).toEqual(['username_open'])
  })

  it.each([
    ['disabled', {profile: {...open, disabled: true}}],
    ['opted out', {profile: {...open, feed_visibility: 'none'}}],
    ['not looking', {profile: {...open, looking_for_matches: false}}],
    ['banned', {profile: open, user: {is_banned_from_posting: true}}],
  ])('leaves out a %s profile', async (_name, options) => {
    await seedUser('excluded', options)
    expect(await feed()).toEqual([])
  })
})
