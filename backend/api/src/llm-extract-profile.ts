import {JSONContent} from '@tiptap/core'
import {getOptions} from 'api/get-options'
import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {searchLocation} from 'api/search-location'
import {
  DIET_CHOICES,
  EDUCATION_CHOICES,
  GENDERS,
  LANGUAGE_CHOICES,
  MBTI_CHOICES,
  POLITICAL_CHOICES,
  RACE_CHOICES,
  RELATIONSHIP_CHOICES,
  RELATIONSHIP_STATUS_CHOICES,
  RELIGION_CHOICES,
  ROMANTIC_CHOICES,
} from 'common/choices'
import {debug} from 'common/logger'
import {ProfileWithoutUser} from 'common/profiles/profile'
import {SITE_ORDER} from 'common/socials'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {parseJsonContentToText} from 'common/util/parse'
import {createHash} from 'crypto'
import {promises as fs} from 'fs'
import {tmpdir} from 'os'
import {join} from 'path'
import {log} from 'shared/monitoring/log'
import {convertToJSONContent, extractGoogleDocId} from 'shared/parse'

const MAX_CONTEXT_LENGTH = 7 * 10 * 30 * 50
const USE_CACHE = true
const CACHE_DIR = join(tmpdir(), 'compass-llm-cache')
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function getCacheKey(content: string): string {
  if (!USE_CACHE) return ''
  const hash = createHash('sha256')
  hash.update(content)
  return hash.digest('hex')
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

async function setCachedResult(
  cacheKey: string,
  result: Partial<ProfileWithoutUser>,
): Promise<void> {
  if (!USE_CACHE) return
  try {
    await fs.mkdir(CACHE_DIR, {recursive: true})
    const cacheFile = join(CACHE_DIR, `${cacheKey}.json`)
    await fs.writeFile(cacheFile, JSON.stringify(result), 'utf-8')
    debug('Cached LLM result', {cacheKey: cacheKey.substring(0, 8)})
  } catch (error) {
    log('Failed to write cache', {cacheKey, error})
    // Don't throw - caching failure shouldn't break the main flow
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

async function callLLM(content: string, locale?: string): Promise<Partial<ProfileWithoutUser>> {
  const [INTERESTS, CAUSE_AREAS, WORK_AREAS] = await Promise.all([
    getOptions('interests', locale),
    getOptions('causes', locale),
    getOptions('work', locale),
  ])

  const PROFILE_FIELDS: Partial<Record<keyof ProfileWithoutUser, any>> = {
    // Basic info
    age: 'Number. Age in years.',
    gender: `One of: ${Object.values(GENDERS).join(', ')}. Infer if you have enough evidence`,
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
    education_level: `One of: ${Object.values(EDUCATION_CHOICES).join(', ')}`,
    company: 'String. Current employer or company name.',
    occupation_title: 'String. Current job title.',

    // Lifestyle
    is_smoker: 'Boolean. Whether they smoke.',
    drinks_per_month: 'Number. Estimated alcoholic drinks per month.',
    has_kids: 'Number. 0 if no kids, otherwise number of kids.',
    wants_kids_strength:
      'Number 0–4. How strongly they want kids (0 = definitely not, 4 = definitely yes).',
    diet: `Array. Any of: ${Object.values(DIET_CHOICES).join(', ')}`,
    ethnicity: `Array. Any of: ${Object.values(RACE_CHOICES).join(', ')}`,

    // Identity — big5 only if person explicitly states a score, never infer from personality description
    mbti: `One of: ${Object.values(MBTI_CHOICES).join(', ')}`,
    big5_openness: 'Number 0–100. Only if explicitly self-reported, never infer.',
    big5_conscientiousness: 'Number 0–100. Only if explicitly self-reported, never infer.',
    big5_extraversion: 'Number 0–100. Only if explicitly self-reported, never infer.',
    big5_agreeableness: 'Number 0–100. Only if explicitly self-reported, never infer.',
    big5_neuroticism: 'Number 0–100. Only if explicitly self-reported, never infer.',

    // Beliefs
    religion: `Array. Any of: ${Object.values(RELIGION_CHOICES).join(', ')}`,
    religious_beliefs:
      'String. Free-form elaboration on religious views, only if explicitly stated.',
    political_beliefs: `Array. Any of: ${Object.values(POLITICAL_CHOICES).join(', ')}`,
    political_details:
      'String. Free-form elaboration on political views, only if explicitly stated.',

    // Preferences
    pref_age_min: 'Number. Minimum preferred age of match.',
    pref_age_max: 'Number. Maximum preferred age of match.',
    pref_gender: `Array. Any of: ${Object.values(GENDERS).join(', ')}`,
    pref_relation_styles: `Array. Any of: ${Object.values(RELATIONSHIP_CHOICES).join(', ')}`,
    pref_romantic_styles: `Array. Any of: ${Object.values(ROMANTIC_CHOICES).join(', ')}`,
    relationship_status: `Array. Any of: ${Object.values(RELATIONSHIP_STATUS_CHOICES).join(', ')}`,

    // Languages
    languages: `Array. Any of: ${Object.values(LANGUAGE_CHOICES).join(', ')}. If none, infer from text.`,

    // Free-form
    headline:
      'String. Summary of who they are, in their own voice (first person). Maximum 200 characters total. Cannot be null.',
    keywords: 'Array of 3–6 short tags summarising the person.',
    links: `Object. Key is any of: ${SITE_ORDER.join(', ')}.`,

    // Taxonomies — match existing labels first, only add new if truly no close match exists
    interests: `Array. Prefer existing labels, only add new if no close match. Any of: ${INTERESTS.join(', ')}`,
    causes: `Array. Prefer existing labels, only add new if no close match. Any of: ${CAUSE_AREAS.join(', ')}`,
    work: `Array. Use only existing labels, do not add new if no close match. Any of: ${WORK_AREAS.join(', ')}`,
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
    log('Content exceeds maximum length', {length: text.length})
    throw APIErrors.badRequest('Content exceeds maximum length')
  }
  debug({text})

  const cacheKey = getCacheKey(text)
  const cached = await getCachedResult(cacheKey)
  if (cached) {
    debug('Using cached LLM result', {cacheKey: cacheKey.substring(0, 8)})
    return cached
  }

  const outputText = await callGemini(text)
  // const outputText = JSON.stringify({})

  if (!outputText) {
    throw APIErrors.internalServerError('Failed to parse LLM response')
  }

  let parsed: Partial<ProfileWithoutUser>
  try {
    parsed = typeof outputText === 'string' ? JSON.parse(outputText) : outputText
    parsed = removeNullOrUndefinedProps(parsed)
  } catch (parseError) {
    log('Failed to parse LLM response as JSON', {outputText, parseError})
    throw APIErrors.internalServerError('Failed to parse extracted data')
  }

  if (parsed.city) {
    if (!parsed.city_latitude || !parsed.city_longitude) {
      const result = await searchLocation({term: parsed.city, limit: 1})
      const locations = result.data?.data
      parsed.city_latitude = locations?.[0]?.latitude
      parsed.city_longitude = locations?.[0]?.longitude
      parsed.country ??= locations?.[0]?.country
    }
  }
  if (parsed.raised_in_city) {
    if (!parsed.raised_in_lat || !parsed.raised_in_lon) {
      const result = await searchLocation({term: parsed.raised_in_city, limit: 1})
      const locations = result.data?.data
      parsed.raised_in_lat = locations?.[0]?.latitude
      parsed.raised_in_lon = locations?.[0]?.longitude
      parsed.raised_in_country ??= locations?.[0]?.country
    }
  }
  if (parsed.links) {
    const sites = Object.keys(parsed.links).filter((key) => SITE_ORDER.includes(key as any))
    parsed.links = sites.reduce(
      (acc, key) => {
        const link = (parsed.links as Record<string, any>)[key]
        if (link) acc[key] = link
        return acc
      },
      {} as Record<string, any>,
    )
  }

  await setCachedResult(cacheKey, parsed)

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

    // 2. Fetch with proper headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)',
        Accept: 'text/html,text/plain,*/*',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
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

export const llmExtractProfileEndpoint: APIHandler<'llm-extract-profile'> = async (
  parsedBody,
  auth,
) => {
  const {url, locale} = parsedBody
  let content = parsedBody.content

  log('Extracting profile from content', {
    contentLength: content?.length,
    url,
    locale,
    userId: auth.uid,
  })

  if (content && url) {
    throw APIErrors.badRequest('Content and URL cannot be provided together')
  }

  let bio
  if (!content) {
    bio = await fetchOnlineProfile(url)
    debug(JSON.stringify(bio, null, 2))
    content = parseJsonContentToText(bio)
  }

  const extracted = await callLLM(content, locale)

  if (bio) {
    extracted.bio = bio
  }

  log('Profile extracted successfully', {extracted})

  return extracted
}
