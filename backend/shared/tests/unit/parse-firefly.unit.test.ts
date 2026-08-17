import {parseJsonContentToText} from 'common/util/parse'
import {
  extractFireflyUsername,
  FireflyProfile,
  fireflyProfileToJSONContent,
} from 'shared/parse-firefly'

describe('extractFireflyUsername', () => {
  it('reads the username out of a profile url', () => {
    expect(extractFireflyUsername('https://datefirefly.com/u/tim133')).toBe('tim133')
    expect(extractFireflyUsername('https://www.datefirefly.com/u/tim133/')).toBe('tim133')
    // The site lower-cases the path segment before querying, so a link typed with capitals still
    // resolves to the same profile.
    expect(extractFireflyUsername('https://datefirefly.com/u/Tim133?ref=x')).toBe('tim133')
  })

  it('ignores anything that is not a firefly profile url', () => {
    expect(extractFireflyUsername('https://datefirefly.com/blog')).toBeNull()
    expect(extractFireflyUsername('https://datefirefly.com/u/tim133/photos')).toBeNull()
    expect(extractFireflyUsername('https://notdatefirefly.com/u/tim133')).toBeNull()
    expect(extractFireflyUsername('not a url')).toBeNull()
  })
})

const PROFILE: FireflyProfile = {
  first_name: 'Tim',
  about_me: 'I build things.\n\nAnd I climb rocks on the weekend.',
  date_of_birth: '1991-05-03',
  address: JSON.stringify({locality: 'Austin', administrativeArea: 'Texas'}),
  gender: 'Man',
  orientation: 'Straight',
  relationship_type_key: 1,
  gender_group: '{"Women","Non-binary"}',
  connection_type: '{"Long-term","Friendship"}',
  lifestyle_one: JSON.stringify({answer: 'Coffee, my bike, and a library card.'}),
  romantic_one: JSON.stringify({answer: 'Someone curious.'}),
  sexual_one: null,
  fun_one: JSON.stringify({answer: 'Teleportation.'}),
  email: 'tim@example.com',
  instagram: '@tim133',
}

describe('fireflyProfileToJSONContent', () => {
  it('rebuilds the document a visitor would have read', () => {
    const text = parseJsonContentToText(fireflyProfileToJSONContent(PROFILE))

    expect(text).toContain('Tim')
    expect(text).toContain('I build things.')
    expect(text).toContain('And I climb rocks on the weekend.')
    expect(text).toContain('Born in: 1991')
    expect(text).toContain('Gender: Man')
    expect(text).toContain('Orientation: Straight')
    expect(text).toContain('Relationship type: Non-monogamous single')
    expect(text).toContain('Location: Austin, Texas')
    expect(text).toContain('Gender: Women, Non-binary')
    expect(text).toContain('Relationship: Long-term, Friendship')
    expect(text).toContain("A list of items I couldn't live without are...")
    expect(text).toContain('Coffee, my bike, and a library card.')
    expect(text).toContain('If I could have any superpower, it would be...')
    expect(text).toContain('Teleportation.')
    expect(text).toContain('Instagram: @tim133')
    expect(text).toContain('Email: tim@example.com')

    // The page shows an age, worked out from the date of birth it never displays.
    const born = new Date('1991-05-03')
    const now = new Date()
    let age = now.getFullYear() - born.getFullYear()
    const monthDiff = now.getMonth() - born.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) age--
    expect(text).toContain(`Age: ${age}`)

    // An unanswered prompt is left out rather than shown empty.
    expect(text).not.toContain("The first thing I notice about a partner's body is")
  })

  it('leaves out sections the profile has not filled in', () => {
    const text = parseJsonContentToText(fireflyProfileToJSONContent({first_name: 'Ana'}))
    expect(text.trim()).toBe('Ana')
  })

  it('carries across only what the profile page itself displays', () => {
    // The RPC hands back more than the page shows. Whatever else lands in the response, none of it
    // should reach the document — see the note on FireflyProfile.
    const text = parseJsonContentToText(
      fireflyProfileToJSONContent({
        ...PROFILE,
        love_language: 'Acts of service',
        profile_picture_urls: ['photos/abc/1.jpg'],
      } as FireflyProfile),
    )
    expect(text).not.toContain('Acts of service')
    expect(text).not.toContain('1.jpg')
  })

  it('survives malformed json from the api', () => {
    const text = parseJsonContentToText(
      fireflyProfileToJSONContent({
        first_name: 'Ana',
        address: 'not json',
        lifestyle_one: 'not json',
      }),
    )
    expect(text.trim()).toBe('Ana')
  })
})
