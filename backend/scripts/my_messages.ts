// Dump my own chat messages since a given date as markdown, ready to paste at the end of a doc.
//
// Run with:
//   export ENVIRONMENT=PROD && npx tsx backend/scripts/my_messages.ts
//
// Conversations with people who have since deleted their account are skipped: deletion drops the
// `users` row outright (only the username survives, in `deleted_users`), so they no longer resolve.
//
// Options (env vars):
//   SINCE=2026-07-01           earliest message to include
//   USERNAME=Martin            whose messages to dump
//   INCLUDE_THREAD=1           also include the other person's messages, for context
//   EXCLUDE=Lily,someone       skip these counterparts, by name or username
//   OUT=../../martin/my-messages.md      where to write

import chalk from 'chalk'
import {writeFileSync} from 'fs'
import {groupBy, uniq} from 'lodash'

import {debug} from 'common/logger'
import {richTextToString} from 'common/util/parse'
import {convertPrivateChatMessage} from 'shared/supabase/messages'

import {runScript} from './run-script'

const SINCE = process.env.SINCE ?? '2026-07-01'
const USERNAME = process.env.USERNAME ?? 'Martin'
const INCLUDE_THREAD = process.env.INCLUDE_THREAD === '1'
const OUT = process.env.OUT ?? '../../martin/my-messages.md'
/** Matched against both name and username, so either spelling of a counterpart works. */
const EXCLUDE = (process.env.EXCLUDE ?? 'Lily')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

/** `2026-08-03 15:48`, matching how I quote conversations by hand. */
const stamp = (ms: number) => {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes(),
  )}`
}

runScript(async ({pg}) => {
  const me = await pg.oneOrNone<{id: string; name: string}>(
    `select id, name from users where username ilike $1`,
    [USERNAME],
  )
  if (!me) throw new Error(`No user with username "${USERNAME}"`)

  // Every message in every channel I'm a member of. Filtering to my own messages happens below so
  // that INCLUDE_THREAD can keep the surrounding conversation without a second round trip.
  const messages = await pg.map(
    `select m.*, u.name as name, u.username as username
     from private_user_messages m
              join private_user_message_channel_members mine
                   on mine.channel_id = m.channel_id and mine.user_id = $1
              left join users u on u.id = m.user_id
     where m.created_time >= $2::timestamptz
       and m.visibility <> 'system_status'
       and not coalesce(m.deleted, false)
     order by m.channel_id, m.created_time`,
    [me.id, SINCE],
    convertPrivateChatMessage,
  )

  const channelIds = uniq(messages.map((m: any) => m.channelId))
  if (!channelIds.length) {
    debug(`[my_messages] No messages since ${SINCE}.`)
    return
  }

  // Who I was talking to, per channel — used for the section headings.
  const others = await pg.manyOrNone<{
    channel_id: number
    name: string
    username: string
  }>(
    `select mem.channel_id, u.name, u.username
     from private_user_message_channel_members mem
              join users u on u.id = mem.user_id
     where mem.channel_id in ($1:csv)
       and mem.user_id <> $2`,
    [channelIds, me.id],
  )
  const othersByChannel = groupBy(others, 'channel_id')

  const byChannel = groupBy(messages, (m: any) => m.channelId)
  const sections: string[] = []

  let mineTotal = 0
  let kept = 0
  let skippedDeleted = 0
  let skippedExcluded = 0

  for (const channelId of channelIds) {
    // No live counterpart means every other member of the channel has deleted their account, since
    // deletion removes the `users` row the heading query joins against.
    const counterparts = othersByChannel[channelId] ?? []
    if (!counterparts.length) {
      skippedDeleted++
      continue
    }
    if (
      counterparts.some(
        (o) => EXCLUDE.includes(o.name.toLowerCase()) || EXCLUDE.includes(o.username.toLowerCase()),
      )
    ) {
      skippedExcluded++
      continue
    }

    const inChannel = byChannel[channelId] ?? []
    const mine = inChannel.filter((m: any) => m.userId === me.id)
    if (!mine.length) continue // a channel where I only received, nothing of mine to show
    mineTotal += mine.length
    kept++

    const heading = counterparts.map((o) => `${o.name} (@${o.username})`).join(', ')
    sections.push(`## ${heading} — channel ${channelId}`, '')

    for (const m of INCLUDE_THREAD ? inChannel : mine) {
      const text = richTextToString((m as any).content).trim()
      if (!text) continue
      const who = (m as any).userId === me.id ? me.name : ((m as any).name ?? 'them')
      sections.push(`[${stamp((m as any).createdTime)}] ${who}: ${text}`, '')
    }
  }

  const lines = [
    `# Messages from @${USERNAME}, since ${SINCE}`,
    '',
    `Generated from ${kept} conversations.` +
      (INCLUDE_THREAD ? '' : ' Only my own messages are included.'),
    '',
    ...sections,
  ]

  writeFileSync(OUT, lines.join('\n'))
  debug(
    `[my_messages] Wrote ${chalk.yellow(String(mineTotal))} of my messages ` +
      `across ${kept} conversations to ${chalk.yellow(OUT)} ` +
      `(skipped ${skippedDeleted} with deleted users, ${skippedExcluded} excluded)`,
  )
})
