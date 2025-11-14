import { strip, getSocialUrl } from './socials'
import {discordLink} from "common/constants";

describe('strip', () => {
  describe('x/twitter', () => {
    it('should strip twitter.com URLs', () => {
      expect(strip('x', 'https://twitter.com/username')).toBe('username')
      expect(strip('x', 'https://x.com/username')).toBe('username')
      expect(strip('x', 'twitter.com/username')).toBe('username')
      expect(strip('x', 'x.com/username')).toBe('username')
      expect(strip('x', '@username')).toBe('username')
      expect(strip('x', 'username')).toBe('username')
    })
  })

  describe('github', () => {
    it('should strip github URLs', () => {
      expect(strip('github', 'https://github.com/username')).toBe('username')
      expect(strip('github', 'github.com/username')).toBe('username')
      expect(strip('github', '@username')).toBe('username')
      expect(strip('github', 'username')).toBe('username')
    })
  })

  describe('instagram', () => {
    it('should strip instagram URLs', () => {
      expect(strip('instagram', 'https://instagram.com/username')).toBe('username')
      expect(strip('instagram', 'instagram.com/username')).toBe('username')
      expect(strip('instagram', '@username')).toBe('username')
      expect(strip('instagram', 'username')).toBe('username')
    })
  })

  describe('bluesky', () => {
    it('should strip bluesky URLs', () => {
      expect(strip('bluesky', 'https://bsky.app/profile/username')).toBe('username')
      expect(strip('bluesky', 'bsky.app/profile/username')).toBe('username')
      expect(strip('bluesky', '@username')).toBe('username')
      expect(strip('bluesky', 'username')).toBe('username')
    })
  })

  describe('mastodon', () => {
    it('should handle mastodon handles', () => {
      expect(strip('mastodon', '@user@instance.social')).toBe('user@instance.social')
      expect(strip('mastodon', 'user@instance.social')).toBe('user@instance.social')
    })
  })

  describe('linkedin', () => {
    it('should strip linkedin URLs', () => {
      expect(strip('linkedin', 'https://linkedin.com/in/username')).toBe('username')
      expect(strip('linkedin', 'linkedin.com/in/username')).toBe('username')
      expect(strip('linkedin', 'https://linkedin.com/company/companyname')).toBe('companyname')
      expect(strip('linkedin', 'username')).toBe('username')
    })
  })
})

describe('getSocialUrl', () => {
  it('should generate correct URLs for each platform', () => {
    expect(getSocialUrl('x', 'username')).toBe('https://x.com/username')
    expect(getSocialUrl('github', 'username')).toBe('https://github.com/username')
    expect(getSocialUrl('instagram', 'username')).toBe('https://instagram.com/username')
    expect(getSocialUrl('bluesky', 'username')).toBe('https://bsky.app/profile/username')
    expect(getSocialUrl('mastodon', 'user@instance.social')).toBe('https://instance.social/@user')
    expect(getSocialUrl('linkedin', 'username')).toBe('https://linkedin.com/in/username')
    expect(getSocialUrl('facebook', 'username')).toBe('https://facebook.com/username')
    expect(getSocialUrl('spotify', 'username')).toBe('https://open.spotify.com/user/username')
  })

  it('should handle custom website URLs', () => {
    expect(getSocialUrl('site', 'example.com')).toBe('https://example.com')
    expect(getSocialUrl('site', 'https://example.com')).toBe('https://example.com')
  })

  it('should handle discord user IDs and default invite', () => {
    expect(getSocialUrl('discord', '123456789012345678')).toBe('https://discord.com/users/123456789012345678')
    expect(getSocialUrl('discord', 'not-an-id')).toBe(discordLink)
  })
})