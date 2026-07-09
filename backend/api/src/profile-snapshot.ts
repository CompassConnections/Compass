import {debug} from 'common/logger'
import {isEqual} from 'lodash'
import {SupabaseDirectClient} from 'shared/supabase/init'

/**
 * A copy of the profile-side tables as they were at the end of the last successful search-alert run.
 *
 * Bookmarked-search alerts are a set diff: a profile is worth an email on the run where it *starts*
 * matching a search, not on every later edit. Running the very same filter query against this
 * snapshot answers "did it already match yesterday?" without duplicating any of the filter logic in
 * `get-profiles.ts` — the tables here carry the same names as their `public` counterparts, so the
 * generated SQL resolves to them through the `search_path` (see {@link withSchema}).
 */
export const SNAPSHOT_SCHEMA = 'profile_snapshot'

/**
 * Where the next snapshot is built, at the *start* of a run. Both sides of the diff then read from a
 * snapshot rather than from `public`, so profiles edited while the run is in flight belong to
 * neither side and are picked up by the next run instead of being silently absorbed.
 *
 * It is promoted to {@link SNAPSHOT_SCHEMA} only once every search has been processed. A run that
 * dies halfway therefore leaves it behind, and the next run resumes against it.
 */
export const STAGING_SCHEMA = 'profile_snapshot_staging'

/**
 * The tables `loadProfiles` filters on that a profile owner can actually change.
 *
 * Everything else it touches keeps resolving to `public` through the search_path, which is what we
 * want: the option tables (`interests`, `causes`, `work`, `*_translations`) are static, and
 * `hidden_profiles` / `compatibility_scores` describe the searcher rather than the profile being
 * matched.
 *
 * `user_activity` is deliberately absent. It churns on every page load, so snapshotting it would
 * cost more storage than everything else combined. Leaving it in `public` also means a `last_active`
 * filter sees identical rows on both sides of the diff, so merely coming back online can never look
 * like a new match.
 */
const SNAPSHOT_TABLES = ['profiles', 'users', 'profile_interests', 'profile_causes', 'profile_work']

/** Indexes to recreate on the copies — CTAS keeps no index from the source table. */
const SNAPSHOT_INDEXES: Record<string, string[]> = {
  profiles: ['id', 'user_id'],
  users: ['id'],
  profile_interests: ['profile_id'],
  profile_causes: ['profile_id'],
  profile_work: ['profile_id'],
}

const MANY_TO_MANY_LABELS = ['interests', 'causes', 'work']

/** Runs `fn` against a client whose unqualified table names resolve to `schema` first. */
export const withSchema = <T>(
  pg: SupabaseDirectClient,
  schema: string,
  fn: (db: SupabaseDirectClient) => Promise<T>,
) =>
  pg.tx(async (t) => {
    // `set local` is scoped to the transaction, so pooled connections keep their own search_path.
    await t.none('set local search_path to $(schema:name), public', {schema})
    const result = await fn(t)
    // Releasing a savepoint hands its `set local` up to the enclosing transaction, so when `pg` is
    // itself a transaction the search_path would outlive this call and quietly point later queries
    // at the snapshot. Restoring is a no-op at the top level, where the commit reverts it anyway.
    await t.none('set local search_path to default')
    return result
  })

export const hasStagingSnapshot = async (pg: SupabaseDirectClient) =>
  await pg.one<boolean>(
    `select to_regclass($(table)) is not null as exists`,
    {table: `${STAGING_SCHEMA}.meta`},
    (r) => r.exists,
  )

export const getStagingTakenAt = async (pg: SupabaseDirectClient) =>
  await pg.one<Date>(`select taken_at from ${STAGING_SCHEMA}.meta`, [], (r) => r.taken_at)

/**
 * Rebuilds the staging snapshot from `public`. Recreating the tables from scratch on every run
 * (rather than truncating fixed ones) is what keeps this maintenance-free: a migration that adds a
 * column to `profiles` needs no matching change here.
 */
export const buildStagingSnapshot = async (pg: SupabaseDirectClient) => {
  await pg.tx(async (t) => {
    await t.none('drop schema if exists $(schema:name) cascade', {schema: STAGING_SCHEMA})
    await t.none('create schema $(schema:name)', {schema: STAGING_SCHEMA})

    for (const table of SNAPSHOT_TABLES) {
      await t.none('create table $(schema:name).$(table:name) as table public.$(table:name)', {
        schema: STAGING_SCHEMA,
        table,
      })
      for (const column of SNAPSHOT_INDEXES[table]) {
        await t.none('create index on $(schema:name).$(table:name) ($(column:name))', {
          schema: STAGING_SCHEMA,
          table,
          column,
        })
      }
      await t.none('analyze $(schema:name).$(table:name)', {schema: STAGING_SCHEMA, table})
    }

    await t.none('create table $(schema:name).meta as select now() as taken_at', {
      schema: STAGING_SCHEMA,
    })
  })
  debug(`built ${STAGING_SCHEMA}`)
}

/**
 * True when the committed snapshot exists and has the same columns as `public`.
 *
 * A migration that changes a snapshotted table leaves the old snapshot unable to answer the filter
 * query (a new filterable column simply would not exist there), so the caller rebuilds instead and
 * skips one run of alerts. Failing closed costs at most a day of alerts; failing open would send
 * every user an email about every profile that already matched.
 */
export const isSnapshotUsable = async (pg: SupabaseDirectClient) => {
  const rows = await pg.manyOrNone<{live: string[] | null; snapshot: string[] | null}>(
    `select
       (select array_agg(c.column_name::text order by c.column_name)
          from information_schema.columns c
         where c.table_schema = 'public' and c.table_name = t.table_name) as live,
       (select array_agg(c.column_name::text order by c.column_name)
          from information_schema.columns c
         where c.table_schema = $(schema) and c.table_name = t.table_name) as snapshot
     from unnest($(tables)::text[]) as t(table_name)`,
    {schema: SNAPSHOT_SCHEMA, tables: SNAPSHOT_TABLES},
  )
  return rows.every((r) => r.snapshot != null && isEqual(r.live, r.snapshot))
}

/** Swaps the staging snapshot in as the committed one. Only safe once every search is processed. */
export const promoteStagingSnapshot = async (pg: SupabaseDirectClient) => {
  await pg.tx(async (t) => {
    await t.none('drop schema if exists $(schema:name) cascade', {schema: SNAPSHOT_SCHEMA})
    await t.none('alter schema $(staging:name) rename to $(snapshot:name)', {
      staging: STAGING_SCHEMA,
      snapshot: SNAPSHOT_SCHEMA,
    })
  })
  debug(`promoted ${STAGING_SCHEMA} to ${SNAPSHOT_SCHEMA}`)
}

const manyToManyCte = (label: string) => `
    changed_${label} as (
      select coalesce(staging.profile_id, snapshot.profile_id) as profile_id
      from (
        select profile_id, md5(array_agg(option_id order by option_id)::text) as hash
        from ${STAGING_SCHEMA}.profile_${label}
        group by profile_id
      ) staging
      full outer join (
        select profile_id, md5(array_agg(option_id order by option_id)::text) as hash
        from ${SNAPSHOT_SCHEMA}.profile_${label}
        group by profile_id
      ) snapshot on snapshot.profile_id = staging.profile_id
      where staging.hash is distinct from snapshot.hash
    )`

/**
 * The users whose profile differs between the staging snapshot and the committed one.
 *
 * Hashing the whole row rather than trusting `profiles.last_modification_time` matters: that
 * column's trigger only fires on `profiles` updates, so it never sees a change to a profile's
 * interests, causes or work.
 */
export const getChangedUserIds = async (pg: SupabaseDirectClient) => {
  const query = `
    with staging_profiles as (
      select p.id, p.user_id, md5(p::text) as hash from ${STAGING_SCHEMA}.profiles p
    ),
    changed_profiles as (
      select coalesce(staging.id, snapshot.id) as id
      from staging_profiles staging
      full outer join (
        select p.id, md5(p::text) as hash from ${SNAPSHOT_SCHEMA}.profiles p
      ) snapshot on snapshot.id = staging.id
      where staging.hash is distinct from snapshot.hash
    ),
    changed_users as (
      select coalesce(staging.id, snapshot.id) as id
      from (select u.id, md5(u::text) as hash from ${STAGING_SCHEMA}.users u) staging
      full outer join (
        select u.id, md5(u::text) as hash from ${SNAPSHOT_SCHEMA}.users u
      ) snapshot on snapshot.id = staging.id
      where staging.hash is distinct from snapshot.hash
    ),
    ${MANY_TO_MANY_LABELS.map(manyToManyCte).join(',')}
    select distinct staging_profiles.user_id
    from staging_profiles
    where staging_profiles.id in (select id from changed_profiles)
       or staging_profiles.user_id in (select id from changed_users)
       ${MANY_TO_MANY_LABELS.map(
         (label) => `or staging_profiles.id in (select profile_id from changed_${label})`,
       ).join('\n       ')}`

  return await pg.map(query, [], (r) => r.user_id as string)
}
