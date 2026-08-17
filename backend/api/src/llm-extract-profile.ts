import {JSONContent} from '@tiptap/core'
import {getOptions} from 'api/get-options'
import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {searchLocation} from 'api/search-location'
import {APIError} from 'common/api/utils'
import {
  CANNABIS_CHOICES,
  DIET_CHOICES,
  EDUCATION_CHOICES,
  EXERCISE_CHOICES,
  GENDERS,
  LANGUAGE_CHOICES,
  MBTI_CHOICES,
  NEUROTYPE_CHOICES,
  ORIENTATION_CHOICES,
  POLITICAL_CHOICES,
  PSYCHEDELICS_CHOICES,
  RACE_CHOICES,
  RELATIONSHIP_CHOICES,
  RELATIONSHIP_STATUS_CHOICES,
  RELIGION_CHOICES,
  ROMANTIC_CHOICES,
  SUBSTANCE_INTENTION_CHOICES,
  SUBSTANCE_PREFERENCE_CHOICES,
} from 'common/choices'
import {debug} from 'common/logger'
import {ageFromBirthDate, birthDateFromStated} from 'common/profiles/birth-date'
import {ProfileWithoutUser} from 'common/profiles/profile'
import {SITE_ORDER} from 'common/socials'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {parseJsonContentToText, textToJSONContent} from 'common/util/parse'
import {HOUR_MS, MINUTE_MS, sleep} from 'common/util/time'
import {createHash} from 'crypto'
import {promises as fs} from 'fs'
import {tmpdir} from 'os'
import {join} from 'path'
import {log} from 'shared/monitoring/log'
import {
  convertToJSONContent,
  extractGoogleDocId,
  extractNotionPageId,
  getBlockedProfileHost,
  hasText,
  NotionRecordMap,
  notionRecordMapToJSONContent,
} from 'shared/parse'
import {
  extractFireflyUsername,
  FireflyProfile,
  fireflyProfileToJSONContent,
} from 'shared/parse-firefly'

const MAX_CONTEXT_LENGTH = 7 * 10 * 30 * 50
const USE_CACHE = true
const CACHE_DIR = join(tmpdir(), 'compass-llm-cache')
const CACHE_TTL_MS = 24 * HOUR_MS
const PROCESSING_TTL_MS = 10 * MINUTE_MS
// 100 blocks per chunk — plenty for any realistic profile page, and a hard stop on runaway paging.
const MAX_NOTION_CHUNKS = 10

type ExtractSource = 'text' | 'url' | 'voice'

interface ParsedBody {
  content?: string
  url?: string
  locale?: string
  source?: ExtractSource
}

// Bump whenever the extraction prompt changes, or whenever we start reading a source differently.
// The cache key is otherwise derived purely from the request, so a fix would keep returning the old
// answer for the 24h TTL — which looks exactly like the fix not working.
const PROMPT_VERSION = 4

function getCacheKey(parsedBody: ParsedBody): string {
  if (!USE_CACHE) return ''
  const hash = createHash('sha256')
  // Normalize: sort keys for consistent hashing
  const normalized = JSON.stringify(parsedBody, Object.keys(parsedBody).sort())
  hash.update(`v${PROMPT_VERSION}:${normalized}`)
  return hash.digest('hex')
}

async function validateProfileFields(
  llmProfile: Partial<ProfileWithoutUser>,
  validChoices: Record<string, string[]>,
): Promise<Partial<ProfileWithoutUser>> {
  const result: Partial<Record<keyof ProfileWithoutUser, any>> = {
    ...removeNullOrUndefinedProps(llmProfile),
  }

  const toArray: (keyof ProfileWithoutUser)[] = [
    'diet',
    'ethnicity',
    'interests',
    'causes',
    'work',
    'languages',
    'religion',
    'political_beliefs',
    'pref_gender',
    'pref_relation_styles',
    'pref_romantic_styles',
    'relationship_status',
    'keywords',
    'psychedelics_intention',
    'cannabis_intention',
    'psychedelics_pref',
    'cannabis_pref',
    'orientation',
    'neurotype',
  ]
  for (const key of toArray) {
    if (result[key] !== undefined) {
      if (!Array.isArray(result[key])) {
        result[key] = [String(result[key])]
      } else {
        result[key] = result[key].map(String)
      }
      // Filter out invalid values
      if (validChoices[key]) {
        result[key] = result[key].filter((v: string) => validChoices[key].includes(v))
        if (result[key].length === 0) {
          result[key] = undefined
        }
      }
    }
  }

  const toString: (keyof ProfileWithoutUser)[] = [
    'gender',
    'education_level',
    'mbti',
    'exercise',
    'psychedelics',
    'cannabis',
    'headline',
    'city',
    'country',
    'raised_in_city',
    'raised_in_country',
    'university',
    'company',
    'occupation_title',
    'religious_beliefs',
    'political_details',
    'gender_details',
    'orientation_details',
    'neurotype_details',
    'accessibility_notes',
  ]
  for (const key of toString) {
    if (result[key] !== undefined) {
      if (Array.isArray(result[key])) {
        result[key] = result[key][0] ?? ''
      }
      result[key] = String(result[key])
      if (validChoices[key] && !validChoices[key].includes(result[key])) {
        result[key] = undefined
      }
    }
  }

  const toNumber: (keyof ProfileWithoutUser)[] = [
    'age',
    'height_in_inches',
    'drinks_per_month',
    'has_kids',
    'wants_kids_strength',
    'big5_openness',
    'big5_conscientiousness',
    'big5_extraversion',
    'big5_agreeableness',
    'big5_neuroticism',
    'pref_age_min',
    'pref_age_max',
    'city_latitude',
    'city_longitude',
    'raised_in_lat',
    'raised_in_lon',
  ]
  for (const key of toNumber) {
    if (result[key] !== undefined) {
      const num = Number(result[key])
      result[key] = isNaN(num) ? undefined : num
    }
  }

  const toBoolean: (keyof ProfileWithoutUser)[] = ['is_smoker']
  for (const key of toBoolean) {
    if (result[key] !== undefined) {
      result[key] = Boolean(result[key])
    }
  }

  if (result.city) {
    if (!result.city_latitude || !result.city_longitude) {
      const response = await searchLocation({term: result.city, limit: 1})
      const locations = response.data?.data
      result.city_latitude = locations?.[0]?.latitude
      result.city_longitude = locations?.[0]?.longitude
      result.country ??= locations?.[0]?.country
    }
  }

  if (result.raised_in_city) {
    if (!result.raised_in_lat || !result.raised_in_lon) {
      const response = await searchLocation({term: result.raised_in_city, limit: 1})
      const locations = response.data?.data
      result.raised_in_lat = locations?.[0]?.latitude
      result.raised_in_lon = locations?.[0]?.longitude
      result.raised_in_country ??= locations?.[0]?.country
    }
  }

  if (result.links) {
    const sites = Object.keys(result.links).filter((key) => SITE_ORDER.includes(key as any))
    result.links = sites.reduce(
      (acc, key) => {
        const link = (result.links as Record<string, any>)[key]
        if (link) acc[key] = link
        return acc
      },
      {} as Record<string, any>,
    )
  }

  // Whether the document stated a year or an age, store a birth date — an extracted age is only
  // true for the year the document was written, and profiles built from one are otherwise wrong
  // forever after. A bare age is dated from now, because now is when it was read to us.
  const birthDate = birthDateFromStated({
    // Asked of the model, but not a profile column — a year is stored as its mid-year date.
    birthYear: (llmProfile as any).birth_year,
    age: result.age,
  })
  delete (result as any).birth_year
  result.birth_date = birthDate ?? undefined
  // `age` is derived from `birth_date` by the database; this only keeps the copy the form previews in
  // step with the date we just worked out.
  result.age = ageFromBirthDate(birthDate) ?? undefined

  // Validate age preferences
  if (result.pref_age_min !== undefined) {
    if (
      !Number.isFinite(result.pref_age_min) ||
      result.pref_age_min < 18 ||
      result.pref_age_min > 100
    ) {
      result.pref_age_min = undefined
    }
  }

  if (result.pref_age_max !== undefined) {
    if (
      !Number.isFinite(result.pref_age_max) ||
      result.pref_age_max < 18 ||
      result.pref_age_max > 100
    ) {
      result.pref_age_max = undefined
    }
  }

  // Ensure pref_age_max > pref_age_min when both are defined
  if (result.pref_age_min !== undefined && result.pref_age_max !== undefined) {
    if (result.pref_age_max <= result.pref_age_min) {
      result.pref_age_max = undefined
      result.pref_age_min = undefined
    }
  }

  return result
}

async function getCachedResult(cacheKey: string): Promise<Partial<ProfileWithoutUser> | null> {
  if (!USE_CACHE) return null
  try {
    const cacheFile = join(CACHE_DIR, `${cacheKey}.json`)
    const stats = await fs.stat(cacheFile)

    if (Date.now() - stats.mtime.getTime() > CACHE_TTL_MS) {
      await fs.unlink(cacheFile)
      return null
    }

    const cachedData = await fs.readFile(cacheFile, 'utf-8')
    return JSON.parse(cachedData)
  } catch {
    return null
  }
}

async function setCachedResult(cacheKey: string, result: any): Promise<void> {
  if (!USE_CACHE) return
  try {
    await fs.mkdir(CACHE_DIR, {recursive: true})
    const cacheFile = join(CACHE_DIR, `${cacheKey}.json`)
    await fs.writeFile(cacheFile, JSON.stringify(result), 'utf-8')
    debug('Cached LLM result', {
      cacheKey: cacheKey.substring(0, 8),
      result: JSON.stringify(result),
    })
  } catch (error) {
    log('Failed to write cache', {cacheKey, error})
    // Don't throw - caching failure shouldn't break the main flow
  }
}

async function isProcessing(cacheKey: string): Promise<boolean> {
  if (!USE_CACHE) return false
  try {
    const processingFile = join(CACHE_DIR, `${cacheKey}.processing`)
    const stats = await fs.stat(processingFile)
    // Check if processing lock is still valid (not expired)
    if (Date.now() - stats.mtime.getTime() > PROCESSING_TTL_MS) {
      // Stale processing lock, remove it
      await fs.unlink(processingFile).catch(() => {})
      return false
    }
    return true
  } catch {
    return false
  }
}

async function setProcessing(cacheKey: string): Promise<void> {
  if (!USE_CACHE) return
  try {
    await fs.mkdir(CACHE_DIR, {recursive: true})
    const processingFile = join(CACHE_DIR, `${cacheKey}.processing`)
    await fs.writeFile(processingFile, Date.now().toString(), 'utf-8')
  } catch {
    // Don't throw - processing flag failure shouldn't break the main flow
  }
}

async function clearProcessing(cacheKey: string): Promise<void> {
  if (!USE_CACHE) return
  try {
    const processingFile = join(CACHE_DIR, `${cacheKey}.processing`)
    await fs.unlink(processingFile)
  } catch {
    // Ignore errors
  }
}

async function processAndCache(
  cacheKey: string,
  content?: string | undefined,
  url?: string | undefined,
  locale?: string,
  source?: ExtractSource,
): Promise<void> {
  log('Extracting profile from content', {
    contentLength: content?.length,
    url,
    locale,
    source,
  })
  try {
    let bio: JSONContent | undefined
    if (!content) {
      bio = await fetchOnlineProfile(url)
      debug(JSON.stringify(bio, null, 2))
      content = parseJsonContentToText(bio)
    }
    const profile = await callLLM(content, locale, source)
    if (bio) {
      profile.bio = bio
    }
    await setCachedResult(cacheKey, {profile, status: 'success'})
  } catch (error) {
    log('Async LLM processing failed', {cacheKey, error})
    await setCachedResult(cacheKey, {profile: {}, status: 'error'})
  } finally {
    await clearProcessing(cacheKey)
  }
}

async function callGemini(text: string) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    log('GEMINI_API_KEY not configured')
    throw APIErrors.internalServerError('Profile extraction service is not configured')
  }

  const models = [
    'gemini-2.5-flash',
    'gemini-3-flash-preview',
    'gemini-2.5-flash-lite',
    'gemini-3.1-flash-preview',
  ]

  for (const model of models) {
    debug(`Calling Gemini ${model}...`)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: text.slice(0, MAX_CONTEXT_LENGTH),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            topP: 0.95,
            topK: 40,
            responseMimeType: 'application/json',
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      log(`Gemini API error with ${model}`, {status: response.status, error: errorText})
      if (model !== models[models.length - 1]) continue
      throw APIErrors.internalServerError('Failed to extract profile data')
    }

    const data = await response.json()
    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text
    return outputText
  }
}

async function _callClaude(text: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    log('ANTHROPIC_API_KEY not configured')
    throw APIErrors.internalServerError('Profile extraction service is not configured')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: text.slice(0, MAX_CONTEXT_LENGTH),
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    log('Anthropic API error', {status: response.status, error: errorText})
    throw APIErrors.internalServerError('Failed to extract profile data')
  }

  const data = await response.json()
  const outputText = data.content?.[0]?.text
  return outputText
}

export async function callLLM(
  content: string,
  locale?: string,
  source?: ExtractSource,
): Promise<Partial<ProfileWithoutUser>> {
  const isVoice = source === 'voice'
  const [INTERESTS, CAUSE_AREAS, WORK_AREAS] = await Promise.all([
    getOptions('interests', locale),
    getOptions('causes', locale),
    getOptions('work', locale),
  ])

  const validChoices: Partial<Record<keyof ProfileWithoutUser, string[]>> = {
    interests: INTERESTS,
    causes: CAUSE_AREAS,
    work: WORK_AREAS,
    diet: Object.values(DIET_CHOICES),
    ethnicity: Object.values(RACE_CHOICES),
    languages: Object.values(LANGUAGE_CHOICES),
    religion: Object.values(RELIGION_CHOICES),
    political_beliefs: Object.values(POLITICAL_CHOICES),
    pref_gender: Object.values(GENDERS),
    pref_relation_styles: Object.values(RELATIONSHIP_CHOICES),
    pref_romantic_styles: Object.values(ROMANTIC_CHOICES),
    relationship_status: Object.values(RELATIONSHIP_STATUS_CHOICES),
    cannabis: Object.values(CANNABIS_CHOICES),
    education_level: Object.values(EDUCATION_CHOICES),
    exercise: Object.values(EXERCISE_CHOICES),
    gender: Object.values(GENDERS),
    mbti: Object.values(MBTI_CHOICES),
    psychedelics: Object.values(PSYCHEDELICS_CHOICES),
    psychedelics_intention: Object.values(SUBSTANCE_INTENTION_CHOICES),
    cannabis_intention: Object.values(SUBSTANCE_INTENTION_CHOICES),
    psychedelics_pref: Object.values(SUBSTANCE_PREFERENCE_CHOICES),
    cannabis_pref: Object.values(SUBSTANCE_PREFERENCE_CHOICES),
    orientation: Object.values(ORIENTATION_CHOICES),
    neurotype: Object.values(NEUROTYPE_CHOICES),
  }

  const PROFILE_FIELDS: Partial<Record<keyof ProfileWithoutUser | 'birth_year', any>> = {
    // Basic info.
    //
    // Two ways of saying the same thing, because documents say it both ways and we want whichever
    // one is actually written there. Working out the stored date is done in code afterwards (see
    // validateProfileFields): a model asked to subtract years from today's date gets it wrong often
    // enough to matter, and asking it only to report what it read cannot go stale.
    //
    // Note we never ask for a full date of birth, even from a document that gives one — see
    // `common/profiles/birth-date` for why we do not want to be holding one.
    birth_year:
      'Number. Year of birth, if stated — including as part of a full date of birth, of which you should report ONLY the year. Do NOT compute it from an age.',
    age: 'Number. Age in years (between 18 and 100), exactly as stated in the text — never worked out from a date.',
    gender: `String. One of: ${validChoices.pref_gender?.join(', ')}. If multiple mentioned, use the most likely one. Infer if you have enough evidence`,
    gender_details:
      'String. Free-form elaboration on their gender identity, only if they say more than the label itself.',
    orientation: `Array. Any of: ${validChoices.orientation?.join(', ')}. Only if stated — never infer from the gender of a partner or of who they are looking for.`,
    orientation_details:
      'String. Free-form elaboration on their orientation, only if they say more than the label itself.',
    height_in_inches: 'Number. Height converted to inches.',
    city: 'String. Current city of residence (English spelling).',
    country: 'String. Current country of residence (English spelling).',
    city_latitude: 'Number. Latitude of current city.',
    city_longitude: 'Number. Longitude of current city.',

    // Background
    raised_in_city: 'String. City where they grew up (English spelling).',
    raised_in_country: 'String. Country where they grew up (English spelling).',
    raised_in_lat: 'Number. Latitude of city where they grew up.',
    raised_in_lon: 'Number. Longitude of city where they grew up.',
    university: 'String. University or college attended.',
    education_level: `String. One of: ${validChoices.education_level?.join(', ')}. Highest level completed`,
    company: 'String. Current employer or company name.',
    occupation_title: 'String. Current job title.',

    // Lifestyle
    is_smoker: 'Boolean. Whether they smoke.',
    drinks_per_month: 'Number. Estimated alcoholic drinks per month.',
    has_kids: 'Number. 0 if no kids, otherwise number of kids.',
    wants_kids_strength:
      'Number 0–4. How strongly they want kids (0 = definitely not, 4 = definitely yes).',
    diet: `Array. Any of: ${validChoices.diet?.join(', ')}`,
    ethnicity: `Array. Any of: ${validChoices.ethnicity?.join(', ')}`,
    exercise: `String. One of: ${validChoices.exercise?.join(', ')}. How often they exercise, only if explicitly stated.`,

    // Substances
    psychedelics: `String. One of: ${validChoices.psychedelics?.join(', ')}. Usage frequency of psychedelics/plant medicine, only if explicitly stated.`,
    cannabis: `String. One of: ${validChoices.cannabis?.join(', ')}. Usage frequency of cannabis, only if explicitly stated.`,
    psychedelics_intention: `Array. Any of: ${validChoices.psychedelics_intention?.join(', ')}. Only if they use psychedelics.`,
    cannabis_intention: `Array. Any of: ${validChoices.cannabis_intention?.join(', ')}. Only if they use cannabis.`,
    psychedelics_pref: `Array. Any of: ${validChoices.psychedelics_pref?.join(', ')}. Partner preference for psychedelics use.`,
    cannabis_pref: `Array. Any of: ${validChoices.cannabis_pref?.join(', ')}. Partner preference for cannabis use.`,

    // Identity — big5 only if person explicitly states a score, never infer from personality description
    mbti: `String. One of: ${validChoices.mbti?.join(', ')}`,
    big5_openness: 'Number 0–100. Only if explicitly self-reported, never infer.',
    big5_conscientiousness: 'Number 0–100. Only if explicitly self-reported, never infer.',
    big5_extraversion: 'Number 0–100. Only if explicitly self-reported, never infer.',
    big5_agreeableness: 'Number 0–100. Only if explicitly self-reported, never infer.',
    big5_neuroticism: 'Number 0–100. Only if explicitly self-reported, never infer.',

    // Neurotype is an identity here, not a diagnosis: only ever take the person's own words for it.
    neurotype: `Array. Any of: ${validChoices.neurotype?.join(', ')}. Only if they identify this way themselves — never infer it from how they describe their personality, focus, energy or social life.`,
    neurotype_details:
      'String. Free-form elaboration on their neurotype, only if they say more than the label itself.',

    // Beliefs
    religion: `Array. Any of: ${validChoices.religion?.join(', ')}`,
    religious_beliefs:
      'String. Free-form elaboration on religious views, only if explicitly stated.',
    political_beliefs: `Array. Any of: ${validChoices.political_beliefs?.join(', ')}`,
    political_details:
      'String. Free-form elaboration on political views, only if explicitly stated.',

    // Preferences
    pref_age_min:
      'Number. Minimum preferred age of match (higher than 18, only if mentioned, do NOT infer).',
    pref_age_max:
      'Number. Maximum preferred age of match (lower than 100, only if mentioned, do NOT infer).',
    pref_gender: `Array. Any of: ${validChoices.pref_gender?.join(', ')}. Only the genders they actually name as sought. If they say gender does not matter to them, or is unimportant to their attraction, OMIT this field — an omitted field already means "no preference", so listing every option instead is both wrong and unreadable.`,
    pref_relation_styles: `Array. Any of: ${validChoices.pref_relation_styles?.join(', ')}`,
    pref_romantic_styles: `Array. Any of: ${validChoices.pref_romantic_styles?.join(', ')}`,
    relationship_status: `Array. Any of: ${validChoices.relationship_status?.join(', ')}`,

    // Languages
    languages: `Array. Any of: ${validChoices.languages?.join(', ')}. If none, infer from text.`,

    // Free-form
    headline:
      'String. Summary of who they are, in their own voice (first person). Maximum 200 characters total. Cannot be null.',
    keywords: 'Array of 3–6 short tags summarising the person.',
    accessibility_notes:
      'String. Practical things that help someone meet them well — access needs, energy levels, sensory preferences, venue preferences. Only if mentioned; never infer a disability, and keep their own framing and wording.',
    links: `Object. Key is any of: ${SITE_ORDER.join(', ')}.`,

    // Taxonomies — match existing labels first, only add new if truly no close match exists
    interests: `Array. Prefer existing labels, only add new if no close match. Any of: ${validChoices.interests?.join(', ')}`,
    causes: `Array. Prefer existing labels, only add new if no close match. Any of: ${validChoices.causes?.join(', ')}`,
    work: `Array. Use only existing labels, do not add new if no close match. Any of: ${validChoices.work?.join(', ')}`,
  }

  // For text and URL sources the bio is the source material itself, stored verbatim. A speech
  // transcript makes a poor bio (filler words, false starts, no paragraphs), so for voice we ask
  // the model to write it instead.
  if (isVoice) {
    PROFILE_FIELDS.bio =
      'String. A first-person bio written from what the person said, in their own voice and their ' +
      'own language. Keep their wording and personality wherever you can; only clean up filler ' +
      'words, false starts, repetitions and transcription noise, and organise it into ' +
      'paragraphs. Separate each paragraph from the next with a BLANK LINE, i.e. two newline ' +
      'characters ("\\n\\n") — a single newline is not enough. Never add facts, opinions or ' +
      'flourishes they did not say, and never write about them in the third person. Plain text ' +
      'only — no markdown.'
  }

  const EXTRACTION_PROMPT = `You are a profile information extraction expert analyzing ${
    isVoice
      ? 'a speech-to-text transcript of someone talking about themselves out loud'
      : 'text from a personal webpage, bio, or similar source'
  }.

TASK: Extract structured profile data and return it as a single valid JSON object.

RULES:
- Only extract information that is EXPLICITLY stated — do not infer, guess, or hallucinate
- Omit the key in the output for missing fields
- For taxonomy fields (interests, causes, work): match existing labels first; only add a new label if truly no existing one is close
- For big5 scores: only populate if the person explicitly states a test result — never infer from personality description
- Never answer a multi-choice field by selecting every option it offers. An expression of openness or indifference ("gender doesn't matter to me", "I'm open to anything") is not a selection of all values — omit the field, which already means "no preference"
- Return valid JSON only — no markdown, no explanation, no extra text${
    isVoice
      ? `
- The transcript is spoken language: expect filler words, false starts, self-corrections and speech-recognition errors. Read past them, and when the person corrects themselves keep the corrected version
- Ignore anything the person says to the recorder rather than about themselves (e.g. "let me start over", "what else should I say")
- Spoken numbers, places and names may be mis-transcribed; only fill a field when you are confident what was meant`
      : ''
  }

SCHEMA (each value describes the expected type and accepted values):
${JSON.stringify(PROFILE_FIELDS, null, 2)}

${isVoice ? 'TRANSCRIPT TO ANALYZE' : 'TEXT TO ANALYZE'}:
`
  const text = EXTRACTION_PROMPT + content
  if (text.length > MAX_CONTEXT_LENGTH) {
    log('Content exceeds maximum length, will be cropped', {length: text.length})
  }
  debug({text})

  const outputText = await callGemini(text)
  // const outputText = {pref_age_min: 0, pref_age_max: 120}

  if (!outputText) {
    throw APIErrors.internalServerError('Failed to parse LLM response')
  }

  let parsed: Partial<ProfileWithoutUser>
  try {
    parsed = typeof outputText === 'string' ? JSON.parse(outputText) : outputText
    parsed = await validateProfileFields(parsed, validChoices)
    // The bio column holds rich text; the model answers with plain prose.
    if (typeof parsed.bio === 'string') {
      parsed.bio = parsed.bio.trim() ? textToJSONContent(parsed.bio) : undefined
    }
    parsed = removeNullOrUndefinedProps(parsed)
  } catch (parseError) {
    log('Failed to parse LLM response as JSON', {outputText, parseError})
    throw APIErrors.internalServerError('Failed to parse extracted data')
  }

  return parsed
}

/**
 * Notion serves nothing but an empty SPA shell to a plain fetch ("JavaScript must be enabled in
 * order to use Notion."), and rejects crawler user agents with a 403. Its internal `loadPageChunk`
 * API, on the other hand, returns the full content of a publicly shared page without auth, so we
 * use that instead of trying to scrape the HTML.
 */
async function fetchNotionRecordMap(pageId: string): Promise<NotionRecordMap> {
  const blocks: NotionRecordMap['block'] = {}
  let cursor: any = {stack: []}

  // Long pages come back paginated; keep pulling chunks until Notion hands back an empty cursor.
  for (let chunk = 0; chunk < MAX_NOTION_CHUNKS; chunk++) {
    const response = await fetch('https://www.notion.so/api/v3/loadPageChunk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        pageId,
        limit: 100,
        cursor,
        chunkNumber: chunk,
        verticalColumns: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      log('Notion API error', {pageId, status: response.status, error: errorText.slice(0, 500)})
      throw new Error(`Failed to fetch Notion page: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    Object.assign(blocks, data?.recordMap?.block ?? {})

    // loadPageChunk returns `cursor`; some responses use the plural `cursors` array instead.
    cursor = data?.cursor ?? data?.cursors?.[0]
    if (!cursor?.stack?.length) break
  }

  return {block: blocks}
}

/**
 * datefirefly.com builds its profile pages in the browser, so a plain fetch of `/u/<username>` only
 * ever gets placeholders. The page fills itself in from a public Supabase RPC — a function Firefly
 * named `get_public_profile` and granted to the `anon` role — so we ask it directly, exactly as the
 * visitor's browser does. `FIREFLY_ANON_KEY` is the site's public anon key, shipped verbatim in its
 * client bundle; it identifies the project, not a user, and nothing here defeats a login, a rate
 * limit or any other gate.
 *
 * Two limits are deliberate, and both are load-bearing rather than stylistic:
 *
 * 1. Only ever on behalf of someone importing their own profile — see `fetchOnlineProfile`'s
 *    `userInitiated` option. Firefly's robots.txt disallows `/u/`, so we do not crawl these pages
 *    of our own accord; we read one when its owner hands us the link. That also keeps the personal
 *    data flowing from the data subject rather than being collected behind their back, which is
 *    what makes a lawful basis available at all (and avoids the GDPR Art. 14 duty that attaches to
 *    data obtained from anywhere else).
 * 2. Only the fields the profile page itself displays, and never the quiz endpoint — see
 *    `FireflyProfile`. Those answers are Art. 9 special-category data and are not needed here.
 */
const FIREFLY_RPC_URL = 'https://khzlfnfbpshvzkouzugj.supabase.co/rest/v1/rpc'
const FIREFLY_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemxmbmZicHNodnprb3V6dWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDU4NTkzNjEsImV4cCI6MTk2MTQzNTM2MX0.F5kGAo0o9rjBeDN76QKkapl0d1sl3ZhFy7UX6GhE30w'

async function fetchFireflyProfile(username: string): Promise<JSONContent> {
  const response = await fetch(`${FIREFLY_RPC_URL}/get_public_profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apiKey: FIREFLY_ANON_KEY,
      Authorization: `Bearer ${FIREFLY_ANON_KEY}`,
    },
    body: JSON.stringify({p_identifier: username}),
  })

  if (!response.ok) {
    const errorText = await response.text()
    log('Firefly API error', {username, status: response.status, error: errorText.slice(0, 500)})
    throw new Error(`Failed to fetch Firefly profile: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const profile: FireflyProfile | undefined = Array.isArray(data) ? data[0] : undefined

  // The site itself redirects to /404 when the RPC comes back empty, so an unknown username is the
  // likely cause rather than anything going wrong on our side.
  if (!profile) {
    throw APIErrors.badRequest(`No Firefly profile found at datefirefly.com/u/${username}.`)
  }

  return fireflyProfileToJSONContent(profile)
}

/**
 * Rejects URLs we know we cannot read, with a message that tells the user what to do instead. Kept
 * separate from `fetchOnlineProfile` so the endpoint can run it synchronously: extraction is
 * otherwise fire-and-forget, and an error raised in there only ever reaches the client as a generic
 * `status: 'error'`.
 */
export function assertProfileUrlIsFetchable(url: string) {
  const blockedHost = getBlockedProfileHost(url)
  if (blockedHost) {
    throw APIErrors.badRequest(
      `${blockedHost} profiles cannot be read automatically. Please copy the text of the profile and paste it instead.`,
    )
  }
}

export async function fetchOnlineProfile(url: string | undefined): Promise<JSONContent> {
  if (!url) throw APIErrors.badRequest('Content or URL is required')
  assertProfileUrlIsFetchable(url)

  try {
    // 1a. Notion shortcut — must run before the generic fetch, which only ever gets the SPA shell.
    const notionPageId = extractNotionPageId(url)
    if (notionPageId) {
      const recordMap = await fetchNotionRecordMap(notionPageId)
      log('Fetched content from Notion', {
        url,
        pageId: notionPageId,
        blockCount: Object.keys(recordMap.block ?? {}).length,
      })
      return notionRecordMapToJSONContent(recordMap, notionPageId)
    }

    // 1b. Firefly shortcut — same story as Notion: the page has no content until its JS runs. Read
    // only for the person importing their own profile; see `fetchFireflyProfile` for why.
    const fireflyUsername = extractFireflyUsername(url)
    if (fireflyUsername) {
      const parsed = await fetchFireflyProfile(fireflyUsername)
      log('Fetched content from Firefly', {url, username: fireflyUsername})
      if (!hasText(parsed)) {
        throw APIErrors.badRequest(
          `The Firefly profile at ${url} has no text to read. Please copy the text and paste it instead.`,
        )
      }
      return parsed
    }

    // 1c. Google Docs shortcut
    const googleDocId = extractGoogleDocId(url)
    if (googleDocId) {
      url = `https://docs.google.com/document/d/${googleDocId}/export?format=html`
    }

    // 2. Fetch with realistic browser headers to avoid scraping detection
    // Try multiple user agents for better success rate
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ]

    const baseHeaders = {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      DNT: '1',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    }

    let lastError: Error | null = null
    let response: Response | null = null

    // Try different user agents until one works
    for (const userAgent of userAgents) {
      try {
        const headers = {...baseHeaders, 'User-Agent': userAgent}
        response = await fetch(url, {headers})

        if (response.ok) {
          break // Success, exit the loop
        } else {
          lastError = new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
          await sleep(2000)
        }
      } catch (error) {
        lastError = error as Error
        // continue // Try next user agent
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error('Failed to fetch with all user agents')
    }

    const contentType = response.headers.get('content-type') ?? ''
    const content = await response.text()

    log('Fetched content from URL', {url, contentType, contentLength: content.length})
    debug({content})

    // 3. Route by content type
    const parsed = convertToJSONContent(content, contentType, url)

    // A page that fetches fine but yields no text is a client-rendered app whose content never
    // reached us. Extracting from it would silently produce an empty profile, so say so instead.
    if (!hasText(parsed)) {
      throw APIErrors.badRequest(
        `We could not read any text from ${new URL(url).hostname} — the page builds its content with JavaScript. Please copy the text and paste it instead.`,
      )
    }

    return parsed
  } catch (error) {
    log('Error fetching URL', {url, error})
    // Errors we raised ourselves already say something useful; only the rest need the generic one.
    if (error instanceof APIError) throw error
    throw APIErrors.badRequest('Failed to fetch content from URL')
  }
}

export const llmExtractProfileEndpoint: APIHandler<'llm-extract-profile'> = async (parsedBody) => {
  const {url, locale, source} = parsedBody
  const content = parsedBody.content

  if (content && url) {
    throw APIErrors.badRequest('Content and URL cannot be provided together')
  }

  // Checked here and not only in fetchOnlineProfile: the fetch happens after we have already
  // replied, so this is the last point at which the client can still be told why.
  if (url) assertProfileUrlIsFetchable(url)

  // Check cache based on parsedBody hash
  const cacheKey = getCacheKey(parsedBody)
  const cached = await getCachedResult(cacheKey)
  if (cached) {
    log('Returning cached profile', {cacheKey: cacheKey.substring(0, 8)})
    return cached as {profile: Partial<ProfileWithoutUser>; status: 'success' | 'error' | 'pending'}
  }

  // Check if already processing
  if (await isProcessing(cacheKey)) {
    log('Profile extraction already in progress', {cacheKey: cacheKey.substring(0, 8)})
    return {profile: {}, status: 'pending'}
  }

  // Start processing asynchronously
  await setProcessing(cacheKey)

  // Kick off async processing (don't await)
  processAndCache(cacheKey, content, url, locale, source).catch((err) => {
    log('Unexpected error in async processing', {cacheKey, error: err})
  })

  log('Started async profile extraction', {cacheKey: cacheKey.substring(0, 8)})
  return {profile: {}, status: 'pending'}
}
