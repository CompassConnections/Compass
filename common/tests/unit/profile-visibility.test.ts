import {
  ALWAYS_SHOWN_COLUMNS,
  canViewerSeeField,
  effectiveAudience,
  fieldOfColumn,
  fieldsHiddenFromMembers,
  fieldsOfSection,
  hasPublicField,
  isIdentityOnlyProfile,
  isProfileVisibleTo,
  OWNER_ONLY_COLUMNS,
  parseFieldVisibility,
  PROFILE_FIELD_KEYS,
  PROFILE_FIELDS,
  redactProfileFor,
} from 'common/profiles/visibility'
import {readFileSync} from 'fs'
import {join} from 'path'

/** The columns of `profiles`, read out of the generated types — the same list the API selects. */
const profileColumns = () => {
  const schema = readFileSync(join(__dirname, '../../src/supabase/schema.ts'), 'utf8')
  const table = schema.slice(schema.indexOf('      profiles: {\n        Row: {'))
  const row = table.slice(table.indexOf('Row: {') + 6, table.indexOf('        }\n'))
  return [...row.matchAll(/^\s+([a-z0-9_]+)\??:/gm)].map((m) => m[1])
}

describe('the profile field map', () => {
  it('places every column of `profiles`', () => {
    const columns = profileColumns()
    // Sanity: the parse found the table, not an empty block.
    expect(columns).toContain('bio')
    expect(columns.length).toBeGreaterThan(80)

    // A new column has to be given a field (so its owner can hide it) or be listed as never hidden
    // or owner-only. Unplaced, `redactProfileFor` drops it for everyone but the owner — safe, but
    // the feature that needed the column would silently not work.
    const unplaced = columns.filter(
      (column) =>
        !fieldOfColumn(column) &&
        !ALWAYS_SHOWN_COLUMNS.has(column) &&
        !OWNER_ONLY_COLUMNS.has(column),
    )
    expect(unplaced).toEqual([])
  })

  it('puts no column in two fields', () => {
    const all = PROFILE_FIELD_KEYS.flatMap((key) => [...PROFILE_FIELDS[key].columns])
    expect(all.length).toBe(new Set(all).size)
  })

  it('never hides the switches themselves', () => {
    for (const column of ['id', 'user_id', 'visibility', 'disabled']) {
      expect(fieldOfColumn(column)).toBeUndefined()
      expect(ALWAYS_SHOWN_COLUMNS.has(column)).toBe(true)
    }
  })

  it('groups fields by form section', () => {
    expect(fieldsOfSection('politics')).toEqual(['political_beliefs'])
    expect(fieldsOfSection('basics')).toEqual(['age', 'gender', 'location'])
  })
})

describe('effective audience', () => {
  it('follows the profile when the field has no choice of its own', () => {
    expect(effectiveAudience({visibility: 'public', field_visibility: {}}, 'bio')).toBe('public')
    expect(effectiveAudience({visibility: 'member', field_visibility: {}}, 'bio')).toBe('member')
  })

  it('treats a missing profile-wide setting as members-only', () => {
    expect(effectiveAudience({}, 'bio')).toBe('member')
  })

  it('lets a field be wider or narrower than the profile-wide setting, which is only a default', () => {
    const profile = {visibility: 'member', field_visibility: {bio: 'public', links: 'only_me'}}
    expect(effectiveAudience(profile, 'bio')).toBe('public')
    expect(effectiveAudience(profile, 'links')).toBe('only_me')
    expect(effectiveAudience(profile, 'gender')).toBe('member')
  })

  it("keeps a field's own choice when the profile-wide setting changes around it", () => {
    const field_visibility = {headline: 'public', neurotype: 'connected'}
    for (const visibility of ['public', 'member']) {
      expect(effectiveAudience({visibility, field_visibility}, 'headline')).toBe('public')
      expect(effectiveAudience({visibility, field_visibility}, 'neurotype')).toBe('connected')
    }
  })

  it('ignores unknown keys and unknown audiences', () => {
    expect(
      parseFieldVisibility({bio: 'friends', nonsense: 'only_me', gender: 'connected'}),
    ).toEqual({gender: 'connected'})
    expect(parseFieldVisibility(null)).toEqual({})
    expect(parseFieldVisibility('{"bio":"only_me"}')).toEqual({})
  })
})

describe('the whole-profile gate', () => {
  it('lets a signed-in member through, whatever the profile', () => {
    expect(isProfileVisibleTo({visibility: 'member', field_visibility: {}}, 'm')).toBe(true)
  })

  it('turns a visitor away from a members-only profile with nothing public', () => {
    expect(isProfileVisibleTo({visibility: 'member', field_visibility: {}}, undefined)).toBe(false)
    expect(
      isProfileVisibleTo({visibility: 'member', field_visibility: {bio: 'only_me'}}, undefined),
    ).toBe(false)
  })

  it('lets a visitor through to a members-only profile that has a public field', () => {
    const profile = {visibility: 'member', field_visibility: {headline: 'public'}}
    expect(hasPublicField(profile)).toBe(true)
    expect(isProfileVisibleTo(profile, undefined)).toBe(true)
    const out = redactProfileFor({...profile, headline: 'Hi', bio: {type: 'doc'}}, {})
    expect(out.headline).toBe('Hi')
    expect(out.bio).toBeNull()
  })

  it('recognises the identity-only shape it leaves', () => {
    expect(
      isIdentityOnlyProfile({user_id: 'u', visibility: 'member', disabled: false} as any),
    ).toBe(true)
    expect(isIdentityOnlyProfile({id: 3})).toBe(false)
  })
})

describe('who sees a field', () => {
  const profile = {
    visibility: 'public',
    field_visibility: {photos: 'member', neurotype: 'connected', political_beliefs: 'only_me'},
  }
  const visitor = {}
  const member = {id: 'm'}
  const approved = {id: 'a', isConnected: true}
  const owner = {id: 'o', isOwner: true}
  const admin = {id: 'x', isAdmin: true}

  it.each([
    ['bio', true, true, true],
    ['photos', false, true, true],
    ['neurotype', false, false, true],
    ['political_beliefs', false, false, false],
  ] as const)('%s', (field, forVisitor, forMember, forApproved) => {
    expect(canViewerSeeField(profile, field, visitor)).toBe(forVisitor)
    expect(canViewerSeeField(profile, field, member)).toBe(forMember)
    expect(canViewerSeeField(profile, field, approved)).toBe(forApproved)
    expect(canViewerSeeField(profile, field, owner)).toBe(true)
    expect(canViewerSeeField(profile, field, admin)).toBe(true)
  })

  it('lists what is kept from ordinary members', () => {
    expect(fieldsHiddenFromMembers(profile)).toEqual(['political_beliefs', 'neurotype'])
  })
})

describe('redactProfileFor', () => {
  const profile = {
    id: 7,
    user_id: 'owner',
    visibility: 'public',
    disabled: false,
    field_visibility: {
      photos: 'member',
      neurotype: 'connected',
      political_beliefs: 'only_me',
      interests: 'only_me',
      links: 'connected',
    },
    bio: {type: 'doc'},
    headline: 'Hello',
    pinned_url: 'https://example.com/a.jpg',
    photo_urls: ['https://example.com/b.jpg'],
    neurotype: ['adhd'],
    neurotype_details: 'diagnosed at 30',
    political_beliefs: ['green'],
    political_details: 'details',
    interests: ['1'],
    interests_names: ['Chess'],
    links: {site: 'https://example.com'},
    search_text: 'hello chess green',
    a_column_added_later: 'secret',
  }

  it('returns the owner their own row untouched', () => {
    expect(redactProfileFor(profile, {id: 'owner', isOwner: true})).toBe(profile)
  })

  it('gives a visitor only what is public', () => {
    const out = redactProfileFor(profile, {})
    expect(out.headline).toBe('Hello')
    expect(out.bio).toEqual({type: 'doc'})
    expect(out.pinned_url).toBeNull()
    expect(out.photo_urls).toBeNull()
    expect(out.neurotype).toBeNull()
    expect(out.neurotype_details).toBeNull()
    expect(out.political_beliefs).toBeNull()
    expect(out.political_details).toBeNull()
    expect(out.interests).toEqual([])
    expect(out.interests_names).toEqual([])
    expect(out.links).toEqual({})
    // Not told that anything is kept for approved people: only a member can ask.
    expect(out).not.toHaveProperty('shares_more')
  })

  it('gives a member the members-only fields, and says there is more to ask for', () => {
    const out = redactProfileFor(profile, {id: 'm'})
    expect(out.pinned_url).toBe(profile.pinned_url)
    expect(out.neurotype).toBeNull()
    expect(out.political_beliefs).toBeNull()
    expect((out as any).shares_more).toBe(true)
  })

  it('gives an approved member the approved fields, and nothing kept for the owner alone', () => {
    const out = redactProfileFor(profile, {id: 'a', isConnected: true})
    expect(out.neurotype).toEqual(['adhd'])
    expect(out.links).toEqual(profile.links)
    expect(out.political_beliefs).toBeNull()
    expect(out.interests).toEqual([])
    expect(out).not.toHaveProperty('shares_more')
  })

  it('never sends the search text, the visibility map, or a column nobody placed', () => {
    for (const viewer of [{}, {id: 'm'}, {id: 'a', isConnected: true}]) {
      const out = redactProfileFor(profile, viewer)
      expect(out).not.toHaveProperty('search_text')
      expect(out).not.toHaveProperty('field_visibility')
      expect(out).not.toHaveProperty('a_column_added_later')
      expect(JSON.stringify(out)).not.toContain('green')
      expect(JSON.stringify(out)).not.toContain('Chess')
    }
  })

  it('leaves a profile with no exceptions as it was, for anyone allowed to read it', () => {
    const plain = {...profile, field_visibility: {}}
    const out = redactProfileFor(plain, {id: 'm'})
    expect(out.neurotype).toEqual(['adhd'])
    expect(out.political_beliefs).toEqual(['green'])
    expect(out.interests).toEqual(['1'])
    expect(out).not.toHaveProperty('shares_more')
  })

  it('shows an admin everything, for moderation', () => {
    const out = redactProfileFor(profile, {id: 'x', isAdmin: true})
    expect(out.political_beliefs).toEqual(['green'])
    expect((out as any).a_column_added_later).toBe('secret')
  })
})
