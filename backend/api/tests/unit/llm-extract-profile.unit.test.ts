import {fetchOnlineProfile} from 'api/llm-extract-profile'

jest.mock('shared/supabase/init')
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
