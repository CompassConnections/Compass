import {JSONContent} from '@tiptap/core'
import {createHash} from 'crypto'
import {lookup} from 'dns/promises'
import * as firebaseUtils from 'shared/firebase-utils'
import {firstOwnedImageSrc, rehostExternalImages} from 'shared/profiles/rehost-images'
import {Readable} from 'stream'

jest.mock('shared/firebase-utils')
jest.mock('dns/promises', () => ({lookup: jest.fn()}))
jest.mock('shared/monitoring/log', () => ({log: jest.fn()}))

const lookupMock = lookup as unknown as jest.Mock

const USERNAME = 'awlego'
const FOLDER = `user-images/${USERNAME}/love-images`

/** A bio holding one image per src, in the shape tiptap stores. */
const docWithImages = (...srcs: string[]): JSONContent => ({
  type: 'doc',
  content: [
    {type: 'paragraph', content: [{type: 'text', text: 'hi'}]},
    ...srcs.map((src) => ({type: 'image', attrs: {src, alt: 'a photo'}})),
  ],
})

const imageSrcs = (doc: JSONContent): string[] =>
  (doc.content ?? []).filter((n) => n.type === 'image').map((n) => n.attrs?.src)

function mockBucket(opts: {existingFiles?: string[]} = {}) {
  const saved: {path: string; buffer: Buffer; options: any}[] = []
  const bucket = {
    name: 'compass-test.firebasestorage.app',
    file: (path: string) => ({
      name: path,
      exists: async () => [opts.existingFiles?.includes(path) ?? false],
      save: async (buffer: Buffer, options: any) => {
        saved.push({path, buffer, options})
      },
    }),
  }
  ;(firebaseUtils.getBucket as jest.Mock).mockReturnValue(bucket)
  return {saved}
}

function mockImageResponse(body = 'jpeg-bytes', contentType = 'image/jpeg') {
  return {
    ok: true,
    status: 200,
    url: 'https://awlego.com/a.jpg',
    headers: new Headers({'content-type': contentType}),
    // The body is read as a stream so it can be cut off at the size ceiling, not with
    // `arrayBuffer()` — which buffers whatever the far end sends before anyone can object.
    body: Readable.from([Buffer.from(body)]),
    arrayBuffer: async () => Buffer.from(body),
  } as unknown as Response
}

describe('rehostExternalImages', () => {
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    jest.resetAllMocks()
    fetchSpy = jest.spyOn(global, 'fetch')
    // Every hostname is public unless a test says otherwise.
    lookupMock.mockResolvedValue([{address: '93.184.216.34', family: 4}])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('copies an external image into our bucket and rewrites the src', async () => {
    const {saved} = mockBucket()
    fetchSpy.mockResolvedValue(mockImageResponse())

    const result = await rehostExternalImages(
      docWithImages('https://awlego.com/images/dateme/kitchen-dancing.jpg'),
      USERNAME,
    )

    expect(saved).toHaveLength(1)
    expect(saved[0].path).toMatch(new RegExp(`^${FOLDER}/[0-9a-f]{32}\\.jpg$`))
    expect(saved[0].options.public).toBe(true)
    expect(saved[0].options.metadata.contentType).toBe('image/jpeg')
    expect(imageSrcs(result)).toEqual([
      `https://firebasestorage.googleapis.com/v0/b/compass-test.firebasestorage.app/o/${encodeURIComponent(
        saved[0].path,
      )}?alt=media`,
    ])
  })

  it('keeps the rest of the document intact', async () => {
    mockBucket()
    fetchSpy.mockResolvedValue(mockImageResponse())

    const result = await rehostExternalImages(docWithImages('https://awlego.com/a.jpg'), USERNAME)

    expect(result.type).toBe('doc')
    expect(result.content?.[0]).toEqual({type: 'paragraph', content: [{type: 'text', text: 'hi'}]})
    // Attributes other than src survive the rewrite.
    expect(result.content?.[1].attrs?.alt).toBe('a photo')
  })

  it('downloads a repeated src only once', async () => {
    const {saved} = mockBucket()
    fetchSpy.mockResolvedValue(mockImageResponse())

    const result = await rehostExternalImages(
      docWithImages('https://awlego.com/a.jpg', 'https://awlego.com/a.jpg'),
      USERNAME,
    )

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(saved).toHaveLength(1)
    expect(imageSrcs(result)[0]).toEqual(imageSrcs(result)[1])
  })

  it('reuses an already-copied object without refetching', async () => {
    // The storage key is sha256(src).slice(0, 32) — stable, so a second import of the same page
    // (or a second person importing it) hits the object already in the bucket.
    const existing = `${FOLDER}/${createHash('sha256')
      .update('https://awlego.com/a.jpg')
      .digest('hex')
      .slice(0, 32)}.jpg`
    const {saved} = mockBucket({existingFiles: [existing]})
    fetchSpy.mockResolvedValue(mockImageResponse())

    const result = await rehostExternalImages(docWithImages('https://awlego.com/a.jpg'), USERNAME)

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(saved).toHaveLength(0)
    expect(imageSrcs(result)[0]).toContain(encodeURIComponent(existing))
  })

  it('leaves images we already host alone', async () => {
    const {saved} = mockBucket()
    const src =
      'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/user-images%2FMartin%2Fa.jpg?alt=media'

    const result = await rehostExternalImages(docWithImages(src), USERNAME)

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(saved).toHaveLength(0)
    expect(imageSrcs(result)).toEqual([src])
  })

  it('leaves the original src when the fetch fails', async () => {
    mockBucket()
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers(),
    } as unknown as Response)

    const result = await rehostExternalImages(docWithImages('https://awlego.com/a.jpg'), USERNAME)

    expect(imageSrcs(result)).toEqual(['https://awlego.com/a.jpg'])
  })

  it('leaves the original src when the host serves something that is not an image', async () => {
    const {saved} = mockBucket()
    fetchSpy.mockResolvedValue(mockImageResponse('<html>nope</html>', 'text/html; charset=utf-8'))

    const result = await rehostExternalImages(docWithImages('https://awlego.com/a.jpg'), USERNAME)

    expect(saved).toHaveLength(0)
    expect(imageSrcs(result)).toEqual(['https://awlego.com/a.jpg'])
  })

  it('never fetches an address inside our own network', async () => {
    mockBucket()
    lookupMock.mockResolvedValue([{address: '169.254.169.254', family: 4}])

    const result = await rehostExternalImages(
      docWithImages('https://metadata.example.com/a.jpg'),
      USERNAME,
    )

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(imageSrcs(result)).toEqual(['https://metadata.example.com/a.jpg'])
  })

  it('re-checks the address after a redirect', async () => {
    mockBucket()
    lookupMock.mockImplementation(async (hostname: string) =>
      hostname === 'evil.example.com'
        ? [{address: '93.184.216.34', family: 4}]
        : [{address: '127.0.0.1', family: 4}],
    )
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 302,
      headers: new Headers({location: 'http://localhost:8080/secret'}),
    } as unknown as Response)

    const result = await rehostExternalImages(
      docWithImages('https://evil.example.com/a.jpg'),
      USERNAME,
    )

    // The first hop was allowed; the redirect target was not followed.
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(imageSrcs(result)).toEqual(['https://evil.example.com/a.jpg'])
  })

  it('rejects a src that is not http(s)', async () => {
    mockBucket()

    const result = await rehostExternalImages(
      docWithImages('data:image/png;base64,iVBORw0KGgo='),
      USERNAME,
    )

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(imageSrcs(result)).toEqual(['data:image/png;base64,iVBORw0KGgo='])
  })

  it('finds images nested anywhere in the document', async () => {
    const {saved} = mockBucket()
    fetchSpy.mockResolvedValue(mockImageResponse())

    const result = await rehostExternalImages(
      {
        type: 'doc',
        content: [
          {
            type: 'blockquote',
            content: [{type: 'image', attrs: {src: 'https://awlego.com/nested.jpg'}}],
          },
        ],
      },
      USERNAME,
    )

    expect(saved).toHaveLength(1)
    expect(result.content?.[0].content?.[0].attrs?.src).toContain(encodeURIComponent(FOLDER))
  })

  it('files the copies under the importing user, not a shared folder', async () => {
    const {saved} = mockBucket()
    fetchSpy.mockResolvedValue(mockImageResponse())

    await rehostExternalImages(docWithImages('https://awlego.com/a.jpg'), 'someone_else')

    expect(saved[0].path).toMatch(/^user-images\/someone_else\/love-images\/[0-9a-f]{32}\.jpg$/)
  })

  it('does nothing to a document without images', async () => {
    const doc: JSONContent = {type: 'doc', content: [{type: 'paragraph'}]}

    expect(await rehostExternalImages(doc, USERNAME)).toEqual(doc)
    expect(firebaseUtils.getBucket).not.toHaveBeenCalled()
  })
})

describe('firstOwnedImageSrc', () => {
  it('returns the first image we serve ourselves', async () => {
    const ours = 'https://firebasestorage.googleapis.com/v0/b/b/o/user-images%2Fa%2Fb.jpg?alt=media'

    expect(firstOwnedImageSrc(docWithImages('https://awlego.com/a.jpg', ours))).toEqual(ours)
  })

  it('never returns an image still hosted elsewhere', async () => {
    // An avatar goes through next/image, which rejects any host not in `remotePatterns`.
    expect(firstOwnedImageSrc(docWithImages('https://awlego.com/a.jpg'))).toBeUndefined()
  })

  it('returns nothing for a document without images', async () => {
    expect(firstOwnedImageSrc({type: 'doc', content: [{type: 'paragraph'}]})).toBeUndefined()
  })
})
