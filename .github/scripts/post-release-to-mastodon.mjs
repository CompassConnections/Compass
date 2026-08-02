/**
 * Announces a GitHub release on Mastodon.
 *
 * The @compassmeet account lives on someone else's instance (mastodon.social by default), so this is a
 * plain authenticated REST call to their API — no ActivityPub implementation on our side. Federation to
 * the rest of the fediverse is the host instance's job.
 *
 * Reads the release JSON produced by `gh api` (see cd-mastodon.yml) and posts a condensed version of the
 * user-facing release notes. Run with DRY_RUN=true to print the post without sending it; a status cannot
 * be unsent from instances that have already received it, so prefer checking the output first.
 */

import {readFileSync} from 'node:fs'

// Mastodon's default status limit. Instances may allow more, but assume the stock value.
const MAX_CHARS = 500

// Mastodon counts every URL as this many characters regardless of its real length, so budget accordingly.
const URL_WEIGHT = 23

// Release notes are a user-facing summary followed by a technical section separated by this marker (see
// CHANGELOG.md and web/pages/news.tsx). Only the summary is worth announcing.
const TECHNICAL_SECTION_MARKER = '<!--tech-->'

const NEWS_URL = 'https://compassmeet.com/news'
const HASHTAGS = '#Compass #OpenSource'

const {MASTODON_ACCESS_TOKEN, MASTODON_INSTANCE, RELEASE_JSON_PATH, DRY_RUN} = process.env

// An unset repository variable arrives as an empty string, which a destructuring default would not catch.
const instance = MASTODON_INSTANCE || 'https://mastodon.social'
const isDryRun = DRY_RUN === 'true'

/** Length as Mastodon counts it: every URL is a fixed 23 characters. */
function weightedLength(text) {
  return [...text.replace(/https?:\/\/\S+/g, '#'.repeat(URL_WEIGHT))].length
}

/** Markdown -> plain text. Mastodon renders the `status` param as plain text, so markup would show raw. */
function stripMarkdown(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links -> label
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(^|\s)([*_])(?=\S)(.*?)\S\2(?=\s|$)/g, '$1$3')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The bullet lines of the user-facing summary, best first (release notes lead with new features). */
function extractHighlights(body) {
  const summary = body.split(TECHNICAL_SECTION_MARKER)[0]

  const highlights = summary
    .split('\n')
    .filter((line) => /^[-*]\s+/.test(line)) // top-level bullets only; indented ones are sub-details
    // A trailing colon means the detail lives in indented sub-bullets we are dropping, so drop it too.
    .map((line) => stripMarkdown(line.replace(/^[-*]\s+/, '')).replace(/:$/, ''))
    .filter(Boolean)

  if (highlights.length) return highlights

  // Releases without bullets (rare) fall back to the first prose paragraph.
  return summary
    .split('\n\n')
    .map((paragraph) => stripMarkdown(paragraph))
    .filter((paragraph) => paragraph && !paragraph.startsWith('#'))
    .slice(0, 1)
}

function buildStatus(release) {
  const version = release.name?.trim() || release.tag_name
  const title = /compass/i.test(version) ? version : `Compass ${version}`
  const header = `🧭 ${title} is out!`
  const footer = `\n\nFull release notes: ${NEWS_URL}\n\n${HASHTAGS}`

  const highlights = extractHighlights(release.body || '')

  const render = (lines, hasMore) =>
    header +
    (lines.length ? `\n\n${lines.join('\n')}` : '') +
    (hasMore ? '\n…and more.' : '') +
    footer

  const lines = []
  for (const highlight of highlights) {
    const candidate = [...lines, `• ${highlight}`]
    // Reserve room for the "…and more." line unless this highlight is the last one anyway.
    const fitsEverything = candidate.length === highlights.length
    if (weightedLength(render(candidate, !fitsEverything)) > MAX_CHARS) break
    lines.push(`• ${highlight}`)
  }

  return render(lines, lines.length < highlights.length)
}

async function main() {
  if (!RELEASE_JSON_PATH) throw new Error('RELEASE_JSON_PATH is not set')

  const release = JSON.parse(readFileSync(RELEASE_JSON_PATH, 'utf8'))
  const status = buildStatus(release)

  console.log(`--- status (${weightedLength(status)}/${MAX_CHARS} chars) ---`)
  console.log(status)
  console.log('---')

  if (isDryRun) {
    console.log('DRY_RUN=true, not posting.')
    return
  }

  // Mirrors sendDiscordMessage: a missing credential is a no-op, not a failure, so forks and unconfigured
  // environments do not fail the workflow.
  if (!MASTODON_ACCESS_TOKEN) {
    console.log('MASTODON_ACCESS_TOKEN is not set, skipping.')
    return
  }

  const response = await fetch(`${instance}/api/v1/statuses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MASTODON_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      // Makes a retried run (or a re-dispatched workflow) reuse the existing status instead of duplicating.
      'Idempotency-Key': `compass-release-${release.tag_name}`,
    },
    body: JSON.stringify({
      status,
      visibility: 'public',
      language: 'en', // release notes are English-only, same as /news
    }),
  })

  if (!response.ok) {
    throw new Error(`Mastodon API ${response.status}: ${await response.text()}`)
  }

  const {url} = await response.json()
  console.log(`Posted: ${url}`)
}

await main()
