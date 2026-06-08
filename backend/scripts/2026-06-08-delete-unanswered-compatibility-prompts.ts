import chalk from 'chalk'
import {runScript} from './run-script'

// Deletes every row in `compatibility_prompts` answered by fewer than N
// distinct people.
//
// "Answered by a person" means that person's user id appears as a creator_id in
// either answer table for the prompt:
//   - compatibility_answers       (multiple-choice answers)
//   - compatibility_answers_free  (free-response answers)
// We count DISTINCT creator_id across both tables (a single person who answered
// in both still counts once), then delete prompts whose count is < N. N defaults
// to 1 (so the default deletes only prompts nobody answered); set THRESHOLD=k to
// delete every prompt with fewer than k distinct answerers.
//
// Deleting a prompt cascades to compatibility_prompts_translations
// (fk_question ON DELETE CASCADE), so its translations are removed too. This
// reclaims DB storage and cuts egress from clients fetching dead prompts.
//
// Dry-run by default: set DELETE=1 in the environment to actually delete.
// Safe to re-run; processed in batches to avoid long-running transactions.

// See compatibility_prompts_rows.sql and compatibility_answers_rows.csv (private) for backup
// with all the 2800 prompts and answers in case we need to restore some of them.

const BATCH_SIZE = 500

runScript(async ({pg}) => {
  const dryRun = process.env.DELETE !== '1'

  const threshold = 2

  console.log(
    chalk.cyan(
      `Finding compatibility prompts answered by fewer than ${threshold} people… ${
        dryRun ? chalk.yellow('(DRY RUN — set DELETE=1 to delete)') : chalk.red('(DELETING)')
      }`,
    ),
  )

  const ids = await pg.map(
    `SELECT p.id, p.question, coalesce(ac.answerers, 0)::int AS answerers
       FROM compatibility_prompts p
       LEFT JOIN (
              SELECT question_id, count(DISTINCT creator_id) AS answerers
                FROM (
                       -- multiple_choice = -1 means the person skipped the prompt; don't count it
                       SELECT question_id, creator_id FROM compatibility_answers
                        WHERE multiple_choice IS DISTINCT FROM -1
                       UNION
                       SELECT question_id, creator_id FROM compatibility_answers_free
                        WHERE multiple_choice IS DISTINCT FROM -1
                     ) u
               GROUP BY question_id
            ) ac ON ac.question_id = p.id
      WHERE coalesce(ac.answerers, 0) <= $1
      ORDER BY p.id`,
    [threshold],
    (row: {id: string; question: string; answerers: number}) => row,
  )

  console.log(
    chalk.blue(`Found ${ids.length} prompt(s) answered by fewer than ${threshold} people.`),
  )
  if (ids.length < 2000) {
    for (const {id, question, answerers} of ids) {
      console.log(chalk.gray(`  id=${id} (${answerers} answerer(s)) — ${question}`))
    }
  }

  if (ids.length === 0) {
    console.log(chalk.green('Nothing to delete.'))
    process.exit(0)
  }

  if (dryRun) {
    console.log(chalk.yellow('\nDry run complete — no rows deleted.'))
    process.exit(0)
  }

  let totalDeleted = 0
  const allIds = ids.map((r) => r.id)
  for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
    const batch = allIds.slice(i, i + BATCH_SIZE)
    const deleted = await pg.result(
      `DELETE FROM compatibility_prompts WHERE id = ANY($1::bigint[])`,
      [batch],
      (r) => r.rowCount,
    )
    totalDeleted += deleted
    console.log(chalk.green(`  [DELETED] batch of ${deleted} prompt(s)`))
  }

  console.log(chalk.cyan('\n── Deletion complete ───────────────────────────────'))
  console.log(chalk.green(`  Deleted : ${totalDeleted}`))
  console.log(chalk.cyan('────────────────────────────────────────────────────'))
  process.exit(0)
})
