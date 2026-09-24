import {declineReason, fetchReviewAccountRow, ReviewAccountRow, toReviewAccountFacts,} from 'api/request-review-prompt'
import {countBy, sortBy} from 'lodash'
import {evaluateReviewPrompt, REVIEW_MOMENTS, ReviewMoment, ReviewTrigger,} from 'common/reviews/prompt'
import {runScript} from './run-script'

// READ-ONLY dry run of `request-review-prompt`. For every member, asks: "if their app called the
// endpoint right now with moment X, would it say yes, and if not, why not?"
//
// Runs the endpoint's own query (`fetchReviewAccountRow`) and its own policy (`evaluateReviewPrompt`),
// but never the insert into `review_prompts` — nothing is written.
//
// Only the server half is checked. The client half (`isInstallEligible`: native app, enough sessions,
// install age) lives in each phone's localStorage and is invisible from here, so "would trigger" means
// "would trigger once the app itself agrees to ask" — and members without the app never ask at all.
//
// Usage (from backend/scripts):
//   bun run 2026-09-24-review-prompt-dry-run.ts               # summary + members granted per moment
//   bun run 2026-09-24-review-prompt-dry-run.ts --verbose     # also every declined member and why
//   bun run 2026-09-24-review-prompt-dry-run.ts --user alice  # one member, all diagnostics
//
// Uses console.log rather than debug(): the report is the deliverable, and debug() is silent whenever
// IS_PROD/IS_DEPLOYED is set. Same choice as 2026-09-10-vpn-asn-dry-run.ts.

const CONCURRENCY = 10

// `inbox` is the retired alias of `conversation-exit` and maps to the same trigger — not worth a column.
const MOMENTS = REVIEW_MOMENTS.filter((m) => m !== 'inbox')

type Result = {
  id: string
  username: string
  row: ReviewAccountRow
  outcomes: Record<ReviewMoment, {trigger: ReviewTrigger | null; reason: string | null}>
}

const args = process.argv.slice(2)
const verbose = args.includes('--verbose')
const onlyUser = args.includes('--user') ? args[args.indexOf('--user') + 1] : undefined

runScript(async ({pg}) => {
  const now = new Date()

  const users = await pg.manyOrNone<{id: string; username: string}>(
    `select id, username
     from users
     where ($(onlyUser) is null or username = $(onlyUser))
     order by created_time`,
    {onlyUser: onlyUser ?? null},
  )
  if (!users.length) {
    console.log(onlyUser ? `No user with username "${onlyUser}".` : 'No users.')
    return
  }
  console.log(`Evaluating ${users.length} member(s) at ${now.toISOString()}...\n`)

  const results: Result[] = []
  for (let i = 0; i < users.length; i += CONCURRENCY) {
    const batch = await Promise.all(
      users.slice(i, i + CONCURRENCY).map(async (u) => {
        const row = await fetchReviewAccountRow(pg, u.id, now)
        const facts = toReviewAccountFacts(row, now)
        const outcomes = {} as Result['outcomes']
        for (const moment of MOMENTS) {
          const trigger = evaluateReviewPrompt(moment, facts)
          outcomes[moment] = {trigger, reason: trigger ? null : declineReason(moment, facts)}
        }
        return {...u, row, outcomes}
      }),
    )
    results.push(...batch)
  }

  if (onlyUser) {
    const [r] = results
    console.log(r.row)
    console.log()
    for (const m of MOMENTS) {
      const o = r.outcomes[m]
      console.log(`${m.padEnd(26)} ${o.trigger ? `YES → ${o.trigger}` : `no — ${o.reason}`}`)
    }
    return
  }

  console.log('=== Summary: members the server would grant, per moment ===')
  for (const m of MOMENTS) {
    const granted = results.filter((r) => r.outcomes[m].trigger).length
    console.log(`  ${m.padEnd(26)} ${String(granted).padStart(5)} / ${results.length}`)
  }

  for (const m of MOMENTS) {
    const granted = results.filter((r) => r.outcomes[m].trigger)
    const declined = results.filter((r) => !r.outcomes[m].trigger)

    console.log(`\n=== ${m} ===`)
    console.log(`Granted: ${granted.length}`)
    const reasons = countBy(declined, (r) => r.outcomes[m].reason)
    for (const [reason, n] of sortBy(Object.entries(reasons), ([, n]) => -n)) {
      console.log(`  declined ${String(n).padStart(5)}  ${reason}`)
    }

    // `testimonial-submitted` and `profile-from-notification` only pass the shared gates (not upset,
    // under the cap, out of cooldown), so listing everyone who passes them is just the member list.
    if (m !== 'conversation-exit' && m !== 'quiet') continue

    for (const r of granted) console.log(`  YES  ${describe(r)}`)
    if (verbose) {
      for (const r of declined) console.log(`  no   ${describe(r)}  — ${r.outcomes[m].reason}`)
    }
  }
})

function describe({username, row}: Result) {
  const date = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '-')
  return [
    `@${username}`.padEnd(24),
    `attempts=${row.attempts}`,
    `lastPrompted=${date(row.last_prompted_at)}`,
    `convs=${row.conversations}`,
    `maxIn=${row.max_inbound ?? '-'}`,
    `maxTotal=${row.max_total ?? '-'}`,
    `lastTwoWay=${date(row.last_two_way_at)}`,
    `lastMsg=${date(row.last_message_at)}`,
    row.recently_upset ? 'UPSET' : '',
  ]
    .filter(Boolean)
    .join('  ')
}
