jest.mock('shared/supabase/init')

import {getProfileFeed} from 'api/get-profile-feed'
import {FeedItem, MAX_FEED_BIO_CHARS} from 'common/feed/feed'
import * as supabaseInit from 'shared/supabase/init'

const row = (overrides: Record<string, any> = {}) => ({
  username: 'martin',
  name: 'Martin',
  created_time: '2026-08-05T09:54:00.000Z',
  headline: 'Lazy Hacker',
  city: 'Rome',
  country: 'Italy',
  gender: 'male',
  keywords: ['photography', 'poetry'],
  bio_text: 'Describing is always a tedious task.',
  feed_visibility: 'basic',
  ...overrides,
})

describe('getProfileFeed', () => {
  let mockPg: any

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {any: jest.fn().mockResolvedValue([])}
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })

  // Handlers are typed as "the response, or a continuation" — this one never continues.
  const call = async (props: any = {}) =>
    (await getProfileFeed(props, undefined as any, {} as any)) as {items: FeedItem[]}

  describe('the query', () => {
    it('only ever reads public, syndicatable, listable profiles', async () => {
      await call()
      const [query] = mockPg.any.mock.calls[0]

      expect(query).toContain("profiles.visibility = 'public'")
      expect(query).toContain("profiles.feed_visibility <> 'none'")
      expect(query).toContain('profiles.disabled != true')
      expect(query).toContain('profiles.looking_for_matches = true')
      expect(query).toContain('not users.is_banned_from_posting')
      expect(query).toContain("users.data ->> 'userDeleted'")
    })

    it('never selects photos, whatever the level', async () => {
      await call()
      const [query] = mockPg.any.mock.calls[0]
      expect(query).not.toContain('photo_urls')
      expect(query).not.toContain('pinned_url')
    })

    it('filters by country case-insensitively, and not at all when none is given', async () => {
      await call({country: 'italy'})
      expect(mockPg.any.mock.calls[0][0]).toContain('lower(profiles.country) = lower($(country))')
      expect(mockPg.any.mock.calls[0][1].country).toBe('italy')

      await call()
      expect(mockPg.any.mock.calls[1][1].country).toBeNull()
    })

    it('parameterises the country instead of concatenating it', async () => {
      await call({country: "Italy'; drop table profiles; --"})
      const [query, params] = mockPg.any.mock.calls[0]
      expect(query).not.toContain('drop table')
      expect(params.country).toBe("Italy'; drop table profiles; --")
    })
  })

  describe('the projection', () => {
    it('sends only name, location, headline, keywords and link for a basic member', async () => {
      mockPg.any.mockResolvedValue([row()])
      const {items} = await call()

      expect(items[0]).toEqual({
        username: 'martin',
        name: 'Martin',
        createdTime: '2026-08-05T09:54:00.000Z',
        headline: 'Lazy Hacker',
        location: 'Rome, Italy',
        keywords: ['photography', 'poetry'],
      })
      expect(items[0].bioExcerpt).toBeUndefined()
      expect(items[0].gender).toBeUndefined()
    })

    it('omits keywords rather than sending an empty list', async () => {
      mockPg.any.mockResolvedValue([row({keywords: []})])
      const {items} = await call()
      expect(items[0].keywords).toBeUndefined()
    })

    it('adds gender and a bio excerpt for a full member', async () => {
      mockPg.any.mockResolvedValue([row({feed_visibility: 'full'})])
      const {items} = await call()

      expect(items[0].gender).toBe('male')
      expect(items[0].keywords).toEqual(['photography', 'poetry'])
      expect(items[0].bioExcerpt).toBe('Describing is always a tedious task.')
    })

    it('truncates a long bio rather than republishing the whole thing', async () => {
      mockPg.any.mockResolvedValue([row({feed_visibility: 'full', bio_text: 'word '.repeat(500)})])
      const {items} = await call()

      expect(items[0].bioExcerpt!.length).toBeLessThanOrEqual(MAX_FEED_BIO_CHARS + 1)
      expect(items[0].bioExcerpt!.endsWith('…')).toBe(true)
    })

    it('falls back to the country alone when no city is set', async () => {
      mockPg.any.mockResolvedValue([row({city: null})])
      const {items} = await call()
      expect(items[0].location).toBe('Italy')
    })

    it('omits location entirely when neither city nor country is set', async () => {
      mockPg.any.mockResolvedValue([row({city: null, country: null})])
      const {items} = await call()
      expect(items[0].location).toBeUndefined()
    })
  })
})
