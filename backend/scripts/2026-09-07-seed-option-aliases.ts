// Seed the `*_aliases` tables by finding options that already mean the same thing.
//
// Run with:
//   cd backend/scripts && ENVIRONMENT=PROD npx tsx 2026-09-07-seed-option-aliases.ts             # dry run
//   cd backend/scripts && ENVIRONMENT=PROD TABLES=interests npx tsx 2026-09-07-seed-option-aliases.ts
//   cd backend/scripts && ENVIRONMENT=PROD SUGGEST=1 npx tsx 2026-09-07-seed-option-aliases.ts   # + invented aliases
//   cd backend/scripts && ENVIRONMENT=PROD APPLY=1 npx tsx 2026-09-07-seed-option-aliases.ts     # for real
//
// Three passes, in descending order of how certain they are:
//   1. MANUAL_ALIASES — names known to be duplicates, including ones an earlier merge already
//      deleted. This is the only pass that can recover a name that no longer exists as a row.
//   2. the merge pass — options that exist right now and mean the same thing, folded together.
//   3. SUGGEST=1 — names nobody has typed yet that the model expects them to. Off by default.
//
// `20260907_canonical_options.sql` gave the option tables a real identity and somewhere to record the
// names that lost a merge, but it can only fold collisions it can see *mechanically* — casing,
// whitespace, trailing punctuation. It cannot see that "AI" and "Artificial intelligence" are one
// option, or that "Gaming", "PC Gaming" and "Video games" are one option, because those pairs share
// no string structure at all. That is what this script is for: a one-time semantic pass over the real
// lists, so the alias tables start out holding the duplicates that already exist rather than filling
// up slowly as someone notices them.
//
// Why insert-then-delete rather than `update profile_x set option_id`: the rebuild triggers in
// `backend/supabase/profile_interests.sql` fire on INSERT and DELETE only. Repointing the rows in
// place would move everyone's tick and leave `search_text` still saying "Gaming" — the exact failure
// the 2026-08-07 merge script documents. (That script also ends by noting that nothing stopped
// someone typing "Gaming" back into existence. The alias row this one leaves behind is the fix: after
// the merge, typing "Gaming" resolves to "Video games" instead of recreating it.)
//
// The model proposes; it never decides alone:
//   - it can only group names taken from the list it was given, and anything it invents is dropped;
//   - the survivor of a group is always the most-used option, never the model's preference;
//   - a group larger than MAX_GROUP_SIZE is refused outright as a likely over-merge;
//   - nothing is written without APPLY=1, and the dry run prints every profile the merge would touch.
//
// It is worth reading the dry run properly. A wrong merge here is destructive in a way a wrong
// suggestion in the picker is not: it silently rewrites what people said about themselves.

import {OPTION_TABLES, OptionTableKey} from 'common/profiles/constants'
import {debug} from 'common/logger'
import {normalizeOptionName, optionNameProblem} from 'common/profiles/option-name'
import {callGemini} from 'shared/llm/gemini'
import {SupabaseDirectClient} from 'shared/supabase/init'
import {runScript} from './run-script'

const APPLY = process.env.APPLY === '1'

/** Restrict the run to some tables, e.g. `TABLES=interests,causes`. Defaults to all three. */
const TABLES = (process.env.TABLES?.split(',').map((t) => t.trim()) ?? OPTION_TABLES).filter(
  (t): t is OptionTableKey => OPTION_TABLES.includes(t as OptionTableKey),
)

/**
 * Options sent to the model at once.
 *
 * Small enough that the whole batch stays comfortably inside the context and the model can actually
 * attend to every name, large enough that genuine duplicates usually land in the same batch. Batches
 * are cut on the popularity ordering, so the well-used options — the ones a duplicate is most likely
 * to be a variant *of* — cluster together near the front.
 */
const BATCH_SIZE = 150

/**
 * A group this big is treated as a modelling failure rather than a discovery.
 *
 * Real duplicate sets are two or three names. When a model returns eight, it has almost always
 * drifted from "the same thing" to "the same topic" — collapsing an entire field into one option and
 * destroying the distinctions people actually chose.
 */
const MAX_GROUP_SIZE = 4

/**
 * Hand-written aliases, applied before the model runs and never subject to its judgement.
 *
 * These add an alias *without* merging anything: the alias name is not, and need not be, an option in
 * its own right. That is the only way to recover a name that is already gone — the model pass below
 * can only group rows that currently exist, so a duplicate that was deleted by an earlier merge is
 * invisible to it.
 *
 * The entries below are exactly that case. `2026-08-07-merge-duplicate-interests.ts` folded "Gaming"
 * and "PC Gaming" into "Video games" before the alias tables existed, so those names are unclaimed
 * today: typing "Gaming" creates a brand-new option and quietly undoes that merge. These rows close
 * it. Anything merged through `/admin/options` from now on records its own alias automatically.
 *
 * "Veganism", deleted outright by the same script, is deliberately absent: it was not merged into
 * anything, and the diet field carries that claim instead. An alias needs a target that means the
 * same thing, and inventing one would put a dietary position on someone's profile they never chose.
 */
const MANUAL_ALIASES: Record<OptionTableKey, [alias: string, optionName: string][]> = {
  interests: [
    // ['Gaming', 'Video games'],
    // ['PC Gaming', 'Video games'],
  ],
  causes: [],
  work: [],
}

/**
 * Pairs of names that must never end up as the same option, whatever the model thinks.
 *
 * The model's characteristic failure is not a wrong group but a *nearly* right one: asked for things
 * that mean the same, it reaches for things that merely sit together in the mind. "Reflection",
 * "Introspection" and "Contemplation" is the shape of it — the first two really are one option, and
 * the third is a different practice that happens to be adjacent to them.
 *
 * So a violation prunes rather than rejects. A group carrying a forbidden pair is split into the
 * largest conflict-free subgroups it contains, and each surviving subgroup of two or more is merged
 * on its own. That group becomes ["Reflection", "Introspection"] plus a lone "Contemplation" that is
 * dropped — which is the answer, rather than losing a real merge to protect against half of it.
 *
 * Pairs are unordered and matched case-insensitively through `normalizeOptionName`. Add to this
 * whenever a dry run proposes something you decline: the next run is what it exists to fix, since
 * nothing here is remembered between runs otherwise.
 */
const NEVER_MERGE: Record<OptionTableKey, [string, string][]> = {
  interests: [
    ['Reflection', 'Contemplation'],
    ['Introspection', 'Contemplation'],
    // Broader/narrower pairs, the category that does the most damage: whoever picked the narrow one
    // said something specific, and a merge silently rewrites it into the general one.
    ['Climbing', 'Bouldering'],
    ['Running', 'Marathons'],
    ['Cooking', 'Baking'],
    ['Programming', 'Python'],
    // "Music" is ambiguous on two axes at once — playing vs listening, and which music — so it is a
    // parent term rather than a synonym of anything below it. Aliasing it either way tells half its
    // holders they meant something they did not, and unlike a duplicate that misfiling is invisible.
    ['Music', 'Jazz'],
    ['Music', 'Playing music'],
    ['Music', 'Making music'],
    ['Music', 'Listening to music'],
    ['Music', 'Music production'],
    ['Writing', 'Poetry'],
  ],
  causes: [
    ['Animal welfare', 'Veganism'],
    ['Climate change', 'Conservation'],
  ],
  work: [
    ['Engineering', 'Software engineering'],
    ['Medicine', 'Nursing'],
    ['Research', 'Academia'],
  ],
}

/** Symmetric lookup of {@link NEVER_MERGE}, keyed by normalised lowercase name. */
function conflictIndex(table: OptionTableKey): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>()
  const add = (a: string, b: string) => {
    const key = normalizeOptionName(a).toLowerCase()
    const value = normalizeOptionName(b).toLowerCase()
    if (!index.has(key)) index.set(key, new Set())
    index.get(key)!.add(value)
  }
  for (const [a, b] of NEVER_MERGE[table]) {
    add(a, b)
    add(b, a)
  }
  return index
}

const conflicts = (index: Map<string, Set<string>>, a: string, b: string) =>
  !!index.get(normalizeOptionName(a).toLowerCase())?.has(normalizeOptionName(b).toLowerCase())

/**
 * Splits a proposed group into subgroups that contain no forbidden pair.
 *
 * Greedy in popularity order: each name joins the first subgroup it does not conflict with, and
 * starts its own when it conflicts with all of them. Deliberately not "keep the most-used and drop
 * whatever clashes with it" — that would throw away ["Reflection", "Introspection"] whenever
 * "Contemplation" happened to be the most-used of the three.
 */
function splitOnConflicts(index: Map<string, Set<string>>, group: Option[]): Option[][] {
  const subgroups: Option[][] = []
  for (const option of [...group].sort((a, b) => b.uses - a.uses || Number(a.id) - Number(b.id))) {
    const home = subgroups.find((sub) => sub.every((o) => !conflicts(index, o.name, option.name)))
    if (home) home.push(option)
    else subgroups.push([option])
  }
  return subgroups
}

/**
 * Whether to ask the model to *invent* aliases for names nobody has created yet (`SUGGEST=1`).
 *
 * Off by default, and worth understanding before turning on. Everything else in this script reacts to
 * duplicates that demonstrably exist; this predicts ones that do not, which is a different and weaker
 * kind of claim. A wrong alias here is quiet and durable: it permanently redirects a name to an
 * option that is not what the typist meant, and nobody will notice, because the picker will simply
 * look like it worked.
 *
 * The prompt is therefore restricted to abbreviations, expansions and spelling variants — "ML" for
 * "Machine learning" — and explicitly refuses broader/narrower pairs, which are the ones that do the
 * damage ("Climbing" is not "Rock climbing"; a beginner typing the first should be offered a choice,
 * not silently given the second).
 *
 * Read the dry run. This is the one part of the script whose output is a guess.
 */
const SUGGEST = process.env.SUGGEST === '1'

/** Invented aliases accepted per option. Past a couple, the model is padding rather than recalling. */
const MAX_SUGGESTED_PER_OPTION = 2

type Option = {id: string; name: string; uses: number}

runScript(async ({pg}) => {
  console.log(APPLY ? '=== APPLYING ===' : '=== DRY RUN (set APPLY=1 to write) ===')
  console.log(`Tables: ${TABLES.join(', ')}\n`)

  for (const table of TABLES) {
    console.log(`\n${'='.repeat(90)}\n${table.toUpperCase()}\n${'='.repeat(90)}`)

    const options = await pg.manyOrNone<Option>(
      `select o.id::text, o.name, o.usage_count as uses
       from ${table} o
       order by o.usage_count desc, o.name`,
    )
    console.log(`${options.length} options.\n`)
    if (!options.length) continue

    await applyManualAliases(pg, table, options)

    const groups = await proposeGroups(table, options)
    if (!groups.length) {
      console.log('No duplicate groups proposed.')
      continue
    }

    for (const group of groups) {
      // Most-used wins, ties broken by lowest id — the option that has been there longest. The
      // model's ordering is deliberately ignored: which spelling is canonical is a fact about what
      // members already picked, not a judgement call.
      const sorted = [...group].sort((a, b) => b.uses - a.uses || Number(a.id) - Number(b.id))
      const [winner, ...losers] = sorted

      console.log(
        `\n"${losers.map((l) => l.name).join('", "')}" -> "${winner.name}" (${winner.uses} uses)`,
      )

      for (const loser of losers) {
        const moving = await pg.manyOrNone<{username: string}>(
          `select u.username
           from profile_${table} po
                    join profiles p on p.id = po.profile_id
                    join users u on u.id = p.user_id
           where po.option_id = $(loserId)
             and not exists (select 1
                             from profile_${table} other
                             where other.profile_id = po.profile_id
                               and other.option_id = $(winnerId))
           order by u.username`,
          {loserId: loser.id, winnerId: winner.id},
        )
        const alreadyHad = loser.uses - moving.length

        console.log(
          `  "${loser.name}" (${loser.uses} uses): ${moving.length} profiles gain "${winner.name}", ` +
            `${alreadyHad} already had it.`,
        )
        console.log(`    ${moving.map((m) => m.username).join(', ') || '(none)'}`)

        if (!APPLY) continue

        await pg.tx(async (t) => {
          // ON CONFLICT covers the people who ticked both — unique is (profile_id, option_id).
          await t.none(
            `insert into profile_${table} (profile_id, option_id)
             select po.profile_id, $(winnerId)
             from profile_${table} po
             where po.option_id = $(loserId)
             on conflict (profile_id, option_id) do nothing`,
            {loserId: loser.id, winnerId: winner.id},
          )
          // Recorded before the delete, so the dead name keeps resolving to the survivor. Any aliases
          // the loser had already collected are carried over rather than cascaded away with it.
          await t.none(
            // Explicit casts because pg-promise renders both ids as quoted literals, and a UNION of
            // two untyped literal columns has no type for Postgres to match against option_id.
            `insert into ${table}_aliases (option_id, alias)
             select $(winnerId)::bigint, a.alias
             from ${table}_aliases a
             where a.option_id = $(loserId)::bigint
             union
             select $(winnerId)::bigint, $(loserName)::text
             on conflict do nothing`,
            {winnerId: winner.id, loserId: loser.id, loserName: loser.name},
          )
          await t.none(`delete from ${table} where id = $(loserId)::bigint`, {loserId: loser.id})
        })
        console.log(`    done — "${loser.name}" merged and aliased.`)
      }
    }

    // Runs last, so it sees the post-merge world: an option that was about to be folded away never
    // gets aliases invented for it.
    if (SUGGEST) await suggestAliases(pg, table, options, groups)
  }

  if (!APPLY) {
    console.log('\nNothing was written. Re-run with APPLY=1 once the output above looks right.')
  }
})

/**
 * Inserts {@link MANUAL_ALIASES}, skipping any whose target option does not exist.
 *
 * A missing target is reported rather than created: an alias pointing at an option nobody has is not
 * useful, and silently creating the option would be this script inventing taxonomy.
 */
async function applyManualAliases(
  pg: SupabaseDirectClient,
  table: OptionTableKey,
  options: Option[],
) {
  const entries = MANUAL_ALIASES[table]
  if (!entries.length) return

  const byName = new Map(options.map((o) => [o.name.toLowerCase(), o]))
  console.log(`Manual aliases (${entries.length}):`)

  for (const [alias, optionName] of entries) {
    const target = byName.get(normalizeOptionName(optionName).toLowerCase())
    if (!target) {
      console.log(`  SKIP "${alias}" -> "${optionName}" — no such option`)
      continue
    }
    if (byName.has(normalizeOptionName(alias).toLowerCase())) {
      // It exists as an option of its own, so it is a merge, not an alias. Leave it to the model
      // pass (or to an explicit entry in a merge script) rather than aliasing a live option's name,
      // which would leave two rows claiming the same identity.
      console.log(`  SKIP "${alias}" -> "${optionName}" — "${alias}" is itself an option; merge it`)
      continue
    }
    console.log(`  "${alias}" -> "${target.name}"`)
    if (!APPLY) continue
    await pg.none(
      `insert into ${table}_aliases (option_id, alias)
       values ($(optionId), $(alias))
       on conflict do nothing`,
      {optionId: target.id, alias: normalizeOptionName(alias)},
    )
  }
  console.log('')
}

/** Groups of options the model considers the same thing, validated back against the real list. */
async function proposeGroups(table: OptionTableKey, options: Option[]): Promise<Option[][]> {
  const byName = new Map(options.map((o) => [o.name.toLowerCase(), o]))
  const claimed = new Set<string>()
  const groups: Option[][] = []
  const conflictsForTable = conflictIndex(table)

  for (let i = 0; i < options.length; i += BATCH_SIZE) {
    const batch = options.slice(i, i + BATCH_SIZE)
    console.log(
      `Asking the model about options ${i + 1}–${i + batch.length} of ${options.length}...`,
    )

    const output = await callGemini(buildPrompt(table, batch), {maxContextLength: 30000})
    if (!output) {
      console.log('  no answer from the model — skipping this batch')
      continue
    }

    let parsed: {groups?: unknown}
    try {
      parsed = JSON.parse(output)
    } catch (err) {
      console.log(`  unparseable answer, skipping this batch: ${String(err)}`)
      continue
    }
    if (!Array.isArray(parsed.groups)) continue
    debug('model groups', parsed.groups)

    for (const raw of parsed.groups) {
      if (!Array.isArray(raw)) continue

      // Names are mapped back through the real list, so anything the model invented or reworded
      // simply fails the lookup and disappears.
      const resolved = raw
        .filter((n): n is string => typeof n === 'string')
        .map((n) => byName.get(n.trim().toLowerCase()))
        .filter((o): o is Option => !!o)

      const unique = resolved.filter(
        (o, idx) => resolved.findIndex((x) => x.id === o.id) === idx && !claimed.has(o.id),
      )
      if (unique.length < 2) continue
      if (unique.length > MAX_GROUP_SIZE) {
        console.log(
          `  REFUSED (${unique.length} names, over MAX_GROUP_SIZE): ${unique.map((o) => o.name).join(', ')}`,
        )
        continue
      }

      const subgroups = splitOnConflicts(conflictsForTable, unique)
      if (subgroups.length > 1) {
        console.log(
          `  SPLIT on NEVER_MERGE: ${subgroups.map((sub) => `[${sub.map((o) => o.name).join(', ')}]`).join(' / ')}`,
        )
      }

      for (const subgroup of subgroups) {
        // A subgroup of one is what is left of a name that conflicted with everything else in the
        // proposal. Nothing to merge it with, so it is simply not merged.
        if (subgroup.length < 2) continue
        // An option cannot be in two groups: the second merge would target a row the first deleted.
        for (const o of subgroup) claimed.add(o.id)
        groups.push(subgroup)
      }
    }
  }

  return groups
}

/**
 * Asks the model for names people are likely to type that mean an existing option but are not options
 * themselves, and records them as aliases.
 *
 * This is the only part of the script that acts on a prediction rather than on evidence, so the
 * filtering afterwards is deliberately harsher than the prompt:
 *   - a suggestion that is already an option is dropped, not aliased — that is a merge, and aliasing
 *     a live option's name would leave two rows claiming one identity;
 *   - a suggestion that is already an alias of anything is dropped, so nothing is ever reassigned;
 *   - a suggestion that would not be allowed as an option name at all is dropped;
 *   - options merged away in this same run are skipped, since they are about to stop existing.
 */
async function suggestAliases(
  pg: SupabaseDirectClient,
  table: OptionTableKey,
  options: Option[],
  merged: Option[][],
) {
  console.log(`\n--- Suggested aliases (SUGGEST=1) ---`)

  const optionNames = new Set(options.map((o) => o.name.toLowerCase()))
  const existingAliases = new Set(
    (await pg.manyOrNone<{alias: string}>(`select alias from ${table}_aliases`)).map((r) =>
      r.alias.toLowerCase(),
    ),
  )
  // Everything except each group's survivor is on its way out.
  const doomed = new Set(
    merged.flatMap((group) =>
      [...group]
        .sort((a, b) => b.uses - a.uses || Number(a.id) - Number(b.id))
        .slice(1)
        .map((o) => o.id),
    ),
  )
  const live = options.filter((o) => !doomed.has(o.id))

  let accepted = 0
  const acceptedPerOption = new Map<string, number>()
  const conflictsForTable = conflictIndex(table)
  for (let i = 0; i < live.length; i += BATCH_SIZE) {
    const batch = live.slice(i, i + BATCH_SIZE)
    console.log(`Asking for aliases of options ${i + 1}–${i + batch.length} of ${live.length}...`)

    const output = await callGemini(buildAliasPrompt(table, batch), {maxContextLength: 30000})
    if (!output) {
      console.log('  no answer from the model — skipping this batch')
      continue
    }

    let parsed: {aliases?: unknown}
    try {
      parsed = JSON.parse(output)
    } catch (err) {
      console.log(`  unparseable answer, skipping this batch: ${String(err)}`)
      continue
    }
    if (!Array.isArray(parsed.aliases)) continue
    debug('model aliases', parsed.aliases)

    const byName = new Map(batch.map((o) => [o.name.toLowerCase(), o]))

    for (const entry of parsed.aliases) {
      if (!entry || typeof entry !== 'object') continue
      const {option, alias} = entry as {option?: unknown; alias?: unknown}
      if (typeof option !== 'string' || typeof alias !== 'string') continue

      // Mapped back through the batch, so an option the model invented is dropped.
      const target = byName.get(option.trim().toLowerCase())
      if (!target) continue

      const canonical = normalizeOptionName(alias)
      const key = canonical.toLowerCase()
      const problem = optionNameProblem(canonical)

      if (problem) {
        console.log(`  SKIP "${canonical}" -> "${target.name}" — unusable name (${problem})`)
        continue
      }
      if (key === target.name.toLowerCase()) continue
      if (optionNames.has(key)) {
        console.log(
          `  SKIP "${canonical}" -> "${target.name}" — already an option; merge it instead`,
        )
        continue
      }
      if (existingAliases.has(key)) {
        console.log(`  SKIP "${canonical}" -> "${target.name}" — already an alias`)
        continue
      }
      // An alias is a merge by another name — typing it lands the reader on the target — so the same
      // pairs are refused here.
      if (conflicts(conflictsForTable, canonical, target.name)) {
        console.log(`  SKIP "${canonical}" -> "${target.name}" — NEVER_MERGE`)
        continue
      }

      // Enforced here as well as asked for in the prompt: a cap the model is merely told about is
      // not a cap.
      const already = acceptedPerOption.get(target.id) ?? 0
      if (already >= MAX_SUGGESTED_PER_OPTION) {
        console.log(
          `  SKIP "${canonical}" -> "${target.name}" — already at ${MAX_SUGGESTED_PER_OPTION}`,
        )
        continue
      }

      console.log(`  "${canonical}" -> "${target.name}" (${target.uses} uses)`)
      acceptedPerOption.set(target.id, already + 1)
      existingAliases.add(key)
      accepted++

      if (!APPLY) continue
      await pg.none(
        `insert into ${table}_aliases (option_id, alias)
         values ($(optionId)::bigint, $(alias))
         on conflict do nothing`,
        {optionId: target.id, alias: canonical},
      )
    }
  }

  console.log(`${accepted} alias(es) ${APPLY ? 'written' : 'proposed'}.`)
}

function buildAliasPrompt(table: OptionTableKey, batch: Option[]) {
  const noun = table === 'work' ? 'work areas' : table
  return `Below are the ${noun} members of a social directory can put on their profile. Members can also type their own, and when they type a name that is not on the list, a new entry gets created — which is how the list fills up with the same thing written several ways.

TASK: for each entry, give the OTHER names a member might realistically type that mean exactly that entry.

RULES:
- Only abbreviations, expansions, and spelling or wording variants of the SAME thing. "ML" for "Machine learning". "Artificial intelligence" for "AI". "Football (soccer)" for "Soccer".
- A broader or narrower term is NOT a variant, and is the worst thing you can return here. "Climbing" is not "Rock climbing". "Running" is not "Marathons". "Programming" is not "Python".
- A related activity is not a variant either. Do not return "Baking" for "Cooking".
- Do not return a name that is already an entry in the list below.
- At most ${MAX_SUGGESTED_PER_OPTION} per entry, and most entries should get none at all. An empty answer is a good answer.
- Return JSON only, in the form {"aliases": [{"option": "Entry exactly as written", "alias": "The other name"}, ...]}.

ENTRIES:
${batch.map((o) => `- ${o.name}`).join('\n')}`
}

function buildPrompt(table: OptionTableKey, batch: Option[]) {
  const noun = table === 'work' ? 'work areas' : table
  return `Below are the ${noun} that members of a social directory can put on their profile. Members can add their own, so the list has accumulated duplicates: the same thing written more than one way.

TASK: find the groups of entries that mean the SAME THING, and return them.

RULES:
- Same thing means a member searching for one would expect to find people who picked the other. "AI" and "Artificial intelligence" are the same thing. "Gaming" and "Video games" are the same thing. "Computer programming" and "Programming" are the same thing.
- Being related, adjacent, or in the same field is NOT the same thing. "Climbing" and "Bouldering" are different (one is narrower). "Running" and "Marathons" are different. "Cooking" and "Baking" are different. When in doubt, leave it out.
- A broader term and a narrower term are NOT the same thing, even when most people who pick one would pick the other.
- Never group more than ${MAX_GROUP_SIZE} entries together. A large group is a sign you have drifted to "same topic" rather than "same thing".
- Copy the entries EXACTLY as written below. Do not reword, re-case or invent entries.
- Most entries belong in no group at all. Returning few groups, or none, is a good answer.
- Return JSON only, in the form {"groups": [["Entry one", "Entry two"], ...]}.

ENTRIES:
${batch.map((o) => `- ${o.name}`).join('\n')}`
}
