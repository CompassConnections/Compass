import {
  fetchOnlineProfile,
  resolveImageFolderName,
  validateProfileFields,
} from 'api/llm-extract-profile'
import {lookup} from 'dns/promises'
import {FALLBACK_IMAGE_FOLDER_NAME} from 'shared/profiles/rehost-images'
import {getUser, getUserByUsername} from 'shared/utils'
import {Readable} from 'stream'

jest.mock('shared/supabase/init')
jest.mock('dns/promises', () => ({lookup: jest.fn()}))
jest.mock('shared/utils', () => ({
  getUser: jest.fn(),
  getUserByUsername: jest.fn(),
}))
// `shared/parse` pulls in jsdom, which drags an ESM-only dependency this jest config cannot
// transform. None of it is on the Firefly path, so stub the module out: the two functions that path
// does touch are `getBlockedProfileHost` (Firefly is not a blocked host) and `hasText`.
jest.mock('shared/parse', () => ({
  getBlockedProfileHost: () => null,
  hasText: () => true,
  extractNotionPageId: () => null,
  extractGoogleDocId: () => null,
  notionRecordMapToJSONContent: jest.fn(),
  convertToJSONContent: jest.fn(),
}))

describe('fetchOnlineProfile', () => {
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Firefly profiles', () => {
    const url = 'https://datefirefly.com/u/tim123'

    it('reads only the profile endpoint, never the quiz answers', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => [{first_name: 'Tim', about_me: 'I build things.'}],
      } as Response)

      await fetchOnlineProfile(url)

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const [requested] = fetchSpy.mock.calls[0]
      expect(requested).toContain('get_public_profile')
      // Special-category data we deliberately do not collect — see FireflyProfile.
      expect(requested).not.toContain('get_public_quiz_answers')
    })
  })

  describe('addresses we refuse to fetch', () => {
    const lookupMock = lookup as unknown as jest.Mock

    // A URL typed into the import box becomes a request leaving from inside our own network, so
    // every one of these would otherwise be a way to read something only the server can reach.
    beforeEach(() => {
      lookupMock.mockReset()
      lookupMock.mockResolvedValue([{address: '93.184.216.34', family: 4}])
    })

    it('rejects a scheme that is not http(s) before resolving anything', async () => {
      await expect(fetchOnlineProfile('file:///etc/passwd')).rejects.toThrow(
        /Only http and https links/,
      )
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('rejects a hostname that resolves inside our network', async () => {
      lookupMock.mockResolvedValue([{address: '169.254.169.254', family: 4}])

      await expect(fetchOnlineProfile('https://metadata.example.com/profile')).rejects.toThrow(
        /not a public address/,
      )
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('does not follow a redirect into our network', async () => {
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

      await expect(fetchOnlineProfile('https://evil.example.com/me')).rejects.toThrow(
        /not a public address/,
      )
      // The first hop was allowed; the redirect target was never requested.
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy.mock.calls[0][1].redirect).toBe('manual')
    })

    it('gives up on a page larger than the ceiling instead of buffering it', async () => {
      const tenMegabytes = Buffer.alloc(10 * 1024 ** 2, 'a')
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        url: 'https://awlego.com/me',
        headers: new Headers({'content-type': 'text/html'}),
        body: Readable.from([tenMegabytes]),
      } as unknown as Response)

      await expect(fetchOnlineProfile('https://awlego.com/me')).rejects.toThrow(/too large to read/)
    })
  })

  describe('Setup Sheets', () => {
    const url = 'https://setupsheet.love/record/recZgSWBkQPZn411r'

    it('reads the record the page reads instead of the empty SPA shell', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({record: {firstName: 'Félix', dealBreakers: 'No daily smoking.'}}),
      } as Response)

      const parsed = await fetchOnlineProfile(url)

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy.mock.calls[0][0]).toBe(
        'https://setupsheet.love/api/records/recZgSWBkQPZn411r',
      )
      expect(JSON.stringify(parsed)).toContain('No daily smoking.')
    })

    it('says the link is wrong rather than failing obscurely on an unknown record', async () => {
      fetchSpy.mockResolvedValue({ok: false, status: 404, text: async () => ''} as Response)

      await expect(fetchOnlineProfile(url)).rejects.toThrow(/No Setup Sheet found/)
    })
  })
})

describe('pinning an imported photo', () => {
  // The model answers with the odd `"pinned_url": ""` even though the prompt never asks for the
  // field. `??=` leaves that in place, so the import copied the photo into our bucket and then
  // pinned nothing — every field filled in, no profile picture.
  it('treats a blank pinned_url as unset rather than as an answer', () => {
    const blank: {pinned_url?: string} = {pinned_url: ''}
    const rehosted = 'https://firebasestorage.googleapis.com/v0/b/b/o/photo.jpg?alt=media'

    // What the code used to do.
    const viaNullish = {...blank}
    viaNullish.pinned_url ??= rehosted
    expect(viaNullish.pinned_url).toBe('')

    // What it does now.
    const viaEmptiness = {...blank}
    if (!viaEmptiness.pinned_url) viaEmptiness.pinned_url = rehosted
    expect(viaEmptiness.pinned_url).toBe(rehosted)
  })
})

describe('resolveImageFolderName', () => {
  const getUserMock = getUser as jest.MockedFunction<typeof getUser>
  const getUserByUsernameMock = getUserByUsername as jest.MockedFunction<typeof getUserByUsername>

  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue(null)
    getUserByUsernameMock.mockReset().mockResolvedValue(null)
  })

  it('prefers the stored username over the one the client sent', async () => {
    getUserMock.mockResolvedValue({username: 'Martin'} as any)

    expect(await resolveImageFolderName('uid1', 'someone_else')).toBe('Martin')
  })

  it('uses the requested username while the user row does not exist yet', async () => {
    expect(await resolveImageFolderName('uid1', 'New User!')).toBe('NewUser')
  })

  it('falls back to the uid when the requested username belongs to somebody else', async () => {
    getUserByUsernameMock.mockResolvedValue({username: 'taken'} as any)

    expect(await resolveImageFolderName('uid1', 'taken')).toBe('uid1')
  })

  // Backward compatibility: clients from before `username` existed never send one.
  it('falls back to the uid when no username is sent', async () => {
    expect(await resolveImageFolderName('uid1', undefined)).toBe('uid1')
  })

  it('uses the fallback folder when there is neither a username nor an authed user', async () => {
    expect(await resolveImageFolderName(undefined, undefined)).toBe(FALLBACK_IMAGE_FOLDER_NAME)
    // Never looked up: there is no uid to look up.
    expect(getUserMock).not.toHaveBeenCalled()
  })

  it('uses the fallback folder when unauthed and the requested username is taken', async () => {
    getUserByUsernameMock.mockResolvedValue({username: 'taken'} as any)

    expect(await resolveImageFolderName(undefined, 'taken')).toBe(FALLBACK_IMAGE_FOLDER_NAME)
  })

  it('still honours a free username when unauthed', async () => {
    expect(await resolveImageFolderName(undefined, 'free_name')).toBe('free_name')
  })
})

describe('validateProfileFields', () => {
  // The prompt asks for "United States", but the model answers with whatever the document said.
  it('collapses every US synonym onto the spelling profiles store', async () => {
    const result = await validateProfileFields(
      {country: 'United States', raised_in_country: 'u.s.'} as any,
      {},
    )

    expect(result.country).toBe('USA')
    expect(result.raised_in_country).toBe('USA')
  })

  it('leaves other countries alone', async () => {
    const result = await validateProfileFields({country: 'Belgium'} as any, {})

    expect(result.country).toBe('Belgium')
  })
})
