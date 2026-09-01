import {JSONContent} from '@tiptap/core'

jest.mock('shared/firebase-utils')
jest.mock('shared/monitoring/log', () => ({log: jest.fn()}))

/**
 * `downloadUrl` builds from FIREBASE_STORAGE_URL, which is `localhost:9199` under the Storage
 * emulator rather than firebasestorage.googleapis.com. While OWN_HOSTS was a hardcoded list, a file
 * we had just written to our own bucket read back as somebody else's: the bio kept the copied image
 * but `firstOwnedImageSrc` found nothing, so a local import produced a profile with the photo in its
 * text and no profile picture pinned.
 *
 * Its own file because the env var has to be set before `common/envs/constants` is first loaded.
 */
describe('under the storage emulator', () => {
  const emulated =
    'http://localhost:9199/v0/b/compass-57c3c.firebasestorage.app/o/user-images%2Fclb%2Fimported%2Fabc.jpg?alt=media'
  const doc = (src: string): JSONContent => ({
    type: 'doc',
    content: [{type: 'image', attrs: {src}}],
  })

  const loadWith = (emulator: boolean) => {
    const previous = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR
    process.env.NEXT_PUBLIC_FIREBASE_EMULATOR = emulator ? 'true' : 'false'
    jest.resetModules()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded: typeof import('shared/profiles/rehost-images') = require('shared/profiles/rehost-images')
    process.env.NEXT_PUBLIC_FIREBASE_EMULATOR = previous
    return loaded
  }

  it('counts what the emulator serves as our own, so the photo can be pinned', () => {
    expect(loadWith(true).firstOwnedImageSrc(doc(emulated))).toBe(emulated)
  })

  it('still refuses a stray localhost URL when we are not running the emulator', () => {
    expect(loadWith(false).firstOwnedImageSrc(doc(emulated))).toBeUndefined()
  })
})
