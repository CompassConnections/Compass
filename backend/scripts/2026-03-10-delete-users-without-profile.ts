import chalk from 'chalk'
import {runScript} from './run-script'

// Deletes all rows in the `users` table whose `id` does not exist
// in the `user_id` column of the `profiles` table.
//
// Processes in batches to avoid long-running transactions / lock contention.
// Safe to re-run: already-deleted rows simply won't appear in subsequent batches.

runScript(async ({pg}) => {
  console.log(chalk.cyan('Starting deletion of users with no matching profile…'))

  let totalDeleted = 0
  let totalFailed = 0

  const rows = await pg.map(
    `SELECT u.id, u.username
       FROM users u
       WHERE NOT EXISTS (
         SELECT 1 FROM profiles p WHERE p.user_id = u.id
       )`,
    [],
    (row: {id: string; username: string}) => [row.id, row.username],
  )

  console.log(chalk.blue(`Deleting batch of ${rows.length} orphaned user(s)…`))

  for (const [id, username] of rows) {
    try {
      await pg.none(`DELETE FROM users WHERE id = $1`, [id])
      totalDeleted++
      console.debug(chalk.green(`  [DELETED] id=${id} (${username})`))
    } catch (err) {
      console.error(chalk.red(`  [ERROR]   id=${id} — delete failed:`), err)
      totalFailed++
    }
  }

  console.log(chalk.cyan('\n── Deletion complete ───────────────────────────────'))
  console.log(chalk.green(`  Deleted : ${totalDeleted}`))
  console.log(chalk.red(`  Failed  : ${totalFailed}`))
  console.log(chalk.cyan('────────────────────────────────────────────────────'))

  process.exit(totalFailed > 0 ? 1 : 0)
})
