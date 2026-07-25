import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {debug} from 'common/logger'
import {log} from 'shared/monitoring/log'

// Whisper's own hard limit is 25 MB. We cap below that so we reject with a friendly message rather
// than letting OpenAI 413 on us. Opus runs ~200-400 KB/minute, so this is many minutes of speech.
const MAX_AUDIO_BYTES = 20 * 1024 * 1024

// `gpt-4o-transcribe` is Whisper's successor and the default in our other voice codebase; set
// OPENAI_TRANSCRIBE_MODEL=whisper-1 to fall back to classic Whisper.
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-transcribe'

// Container → file extension. OpenAI infers the codec from the uploaded filename, so this has to be
// right; `;codecs=...` suffixes that browsers append are stripped first.
const EXTENSION_BY_MIME: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'mp4',
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/flac': 'flac',
}

function parseMimeType(mimeType: string): {contentType: string; extension: string} {
  const base = mimeType.split(';')[0].trim().toLowerCase()
  const extension = EXTENSION_BY_MIME[base]
  if (extension) return {contentType: base, extension}
  // Unknown container: webm/opus is what every Chromium browser records, so it is the safest guess.
  log('Unsupported audio mime type, falling back to audio/webm', {mimeType})
  return {contentType: 'audio/webm', extension: 'webm'}
}

// Whisper takes an ISO-639-1 code; our locales are either 'en' or 'en-US'-shaped.
function toLanguageCode(locale: string | undefined): string | undefined {
  const code = locale?.split(/[-_]/)[0]?.toLowerCase()
  return code && /^[a-z]{2}$/.test(code) ? code : undefined
}

export const transcribeAudio: APIHandler<'transcribe-audio'> = async (props) => {
  const {audio, mimeType, locale} = props

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    log('OPENAI_API_KEY not configured')
    throw APIErrors.internalServerError('Voice transcription is not configured')
  }

  // `audio` is base64: 4 characters encode 3 bytes.
  const sizeInBytes = Math.floor((audio.length * 3) / 4)
  if (sizeInBytes > MAX_AUDIO_BYTES) {
    throw APIErrors.badRequest('Recording is too long. Please record a shorter message.')
  }

  const {contentType, extension} = parseMimeType(mimeType)
  const language = toLanguageCode(locale)
  log('Transcribing audio', {mimeType, contentType, sizeInBytes, model: TRANSCRIBE_MODEL, language})

  const form = new FormData()
  form.append(
    'file',
    new Blob([Buffer.from(audio, 'base64')], {type: contentType}),
    `voice.${extension}`,
  )
  form.append('model', TRANSCRIBE_MODEL)
  // Punctuated, readable text — the extraction step downstream reads much better prose than a
  // single unbroken run of words.
  form.append('response_format', 'text')
  if (language) form.append('language', language)

  let response: Response
  try {
    response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {Authorization: `Bearer ${apiKey}`},
      body: form,
    })
  } catch (error) {
    log('OpenAI transcription request failed', {error})
    throw APIErrors.internalServerError('Failed to transcribe the recording')
  }

  if (!response.ok) {
    const errorText = await response.text()
    log('OpenAI transcription API error', {status: response.status, error: errorText})
    throw APIErrors.internalServerError('Failed to transcribe the recording')
  }

  const transcript = (await response.text()).trim()
  debug({transcript})

  if (!transcript) {
    throw APIErrors.badRequest('We could not hear any speech in that recording. Please try again.')
  }

  return {transcript}
}
