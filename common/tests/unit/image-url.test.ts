import {profileSchema} from 'common/api/zod-types'
import {isOwnImageUrl} from 'common/util/image-url'

describe('isOwnImageUrl', () => {
  it.each([
    'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/user-images%2Fa%2Fb.jpg?alt=media&token=x',
    'https://firebasestorage.googleapis.com/v0/b/compass-57c3c.firebasestorage.app/o/a.jpg?alt=media',
    // `generateAvatarUrl`'s shape
    'https://firebasestorage.googleapis.com/compass-130ba.firebasestorage.app/user-images/uid.png',
    'https://storage.googleapis.com/compass-130ba.firebasestorage.app/user-images/uid.png',
    'https://www.compassmeet.com/images/default-avatar.png',
    'https://compassmeet.com/images/default-avatar.png',
    '/images/showcase/alexmorel-1.jpg',
  ])('accepts our own image %s', (src) => {
    expect(isOwnImageUrl(src)).toBe(true)
  })

  it.each([
    'https://attacker.example/pixel.png',
    'http://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/a.jpg',
    // Same Google hosts, somebody else's bucket — they can read its access logs
    'https://firebasestorage.googleapis.com/v0/b/attacker-bucket/o/a.jpg?alt=media',
    'https://storage.googleapis.com/attacker-bucket/a.jpg',
    'https://firebasestorage.googleapis.com.attacker.example/v0/b/compass-130ba.firebasestorage.app/o/a.jpg',
    // Our site, but not a static image — could redirect off-site
    'https://www.compassmeet.com/api/whatever?url=https://attacker.example',
    'https://www.compassmeet.com/images/../redirect',
    '//attacker.example/images/a.png',
    '/\\attacker.example/images/a.png',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    'not a url',
    '',
    null,
    undefined,
  ])('refuses %s', (src) => {
    expect(isOwnImageUrl(src)).toBe(false)
  })
})

describe('profileSchema photo URLs', () => {
  const ours = 'https://www.compassmeet.com/images/default-avatar.png'
  const theirs = 'https://attacker.example/pixel.png'
  const parse = (props: object) => profileSchema.partial().safeParse(props).success

  it('accepts our own photos and an empty pinned_url', () => {
    expect(parse({pinned_url: ours, photo_urls: [ours]})).toBe(true)
    expect(parse({pinned_url: ''})).toBe(true)
    expect(parse({pinned_url: null, photo_urls: null})).toBe(true)
  })

  it('refuses a photo hosted elsewhere', () => {
    expect(parse({pinned_url: theirs})).toBe(false)
    expect(parse({photo_urls: [ours, theirs]})).toBe(false)
  })
})
