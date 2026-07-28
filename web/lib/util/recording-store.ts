import {debug} from 'common/logger'
import {WEEK_MS} from 'common/util/time'

/**
 * On-device persistence for an in-progress voice auto-fill recording, so that switching tabs,
 * reloading, or closing the app never costs someone the minute they just spent talking.
 *
 * IndexedDB rather than `localStorage`, for three reasons:
 *  - it stores a `Blob` natively; localStorage is strings only, so audio would have to be base64'd,
 *    inflating it by a third
 *  - localStorage's ~5 MB origin budget is shared with everything else we keep there, and
 *    `safeLocalStorage` reacts to a quota error by calling `store.clear()` — a long recording could
 *    therefore wipe the user's saved profile draft
 *  - localStorage is synchronous, so writing megabytes of audio would jank the main thread
 */

const DB_NAME = 'compass'
const STORE = 'pending-recordings'
const VERSION = 1
// Only ever one profile recording in flight, so a fixed key keeps this a single-row store.
const KEY = 'profile-voice-autofill'
// Audio is bulky; don't sit on someone's voice indefinitely if they never came back to it.
const TTL_MS = WEEK_MS

export type PendingRecording = {
  blob: Blob
  mimeType: string
  /** Recording length in seconds, so the UI can show it without decoding the audio. */
  seconds: number
  /** Present once transcribed, so a reload does not force a second (paid) transcription. */
  transcript: string | null
  createdAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('IndexedDB upgrade blocked'))
  })
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
  )
}

// Private browsing, disabled storage and SSR all make IndexedDB unavailable. Persistence is a
// convenience, never a precondition for recording, so every failure degrades to "not saved".
const available = () => typeof indexedDB !== 'undefined'

export async function savePendingRecording(
  entry: Omit<PendingRecording, 'createdAt'>,
): Promise<void> {
  if (!available()) return
  try {
    await tx('readwrite', (s) => s.put({...entry, createdAt: Date.now()}, KEY))
  } catch (e) {
    debug('failed to persist recording', e)
  }
}

/** Updates the transcript on the stored recording, leaving the audio untouched. */
export async function savePendingTranscript(transcript: string | null): Promise<void> {
  if (!available()) return
  try {
    const existing = await tx<PendingRecording | undefined>('readonly', (s) => s.get(KEY))
    if (!existing) return
    await tx('readwrite', (s) => s.put({...existing, transcript}, KEY))
  } catch (e) {
    debug('failed to persist transcript', e)
  }
}

export async function loadPendingRecording(): Promise<PendingRecording | null> {
  if (!available()) return null
  try {
    const entry = await tx<PendingRecording | undefined>('readonly', (s) => s.get(KEY))
    if (!entry) return null
    if (Date.now() - entry.createdAt > TTL_MS) {
      await clearPendingRecording()
      return null
    }
    return entry
  } catch (e) {
    debug('failed to load recording', e)
    return null
  }
}

export async function clearPendingRecording(): Promise<void> {
  if (!available()) return
  try {
    await tx('readwrite', (s) => s.delete(KEY))
  } catch (e) {
    debug('failed to clear recording', e)
  }
}
