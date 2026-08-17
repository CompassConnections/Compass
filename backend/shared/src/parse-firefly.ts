import {JSONContent} from '@tiptap/core'
import {textToJSONContent} from 'common/util/parse'

/**
 * datefirefly.com profile pages (`/u/<username>`) are client-rendered: a plain fetch returns a shell
 * whose only text is the nav and a few "Loading..." placeholders — enough text to sneak past the
 * empty-document check, so extraction from it quietly produced a profile made of nothing. The page
 * fills itself in from a public Supabase RPC (`get_public_profile`), which serves any public profile
 * without a session, so we call that instead and rebuild the document the visitor would have read.
 * See `fetchFireflyProfile` in backend/api/src/llm-extract-profile.ts for the fetching side, and for
 * the constraints on when we are willing to read one at all.
 */
export function extractFireflyUsername(url: string): string | null {
  let hostname: string
  let pathname: string
  try {
    const parsed = new URL(url)
    hostname = parsed.hostname
    pathname = parsed.pathname
  } catch {
    return null
  }

  if (hostname !== 'datefirefly.com' && hostname !== 'www.datefirefly.com') return null

  const match = pathname.match(/^\/u\/([^/]+)\/?$/)
  if (!match) return null
  // The page reads the username off the path and lower-cases it before querying; match that, so a
  // link written with different capitalisation resolves to the same profile.
  return decodeURIComponent(match[1]).trim().toLowerCase() || null
}

/**
 * One row of the `get_public_profile` RPC. Every field is optional — most profiles fill in few.
 *
 * Deliberately narrower than what the RPC returns. Firefly also serves a second endpoint,
 * `get_public_quiz_answers`, holding up to 195 answers covering sex life, kinks, religion, politics
 * and drug use. We do not read it: it is GDPR Art. 9 special-category data, and none of it is needed
 * to prefill a Compass profile. Do not add it back without a reason that survives that trade.
 */
export type FireflyProfile = {
  first_name?: string | null
  about_me?: string | null
  date_of_birth?: string | null
  /** JSON string of a Google-Places-shaped address; only locality/administrativeArea are shown. */
  address?: string | null
  gender?: string | null
  orientation?: string | null
  relationship_type_key?: number | null
  /** Postgres array literals, e.g. `{"Men","Women"}`. */
  gender_group?: string | null
  connection_type?: string | null
  /** JSON strings of `{answer: string}` — the four free-text prompts shown on the page. */
  lifestyle_one?: string | null
  romantic_one?: string | null
  sexual_one?: string | null
  fun_one?: string | null
  email?: string | null
  instagram?: string | null
  // Also returned: love_language and profile_picture_urls. The page does not display the former,
  // and the latter are storage paths that only load with the site's own auth header, so a bio
  // pointing at them would show broken images. Both are left out.
}

/** Titles of the four free-text prompts, in the order the page lays them out. */
const FIREFLY_PROFILE_QUESTIONS: Array<[keyof FireflyProfile, string]> = [
  ['lifestyle_one', "A list of items I couldn't live without are..."],
  ['romantic_one', 'In a relationship, I am looking for...'],
  ['sexual_one', "The first thing I notice about a partner's body is..."],
  ['fun_one', 'If I could have any superpower, it would be...'],
]

// The page falls back to "Monogamous" for any key it does not know; we leave the line out instead
// rather than assert something the profile may not have said.
const FIREFLY_RELATIONSHIP_TYPES: Record<number, string> = {
  0: 'Monogamous',
  1: 'Non-monogamous single',
  2: 'Non-monogamous with partner(s)',
  13: 'Non-monogamous with nesting partner(s)',
}

function parseJsonField<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

/** Turns a Postgres array literal (`{"Men","Women"}`) into a comma-separated list. */
function parseArrayLiteral(value: string | null | undefined): string | null {
  if (!value) return null
  const items = value
    .replace(/[{}"]/g, '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return items.length ? items.join(', ') : null
}

function parseLocation(address: string | null | undefined): string | null {
  const parsed = parseJsonField<{locality?: string; administrativeArea?: string}>(address)
  const {locality, administrativeArea} = parsed ?? {}
  if (locality && administrativeArea) return `${locality}, ${administrativeArea}`
  return locality || administrativeArea || null
}

function parseBirthDate(dateOfBirth: string | null | undefined): Date | null {
  if (!dateOfBirth) return null
  const born = new Date(dateOfBirth)
  return isNaN(born.getTime()) ? null : born
}

function ageFrom(born: Date): number | null {
  // Read the birth date in UTC: a date-only string parses as UTC midnight, which in any negative
  // offset lands on the previous day locally — and on the previous year for a January 1st birthday.
  const now = new Date()
  let age = now.getFullYear() - born.getUTCFullYear()
  const monthDiff = now.getMonth() - born.getUTCMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getUTCDate())) age--
  return age >= 0 && age < 150 ? age : null
}

function heading(level: number, text: string): JSONContent {
  return {type: 'heading', attrs: {level}, content: [{type: 'text', text}]}
}

/** A `**Label:** value` paragraph — how the page renders both its detail cards. */
function labelled(label: string, value: string): JSONContent {
  return {
    type: 'paragraph',
    content: [
      {type: 'text', text: `${label}: `, marks: [{type: 'bold'}]},
      {type: 'text', text: value},
    ],
  }
}

function prose(text: string): JSONContent[] {
  return textToJSONContent(text).content ?? []
}

/**
 * Rebuilds the document a visitor to the profile page would have read, and nothing more: every
 * section below is one the page itself renders. Fields the RPC happens to return but the page does
 * not show are left out on purpose — the import is meant to carry across what its owner published,
 * not everything their old platform holds on them.
 */
export function fireflyProfileToJSONContent(profile: FireflyProfile): JSONContent {
  const content: JSONContent[] = []

  if (profile.first_name) content.push(heading(1, profile.first_name))

  if (profile.about_me?.trim()) {
    content.push(heading(2, 'About me'), ...prose(profile.about_me))
  }

  // Details, in the order the page's own card lists them.
  const details: JSONContent[] = []
  const born = parseBirthDate(profile.date_of_birth)
  const age = born ? ageFrom(born) : null
  if (born && age !== null) {
    details.push(labelled('Age', String(age)))
    // The page only shows an age, which is only true for the day it was read. The year behind it is
    // what we actually want to keep, so state it too (see `birthDateFromStated` in common).
    details.push(labelled('Born in', String(born.getUTCFullYear())))
  }
  if (profile.gender) details.push(labelled('Gender', profile.gender))
  if (profile.orientation) details.push(labelled('Orientation', profile.orientation))
  const relationshipType =
    profile.relationship_type_key != null
      ? FIREFLY_RELATIONSHIP_TYPES[profile.relationship_type_key]
      : null
  if (relationshipType) details.push(labelled('Relationship type', relationshipType))
  const location = parseLocation(profile.address)
  if (location) details.push(labelled('Location', location))
  if (details.length) content.push(heading(2, 'Details'), ...details)

  // Interested in
  const interestedIn: JSONContent[] = []
  const genderGroup = parseArrayLiteral(profile.gender_group)
  if (genderGroup) interestedIn.push(labelled('Gender', genderGroup))
  const connectionType = parseArrayLiteral(profile.connection_type)
  if (connectionType) interestedIn.push(labelled('Relationship', connectionType))
  if (interestedIn.length) content.push(heading(2, 'Interested in'), ...interestedIn)

  // The four free-text prompts.
  for (const [field, question] of FIREFLY_PROFILE_QUESTIONS) {
    const answer = parseJsonField<{answer?: string}>(profile[field] as string | null)?.answer
    if (!answer?.trim()) continue
    content.push(heading(3, question), ...prose(answer))
  }

  const contacts: JSONContent[] = []
  if (profile.instagram) {
    const handle = profile.instagram.replace('@', '').trim()
    if (handle) {
      contacts.push({
        type: 'paragraph',
        content: [
          {type: 'text', text: 'Instagram: ', marks: [{type: 'bold'}]},
          {
            type: 'text',
            text: profile.instagram,
            marks: [
              {
                type: 'link',
                attrs: {href: `https://www.instagram.com/${handle}`, target: '_blank'},
              },
            ],
          },
        ],
      })
    }
  }
  if (profile.email) contacts.push(labelled('Email', profile.email))
  if (contacts.length) content.push(heading(2, 'Contact'), ...contacts)

  return {type: 'doc', content}
}
