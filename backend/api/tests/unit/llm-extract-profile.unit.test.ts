import {fetchOnlineProfile, resolveImageFolderName} from 'api/llm-extract-profile'
import {FALLBACK_IMAGE_FOLDER_NAME} from 'shared/profiles/rehost-images'
import {getUser, getUserByUsername} from 'shared/utils'

jest.mock('shared/supabase/init')
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
