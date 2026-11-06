import {asAnon, getTestDb, resetDb, seedUser} from './helpers/db'

const INSUFFICIENT_PRIVILEGE = '42501'

// What the public anon key may read, row for row. The browser only ever holds that key, so anything
// here is readable by anyone, in bulk. A table belongs on this list only if it is public by design.
const PUBLIC_TABLES = [
  'causes',
  'causes_aliases',
  'causes_translations',
  'compatibility_prompts',
  'compatibility_prompts_translations',
  'events',
  'events_participants',
  'interests',
  'interests_aliases',
  'interests_translations',
  'notification_template_translations',
  'notification_templates',
  'profile_causes',
  'profile_interests',
  'profile_work',
  'vote_comment_edits',
  'vote_comments',
  'vote_edits',
  'work',
  'work_aliases',
  'work_translations',
]

const readAsAnon = (table: string) =>
  asAnon((tx) => tx.manyOrNone(`select * from $1:name`, [table])).catch((e) => {
    if (e.code === INSUFFICIENT_PRIVILEGE) return []
    throw e
  })

describe('the anon key', () => {
  beforeEach(async () => {
    await resetDb()
    await seedUser('member', {profile: {visibility: 'member', headline: 'Secret headline'}})
  })

  // A policy tied to `firebase_uid()` matches nothing here: it is null for every browser request.
  it('can read only the tables that are public by design', async () => {
    const readable = await getTestDb().map(
      `select c.relname
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public'
         and c.relkind in ('r', 'v', 'm')
         and has_table_privilege('anon', c.oid, 'select')
         and (c.relkind <> 'r'
           or not c.relrowsecurity
           or exists (select 1
                      from pg_policies p
                      where p.schemaname = 'public'
                        and p.tablename = c.relname
                        and p.cmd in ('SELECT', 'ALL')
                        and p.roles && array['public', 'anon']::name[]
                        and p.qual !~ 'firebase_uid'))
       order by c.relname`,
      [],
      (row) => row.relname as string,
    )
    expect(readable).toEqual(PUBLIC_TABLES)
  })

  it.each(['users', 'private_users', 'profiles'])('cannot read %s', async (table) => {
    expect(await readAsAnon(table)).toEqual([])
  })

  describe('get_profile_by_user_id', () => {
    const readProfile = (id: string) =>
      asAnon((tx) => tx.oneOrNone(`select * from get_profile_by_user_id($1)`, [id]))

    it('redacts a members-only profile', async () => {
      const row = await readProfile('member')
      expect(row.user_id).toBe('member')
      expect(row.headline).toBeNull()
      expect(row.id).toBeNull()
    })

    it('redacts a disabled public profile', async () => {
      await seedUser('disabled', {
        profile: {visibility: 'public', disabled: true, headline: 'Secret headline'},
      })
      expect((await readProfile('disabled')).headline).toBeNull()
    })

    it('redacts a banned public profile', async () => {
      await seedUser('banned', {
        user: {is_banned_from_posting: true},
        profile: {visibility: 'public', headline: 'Secret headline'},
      })
      expect((await readProfile('banned')).headline).toBeNull()
    })

    it('returns a public profile in full', async () => {
      await seedUser('public', {profile: {visibility: 'public', headline: 'Open headline'}})
      expect((await readProfile('public')).headline).toBe('Open headline')
    })
  })

  // Known gap, see docs/test-coverage-plan.md. Once fixed, change this to a plain `it`.
  it.failing('cannot learn why a member was banned', async () => {
    await seedUser('banned', {user: {is_banned_from_posting: true, ban_reason: 'confirmed_abuse'}})
    const row = await asAnon((tx) => tx.one(`select * from get_display_users(array['banned'])`))
    expect(row.ban_reason).toBeUndefined()
  })

  // Known gap, see docs/test-coverage-plan.md. Once fixed, change this to a plain `it`.
  it.failing('cannot read when a member was last online', async () => {
    await getTestDb().none(
      `insert into user_activity (user_id, last_online_time) values ($1, now())`,
      ['member'],
    )
    const rows = await asAnon((tx) => tx.manyOrNone(`select * from get_user_activity('member')`))
    expect(rows).toEqual([])
  })
})
