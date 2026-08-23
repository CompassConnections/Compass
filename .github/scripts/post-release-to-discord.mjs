/**
 * Announces a GitHub release in Discord's #announcements channel.
 *
 * A webhook rather than `sendDiscordMessage` from common/discord/core, because this runs on a GitHub
 * runner that has no access to the API's environment: the URL arrives as a repository secret, not from
 * .env or GCP Secret Manager. It is the same kind of URL and the same no-op-when-unset behaviour.
 *
 * Reads the release JSON produced by `gh api` (see cd-discord.yml) and posts the user-facing half of the
 * release notes. Unlike the Mastodon post, which has to squeeze into 500 characters of plain text, Discord
 * renders Markdown and allows 2000 — so the notes go out close to verbatim rather than as bullet
 * highlights. Run with DRY_RUN=true to print the message without sending it.
 */

import {readFileSync} from 'node:fs'

// Discord's limit on a message's `content`. Embeds allow more, but a plain message is what the rest of
// the channels get, and an embed would render the release notes in a grey sidebar nobody reads.
const MAX_CHARS = 2000

// Release notes are a user-facing summary followed by a technical section separated by this marker (see
// CHANGELOG.md and web/pages/news.tsx). Only the summary is worth announcing.
const TECHNICAL_SECTION_MARKER = '<!--tech-->'

const NEWS_URL = 'https://compassmeet.com/news'

// Angle brackets stop Discord from unfurling the link into a preview card under the post.
const FOOTER = `\n\nFull release notes: <${NEWS_URL}>`

const CONTINUED = '\n…and more.'

const {DISCORD_WEBHOOK_ANNOUNCEMENTS, RELEASE_JSON_PATH, DRY_RUN} = process.env

const isDryRun = DRY_RUN === 'true'

/**
 * Rejoins bullets that CHANGELOG.md hard-wraps at 110 columns. Those continuation lines are an artifact
 * of writing the file for a human reader; Discord wraps to the reader's window, and left alone the indent
 * shows up as ragged half-lines hanging under each bullet. A line that starts its own bullet, heading or
 * paragraph is left where it is — only the continuations are folded back.
 */
function unwrap(text) {
  const lines = []
  for (const line of text.split('\n')) {
    const isContinuation =
      /^\s+\S/.test(line) && !/^\s*([-*]\s|#)/.test(line) && lines.at(-1)?.trim()
    if (isContinuation) lines[lines.length - 1] += ` ${line.trim()}`
    else lines.push(line)
  }
  return lines.join('\n')
}

/**
 * The user-facing summary, tidied for Discord. Discord renders Markdown natively, so headings, bullets
 * and links survive; only what it cannot render (images, HTML) and what would clutter the channel (bare
 * PR and compare URLs, each of which unfurls into its own preview card) is rewritten or dropped.
 */
function summaryFor(body) {
  return unwrap(
    body
      .split(TECHNICAL_SECTION_MARKER)[0]
      .replace(/\*\*?Full Changelog\*\*?: \S+/g, '')
      .replace(
        /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/(\d+)/g,
        (url, number) => `[#${number}](<${url}>)`,
      )
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
      .replace(/<!--[\s\S]*?-->/g, '')
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  )
}

/**
 * Fits the notes into one message, cutting on line boundaries — half a bullet is worse than one bullet
 * fewer. The overflow is not lost: `…and more.` sits directly above the link to the full notes.
 */
function truncate(summary, budget) {
  if (summary.length <= budget) return {text: summary, truncated: false}

  const lines = summary.split('\n')
  const kept = []
  let length = 0
  for (const line of lines) {
    const added = kept.length ? line.length + 1 : line.length
    if (length + added > budget - CONTINUED.length) break
    kept.push(line)
    length += added
  }
  return {text: kept.join('\n').trimEnd(), truncated: true}
}

function buildMessage(release) {
  const version = release.name?.trim() || release.tag_name
  const title = /compass/i.test(version) ? version : `Compass ${version}`
  const header = `## 🧭 ${title} is out!`

  const summary = summaryFor(release.body || '')
  // +2 for the blank line between the header and the notes, which a release with no notes never gets.
  const {text, truncated} = truncate(summary, MAX_CHARS - header.length - 2 - FOOTER.length)

  return header + (text ? `\n\n${text}` : '') + (truncated ? CONTINUED : '') + FOOTER
}

async function main() {
  if (!RELEASE_JSON_PATH) throw new Error('RELEASE_JSON_PATH is not set')

  const release = JSON.parse(readFileSync(RELEASE_JSON_PATH, 'utf8'))
  const content = buildMessage(release)

  console.log(`--- message (${content.length}/${MAX_CHARS} chars) ---`)
  console.log(content)
  console.log('---')

  if (isDryRun) {
    console.log('DRY_RUN=true, not posting.')
    return
  }

  // Mirrors sendDiscordMessage: a missing webhook is a no-op, not a failure, so forks and unconfigured
  // environments do not fail the workflow.
  if (!DISCORD_WEBHOOK_ANNOUNCEMENTS) {
    console.log('DISCORD_WEBHOOK_ANNOUNCEMENTS is not set, skipping.')
    return
  }

  const response = await fetch(DISCORD_WEBHOOK_ANNOUNCEMENTS, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      content,
      // Release notes are written by us, but they quote feature names and usernames; nothing in them
      // should ever be able to ping a channel of members.
      allowed_mentions: {parse: []},
    }),
  })

  if (!response.ok) {
    throw new Error(`Discord webhook ${response.status}: ${await response.text()}`)
  }

  console.log(`Posted ${release.tag_name} to #announcements.`)
}

await main()
