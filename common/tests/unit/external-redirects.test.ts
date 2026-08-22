import {discordLink} from 'common/constants'
import {RESERVED_PATHS} from 'common/envs/constants'
import {EXTERNAL_REDIRECTS, getExternalRedirect} from 'common/external-redirects'

describe('getExternalRedirect', () => {
  it('resolves a deep-link pathname', () => {
    expect(getExternalRedirect('/discord')).toBe(discordLink)
  })

  it('accepts the shapes an Android intent can hand us', () => {
    // Bare slug, trailing slash, casing, and the query string an email tracker appends.
    expect(getExternalRedirect('discord')).toBe(discordLink)
    expect(getExternalRedirect('/discord/')).toBe(discordLink)
    expect(getExternalRedirect('/Discord')).toBe(discordLink)
    expect(getExternalRedirect('/discord?utm_source=email')).toBe(discordLink)
  })

  it('leaves in-app paths alone', () => {
    expect(getExternalRedirect('/martin')).toBeUndefined()
    expect(getExternalRedirect('/messages/abc')).toBeUndefined()
    expect(getExternalRedirect('/')).toBeUndefined()
    expect(getExternalRedirect('')).toBeUndefined()
    expect(getExternalRedirect(null)).toBeUndefined()
  })

  it('points every path off our own domain', () => {
    for (const [source, destination] of Object.entries(EXTERNAL_REDIRECTS)) {
      expect(source).toMatch(/^\/[a-z]+$/)
      expect(destination).toMatch(/^https:\/\//)
      expect(destination).not.toContain('compassmeet.com')
    }
  })

  it('keeps the redirect paths reserved, so no one can register them as a username', () => {
    for (const source of Object.keys(EXTERNAL_REDIRECTS)) {
      expect(RESERVED_PATHS).toContain(source.slice(1))
    }
  })
})
