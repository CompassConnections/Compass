import {APIErrors} from 'common/api/utils'
import {debug} from 'common/logger'
import {log} from 'shared/monitoring/log'

/**
 * Tried in order; the first that answers wins. A model being retired, rate-limited or briefly
 * unavailable is the common case, not an exceptional one, so a failure falls through to the next
 * rather than failing the request.
 */
const MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-preview',
]

/** Default ceiling on prompt size, inherited from the profile extractor that this was factored out of. */
export const DEFAULT_MAX_CONTEXT_LENGTH = 7 * 10 * 30 * 50

/**
 * One JSON-mode Gemini completion, or `null` when the key is not configured.
 *
 * Returning `null` rather than throwing on a missing key is deliberate: the duplicate-option check
 * in `check-option-name` is an *improvement* on a trigram shortlist, not a requirement, and a
 * deployment without `GEMINI_API_KEY` should still be able to add an interest. Callers that genuinely
 * cannot proceed without a model (the profile extractor) turn the `null` into an error themselves.
 */
export async function callGemini(
  prompt: string,
  opts: {maxContextLength?: number; temperature?: number} = {},
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    log('GEMINI_API_KEY not configured')
    return null
  }

  const {maxContextLength = DEFAULT_MAX_CONTEXT_LENGTH, temperature = 0} = opts

  for (const model of MODELS) {
    debug(`Calling Gemini ${model}...`)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          contents: [{parts: [{text: prompt.slice(0, maxContextLength)}]}],
          generationConfig: {
            temperature,
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
      if (model !== MODELS[MODELS.length - 1]) continue
      throw APIErrors.internalServerError('Failed to reach the language model')
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null
  }
  return null
}
