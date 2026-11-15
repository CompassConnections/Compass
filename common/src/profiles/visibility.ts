import {ProfileRow} from 'common/profiles/profile'
import {User} from 'common/user'

/**
 * Who is allowed to read a profile, and what is left of one when they are not.
 *
 * `profiles.visibility` has two values: 'public' (anyone) and 'member' (signed-in members only). The
 * column defaults to 'member', so most profiles on the site are gated — which is exactly why this
 * cannot be a rendering decision. A component that merely hides a field has still shipped it: in the
 * API response, in the page's `__NEXT_DATA__`, in the OG tags. The gate belongs where the response is
 * assembled, and the redactions below are the whole of what a non-member may receive.
 *
 * The one thing a members-only profile still says out loud is the display name — enough for a link to
 * make sense, and for the person to recognise their own page — so `user.name` survives and nothing
 * else does.
 *
 * `visibility` is the *default* for the profile's fields, not a ceiling (docs/profile-visibility.md):
 * a member may set one field wider than the rest, so a members-only profile can still show a
 * signed-out visitor its headline. The whole-profile gate is therefore "is there anything at all
 * this reader may see": a signed-in member always passes, and a visitor passes when at least one
 * field is public. A profile that passes is then redacted field by field (`redactProfileFor`).
 */
export const isProfileVisibleTo = (
  profile: {visibility?: string | null; field_visibility?: unknown} | null | undefined,
  viewerId: string | null | undefined,
) => !profile || !!viewerId || hasPublicField(profile)

/**
 * Whether a profile row is the identity-only shape the whole-profile gate leaves (below): no `id`,
 * no content. What the client draws its "members only" panel from — it cannot work the gate out
 * itself, since the map of who-sees-what is never sent to anyone but the owner.
 */
export const isIdentityOnlyProfile = (profile: {id?: unknown} | null | undefined) =>
  !!profile && profile.id == null

/**
 * The identity columns of a members-only profile, and nothing more: that it exists, whose it is,
 * whether it is gated, whether it is disabled. Every field a reader could learn something from is
 * dropped rather than blanked, so it cannot be read back out of the JSON either.
 *
 * `id` is deliberately absent too. `profile_interests`, `profile_causes` and `profile_work` join on
 * it and are readable with the public anon key, so handing it out would give back the tags the rest
 * of this removes.
 */
export function redactMemberOnlyProfile<
  T extends Pick<ProfileRow, 'user_id' | 'visibility' | 'disabled'>,
>(profile: T): T {
  const {user_id, visibility, disabled} = profile
  // The result is not a whole row and does not claim to be one at runtime; the cast keeps callers
  // typed against `ProfileRow` the way the un-redacted branch is.
  return {user_id, visibility, disabled} as unknown as T
}

/** The photo is profile content, so it goes with the rest of it. Name and username stay. */
export function redactMemberOnlyUser<T extends User>(user: T): T {
  return {...user, avatarUrl: ''}
}

// ---------------------------------------------------------------------------------------------
// Per-field visibility (docs/profile-visibility.md)
// ---------------------------------------------------------------------------------------------

/**
 * Who a field is shown to. An ordered ladder — each rung is a subset of the one before — which is
 * what keeps the rule to one comparison: a viewer sees a field when their own rung is at least as
 * narrow as the field's.
 *
 * `connected` is the members the owner has approved one by one (`profile_access`), and nothing else:
 * not messaging, not a like, not mutual interest.
 */
export const AUDIENCES = ['public', 'member', 'connected', 'only_me'] as const
export type Audience = (typeof AUDIENCES)[number]

const AUDIENCE_RANK: Record<Audience, number> = {public: 0, member: 1, connected: 2, only_me: 3}

export const isAudience = (value: unknown): value is Audience =>
  typeof value === 'string' && value in AUDIENCE_RANK

/** The narrower of two audiences. */
export const narrowerAudience = (a: Audience, b: Audience): Audience =>
  AUDIENCE_RANK[a] >= AUDIENCE_RANK[b] ? a : b

export const isNarrowerThan = (a: Audience, b: Audience) => AUDIENCE_RANK[a] > AUDIENCE_RANK[b]

/**
 * The form's sections, in form order. They exist for the form only — a section control sets every
 * field under it — and are never stored: `field_visibility` holds one entry per *field*.
 */
export const PROFILE_SECTIONS = [
  'basics',
  'photos',
  'profile_card',
  'bio',
  'seeking',
  'work',
  'education',
  'relationships',
  'family',
  'politics',
  'religion',
  'morality',
  'interests',
  'lifestyle',
  'substances',
  'psychology',
  'demographics',
  'background',
  'languages',
  'socials',
  'accessibility',
  'other',
] as const
export type ProfileSection = (typeof PROFILE_SECTIONS)[number]

type FieldDef = {section: ProfileSection; columns: readonly string[]}

/**
 * Every hideable field: one control in the profile form as the member sees it, the section it sits
 * under, and the columns (or option arrays) that carry it. A choice and its free-text "Details"
 * companion share a key — hiding the checkboxes while showing the sentence that explains them
 * protects nothing — and so do the several columns behind one location.
 *
 * This is the single source for the server's redaction and for the form's pickers, so the two cannot
 * drift apart. `answers` and `endorsements` have no columns: they live in their own tables and are
 * gated by `canReadProfileContent`.
 */
export const PROFILE_FIELDS = {
  age: {section: 'basics', columns: ['age', 'birth_date']},
  gender: {section: 'basics', columns: ['gender', 'gender_details']},
  location: {
    section: 'basics',
    columns: ['city', 'region_code', 'country', 'city_latitude', 'city_longitude', 'geodb_city_id'],
  },
  photos: {section: 'photos', columns: ['pinned_url', 'photo_urls', 'image_descriptions']},
  headline: {section: 'profile_card', columns: ['headline']},
  keywords: {section: 'profile_card', columns: ['keywords']},
  bio: {section: 'bio', columns: ['bio', 'bio_length', 'bio_text', 'bio_tsv', 'bio_snippet']},
  pref_gender: {section: 'seeking', columns: ['pref_gender']},
  pref_age: {section: 'seeking', columns: ['pref_age_min', 'pref_age_max']},
  pref_max_distance: {section: 'seeking', columns: ['pref_max_distance']},
  pref_relation_styles: {section: 'seeking', columns: ['pref_relation_styles']},
  occupation: {section: 'work', columns: ['occupation', 'occupation_title']},
  company: {section: 'work', columns: ['company']},
  work: {section: 'work', columns: ['work', 'work_names']},
  education_level: {section: 'education', columns: ['education_level']},
  university: {section: 'education', columns: ['university']},
  relationship_status: {section: 'relationships', columns: ['relationship_status']},
  orientation: {section: 'relationships', columns: ['orientation', 'orientation_details']},
  pref_romantic_styles: {section: 'relationships', columns: ['pref_romantic_styles']},
  has_kids: {section: 'family', columns: ['has_kids']},
  wants_kids: {section: 'family', columns: ['wants_kids_strength']},
  political_beliefs: {section: 'politics', columns: ['political_beliefs', 'political_details']},
  religion: {
    section: 'religion',
    columns: ['religion', 'religious_beliefs', 'religious_belief_strength'],
  },
  causes: {section: 'morality', columns: ['causes', 'causes_names']},
  interests: {section: 'interests', columns: ['interests', 'interests_names']},
  diet: {section: 'lifestyle', columns: ['diet']},
  exercise: {section: 'lifestyle', columns: ['exercise']},
  smoking: {section: 'substances', columns: ['is_smoker']},
  drinking: {section: 'substances', columns: ['drinks_per_month']},
  psychedelics: {
    section: 'substances',
    columns: ['psychedelics', 'psychedelics_intention', 'psychedelics_pref'],
  },
  cannabis: {section: 'substances', columns: ['cannabis', 'cannabis_intention', 'cannabis_pref']},
  neurotype: {section: 'psychology', columns: ['neurotype', 'neurotype_details']},
  mbti: {section: 'psychology', columns: ['mbti']},
  big5: {
    section: 'psychology',
    columns: [
      'big5_openness',
      'big5_conscientiousness',
      'big5_extraversion',
      'big5_agreeableness',
      'big5_neuroticism',
    ],
  },
  height: {section: 'demographics', columns: ['height_in_inches']},
  ethnicity: {section: 'background', columns: ['ethnicity']},
  raised_in: {
    section: 'background',
    columns: [
      'raised_in_city',
      'raised_in_region_code',
      'raised_in_country',
      'raised_in_lat',
      'raised_in_lon',
      'raised_in_radius',
      'raised_in_geodb_city_id',
      // The free-text birthplace is no longer asked for by the form, but older profiles carry it;
      // it is the same answer as where someone grew up, so it follows that field.
      'born_in_location',
    ],
  },
  languages: {section: 'languages', columns: ['languages']},
  links: {section: 'socials', columns: ['links']},
  online_communities: {section: 'socials', columns: ['online_communities']},
  accessibility_notes: {section: 'accessibility', columns: ['accessibility_notes']},
  answers: {section: 'other', columns: []},
  endorsements: {section: 'other', columns: []},
} as const satisfies Record<string, FieldDef>

export type ProfileFieldKey = keyof typeof PROFILE_FIELDS
export const PROFILE_FIELD_KEYS = Object.keys(PROFILE_FIELDS) as ProfileFieldKey[]

/**
 * What is stored in `profiles.field_visibility`: the fields that differ from the profile-wide
 * `visibility`, wider or narrower. An absent key follows `visibility`.
 */
export type FieldVisibility = Partial<Record<ProfileFieldKey, Audience>>

/**
 * Columns that are not a member's content and are never hidden: identity, the switches themselves,
 * and the settings other features read (can this person be messaged, is the page open to comments).
 */
export const ALWAYS_SHOWN_COLUMNS: ReadonlySet<string> = new Set([
  'id',
  'user_id',
  'user',
  'created_time',
  'last_modification_time',
  'visibility',
  'feed_visibility',
  'disabled',
  'looking_for_matches',
  'comments_enabled',
  'allow_direct_messaging',
  'allow_interest_indicating',
  'donor_badge_hidden',
  'donor_past_year_cents',
  'spotlight_consent',
  'social_media_consent',
  'referred_by_username',
  'referred_by_user_id',
  // Derived by list endpoints, about the pair rather than about the profile.
  'compatibility_score',
  'last_online_time',
  // Set by the redaction itself, below.
  'shares_more',
])

/**
 * Columns only the owner ever receives: the search vectors are built from the whole profile, and the
 * map of who-sees-what is itself something a visitor could read a hidden field's existence out of.
 */
export const OWNER_ONLY_COLUMNS: ReadonlySet<string> = new Set([
  'search_text',
  'search_tsv',
  'field_visibility',
])

const COLUMN_TO_FIELD: Record<string, ProfileFieldKey> = Object.fromEntries(
  PROFILE_FIELD_KEYS.flatMap((key) => PROFILE_FIELDS[key].columns.map((column) => [column, key])),
)

/** The field a column belongs to, or undefined for a column that is not a hideable field. */
export const fieldOfColumn = (column: string): ProfileFieldKey | undefined =>
  COLUMN_TO_FIELD[column]

export const fieldsOfSection = (section: ProfileSection): ProfileFieldKey[] =>
  PROFILE_FIELD_KEYS.filter((key) => PROFILE_FIELDS[key].section === section)

type VisibilitySource = {visibility?: string | null; field_visibility?: unknown}

/** The stored map, with anything that is not a known field and a known audience dropped. */
export const parseFieldVisibility = (raw: unknown): FieldVisibility => {
  if (!raw || typeof raw !== 'object') return {}
  const out: FieldVisibility = {}
  for (const key of PROFILE_FIELD_KEYS) {
    const value = (raw as Record<string, unknown>)[key]
    if (isAudience(value)) out[key] = value
  }
  return out
}

/** Whether a signed-out visitor may read at least one field of this profile. */
export const hasPublicField = (profile: VisibilitySource) =>
  PROFILE_FIELD_KEYS.some((field) => effectiveAudience(profile, field) === 'public')

/** The profile-wide setting as an audience. Anything but an explicit `public` is members-only. */
export const profileAudience = (profile: VisibilitySource): Audience =>
  profile.visibility === 'public' ? 'public' : 'member'

/**
 * Who actually sees a field: its own choice when it has one, the profile-wide setting otherwise.
 *
 * The profile-wide setting is a default, not a ceiling: a field may be wider than it (a public
 * headline on a members-only profile) as well as narrower. Switching the profile-wide setting
 * therefore only moves the fields that have no choice of their own.
 */
export const effectiveAudience = (profile: VisibilitySource, field: ProfileFieldKey): Audience =>
  parseFieldVisibility(profile.field_visibility)[field] ?? profileAudience(profile)

/**
 * Who is reading. `isOwner` and `isAdmin` see everything (admins for moderation); `isConnected` is an
 * approved `profile_access` row from the owner to this viewer; `id` undefined is a signed-out visitor.
 */
export type ProfileViewer = {
  id?: string | null
  isOwner?: boolean
  isConnected?: boolean
  isAdmin?: boolean
}

/** The narrowest audience this viewer belongs to. */
export const viewerAudience = (viewer: ProfileViewer): Audience =>
  viewer.isOwner || viewer.isAdmin
    ? 'only_me'
    : viewer.isConnected
      ? 'connected'
      : viewer.id
        ? 'member'
        : 'public'

export const canViewerSeeField = (
  profile: VisibilitySource,
  field: ProfileFieldKey,
  viewer: ProfileViewer,
) => !isNarrowerThan(effectiveAudience(profile, field), viewerAudience(viewer))

/** The fields of this profile the viewer may not read. */
export const hiddenFieldsFor = (profile: VisibilitySource, viewer: ProfileViewer) =>
  PROFILE_FIELD_KEYS.filter((field) => !canViewerSeeField(profile, field, viewer))

/**
 * Fields kept from ordinary members (`connected` or `only_me`). Filters and keyword search treat
 * these as unset for every searcher, and their owner may not filter on them (reciprocity).
 */
export const fieldsHiddenFromMembers = (profile: VisibilitySource) =>
  PROFILE_FIELD_KEYS.filter((field) => isNarrowerThan(effectiveAudience(profile, field), 'member'))

/** What a hidden column is replaced with: the value an unset one would have, so nothing can be read back. */
const blankFor = (column: string) =>
  column === 'links'
    ? {}
    : /^(interests|causes|work)(_names)?$/.test(column)
      ? []
      : column === 'bio_snippet'
        ? ''
        : null

/**
 * The profile as `viewer` may read it. Hidden means not sent: every column of a field the viewer
 * cannot see is blanked here, where the response is assembled, so it is absent from the JSON, from
 * the static page props and from anything derived from them.
 *
 * It is an allowlist. A column that is neither in a field nor in `ALWAYS_SHOWN_COLUMNS` is removed
 * for everyone but the owner, so a column added to `profiles` later is hidden until someone places it
 * in the map (a unit test fails first).
 *
 * `shares_more` is set when the member keeps something for approved people and this viewer is not
 * one: it is the only thing a visitor learns about what is hidden — not which fields, nor how many.
 */
export function redactProfileFor<T extends VisibilitySource & Record<string, any>>(
  profile: T,
  viewer: ProfileViewer,
): T {
  if (viewer.isOwner) return profile

  const hidden = new Set(hiddenFieldsFor(profile, viewer))
  const out: Record<string, any> = {}
  for (const [column, value] of Object.entries(profile)) {
    if (ALWAYS_SHOWN_COLUMNS.has(column)) {
      out[column] = value
      continue
    }
    if (OWNER_ONLY_COLUMNS.has(column)) continue
    const field = fieldOfColumn(column)
    if (!field) {
      // Unmapped: fails closed, except for admins, who read whole rows to moderate.
      if (viewer.isAdmin) out[column] = value
      continue
    }
    out[column] = hidden.has(field) ? blankFor(column) : value
  }

  const fields = parseFieldVisibility(profile.field_visibility)
  const sharesMore =
    !!viewer.id &&
    !viewer.isConnected &&
    !viewer.isAdmin &&
    Object.values(fields).some((audience) => audience === 'connected')
  if (sharesMore) out.shares_more = true

  return out as T
}

/** Whether the viewer may see this member's photos — which decides the avatar on the `user` too. */
export const canViewerSeePhotos = (profile: VisibilitySource, viewer: ProfileViewer) =>
  canViewerSeeField(profile, 'photos', viewer)

/** One member in the owner's approvals list: someone approved, or someone waiting for an answer. */
export type ProfileAccessEntry = {
  id: string
  name: string
  username: string
  avatarUrl?: string
  /** ISO time of the approval, or of the request. */
  time: string
}
