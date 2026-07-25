import {
  ArrowPathIcon,
  MicrophoneIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {useEffect, useState} from 'react'
import Textarea from 'react-expanding-textarea'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {AudioPlayer} from 'web/components/widgets/audio-player'
import {useAudioRecorder} from 'web/hooks/use-audio-recorder'
import {useT} from 'web/lib/locale'
import {
  clearPendingRecording,
  loadPendingRecording,
  savePendingRecording,
  savePendingTranscript,
} from 'web/lib/util/recording-store'
import {isAndroidApp} from 'web/lib/util/webview'

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Talking prompts. Deliberately open-ended and unordered — the point is to unblock someone staring
 * at a mic button, not to turn speaking into another form to fill in.
 */
function useTalkingPoints() {
  const t = useT()
  return [
    t('profile.voice.prompt.who', "What's your gender, how old are you, and where do you live?"),
    t('profile.voice.prompt.work', 'What do you do — work, studies, projects?'),
    t('profile.voice.prompt.time', 'How do you like to spend your time?'),
    t('profile.voice.prompt.care', 'What do you care about most?'),
    t('profile.voice.prompt.looking', 'What kind of connection are you looking for?'),
  ]
}

export function VoiceAutofillSection(props: {
  /** Runs transcription; resolves to the transcript, or null when it failed. */
  onTranscribe: (blob: Blob) => Promise<string | null>
  /** Hands the (possibly edited) transcript to the profile extractor. */
  onExtract: (transcript: string) => Promise<void>
  isExtracting: boolean
  isSubmitting: boolean
  progress: number
}) {
  const {onTranscribe, onExtract, isExtracting, isSubmitting, progress} = props
  const t = useT()
  const talkingPoints = useTalkingPoints()
  const recorder = useAudioRecorder({
    onRecorded: (recorded, recordedSeconds) => {
      void savePendingRecording({
        blob: recorded,
        mimeType: recorded.type,
        seconds: recordedSeconds,
        transcript: null,
      })
    },
  })
  const {isRecording, isPaused, seconds, level, blob, previewUrl, restore} = recorder

  const [isTranscribing, setIsTranscribing] = useState(false)
  // Kept in state (not just handed straight to the extractor) so the user can read what we heard and
  // fix any mis-transcribed names or places before it becomes their profile.
  const [transcript, setTranscript] = useState<string | null>(null)

  // Rehydrate whatever was left behind by a reload, an app close, or an earlier session. Runs once;
  // `restore` no-ops if a recording is already under way.
  useEffect(() => {
    let cancelled = false
    loadPendingRecording().then((pending) => {
      if (cancelled || !pending) return
      restore(pending.blob, pending.seconds)
      if (pending.transcript) setTranscript(pending.transcript)
    })
    return () => {
      cancelled = true
    }
  }, [restore])

  const busy = isTranscribing || isExtracting || isSubmitting

  const handleTranscribe = async () => {
    if (!blob) return
    setIsTranscribing(true)
    try {
      const text = await onTranscribe(blob)
      if (text) {
        setTranscript(text)
        // Saved alongside the audio so a reload does not force a second (paid) transcription.
        void savePendingTranscript(text)
      }
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleExtract = async () => {
    if (!transcript?.trim()) return
    await onExtract(transcript.trim())
    // The recording has served its purpose; the extracted fields are the artefact now.
    setTranscript(null)
    recorder.reset()
    void clearPendingRecording()
  }

  const startOver = () => {
    setTranscript(null)
    recorder.reset()
    void clearPendingRecording()
  }

  const errorMessage =
    recorder.error === 'permission'
      ? // In the Android app there is no browser to change a setting in: the prompt is Android's, and
        // once denied it can only be undone from the app's own permission screen.
        isAndroidApp()
        ? t(
            'profile.voice.error.permission_app',
            'We could not access your microphone. Allow the Microphone permission for Compass in your device settings, then try again.',
          )
        : t(
            'profile.voice.error.permission',
            'We could not access your microphone. Allow microphone access in your browser, then try again.',
          )
      : recorder.error === 'unsupported'
        ? t(
            'profile.voice.error.unsupported',
            'Your browser does not support voice recording. Try the link or text option instead.',
          )
        : recorder.error
          ? t('profile.voice.error.failed', 'Recording failed. Please try again.')
          : null

  return (
    <Col className="gap-4">
      <div>
        {t(
          'profile.voice.description',
          'Rather talk than type? Record yourself for a few minutes and we will fill in your profile from what you say.',
        )}
      </div>
      <div className="guidance">
        {t(
          'profile.voice.guidance',
          'Heads up: your recording is sent to OpenAI Whisper to be transcribed, and the transcript to Google AI to fill in the fields. We pay for both services, so neither should use your content to train their models — but we never know. Prefer to keep things fully internal? Just fill the form manually — no AI involved.',
        )}
      </div>

      {transcript === null ? (
        <>
          {/* Prompts and mic sit side by side from `sm` up: stacked, they pushed the mic below the
              fold on short viewports. Talking points stay visible while recording — they are the
              script. On mobile they stack, mic underneath. */}
          <Col className="gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 rounded-xl bg-canvas-50 ring-1 ring-canvas-200 p-4">
              <p className="text-sm font-semibold text-ink-900">
                {t('profile.voice.prompts.title', 'Talk freely, or use these as a starting point:')}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-ink-700">
                {talkingPoints.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span aria-hidden className="text-primary-500">
                      •
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-ink-600">
                {t(
                  'profile.voice.prompts.footer',
                  'No need to be polished — we clean up the ums and false starts. Skip anything you would rather not share.',
                )}
              </p>
            </div>

            {!blob && (
              <Col className="shrink-0 items-center gap-2 sm:w-48">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  {isRecording && !isPaused && (
                    <>
                      <span
                        aria-hidden
                        className="absolute h-20 w-20 rounded-full bg-primary-500/15 will-change-transform"
                        style={{
                          transform: `scale(${1 + level * 1.6})`,
                          opacity: Math.max(0.05, 0.4 - level * 0.25),
                          transition: 'transform 140ms ease-out, opacity 140ms ease-out',
                        }}
                      />
                      <span
                        aria-hidden
                        className="absolute h-20 w-20 rounded-full bg-primary-500/25 will-change-transform"
                        style={{
                          transform: `scale(${1 + level * 0.85})`,
                          transition: 'transform 140ms ease-out',
                        }}
                      />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={isRecording ? recorder.stop : recorder.start}
                    disabled={busy}
                    aria-label={
                      isRecording
                        ? t('profile.voice.stop', 'Stop recording')
                        : t('profile.voice.start', 'Start recording')
                    }
                    className={clsx(
                      'relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50',
                      // `bg-cta`, not `bg-primary-500`: the design system reserves this token for
                      // solid brand-coloured controls because white on primary-500 is only 3.30:1.
                      'bg-cta hover:bg-cta-hover',
                    )}
                  >
                    {isRecording ? (
                      <StopIcon className="h-8 w-8" />
                    ) : (
                      <MicrophoneIcon className="h-9 w-9" />
                    )}
                  </button>
                </div>

                {isRecording ? (
                  <>
                    <span className="font-mono text-lg tabular-nums text-ink-900">
                      {formatTime(seconds)}
                    </span>
                    <span
                      className={clsx(
                        'text-sm',
                        isPaused ? 'text-ink-600' : 'animate-pulse font-medium text-primary-700',
                      )}
                    >
                      {isPaused
                        ? t('profile.voice.paused', 'Paused')
                        : t('profile.voice.recording', 'Recording…')}
                    </span>
                    {/* Wraps rather than overflowing the narrow right-hand column. */}
                    <Row className="flex-wrap justify-center gap-2">
                      <Button
                        color="gray-outline"
                        size="sm"
                        onClick={isPaused ? recorder.resume : recorder.pause}
                      >
                        {isPaused ? (
                          <PlayIcon className="mr-1.5 h-4 w-4" />
                        ) : (
                          <PauseIcon className="mr-1.5 h-4 w-4" />
                        )}
                        {isPaused
                          ? t('profile.voice.resume', 'Resume')
                          : t('profile.voice.pause', 'Pause')}
                      </Button>
                      <Button color="indigo" size="sm" onClick={recorder.stop}>
                        {t('profile.voice.done_talking', 'I am done')}
                      </Button>
                    </Row>
                  </>
                ) : (
                  <span className="text-center text-sm text-ink-600">
                    {t('profile.voice.tap_to_record', 'Tap to start recording')}
                  </span>
                )}
              </Col>
            )}
          </Col>

          {blob && !isRecording && (
            <Col className="gap-3">
              <p className="text-sm text-ink-700">
                {t(
                  'profile.voice.review_recording',
                  'Feel free to listen before we transcribe it — {duration} recorded.',
                ).replace('{duration}', formatTime(seconds))}
              </p>
              {previewUrl && <AudioPlayer key={previewUrl} src={previewUrl} />}
              <Row className="flex-wrap gap-2">
                <Button
                  color="indigo"
                  onClick={handleTranscribe}
                  loading={isTranscribing}
                  disabled={busy}
                >
                  {isTranscribing
                    ? t('profile.voice.transcribing', 'Transcribing…')
                    : t('profile.voice.transcribe', 'Transcribe my recording')}
                </Button>
                <Button color="gray-outline" onClick={startOver} disabled={busy}>
                  <ArrowPathIcon className="mr-1.5 h-4 w-4" />
                  {t('profile.voice.record_again', 'Record again')}
                </Button>
              </Row>
            </Col>
          )}
        </>
      ) : (
        <Col className="gap-3">
          <p className="text-sm text-ink-700">
            {t(
              'profile.voice.review_transcript',
              'Here is what we heard. No need to tidy it up — the ums, the false starts, the times you changed your mind mid-sentence are all handled for you, and none of it ends up on your profile. Only worth fixing is what we misheard: names and places are the usual suspects.',
            )}
          </p>
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            // Corrections to the transcript are persisted too, so a reload does not silently undo
            // the name or city the user just fixed by hand.
            onBlur={() => void savePendingTranscript(transcript)}
            disabled={busy}
            className="border-canvas-200 bg-canvas-0 text-ink-900 focus:border-primary-500 w-full resize-none rounded-lg border p-3 text-sm leading-relaxed focus:outline-none"
          />
          {isExtracting && (
            <div className="w-full h-2 bg-canvas-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-100 ease-linear rounded-full"
                style={{width: `${Math.min(progress, 100)}%`}}
              />
            </div>
          )}
          <Row className="flex-wrap gap-2">
            <Button
              color="indigo"
              onClick={handleExtract}
              loading={isExtracting}
              disabled={busy || !transcript.trim()}
            >
              {isExtracting
                ? t('profile.llm.extract.button_extracting', 'Extracting Profile Data')
                : t('profile.voice.fill_profile', 'Fill in my profile')}
            </Button>
            <Button color="gray-outline" onClick={startOver} disabled={busy}>
              <ArrowPathIcon className="mr-1.5 h-4 w-4" />
              {t('profile.voice.record_again', 'Record again')}
            </Button>
          </Row>
        </Col>
      )}

      {errorMessage && (
        <p className="border rounded-xl border-red-900 text-red-600 text-sm p-2">{errorMessage}</p>
      )}
    </Col>
  )
}
