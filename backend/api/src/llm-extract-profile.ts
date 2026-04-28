import {JSONContent} from '@tiptap/core'
import {getOptions} from 'api/get-options'
import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {searchLocation} from 'api/search-location'
import {
  CANNABIS_CHOICES,
  DIET_CHOICES,
  EDUCATION_CHOICES,
  GENDERS,
  LANGUAGE_CHOICES,
  MBTI_CHOICES,
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
import {ProfileWithoutUser} from 'common/profiles/profile'
import {SITE_ORDER} from 'common/socials'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {parseJsonContentToText} from 'common/util/parse'
import {HOUR_MS, MINUTE_MS, sleep} from 'common/util/time'
import {createHash} from 'crypto'
import {promises as fs} from 'fs'
import {tmpdir} from 'os'
import {join} from 'path'
import {log} from 'shared/monitoring/log'
import {convertToJSONContent, extractGoogleDocId} from 'shared/parse'

const MAX_CONTEXT_LENGTH = 7 * 10 * 30 * 50
const USE_CACHE = true
const CACHE_DIR = join(tmpdir(), 'compass-llm-cache')
const CACHE_TTL_MS = 24 * HOUR_MS
const PROCESSING_TTL_MS = 10 * MINUTE_MS

interface ParsedBody {
  content?: string
  url?: string
  locale?: string
}

function getCacheKey(parsedBody: ParsedBody): string {
  if (!USE_CACHE) return ''
  const hash = createHash('sha256')
  // Normalize: sort keys for consistent hashing
  const normalized = JSON.stringify(parsedBody, Object.keys(parsedBody).sort())
  hash.update(normalized)
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
    'psychedelics',
    'cannabis',
    'psychedelics_intention',
    'cannabis_intention',
    'psychedelics_pref',
    'cannabis_pref',
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
    debug('Cached LLM result', {cacheKey: cacheKey.substring(0, 8), result})
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
): Promise<void> {
  log('Extracting profile from content', {
    contentLength: content?.length,
    url,
    locale,
  })
  try {
    let bio: JSONContent | undefined
    if (!content) {
      bio = await fetchOnlineProfile(url)
      debug(JSON.stringify(bio, null, 2))
      content = parseJsonContentToText(bio)
    }
    const profile = await callLLM(content, locale)
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
  // We don't use it as there is no free tier
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
): Promise<Partial<ProfileWithoutUser>> {
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
    gender: Object.values(GENDERS),
    mbti: Object.values(MBTI_CHOICES),
    psychedelics: Object.values(PSYCHEDELICS_CHOICES),
    psychedelics_intention: Object.values(SUBSTANCE_INTENTION_CHOICES),
    cannabis_intention: Object.values(SUBSTANCE_INTENTION_CHOICES),
    psychedelics_pref: Object.values(SUBSTANCE_PREFERENCE_CHOICES),
    cannabis_pref: Object.values(SUBSTANCE_PREFERENCE_CHOICES),
  }

  const PROFILE_FIELDS: Partial<Record<keyof ProfileWithoutUser, any>> = {
    // Basic info
    age: 'Number. Age in years (between 18 and 100).',
    gender: `String. One of: ${validChoices.pref_gender?.join(', ')}. If multiple mentioned, use the most likely one. Infer if you have enough evidence`,
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

    // Substances
    psychedelics: `String. One of: ${validChoices.psychedelics?.join(', ')}. Usage frequency of psychedelics/plant medicine, only if explicitly stated.`,
    cannabis: `String. One of: ${validChoices.cannabis?.join(', ')}. Usage frequency of cannabis, only if explicitly stated.`,
    psychedelics_intention: `String. Array. Any of: ${validChoices.psychedelics_intention?.join(', ')}. Only if they use psychedelics.`,
    cannabis_intention: `String. Array. Any of: ${validChoices.cannabis_intention?.join(', ')}. Only if they use cannabis.`,
    psychedelics_pref: `String. Array. Any of: ${validChoices.psychedelics_pref?.join(', ')}. Partner preference for psychedelics use.`,
    cannabis_pref: `String. Array. Any of: ${validChoices.cannabis_pref?.join(', ')}. Partner preference for cannabis use.`,

    // Identity — big5 only if person explicitly states a score, never infer from personality description
    mbti: `String. One of: ${validChoices.mbti?.join(', ')}`,
    big5_openness: 'Number 0–100. Only if explicitly self-reported, never infer.',
    big5_conscientiousness: 'Number 0–100. Only if explicitly self-reported, never infer.',
    big5_extraversion: 'Number 0–100. Only if explicitly self-reported, never infer.',
    big5_agreeableness: 'Number 0–100. Only if explicitly self-reported, never infer.',
    big5_neuroticism: 'Number 0–100. Only if explicitly self-reported, never infer.',

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
    pref_gender: `Array. Any of: ${validChoices.pref_gender?.join(', ')}`,
    pref_relation_styles: `Array. Any of: ${validChoices.pref_relation_styles?.join(', ')}`,
    pref_romantic_styles: `Array. Any of: ${validChoices.pref_romantic_styles?.join(', ')}`,
    relationship_status: `Array. Any of: ${validChoices.relationship_status?.join(', ')}`,

    // Languages
    languages: `Array. Any of: ${validChoices.languages?.join(', ')}. If none, infer from text.`,

    // Free-form
    headline:
      'String. Summary of who they are, in their own voice (first person). Maximum 200 characters total. Cannot be null.',
    keywords: 'Array of 3–6 short tags summarising the person.',
    links: `Object. Key is any of: ${SITE_ORDER.join(', ')}.`,

    // Taxonomies — match existing labels first, only add new if truly no close match exists
    interests: `Array. Prefer existing labels, only add new if no close match. Any of: ${validChoices.interests?.join(', ')}`,
    causes: `Array. Prefer existing labels, only add new if no close match. Any of: ${validChoices.causes?.join(', ')}`,
    work: `Array. Use only existing labels, do not add new if no close match. Any of: ${validChoices.work?.join(', ')}`,
  }

  const EXTRACTION_PROMPT = `You are a profile information extraction expert analyzing text from a personal webpage, LinkedIn, bio, or similar source.

TASK: Extract structured profile data and return it as a single valid JSON object.

RULES:
- Only extract information that is EXPLICITLY stated — do not infer, guess, or hallucinate
- Omit the key in the output for missing fields
- For taxonomy fields (interests, causes, work): match existing labels first; only add a new label if truly no existing one is close
- For big5 scores: only populate if the person explicitly states a test result — never infer from personality description
- Return valid JSON only — no markdown, no explanation, no extra text

SCHEMA (each value describes the expected type and accepted values):
${JSON.stringify(PROFILE_FIELDS, null, 2)}

TEXT TO ANALYZE:
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
    parsed = removeNullOrUndefinedProps(parsed)
  } catch (parseError) {
    log('Failed to parse LLM response as JSON', {outputText, parseError})
    throw APIErrors.internalServerError('Failed to parse extracted data')
  }

  return parsed
}

export async function fetchOnlineProfile(url: string | undefined): Promise<JSONContent> {
  if (!url) throw APIErrors.badRequest('Content or URL is required')

  try {
    // 1. Google Docs shortcut
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
    return convertToJSONContent(content, contentType, url)
  } catch (error) {
    log('Error fetching URL', {url, error})
    throw APIErrors.badRequest('Failed to fetch content from URL')
  }
}

export const llmExtractProfileEndpoint: APIHandler<'llm-extract-profile'> = async (parsedBody) => {
  const {url, locale} = parsedBody
  const content = parsedBody.content

  if (content && url) {
    throw APIErrors.badRequest('Content and URL cannot be provided together')
  }

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
  processAndCache(cacheKey, content, url, locale).catch((err) => {
    log('Unexpected error in async processing', {cacheKey, error: err})
  })

  log('Started async profile extraction', {cacheKey: cacheKey.substring(0, 8)})
  return {profile: {}, status: 'pending'}
}
