import {deleteMe} from 'api/delete-me'
import {getSearchAlert} from 'api/get-search-alert'
import {AuthedUser} from 'api/helpers/endpoint'

import {getTestDb, resetDb, seedUser} from './helpers/db'

jest.mock('firebase-admin', () => ({
  auth: jest.fn(() => ({deleteUser: jest.fn()})),
}))
jest.mock('shared/firebase-utils', () => ({deleteUserFiles: jest.fn()}))

const LEAVING = 'leaving'
const OTHER = 'other'

const auth = {uid: LEAVING} as AuthedUser
const reason = {reasonCategory: 'found_connection', reasonDetails: 'Met someone'} as any
const testimonialBody = 'Thank you, I met someone wonderful here and we are very happy.'
const deleteAccount = (props = reason) => deleteMe(props, auth, {} as any)

const count = async (sql: string, params: unknown[] = []) => {
  const {count} = await getTestDb().one(`select count(*) from ${sql}`, params)
  return count as number
}

describe('account deletion schema', () => {
  // `delete-me` deletes the users row and relies on these rules to clear the rest, so a foreign key
  // without one makes deleting the account fail.
  it('gives every foreign key to users a delete rule', async () => {
    const missing = await getTestDb().manyOrNone(`
      select conrelid::regclass::text as table_name, conname
      from pg_constraint
      where contype = 'f'
        and confrelid = 'users'::regclass
        and confdeltype not in ('c', 'n')
    `)
    expect(missing).toEqual([])
  })

  it('only uses on delete set null on nullable columns', async () => {
    const conflicts = await getTestDb().manyOrNone(`
      select c.conrelid::regclass::text as table_name, a.attname as column_name
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
      where c.contype = 'f'
        and c.confdeltype = 'n'
        and a.attnotnull
    `)
    expect(conflicts).toEqual([])
  })
})

describe('deleteMe', () => {
  beforeEach(async () => {
    await resetDb()
    await seedUser(LEAVING)
    await seedUser(OTHER)
  })

  it('removes the account and its personal rows', async () => {
    const pg = getTestDb()
    await pg.none(`insert into profile_likes (creator_id, target_id) values ($1, $2)`, [
      LEAVING,
      OTHER,
    ])

    await deleteAccount()

    expect(await count(`users where id = $1`, [LEAVING])).toBe(0)
    expect(await count(`private_users where id = $1`, [LEAVING])).toBe(0)
    expect(await count(`profiles where user_id = $1`, [LEAVING])).toBe(0)
    expect(await count(`profile_likes where creator_id = $1`, [LEAVING])).toBe(0)
  })

  it('leaves other members untouched', async () => {
    await deleteAccount()

    expect(await count(`users where id = $1`, [OTHER])).toBe(1)
    expect(await count(`profiles where user_id = $1`, [OTHER])).toBe(1)
  })

  it('works for a member who posted a proposal and voted, keeping the proposal', async () => {
    const pg = getTestDb()
    const {id: voteId} = await pg.one(
      `insert into votes (title, is_anonymous, creator_id) values ('Proposal', false, $1) returning id`,
      [LEAVING],
    )
    await pg.none(
      `insert into vote_results (vote_id, user_id, choice, priority) values ($1, $2, 1, 0), ($1, $3, 1, 0)`,
      [voteId, LEAVING, OTHER],
    )

    await deleteAccount()

    const proposal = await pg.one(`select creator_id from votes where id = $1`, [voteId])
    expect(proposal.creator_id).toBeNull()
    expect(await count(`vote_results where user_id = $1`, [LEAVING])).toBe(0)
    expect(await count(`vote_results where user_id = $1`, [OTHER])).toBe(1)
  })

  it('records the reason for leaving', async () => {
    await deleteAccount()

    const row = await getTestDb().one(`select * from deleted_users`)
    expect(row).toMatchObject({
      username: `username_${LEAVING}`,
      reason_category: reason.reasonCategory,
      reason_details: reason.reasonDetails,
    })
  })

  it('keeps a parting testimonial without its author', async () => {
    await deleteAccount({
      ...reason,
      testimonial: {body: testimonialBody, headline: 'Bye', rating: 5, showAuthor: false},
    })

    const row = await getTestDb().one(`select author_id, body from testimonials`)
    expect(row).toEqual({author_id: null, body: testimonialBody})
  })

  it('removes the member from likes and ships by others', async () => {
    const pg = getTestDb()
    await pg.none(`insert into profile_likes (creator_id, target_id) values ($1, $2)`, [
      OTHER,
      LEAVING,
    ])
    await pg.none(
      `insert into profile_ships (creator_id, target1_id, target2_id) values ($1, $2, $1)`,
      [OTHER, LEAVING],
    )

    await deleteAccount()

    expect(await count(`profile_likes where target_id = $1`, [LEAVING])).toBe(0)
    expect(await count(`profile_ships where $1 in (target1_id, target2_id)`, [LEAVING])).toBe(0)
  })

  describe('search alerts that named the member', () => {
    const THIRD = 'third'
    const seedAlert = async (matchedUserIds: string[]) => {
      const {id} = await getTestDb().one(
        `insert into search_alert_sends (creator_id, search_ids, matched_user_ids)
         values ($1, '{}', $2) returning id`,
        [OTHER, matchedUserIds],
      )
      return id as number
    }
    const readAlert = (id: number) =>
      getSearchAlert({id}, {uid: OTHER} as AuthedUser, {} as any) as Promise<any>

    it('removes the id and still reports the member as gone', async () => {
      await seedUser(THIRD)
      const id = await seedAlert([LEAVING, THIRD])

      await deleteAccount()

      const row = await getTestDb().one(
        `select matched_user_ids, deleted_match_count from search_alert_sends where id = $1`,
        [id],
      )
      expect(row).toEqual({matched_user_ids: [THIRD], deleted_match_count: 1})

      const alert = await readAlert(id)
      expect(alert.goneCount).toBe(1)
      expect(alert.profiles.map((p: any) => p.user_id)).toEqual([THIRD])
    })

    it('shows nobody when everyone the alert named has left', async () => {
      const id = await seedAlert([LEAVING])

      await deleteAccount()

      const alert = await readAlert(id)
      expect(alert.goneCount).toBe(1)
      expect(alert.profiles).toEqual([])
    })
  })
})
