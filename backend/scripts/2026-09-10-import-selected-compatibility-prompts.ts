import chalk from 'chalk'
import {debug} from 'common/logger'
import {COMPATIBILITY_CATEGORIES} from 'common/profiles/compatibility-categories'
import {readFileSync} from 'fs'
import {join} from 'path'
import {insert, update} from 'shared/supabase/utils'

import {runScript} from './run-script'
import {PROD_CONFIG} from 'common/envs/prod'

// Imports the curated prompt set from martin/compatibility_prompts/selected_prompts.json — the 277
// questions marked `x` or `c` in candidates.csv, with the escalation ordering already applied.
//
// `importance_score` is the serving order, not a weight: get-compatibility-questions orders by it
// DESC, so 67 is the first question a new member sees and 1 is the most exposing. Non-core prompts
// sit at 0 and are served after the whole core ramp. A low number here means "ask this later", never
// "this matters less".
//
// Idempotent. A prompt is matched by its live id where the sheet has one, and otherwise by exact
// question text, so a second run updates what the first run inserted instead of duplicating it.
// Nothing is ever deleted here: prompts that should go are removed from /admin/compatibility-questions,
// which is deliberate about leaving the cached pair scores stale until you rebuild them.
//
// Dry run by default. Pass --write to actually mutate.
//
//   bun run 2026-09-10-import-selected-compatibility-prompts.ts
//   bun run 2026-09-10-import-selected-compatibility-prompts.ts --write

type SelectedPrompt = {
  row: number
  liveId: number | null
  question: string
  options: string[]
  category: string | null
  importanceScore: number
  isCore: boolean
  tier: number | null
}

const SOURCE = join(
  __dirname,
  '..',
  '..',
  'martin',
  'compatibility_prompts',
  'selected_prompts.json',
)

const ANSWER_TYPE = 'compatibility_multiple_choice'

/** Stored as {label: index}; the index is what answers reference, so option order is load-bearing. */
const toMultipleChoiceOptions = (options: string[]) =>
  Object.fromEntries(options.map((label, i) => [label, i]))

const validate = (prompts: SelectedPrompt[]) => {
  const problems: string[] = []
  const seen = new Map<string, number>()

  for (const p of prompts) {
    const where = `row ${p.row}`
    if (!p.question.trim()) problems.push(`${where}: empty question`)
    if (p.options.length < 2) problems.push(`${where}: needs at least 2 options`)
    if (new Set(p.options).size !== p.options.length) {
      problems.push(`${where}: duplicate option labels — they would collapse into one key`)
    }
    if (p.category && !(p.category in COMPATIBILITY_CATEGORIES)) {
      problems.push(`${where}: category "${p.category}" is not in COMPATIBILITY_CATEGORIES`)
    }
    if (!Number.isInteger(p.importanceScore) || p.importanceScore < 0) {
      problems.push(`${where}: importance_score must be a non-negative integer`)
    }
    if (p.isCore !== p.importanceScore > 0) {
      problems.push(`${where}: core flag and importance_score disagree`)
    }
    const key = p.question.trim().toLowerCase()
    const first = seen.get(key)
    if (first !== undefined) problems.push(`${where}: same question text as row ${first}`)
    else seen.set(key, p.row)
  }

  // Two prompts sharing an importance_score would be served in an arbitrary order relative to each
  // other, which quietly breaks the ramp the sheet exists to encode.
  const scores = prompts.filter((p) => p.isCore).map((p) => p.importanceScore)
  if (new Set(scores).size !== scores.length) {
    problems.push('core prompts do not have distinct importance_score values')
  }
  return problems
}

runScript(async ({pg}) => {
  const write = process.argv.includes('--write')
  const prompts: SelectedPrompt[] = JSON.parse(readFileSync(SOURCE, 'utf8'))
  debug(`Loaded ${prompts.length} prompts from ${SOURCE}`)

  const problems = validate(prompts)
  if (problems.length) {
    console.error(chalk.red(`\n${problems.length} problem(s) in the source file:`))
    for (const p of problems) console.error(chalk.red(`  ${p}`))
    process.exit(1)
  }

  // One lookup by question text so a re-run finds what a previous run inserted, and so a prompt the
  // sheet has no live id for is still recognised if it already exists.
  const existing = await pg.manyOrNone<{id: number; question: string}>(
    `select id, question from compatibility_prompts where answer_type = $1`,
    [ANSWER_TYPE],
  )
  const byQuestion = new Map(existing.map((r) => [r.question.trim().toLowerCase(), r.id]))
  const liveIds = new Set(existing.map((r) => r.id))

  let updated = 0
  let inserted = 0
  let missing = 0

  await pg
    .tx(async (tx) => {
      for (const p of prompts) {
        // The sheet's live id wins, but only if that row still exists — prompts were deleted from the
        // admin page after the sheet was built, and a stale id must become an insert, not a silent skip.
        let id = p.liveId && liveIds.has(p.liveId) ? p.liveId : undefined
        if (p.liveId && !id) {
          missing++
          debug(`row ${p.row}: live id ${p.liveId} no longer exists, will insert instead`)
        }
        if (!id) id = byQuestion.get(p.question.trim().toLowerCase())

        const values = {
          question: p.question,
          multiple_choice_options: toMultipleChoiceOptions(p.options),
          category: p.category,
          importance_score: p.importanceScore,
          answer_type: ANSWER_TYPE,
        }

        if (id) {
          if (write) await update(tx, 'compatibility_prompts', 'id', {id, ...values})
          updated++
        } else {
          if (write)
            await insert(tx, 'compatibility_prompts', {
              creator_id: PROD_CONFIG.adminIds[0],
              ...values,
            })
          inserted++
        }
      }

      if (!write) {
        // Nothing was written, but the transaction proved the connection and the row lookup.
        debug('Dry run — rolling back')
        throw new DryRun()
      }
    })
    .catch((e: unknown) => {
      if (!(e instanceof DryRun)) throw e
    })

  console.log(chalk.cyan('\n── Import summary ──────────────────────────────────'))
  console.log(`  ${chalk.green(String(inserted))} to insert`)
  console.log(`  ${chalk.blue(String(updated))} to update in place`)
  if (missing) console.log(`  ${chalk.yellow(String(missing))} had a live id that no longer exists`)
  console.log(`  ${prompts.length} total, ${prompts.filter((p) => p.isCore).length} core`)
  console.log(chalk.cyan('────────────────────────────────────────────────────'))
  if (!write) {
    console.log(chalk.yellow('\nDry run. Nothing was written. Re-run with --write to apply.'))
  } else {
    console.log(
      chalk.yellow('\nCached pair scores are now stale — press "Rebuild all pair scores" on'),
      chalk.yellow('/admin/compatibility-questions once you are done changing prompts.'),
    )
  }
})

/** Sentinel that rolls the transaction back on a dry run without looking like a failure. */
class DryRun extends Error {}
