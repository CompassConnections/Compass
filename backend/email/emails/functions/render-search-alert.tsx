/**
 * Renders the search-alert email to a standalone HTML file, for the about-page clip (A4 in
 * docs/marketing-visuals.md).
 *
 * The clip's middle beat is the email that a saved search produces. That email had to be the *real*
 * template rather than a mock-up — the whole principle of these visuals is that anything which can be
 * a capture of the real thing should be, so it goes stale visibly instead of silently.
 *
 * This lives in `backend/email` rather than in media-creator because this is where the `common/` and
 * `shared/` path aliases already resolve. media-creator is a standalone npm project outside the yarn
 * workspaces and cannot import the template at all.
 *
 * The props are the showcase personas — fictional by construction, same standing as everything else
 * the capture scripts photograph, and never real member data. `NewSearchAlertsEmail.PreviewProps` is
 * deliberately left alone: that serves developers opening the react-email preview, and it should keep
 * showing the multi-search case rather than this one narrow scenario.
 *
 * Usage, from the repo root:
 *   npx tsx backend/email/emails/functions/render-search-alert.tsx /tmp/alert.html
 */

import {writeFileSync} from 'node:fs'

import {render} from '@react-email/components'
import {type User} from 'common/user'
import React from 'react'

import {NewSearchAlertsEmail} from '../new-search-alerts'

/**
 * The showcase viewer, not `mockUser` from ./mock.
 *
 * `mockUser` is Martin's own name and a photo of him hosted on his personal site. That is fine for a
 * developer eyeballing the preview, but this output is a marketing asset — it should carry the same
 * fictional persona the rest of the clip is shot as (`SHOWCASE_VIEWER` in
 * tests/e2e/utils/showcase-profiles.ts), so the email is addressed to the person whose session the
 * surrounding frames were captured in.
 */
const RECIPIENT: User = {
  createdTime: 0,
  avatarUrl: '/images/showcase/alexmorel-1.jpg',
  id: 'showcase-viewer',
  username: 'alexmorel',
  name: 'Alex Morel',
}

/**
 * Mirrors the saved search the capture script builds in the UI: man, 24–40, atheist, vegan, near
 * Grenoble. If you change the filters in `capture-alert.mjs`, change them here too — the email is
 * supposed to be describing the search the viewer just saved, and a mismatch would make the clip
 * quietly incoherent.
 *
 * No wants-kids facet, deliberately: that filter only renders for viewers whose own profile seeks a
 * relationship, and the showcase viewer does not. See the note in capture-alert.mjs.
 */
const SAVED_SEARCH = {
  genders: ['male'],
  religion: ['atheist'],
  diet: ['vegan'],
  // These are the real `FilterFields` keys, and they have to be exact. `formatFilters` special-cases
  // them — it folds the two age bounds into one "Age: 24-40" entry. Anything it does not recognise
  // falls through to a generic de-camel-casing path, which is how an earlier draft of this file
  // rendered "Agemin: 24 • Agemax: 40" into the email.
  pref_age_min: 24,
  pref_age_max: 40,
  orderBy: 'created_time',
}

/**
 * One match, not several. The clip's premise is that the search had no results when it was saved, so
 * the honest payoff is the single person who has since joined — a list of five would imply the search
 * was already working and undercut the reason to save it.
 */
const MATCHES = [
  {
    name: 'Julien Sarr',
    username: 'juliensarr',
    avatarUrl: '/images/showcase/juliensarr-1.jpg',
  },
]

async function main() {
  const out = process.argv[2]
  if (!out) throw new Error('usage: render-search-alert.tsx <output.html> [baseUrl]')

  // The template's logo and the match avatar are root-relative paths, which resolve against the
  // recipient's mail host in a real send. Opened as a local file they resolve against file:// and both
  // render as broken-image icons. A <base> makes them resolve against the dev server instead, so the
  // capture shows the email as it actually arrives.
  const base = process.argv[3] ?? 'http://localhost:3000'

  const html = await render(
    <NewSearchAlertsEmail
      toUser={RECIPIENT}
      email="alex.morel@compass.showcase"
      unsubscribeUrl="https://compassmeet.com/unsubscribe"
      matches={[
        {
          id: 'showcase-saved-search',
          description: {
            filters: SAVED_SEARCH,
            location: {location: {name: 'Grenoble'}, radius: 100},
          },
          matches: MATCHES,
        },
      ]}
    />,
  )

  // A viewport meta as well as the base. Email HTML has none — mail clients supply their own chrome —
  // so a mobile browser opening this file falls back to a ~980px layout viewport and scales the whole
  // thing down, which renders the body text at about 5px. With this, the template's `maxWidth: 600px`
  // container reflows to the actual 390px viewport and reads at roughly 1:1, which is the entire
  // reason this clip is captured on a phone rather than a desktop.
  // No theme handling here any more. The template now carries real `prefers-color-scheme` support
  // (DARK_MODE_CSS in emails/utils.tsx), so a dark capture just needs Playwright's colorScheme and the
  // email renders dark on its own — which is also what a dark-mode mail client shows a real recipient.
  // The earlier version framed a light email in invented dark chrome; supporting dark mode properly
  // made that unnecessary and is the better fix.
  const theme = process.argv[4] ?? 'light'

  const head = `<head><base href="${base}/"><meta name="viewport" content="width=device-width, initial-scale=1">`
  writeFileSync(out, html.replace('<head>', head))
  console.log(`wrote ${out} (${theme}, assets resolved against ${base})`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
