// Invite every member to opt in to home-page spotlights.
//
// Run with:
//   cd backend/scripts && ENVIRONMENT=PROD npx tsx 2026-08-12-invite-members-to-spotlight.ts        # dry run
//   cd backend/scripts && ENVIRONMENT=PROD APPLY=1 npx tsx 2026-08-12-invite-members-to-spotlight.ts # for real
//
// Defaults to a dry run, and deliberately so: this is a broadcast to the entire membership and a
// notification cannot be unsent. The dry run prints the recipient count and the exact copy, which is
// the last chance anyone gets to read it before several hundred people do.
//
// Prerequisites, in order:
//   1. ./scripts/migrate.sh backend/supabase/migrations/20260812_add_profile_spotlights.sql
//   2. yarn --cwd=backend/api regen-types-dev
//   3. Deploy web + API.
//
// Step 3 is not optional. The notification tells members to go to Settings → Data & Privacy and flip a
// switch; sending it before the deploy lands every one of them on a page with no such switch on it.

import {debug} from 'common/logger'
import {createSpotlightInviteNotifications} from 'shared/create-notification'

import {runScript} from './run-script'

const APPLY = process.env.APPLY === '1'

runScript(async ({pg}) => {
  const {count} = await pg.one<{count: string}>('select count(*) as count from users')

  if (!APPLY) {
    debug(`[dry run] would notify ${count} members. Re-run with APPLY=1 to send.`)
    return
  }

  const result = await createSpotlightInviteNotifications()
  debug('Spotlight invite sent', result)
})
