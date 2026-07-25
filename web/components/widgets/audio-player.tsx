import {PauseIcon, PlayIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {debug} from 'common/logger'
import {useCallback, useEffect, useRef, useState} from 'react'
import {useT} from 'web/lib/locale'

function formatTime(totalSeconds: number) {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 0
  const minutes = Math.floor(safe / 60)
  const seconds = Math.floor(safe % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Audio player driven by the Web Audio API rather than `<audio controls>`.
 *
 * Files produced by MediaRecorder (webm/opus) carry no duration in their container and are not
 * seekable, so a native `<audio>` element reports `duration = Infinity`, paints its scrubber as
 * full the instant playback starts, and refuses to move `currentTime`. Decoding the blob into an
 * AudioBuffer up front gives us a real duration and lets us start playback from any offset — which
 * is what makes both the moving playhead and dragging to seek possible. It also means the bar is
 * ours to style, so it follows the app's palette instead of the browser's blue.
 */
export function AudioPlayer(props: {src: string; className?: string}) {
  const {src, className} = props
  const t = useT()

  const trackRef = useRef<HTMLDivElement | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  // Position (in seconds) at which the current playback segment started...
  const offsetRef = useRef(0)
  // ...and the context clock reading when it did, so elapsed time is a subtraction.
  const startedAtRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    let cancelled = false
    const Ctx =
      window.AudioContext ||
      (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext
    const ctx = new Ctx()
    ctxRef.current = ctx
    offsetRef.current = 0
    setReady(false)
    setPlaying(false)
    setCurrent(0)

    fetch(src)
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => {
        if (cancelled) return
        bufferRef.current = decoded
        setDuration(decoded.duration)
        setReady(true)
      })
      .catch((e) => debug('failed to decode audio', e))

    return () => {
      cancelled = true
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      const source = sourceRef.current
      if (source) {
        source.onended = null
        try {
          source.stop()
        } catch {
          // Already stopped; nothing to do.
        }
        source.disconnect()
      }
      sourceRef.current = null
      bufferRef.current = null
      ctx.close().catch(() => {})
    }
  }, [src])

  const currentPosition = useCallback(() => {
    const ctx = ctxRef.current
    const buffer = bufferRef.current
    if (!ctx || !buffer || !sourceRef.current) return offsetRef.current
    return Math.min(buffer.duration, offsetRef.current + (ctx.currentTime - startedAtRef.current))
  }, [])

  const stopSource = useCallback(() => {
    const source = sourceRef.current
    if (source) {
      // Manual stop: drop the handler so it is not mistaken for reaching the end.
      source.onended = null
      try {
        source.stop()
      } catch {
        // Already stopped.
      }
      try {
        source.disconnect()
      } catch {
        // Already disconnected.
      }
      sourceRef.current = null
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startSegment = useCallback(
    (offset: number) => {
      const ctx = ctxRef.current
      const buffer = bufferRef.current
      if (!ctx || !buffer) return
      stopSource()

      const node = ctx.createBufferSource()
      node.buffer = buffer
      node.connect(ctx.destination)
      node.onended = () => {
        // Played to the end: rewind so the button is a straightforward replay.
        sourceRef.current = null
        offsetRef.current = 0
        setPlaying(false)
        setCurrent(0)
      }
      offsetRef.current = Math.min(Math.max(0, offset), buffer.duration)
      startedAtRef.current = ctx.currentTime
      node.start(0, offsetRef.current)
      sourceRef.current = node

      const tick = () => {
        const buf = bufferRef.current
        if (!buf) return
        const pos = currentPosition()
        setCurrent(pos)
        if (sourceRef.current && pos < buf.duration) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [currentPosition, stopSource],
  )

  const play = useCallback(() => {
    if (!ctxRef.current || !bufferRef.current) return
    // Browsers start the context suspended until a user gesture.
    ctxRef.current.resume().catch(() => {})
    startSegment(offsetRef.current)
    setPlaying(true)
  }, [startSegment])

  const pause = useCallback(() => {
    offsetRef.current = currentPosition()
    stopSource()
    setPlaying(false)
    setCurrent(offsetRef.current)
  }, [currentPosition, stopSource])

  const seekTo = useCallback(
    (seconds: number) => {
      const buffer = bufferRef.current
      if (!buffer) return
      const clamped = Math.min(Math.max(0, seconds), buffer.duration)
      offsetRef.current = clamped
      setCurrent(clamped)
      if (playing) startSegment(clamped)
    },
    [playing, startSegment],
  )

  const seekToPointer = (clientX: number) => {
    const buffer = bufferRef.current
    const element = trackRef.current
    if (!buffer || !element) return
    const rect = element.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    seekTo(ratio * buffer.duration)
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setDragging(false)
  }

  const percent = duration ? Math.min(100, (current / duration) * 100) : 0

  return (
    <div
      className={clsx(
        'flex w-full items-center gap-3 rounded-xl bg-canvas-50 ring-1 ring-canvas-200 px-3 py-2.5',
        className,
      )}
    >
      <button
        type="button"
        onClick={playing ? pause : play}
        disabled={!ready}
        aria-label={playing ? t('audio.pause', 'Pause') : t('audio.play', 'Play')}
        // `bg-cta` is the design system's solid brand fill; white on `primary-500` is only 3.30:1.
        className="bg-cta hover:bg-cta-hover flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-colors active:scale-95 disabled:opacity-50"
      >
        {playing ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5 pl-0.5" />}
      </button>

      <div className="min-w-0 flex-1">
        {/* Negative margin plus padding: a comfortably tall hit area around a slim visual bar. */}
        <div
          ref={trackRef}
          onPointerDown={(e) => {
            if (!ready) return
            e.currentTarget.setPointerCapture(e.pointerId)
            setDragging(true)
            seekToPointer(e.clientX)
          }}
          onPointerMove={(e) => {
            if (dragging) seekToPointer(e.clientX)
          }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(e) => {
            if (!ready) return
            if (e.key === 'ArrowLeft') {
              e.preventDefault()
              seekTo(currentPosition() - 5)
            } else if (e.key === 'ArrowRight') {
              e.preventDefault()
              seekTo(currentPosition() + 5)
            } else if (e.key === 'Home') {
              e.preventDefault()
              seekTo(0)
            } else if (e.key === 'End') {
              e.preventDefault()
              seekTo(duration)
            }
          }}
          className="relative -my-2 cursor-pointer touch-none py-2"
          role="slider"
          tabIndex={0}
          aria-label={t('audio.position', 'Playback position')}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          aria-valuetext={formatTime(current)}
        >
          <div className="relative h-1.5 rounded-full bg-canvas-200">
            <div
              className="bg-primary-500 absolute inset-y-0 left-0 rounded-full"
              style={{width: `${percent}%`}}
            />
            <div
              className={clsx(
                'bg-primary-500 ring-canvas-0 absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow ring-2 transition-transform',
                dragging && 'scale-110',
              )}
              style={{left: `${percent}%`}}
            />
          </div>
        </div>
        <div className="mt-1 flex justify-between font-mono text-[11px] tabular-nums text-ink-600">
          <span>{formatTime(current)}</span>
          <span>{duration ? formatTime(duration) : '—:—'}</span>
        </div>
      </div>
    </div>
  )
}
