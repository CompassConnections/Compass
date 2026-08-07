// Fold near-duplicate interest options into one, and drop "Veganism" in favour of the diet field.
//
// Run with:
//   cd backend/scripts && ENVIRONMENT=PROD npx tsx 2026-08-07-merge-duplicate-interests.ts        # dry run
//   cd backend/scripts && ENVIRONMENT=PROD APPLY=1 npx tsx 2026-08-07-merge-duplicate-interests.ts # for real
//
// Why insert-then-delete rather than `update profile_interests set option_id`: the rebuild triggers in
// `backend/supabase/profile_interests.sql` fire on INSERT and DELETE only — there is no UPDATE trigger.
// Repointing the rows in place would move everyone's tick and leave `search_text` still saying "Gaming",
// which is the exact failure this migration exists to remove. Going through insert and delete lets the
// existing triggers rebuild each affected profile, so nothing here calls `rebuild_profile_search` by hand.
//
// Deleting the `interests` row cascades to `profile_interests` and `interests_translations` (both are
// ON DELETE CASCADE), and the cascade still fires the per-row delete trigger.

import {runScript} from './run-script'

const APPLY = process.env.APPLY === '1'

/** `[from, into]` — everyone holding `from` ends up holding `into`, and `from` stops existing. */
const MERGES: [string, string][] = [
  ['Gaming', 'Video games'],
  ['PC Gaming', 'Video games'],
]

/**
 * Dropped outright rather than merged: the diet field already carries this, and an interest in veganism
 * is not the same claim as being vegan — so there is nothing to merge it *into* without inventing a
 * dietary position on someone's behalf. The people who ticked the interest and no diet are printed
 * below rather than converted.
 */
const DELETE_OUTRIGHT = ['Veganism']

runScript(async ({pg}) => {
  const idOf = async (name: string) =>
    (await pg.oneOrNone<{id: string}>(`select id from interests where name = $1`, [name]))?.id ??
    null

  const holders = async (name: string) =>
    pg.manyOrNone<{username: string}>(
      `select u.username
       from profile_interests pi
                join interests i on i.id = pi.option_id
                join profiles p on p.id = pi.profile_id
                join users u on u.id = p.user_id
       where i.name = $1
       order by u.username`,
      [name],
    )

  console.log(APPLY ? '=== APPLYING ===' : '=== DRY RUN (set APPLY=1 to write) ===')

  for (const [from, into] of MERGES) {
    const fromId = await idOf(from)
    const intoId = await idOf(into)
    if (!fromId) {
      console.log(`\n"${from}" does not exist — nothing to do.`)
      continue
    }
    if (!intoId)
      throw new Error(`Target interest "${into}" does not exist — refusing to merge into nothing`)

    const moving = await pg.manyOrNone<{username: string}>(
      `select u.username
       from profile_interests pi
                join profiles p on p.id = pi.profile_id
                join users u on u.id = p.user_id
       where pi.option_id = $(fromId)
         and not exists (select 1
                         from profile_interests other
                         where other.profile_id = pi.profile_id
                           and other.option_id = $(intoId))
       order by u.username`,
      {fromId, intoId},
    )
    const alreadyHad = (await holders(from)).length - moving.length

    console.log(
      `\n"${from}" -> "${into}": ${moving.length} profiles gain "${into}", ${alreadyHad} already had it.`,
    )
    console.log(`  ${moving.map((m) => m.username).join(', ') || '(none)'}`)

    if (APPLY) {
      await pg.tx(async (t) => {
        // ON CONFLICT covers the people who ticked both — the unique constraint is (profile_id, option_id).
        await t.none(
          `insert into profile_interests (profile_id, option_id)
           select pi.profile_id, $(intoId)
           from profile_interests pi
           where pi.option_id = $(fromId)
           on conflict (profile_id, option_id) do nothing`,
          {fromId, intoId},
        )
        await t.none(`delete from interests where id = $(fromId)`, {fromId})
      })
      console.log(`  done — "${from}" deleted.`)
    }
  }

  for (const name of DELETE_OUTRIGHT) {
    const id = await idOf(name)
    if (!id) {
      console.log(`\n"${name}" does not exist — nothing to do.`)
      continue
    }

    // The ones this actually costs something: they said veganism and never set the diet, so after this
    // runs there is nothing on their profile a search for "vegan" can find unless they wrote it in prose.
    const orphaned = await pg.manyOrNone<{username: string; in_prose: boolean}>(
      `select u.username,
              coalesce(p.search_text, '') ilike '%vegan%' as in_prose
       from profile_interests pi
                join profiles p on p.id = pi.profile_id
                join users u on u.id = p.user_id
       where pi.option_id = $(id)
         and not ('vegan' = any (p.diet))
       order by u.username`,
      {id},
    )

    console.log(`\n"${name}": deleting, ${(await holders(name)).length} profiles hold it.`)
    console.log(
      `  ${orphaned.length} of them have no vegan diet set, so this is all they had:` +
        `\n  ${orphaned.map((o) => `${o.username}${o.in_prose ? ' (says it in their profile text)' : ' (NOTHING LEFT)'}`).join(', ') || '(none)'}`,
    )

    if (APPLY) {
      await pg.none(`delete from interests where id = $(id)`, {id})
      console.log(`  done — "${name}" deleted.`)
    }
  }

  console.log(
    '\nNote: interests are user-creatable (`interests.creator_id`), so nothing stops someone typing' +
      ' "Gaming" back into existence. A lasting fix needs canonical names or synonyms, not another merge.',
  )
})
