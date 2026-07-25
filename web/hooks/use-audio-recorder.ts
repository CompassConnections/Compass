import {debug} from 'common/logger'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

/**
 * Ordered by preference. Opus in WebM is what Chromium records; `audio/mp4` (AAC) is the only thing
 * iOS Safari will give us. Both are accepted by the transcription backend.
 */
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac']

// Speech does not benefit from more, and every extra kbps is base64 we have to push over the wire.
const AUDIO_BITS_PER_SECOND = 32000

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return undefined
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type))
}

export type RecorderError = 'permission' | 'unsupported' | 'failed'

/**
 * Microphone recording with a live input level for visual feedback.
 *
 * The blob is kept until the caller explicitly clears it, so a failed upload never costs the user
 * their recording — they can retry or re-listen.
 */
export function useAudioRecorder(
  opts: {
    /**
     * Fired once a recording is finalised, before anything is uploaded — the hook's cue to the
     * caller to persist it. Kept in a ref so passing an inline closure does not re-create `start`.
     */
    onRecorded?: (blob: Blob, seconds: number) => void
  } = {},
) {
  const onRecordedRef = useRef(opts.onRecorded)
  onRecordedRef.current = opts.onRecorded

  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [seconds, setSeconds] = useState(0)
  // Smoothed microphone amplitude, 0..1. Drives the pulsing rings.
  const [level, setLevel] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<RecorderError | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const levelRef = useRef(0)

  // `onstop` fires outside React's render cycle, so it cannot read `seconds` from the closure.
  const secondsRef = useRef(0)
  useEffect(() => {
    secondsRef.current = seconds
  }, [seconds])

  const previewUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
  }, [stopTimer])

  const stopMeter = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    levelRef.current = 0
    setLevel(0)
  }, [])

  const startMeter = useCallback((stream: MediaStream) => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext
      const ctx = new Ctx()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.fftSize)
      levelRef.current = 0

      const tick = () => {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / data.length)
        // High gain plus a sub-linear curve, so a normal speaking voice (RMS ~0.05) already fills
        // most of the visible range instead of barely moving.
        const target = Math.pow(Math.min(1, rms * 6.5), 0.6)
        // Asymmetric smoothing: quick to rise, slow to fall, so the rings breathe rather than
        // snapping on every syllable.
        const prev = levelRef.current
        const next = prev + (target - prev) * (target > prev ? 0.28 : 0.08)
        levelRef.current = next
        setLevel(next)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch (e) {
      // Purely decorative — never let it break the recording itself.
      debug('audio level meter unavailable', e)
    }
  }, [])

  // Teardown on unmount: an orphaned MediaStream keeps the browser's recording indicator lit.
  useEffect(() => {
    return () => {
      stopTimer()
      stopMeter()
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [stopMeter, stopTimer])

  const start = useCallback(async () => {
    setError(null)
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('unsupported')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {echoCancellation: true, noiseSuppression: true},
      })
      streamRef.current = stream
      const mimeType = pickMimeType()
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? {mimeType} : {}),
        audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
      })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        const type = recorder.mimeType || mimeType || 'audio/webm'
        const recorded = new Blob(chunksRef.current, {type})
        setBlob(recorded)
        // Persist before any network call, so a crash mid-upload still leaves the audio on disk.
        onRecordedRef.current?.(recorded, secondsRef.current)
      }
      recorder.start()
      recorderRef.current = recorder
      setBlob(null)
      setSeconds(0)
      setIsRecording(true)
      setIsPaused(false)
      startTimer()
      startMeter(stream)
    } catch (e) {
      debug('microphone unavailable', e)
      const name = (e as {name?: string})?.name
      setError(name === 'NotAllowedError' || name === 'SecurityError' ? 'permission' : 'failed')
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [startMeter, startTimer])

  const pause = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder?.state !== 'recording') return
    recorder.pause()
    setIsPaused(true)
    stopTimer()
    stopMeter()
  }, [stopMeter, stopTimer])

  const resume = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder?.state !== 'paused') return
    recorder.resume()
    setIsPaused(false)
    startTimer()
    if (streamRef.current) startMeter(streamRef.current)
  }, [startMeter, startTimer])

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    setIsRecording(false)
    setIsPaused(false)
    stopTimer()
    stopMeter()
  }, [stopMeter, stopTimer])

  /**
   * Adopts a previously saved recording as the current one — used to rehydrate from storage after a
   * reload. Ignored while recording, so a slow restore can never clobber live audio.
   */
  const restore = useCallback((restored: Blob, recordedSeconds: number) => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') return
    setBlob(restored)
    setSeconds(recordedSeconds)
  }, [])

  /** Throws away the recording and returns to the initial state. */
  const reset = useCallback(() => {
    stop()
    setBlob(null)
    setSeconds(0)
    setError(null)
  }, [stop])

  return {
    isRecording,
    isPaused,
    seconds,
    level,
    blob,
    previewUrl,
    error,
    start,
    pause,
    restore,
    resume,
    stop,
    reset,
  }
}
