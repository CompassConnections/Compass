/**
 * The rules a first message has to meet, and the state a member has to be in to send one.
 *
 * Pure functions shared by the composer (live feedback while someone writes) and the API (the
 * floor that is actually enforced). Keeping them in one place is what lets the client say "mention
 * something from their profile" before the server has to say "no".
 *
 * Why these exist at all: generic openers and comments on looks are what members report most, and
 * a bulk-messager's cost per opener is the only thing that reliably changes their behaviour. A
 * message that has to anchor on something the recipient wrote cannot be pasted twenty times.
 * The enforcement lives in `backend/api/src/create-private-user-message.ts` (openers) and
 * `backend/api/src/create-private-user-message-channel.ts` (the profile gate); the reasoning in
 * `docs/first-messages.md`.
 */

import {MIN_BIO_LENGTH} from 'common/constants'

/** Shortest first message the composer and the API accept, in characters of plain text. */
export const MIN_FIRST_MESSAGE_CHARS = 200

/**
 * What a member's own profile needs before they may start a conversation. A bio is the thing a
 * recipient has to go on, and the answers are the cheapest proof that someone has thought about
 * what they want — the two things the platform asks everyone to do before asking anything of
 * anyone else.
 */
export const MIN_BIO_CHARS_TO_MESSAGE = MIN_BIO_LENGTH
export const MIN_ANSWERS_TO_MESSAGE = 0

/**
 * Machine-readable markers on the API error details, so the client can render the right panel
 * rather than a bare red line.
 */
export const PROFILE_INCOMPLETE_CODE = 'profile-incomplete'
export const FIRST_MESSAGE_REJECTED_CODE = 'first-message-rejected'

/**
 * Two openers at or above this word-set similarity are the same message with the names swapped.
 * Measured as Jaccard over words of three letters or more: a 40-word template with the recipient's
 * name and one keyword changed still lands around 0.9, while two genuinely separate messages to two
 * different people rarely pass 0.3.
 */
export const DUPLICATE_OPENER_SIMILARITY = 0.6
/** How far back a sender's earlier openers are compared, and at most how many of them. */
export const DUPLICATE_OPENER_LOOKBACK_DAYS = 30
export const DUPLICATE_OPENER_SAMPLE = 20

const MIN_DISTINCTIVE_LENGTH = 5

/**
 * Words that appear in most profiles and most openers, so sharing one proves nothing. Only words of
 * `MIN_DISTINCTIVE_LENGTH` letters or more need listing; shorter ones are dropped before the check.
 * The looks vocabulary is here on purpose: "beautiful" matching a profile that happens to contain it
 * must not count as having read the profile.
 */
const STOPWORDS = new Set(
  (
    'about above after again against almost along already although always among another anyone ' +
    'anything around because before being below between could doing during either enough every ' +
    'everyone everything first found getting going great having hello honestly interested ' +
    'interesting interest interests little looking maybe might mostly never nothing often other ' +
    'others people person please pretty probably profile quite rather really right seems should ' +
    'since someone something still their there these thing things think those though thought ' +
    'three through today under until usually wanted where whether which while whole without ' +
    'world would write writing wrote yours yourself thanks thank compass message messages ' +
    'reading friend friends partner partners relationship relationships connection connections ' +
    'meaningful genuine curious loved loves enjoy enjoyed enjoys liked likes happy awesome ' +
    'amazing beautiful gorgeous lovely stunning attractive handsome photo photos picture ' +
    'pictures smile woman women ' +
    // French and German equivalents of the commonest ones, since profiles come in both.
    'aussi avec cette comme dans faire pour votre notre mais beaucoup vraiment profil ' +
    'quelqu intéressant intéressé ' +
    'nicht sehr viel wenn haben machen über eine einen einem einer auch aber deine dich profil'
  ).split(/\s+/),
)

/** Lowercase, diacritics stripped, possessive and punctuation removed. */
export function normalizeWord(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]s$/, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
}

const words = (text: string) =>
  text
    .split(/[^\p{L}\p{N}'’]+/u)
    .map(normalizeWord)
    .filter(Boolean)

/**
 * The words in a text that could only have come from reading it: five letters or more, not in the
 * stopword list, not in `exclude`, each once.
 */
export function distinctiveWords(text: string, exclude: string[] = []): string[] {
  const excluded = new Set(exclude.map(normalizeWord))
  const seen = new Set<string>()
  for (const w of words(text)) {
    if (w.length < MIN_DISTINCTIVE_LENGTH || STOPWORDS.has(w) || excluded.has(w)) continue
    seen.add(w)
  }
  return [...seen]
}

export type ProfileText = {
  name?: string | null
  username?: string | null
  headline?: string | null
  keywords?: string[] | null
  /** Plain text of the bio: `profiles.bio_text`, or `richTextToString(bio)` on the client. */
  bioText?: string | null
}

/**
 * Everything on a profile a first message could anchor to. The member's own name and username are
 * excluded: "Hi Martin" is not evidence of having read anything.
 */
export function profileVocabulary(profile: ProfileText): string[] {
  const text = [profile.headline, ...(profile.keywords ?? []), profile.bioText]
    .filter(Boolean)
    .join(' ')
  const exclude = [...(profile.name ?? '').split(/\s+/), profile.username ?? '']
  return distinctiveWords(text, exclude)
}

/**
 * Whether a message word and a profile word are the same word for this purpose. Plain prefix
 * matching stands in for stemming — "music"/"musician", "climb"/"climbing" — and is cheap enough to
 * run on every keystroke. Both sides are already five letters or more, so "inter" cannot match
 * "international" by accident of length alone.
 */
const sameWord = (a: string, b: string) => a === b || a.startsWith(b) || b.startsWith(a)

/** The profile words a message picks up, in profile order. */
export function profileReferences(message: string, vocabulary: string[]): string[] {
  const messageWords = distinctiveWords(message)
  if (!messageWords.length || !vocabulary.length) return []
  return vocabulary.filter((v) => messageWords.some((m) => sameWord(m, v)))
}

/**
 * How many profile words a message has to pick up. A profile with almost nothing on it gives a
 * sender nothing to anchor to, and that is the recipient's doing, not the sender's — so it asks for
 * nothing. Otherwise one is enough: the check is advisory (a warning in the composer, a log line in
 * the API), so a message that picks up a single keyword must not be told it mentions nothing. The
 * model review is what judges whether an opener is generic.
 */
export function requiredReferences(vocabulary: string[]): number {
  return vocabulary.length < 5 ? 0 : 1
}

export function referencesProfile(message: string, vocabulary: string[]): boolean {
  return profileReferences(message, vocabulary).length >= requiredReferences(vocabulary)
}

const comparableWords = (text: string) => new Set(words(text).filter((w) => w.length >= 3))

/** Jaccard similarity of the two texts' word sets, 0 to 1. */
export function openerSimilarity(a: string, b: string): number {
  const wa = comparableWords(a)
  const wb = comparableWords(b)
  if (!wa.size || !wb.size) return 0
  let shared = 0
  for (const w of wa) if (wb.has(w)) shared++
  return shared / (wa.size + wb.size - shared)
}

/**
 * The earlier opener this one is a copy of, if any: the most similar one at or above the threshold.
 */
export function findDuplicateOpener(
  message: string,
  previous: string[],
): {index: number; similarity: number} | null {
  let best: {index: number; similarity: number} | null = null
  previous.forEach((p, index) => {
    const similarity = openerSimilarity(message, p)
    if (similarity >= DUPLICATE_OPENER_SIMILARITY && (!best || similarity > best.similarity)) {
      best = {index, similarity}
    }
  })
  return best
}

export type ProfileGateIssues = {bio: boolean; answers: boolean}

/**
 * What is still missing from a member's own profile before they may start a conversation, or null
 * when nothing is.
 */
export function profileGateIssues(profile: {
  bioChars: number
  answers: number
}): ProfileGateIssues | null {
  console.log(profile)
  const issues = {
    bio: profile.bioChars < MIN_BIO_CHARS_TO_MESSAGE,
    answers: profile.answers < MIN_ANSWERS_TO_MESSAGE,
  }
  return issues.bio || issues.answers ? issues : null
}
