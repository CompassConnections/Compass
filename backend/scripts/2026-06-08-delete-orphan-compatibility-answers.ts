import chalk from 'chalk'
import {runScript} from './run-script'

// Deletes "orphaned" compatibility answers — rows whose `question_id` points at
// a compatibility_prompts row that no longer exists. These accumulated because
// neither answer table had a foreign key on question_id, so deleting a prompt
// left its answers behind. Covers both answer tables:
//   - compatibility_answers       (multiple-choice answers)
//   - compatibility_answers_free  (free-response answers)
//
// The companion migration
//   supabase/migrations/20250101005800_add_compatibility_answers_question_fk.sql
// adds `question_id -> compatibility_prompts(id) ON DELETE CASCADE` so this
// can't recur. That migration also clears orphans inline (a FK can't be added
// while violating rows exist), so this script is mainly for a quick ad-hoc
// cleanup / dry-run audit before the migration is applied.
//
// Dry-run by default: set DELETE=1 in the environment to actually delete.
// Safe to re-run; idempotent.

const TABLES = ['compatibility_answers', 'compatibility_answers_free'] as const

runScript(async ({pg}) => {
  const dryRun = process.env.DELETE !== '1'

  console.log(
    chalk.cyan(
      `Finding orphaned compatibility answers (question_id with no matching prompt)… ${
        dryRun ? chalk.yellow('(DRY RUN — set DELETE=1 to delete)') : chalk.red('(DELETING)')
      }`,
    ),
  )

  let grandTotal = 0
  for (const table of TABLES) {
    const orphanCount = await pg.one(
      `SELECT count(*)::int AS n
         FROM ${table} a
        WHERE NOT EXISTS (
                SELECT 1 FROM compatibility_prompts p WHERE p.id = a.question_id
              )`,
      [],
      (r: {n: number}) => r.n,
    )

    console.log(chalk.blue(`  ${table}: ${orphanCount} orphaned answer(s).`))
    grandTotal += orphanCount

    if (orphanCount === 0 || dryRun) continue

    const deleted = await pg.result(
      `DELETE FROM ${table} a
        WHERE NOT EXISTS (
                SELECT 1 FROM compatibility_prompts p WHERE p.id = a.question_id
              )`,
      [],
      (r) => r.rowCount,
    )
    console.log(chalk.green(`  [DELETED] ${deleted} row(s) from ${table}`))
  }

  if (dryRun) {
    console.log(
      chalk.yellow(`\nDry run complete — ${grandTotal} orphaned row(s) found, none deleted.`),
    )
  } else {
    console.log(chalk.cyan('\n── Deletion complete ───────────────────────────────'))
    console.log(chalk.green(`  Orphans removed : ${grandTotal}`))
    console.log(chalk.cyan('────────────────────────────────────────────────────'))
  }
  process.exit(0)
})
