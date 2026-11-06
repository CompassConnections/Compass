import {getUserDataExport} from 'api/get-user-data-export'
import {AuthedUser} from 'api/helpers/endpoint'

import {getTestDb, resetDb, seedUser} from './helpers/db'

const MEMBER = 'member'
const OTHER = 'other'

const exportFor = (uid: string) => getUserDataExport({}, {uid} as AuthedUser, {} as any) as any

describe('getUserDataExport', () => {
  beforeEach(async () => {
    await resetDb()
    await seedUser(MEMBER, {profile: {headline: 'Mine'}})
    await seedUser(OTHER, {profile: {headline: 'Theirs'}})
  })

  it('returns the member, and their searches and ballots', async () => {
    const pg = getTestDb()
    await pg.none(
      `insert into bookmarked_searches (creator_id, search_filters) values ($1, '{}')`,
      [MEMBER],
    )
    const {id: voteId} = await pg.one(
      `insert into votes (title, is_anonymous) values ('Proposal', false) returning id`,
    )
    await pg.none(
      `insert into vote_results (vote_id, user_id, choice, priority) values ($1, $2, 1, 0)`,
      [voteId, MEMBER],
    )

    const data = await exportFor(MEMBER)

    expect(data.user.id).toBe(MEMBER)
    expect(data.privateUser.id).toBe(MEMBER)
    expect(data.profile.headline).toBe('Mine')
    expect(data.searchBookmarks).toHaveLength(1)
    expect(data.voteAnswers).toHaveLength(1)
  })

  it('includes every like and ship, whoever they are of', async () => {
    const pg = getTestDb()
    await pg.none(`update users set is_banned_from_posting = true where id = $1`, [OTHER])
    await pg.none(`update profiles set looking_for_matches = false where user_id = $1`, [OTHER])
    await pg.none(`insert into profile_likes (creator_id, target_id) values ($1, $2), ($2, $1)`, [
      MEMBER,
      OTHER,
    ])
    await pg.none(
      `insert into profile_ships (creator_id, target1_id, target2_id) values ($2, $1, $2)`,
      [MEMBER, OTHER],
    )

    const {endorsements} = await exportFor(MEMBER)

    expect(endorsements.likesGiven.map((l: any) => l.user_id)).toEqual([OTHER])
    expect(endorsements.likesReceived.map((l: any) => l.user_id)).toEqual([OTHER])
    expect(endorsements.ships).toHaveLength(1)
  })

  it("contains none of another member's data", async () => {
    const pg = getTestDb()
    await pg.none(
      `insert into bookmarked_searches (creator_id, search_filters) values ($1, '{}')`,
      [OTHER],
    )
    await pg.none(`insert into contact (user_id, content) values ($1, '{}')`, [OTHER])

    const data = await exportFor(MEMBER)

    expect(data.searchBookmarks).toEqual([])
    expect(data.contactMessages).toEqual([])
    expect(data.messages.channels).toEqual([])
  })

  it('names the other members of a conversation, leaving out the requester', async () => {
    const pg = getTestDb()
    const {id} = await pg.one(
      `insert into private_user_message_channels default values returning id`,
    )
    await pg.none(
      `insert into private_user_message_channel_members (channel_id, user_id, role)
       values ($1, $2, 'member'), ($1, $3, 'member')`,
      [id, MEMBER, OTHER],
    )

    const {messages} = await exportFor(MEMBER)

    expect(messages.channels).toHaveLength(1)
    expect(messages.memberships.map((m: any) => m.username)).toEqual([`username_${OTHER}`])
  })

  it('works for an account with no profile', async () => {
    await getTestDb().none(`delete from profiles where user_id = $1`, [MEMBER])

    const data = await exportFor(MEMBER)

    expect(data.user.id).toBe(MEMBER)
    expect(data.profile).toBeNull()
  })
})
