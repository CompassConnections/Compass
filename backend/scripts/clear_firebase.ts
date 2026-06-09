import chalk from 'chalk'
import * as admin from 'firebase-admin'
import {initAdmin} from 'shared/init-admin'
import {isProd} from 'common/envs/is-prod'

// Deletes ALL Firebase Auth users. DEV ONLY.
//
// Used by ./scripts/dev_db_clear_firebase.sh as part of the dev DB reset flow.
// This is destructive and irreversible, so it hard-refuses to run against prod:
//   - bails if ENVIRONMENT is not 'dev'
//   - bails if isProd() is true
//   - bails if the initialized Firebase project is the prod project
//
// Firebase project ids (see common/envs/is-prod.ts + init-admin.ts):
const DEV_FIREBASE_PROJECT_ID = 'compass-57c3c'

async function main() {
  // 1. Refuse anything that isn't an explicit dev run.
  const env = process.env.ENVIRONMENT?.toUpperCase()
  if (env !== 'DEV') {
    throw new Error(
      `Refusing to clear Firebase users: ENVIRONMENT is "${process.env.ENVIRONMENT ?? '(unset)'}", expected "dev". ` +
        `This script is DEV ONLY.`,
    )
  }

  initAdmin()

  // 2. Belt-and-suspenders: refuse if the resolved config looks like prod.
  if (isProd()) {
    throw new Error(
      'Refusing to clear Firebase users: isProd() returned true. This script is DEV ONLY.',
    )
  }

  const projectId = admin.app().options.projectId
  console.log({projectId})
  if (projectId !== DEV_FIREBASE_PROJECT_ID) {
    throw new Error(
      `Refusing to clear Firebase users: initialized Firebase project is the PROD project ` +
        `("${projectId}"). This script is DEV ONLY.`,
    )
  }

  const auth = admin.app().auth()
  console.log(
    chalk.cyan(`Clearing all Firebase Auth users on project "${projectId ?? '(unknown)'}"…`),
  )

  let totalDeleted = 0
  let totalFailed = 0

  // listUsers returns up to 1000 per page; deleteUsers accepts up to 1000 uids.
  // Re-list from the start after each delete batch instead of paging, since
  // deletions shift the page tokens.
  for (;;) {
    const {users} = await auth.listUsers(1000)
    if (users.length === 0) break

    const uids = users.map((u) => u.uid)
    const result = await auth.deleteUsers(uids)

    totalDeleted += result.successCount
    totalFailed += result.failureCount

    for (const err of result.errors) {
      console.error(chalk.red(`  [ERROR] uid=${uids[err.index]} — ${err.error.message}`))
    }

    console.log(
      chalk.blue(
        `  Deleted ${result.successCount}/${uids.length} in this batch (running total: ${totalDeleted})`,
      ),
    )

    // If a whole batch fails, stop to avoid an infinite loop.
    if (result.successCount === 0) break
  }

  console.log(chalk.cyan('\n── Firebase clear complete ─────────────────────────'))
  console.log(chalk.green(`  Deleted : ${totalDeleted}`))
  console.log(chalk.red(`  Failed  : ${totalFailed}`))
  console.log(chalk.cyan('────────────────────────────────────────────────────'))

  process.exit(totalFailed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(chalk.red(err instanceof Error ? err.message : err))
  process.exit(1)
})
