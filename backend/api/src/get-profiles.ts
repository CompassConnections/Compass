import * as Sentry from '@sentry/node'
import {type JSONContent} from '@tiptap/core'
import {type APIHandler} from 'api/helpers/endpoint'
import {
  DIET_CHOICES,
  EDUCATION_CHOICES,
  EXERCISE_CHOICES,
  GENDERS,
  LANGUAGE_CHOICES,
  MBTI_CHOICES,
  NEUROTYPE_CHOICES,
  ORIENTATION_CHOICES,
  POLITICAL_CHOICES,
  RACE_CHOICES,
  RELATIONSHIP_CHOICES,
  RELATIONSHIP_STATUS_CHOICES,
  RELIGION_CHOICES,
  ROMANTIC_CHOICES,
} from 'common/choices'
import {OptionTableKey} from 'common/profiles/constants'
import {parseJsonContentToText} from 'common/util/parse'
import {compact} from 'lodash'
import {log} from 'shared/monitoring/log'
import {convertRow} from 'shared/profiles/supabase'
import {createSupabaseDirectClient, pgp, SupabaseDirectClient} from 'shared/supabase/init'
import {
  from,
  join,
  leftJoin,
  limit,
  orderBy,
  renderSql,
  select,
  where,
} from 'shared/supabase/sql-builder'

/**
 * Profile query parameters for filtering and pagination
 *
 * Defines the available filters and pagination options for retrieving
 * user profiles from the database. Supports complex filtering based
 * on demographics, preferences, and location.
 */
export type profileQueryType = {
  /** Maximum number of profiles to return */
  limit?: number | undefined
  /** Pagination cursor for retrieving next page of results */
  after?: string | undefined
  /** Specific user ID to retrieve (for single profile lookups) */
  userId?: string | undefined
  /** Name filter for profile search */
  name?: string | undefined
  /** Filter by gender identity */
  genders?: string[] | undefined
  /** Filter for profiles with photos */
  hasPhoto?: boolean | undefined
  /** Filter by education level */
  education_levels?: string[] | undefined
  /** Filter by preferred gender for matches */
  pref_gender?: string[] | undefined
  /** Minimum preferred age for matches */
  pref_age_min?: number | undefined
  /** Maximum preferred age for matches */
  pref_age_max?: number | undefined
  /** Minimum drinks consumed per month */
  drinks_min?: number | undefined
  /** Maximum drinks consumed per month */
  drinks_max?: number | undefined
  big5_openness_min?: number | undefined
  big5_openness_max?: number | undefined
  big5_conscientiousness_min?: number | undefined
  big5_conscientiousness_max?: number | undefined
  big5_extraversion_min?: number | undefined
  big5_extraversion_max?: number | undefined
  big5_agreeableness_min?: number | undefined
  big5_agreeableness_max?: number | undefined
  big5_neuroticism_min?: number | undefined
  big5_neuroticism_max?: number | undefined
  pref_relation_styles?: string[] | undefined
  pref_romantic_styles?: string[] | undefined
  diet?: string[] | undefined
  political_beliefs?: string[] | undefined
  mbti?: string[] | undefined
  relationship_status?: string[] | undefined
  languages?: string[] | undefined
  religion?: string[] | undefined
  orientation?: string[] | undefined
  neurotype?: string[] | undefined
  wants_kids_strength?: number | undefined
  has_kids?: number | undefined
  is_smoker?: boolean | undefined
  exercise?: string[] | undefined
  shortBio?: boolean | undefined
  psychedelics?: string[] | undefined
  cannabis?: string[] | undefined
  psychedelics_intention?: string[] | undefined
  cannabis_intention?: string[] | undefined
  psychedelics_pref?: string[] | undefined
  cannabis_pref?: string[] | undefined
  geodbCityIds?: string[] | undefined
  lat?: number | undefined
  lon?: number | undefined
  radius?: number | undefined
  raised_in_lat?: number | undefined
  raised_in_lon?: number | undefined
  raised_in_radius?: number | undefined
  compatibleWithUserId?: string | undefined
  skipId?: string | undefined
  orderBy?: string | undefined
  lastModificationWithin?: string | undefined
  /** Restrict the results to these user ids. An empty array matches nothing. */
  userIds?: string[] | undefined
  /** Skip the total-count query when the caller only needs the rows */
  skipCount?: boolean | undefined
  last_active?: string | undefined
  locale?: string | undefined
  /** Which columns to return — see {@link ProfileProjection}. Defaults to `full`. */
  projection?: ProfileProjection | undefined
} & {
  [K in OptionTableKey]?: string[] | undefined
}

// Define all text fields to search
const textFields = [
  'users.name',
  'users.username',
  'search_text',
  'headline',
  'occupation',
  'occupation_title',
  'company',
  'university',
  'city',
  'country',
  'born_in_location',
  'raised_in_city',
  'raised_in_country',
  'political_details',
  'religious_beliefs',
  'orientation_details',
  'gender_details',
  'neurotype_details',
  // Keyword-searchable but deliberately has no filter of its own — see the migration for why.
  'accessibility_notes',
]

// Define choice fields to search
const choiceFields = [
  {field: 'gender', choices: GENDERS},
  {field: 'education_level', choices: EDUCATION_CHOICES},
  {field: 'mbti', choices: MBTI_CHOICES},
  {field: 'exercise', choices: EXERCISE_CHOICES},
]

// Define array choice fields to search
const arrayChoiceFields = [
  {field: 'diet', choices: DIET_CHOICES},
  {field: 'political_beliefs', choices: POLITICAL_CHOICES},
  {field: 'relationship_status', choices: RELATIONSHIP_STATUS_CHOICES},
  {field: 'religion', choices: RELIGION_CHOICES},
  {field: 'orientation', choices: ORIENTATION_CHOICES},
  {field: 'neurotype', choices: NEUROTYPE_CHOICES},
  {field: 'pref_relation_styles', choices: RELATIONSHIP_CHOICES},
  {field: 'pref_romantic_styles', choices: ROMANTIC_CHOICES},
  {field: 'languages', choices: LANGUAGE_CHOICES},
  {field: 'ethnicity', choices: RACE_CHOICES},
]

// Search-only columns. `bio_text`/`bio_tsv` were already stripped from the response by `convertRow`,
// but they were still being read out of Postgres on every query — `bio_tsv` is a tsvector roughly the
// size of the bio itself, so 20 of them per page is real DB→API transfer for bytes nobody reads.
// `birth_date` is deliberately here as well: `age` is what the cards show, the database derives it,
// and a list of strangers has no reason to carry the date it was derived from.
const EXCLUDED_PROFILE_COLS = new Set([
  'search_text',
  'search_tsv',
  'bio_text',
  'bio_tsv',
  'birth_date',
])

/**
 * Which profile columns to return.
 *
 * `full` is every column (minus {@link EXCLUDED_PROFILE_COLS}) and stays the default, since callers
 * hand the row to code that expects a complete `Profile`. `card` returns only what the profile grid
 * actually renders — the row is ~80 columns wide and the card reads about a quarter of them, so the
 * rest is pure egress. See {@link PROFILE_CARD_COLS}.
 */
export type ProfileProjection = 'card' | 'full'

/**
 * The profile columns the grid card in `web/components/profile-grid.tsx` reads, directly or through
 * `ProfileAvatar` / `ProfileLocation` / `ProfileDetailRail` / `SendMessageButton`. Keep in sync with
 * that component. `interests` / `causes` / `work` are not here — they come from their own joins.
 *
 * `bio` is selected but never sent: it is replaced by {@link toBioSnippet} before the response.
 */
const PROFILE_CARD_COLS = [
  'id',
  'user_id',
  'created_time',
  'age',
  'gender',
  'headline',
  'bio',
  'bio_length',
  'keywords',
  'pinned_url',
  'city',
  'country',
  'region_code',
  'occupation_title',
  'diet',
  'drinks_per_month',
  'is_smoker',
  'languages',
  'mbti',
  'pref_relation_styles',
]

/**
 * A card shows at most 6 lines of headline + bio, and the widest card fits ~78 characters to a line.
 * 600 leaves room to spare while cutting a long bio down to a fraction of its size.
 */
const BIO_SNIPPET_CHARS = 600

/** A block whose whole text is bold and no longer than this reads as a heading, not as prose. */
const HEADING_LIKE_CHARS = 80

/** Openers we treat as an aside, mapped to the closer that ends them. */
const BRACKET_PAIRS: Record<string, string> = {'(': ')', '[': ']', '{': '}'}

/**
 * Leading blocks that are pure scaffolding: a section label the bio itself repeats ("About me"), or
 * an editorial note about the document rather than about the person. Matched case-insensitively
 * against the block's whole text, so a paragraph merely *starting* with "Note that..." is prose and
 * survives.
 */
const LABEL_BLOCK = /^(about me|summary)\s*[:.]?$/i
const META_NOTE_BLOCK = /^(note|nb|disclaimer|edit|update|ps)\b\s*[:\-–—]/i

/** Every text node under `node`, in document order. */
const textNodes = (node: JSONContent): JSONContent[] =>
  node.type === 'text' ? [node] : (node.content ?? []).flatMap(textNodes)

/**
 * The block's text with marks flattened. Inline siblings are joined without a separator (a bolded
 * word mid-sentence is its own text node); anything else — list items, table cells — gets a space so
 * words from different blocks don't run together.
 */
const blockText = (node: JSONContent): string => {
  if (node.type === 'text') return node.text ?? ''
  const children = node.content ?? []
  const parts = children.map(blockText)
  const separator = children.every((c) => c.type === 'text') ? '' : ' '
  return parts.join(separator).replace(/\s+/g, ' ').trim()
}

/** Whether every non-blank text node in the block carries the bold mark. */
const isAllBold = (node: JSONContent) => {
  const nodes = textNodes(node).filter((n) => (n.text ?? '').trim())
  return nodes.length > 0 && nodes.every((n) => n.marks?.some((m) => m.type === 'bold'))
}

/**
 * Index of the bracket that closes the one opening `text`, or -1 if `text` doesn't open with a
 * bracket / never closes it. Nesting is counted so `[updated (2 Aug)]` closes at the last character.
 */
const closingBracketIndex = (text: string) => {
  const open = text[0]
  const close = BRACKET_PAIRS[open]
  if (!close) return -1
  let depth = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === open) depth++
    else if (text[i] === close && --depth === 0) return i
  }
  return -1
}

/** A block that is nothing but a bracketed aside, e.g. "[profile updated 2 Aug 2026]". */
const isBracketedBlock = (text: string) => closingBracketIndex(text) === text.length - 1

/**
 * Drops a bracketed aside that opens the bio inline — the same "[profile updated ...]" preamble, but
 * written at the head of the first real paragraph instead of on its own line. Repeats, since bios
 * stack them ("[updated 2 Aug] (he/him) Hi, ...").
 */
const stripLeadingBrackets = (text: string) => {
  let out = text.trim()
  for (;;) {
    const end = closingBracketIndex(out)
    if (end <= 0 || end === out.length - 1) return out
    out = out.slice(end + 1).trim()
  }
}

/**
 * Whether a *leading* block is preliminary — scaffolding a reader skims past to reach the bio. Only
 * ever asked about blocks before the first real prose, so a heading deeper in the bio is left alone.
 */
const isPreliminaryBlock = (node: JSONContent, text: string) =>
  !text ||
  node.type === 'heading' ||
  isBracketedBlock(text) ||
  LABEL_BLOCK.test(text) ||
  META_NOTE_BLOCK.test(text) ||
  // "1. Introduction" / "Introduction" written as bold prose rather than as a heading node.
  (isAllBold(node) && text.length <= HEADING_LIKE_CHARS)

/**
 * At most this many leading lines are dropped. A bio that is heading-shaped all the way down is
 * more likely to be unusual formatting than to be all preamble, and the snippet should still show
 * something from the top of it.
 */
const MAX_DROPPED_BLOCKS = 5

/**
 * The visual lines of a block, as pseudo-blocks. Bios pasted from a doc routinely arrive as one
 * paragraph whose "paragraphs" are `hardBreak` pairs, so the preamble ("[profile updated 2 Aug
 * 2026]", "1. Introduction") sits inside the same node as the bio itself — splitting here is what
 * lets {@link isPreliminaryBlock} see those lines at all. Blocks without a hard break are their own
 * single line.
 */
const blockLines = (node: JSONContent): JSONContent[] => {
  const children = node.content ?? []
  if (!children.some((c) => c.type === 'hardBreak')) return [node]
  const lines: JSONContent[] = []
  let current: JSONContent[] = []
  for (const child of children) {
    if (child.type === 'hardBreak') {
      if (current.length) lines.push({...node, content: current})
      current = []
    } else {
      current.push(child)
    }
  }
  if (current.length) lines.push({...node, content: current})
  return lines
}

/**
 * The bio with its preamble removed: title headings, "About me" labels, bracketed status notes, and
 * editorial notes about the document itself (Richard's date-me doc opens with a parenthetical about
 * reading it on Google Docs). Falls back to the untouched document when stripping would leave
 * nothing — a bio that is *only* a heading is better shown than blanked.
 *
 * Scans line by line (see {@link blockLines}) and stops at the first line of real prose, so only a
 * leading run is ever dropped and a heading further down the bio is left alone.
 */
const stripBioPreamble = (bio: JSONContent) => {
  const blocks = bio?.content
  if (!Array.isArray(blocks)) return bio
  let dropped = 0
  for (let i = 0; i < blocks.length; i++) {
    const lines = blockLines(blocks[i])
    let start = 0
    while (
      start < lines.length &&
      dropped < MAX_DROPPED_BLOCKS &&
      isPreliminaryBlock(lines[start], blockText(lines[start]))
    ) {
      start++
      dropped++
    }
    // Prose found in this block: keep its surviving lines and everything after it.
    const kept = lines.slice(start)
    if (kept.length) return {...bio, content: [...kept, ...blocks.slice(i + 1)]}
    // The whole block was preamble — carry the drop count into the next one.
  }
  return bio
}

/**
 * The card renders `parseJsonContentToText(profile.bio)` clamped to a few lines, so shipping the whole
 * rich-text document is wasted. Computed here rather than read from the `bio_text` column: that column
 * is built with `string_agg(DISTINCT ...)` for search, which reorders and dedupes the text nodes — fine
 * for a tsvector, wrong for something a person reads.
 *
 * The snippet starts at the first block of actual bio (see {@link stripBioPreamble}) rather than at
 * the top of the document, so the few lines a card shows aren't spent on a title or a changelog note.
 */
const toBioSnippet = (bio: unknown) => {
  const content = bio as JSONContent
  const stripped = typeof content === 'object' && content ? stripBioPreamble(content) : content
  const text = stripLeadingBrackets(parseJsonContentToText(stripped).replace(/\s+/g, ' ').trim())
  const snippet = text || parseJsonContentToText(content).replace(/\s+/g, ' ').trim()
  return snippet.length > BIO_SNIPPET_CHARS ? `${snippet.slice(0, BIO_SNIPPET_CHARS)}…` : snippet
}

let profileCols: any

export const getProfileCols = async () => {
  if (profileCols) return profileCols
  const pg = createSupabaseDirectClient()
  // table_schema matters: the search-alert snapshot schemas hold a `profiles` table too.
  const rows = await pg.manyOrNone<{column_name: string}>(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' ORDER BY ordinal_position`,
  )
  profileCols = rows
    .map((r) => r.column_name)
    .filter((c) => !EXCLUDED_PROFILE_COLS.has(c))
    .map((c) => `profiles.${c}`)
    .join(', ')
  console.log('profileCols:', profileCols)
  return profileCols
}

/**
 * @param db pass a client bound to a snapshot schema (see `withSchema` in `profile-snapshot.ts`) to
 *   evaluate the same filters against the profiles as they were at an earlier point in time.
 */
export const loadProfiles = async (props: profileQueryType, db?: SupabaseDirectClient) => {
  const pg = db ?? createSupabaseDirectClient()
  const {
    limit: limitParam,
    after,
    name,
    userId,
    genders,
    hasPhoto,
    education_levels,
    pref_gender,
    pref_age_min,
    pref_age_max,
    drinks_min,
    drinks_max,
    big5_openness_min,
    big5_openness_max,
    big5_conscientiousness_min,
    big5_conscientiousness_max,
    big5_extraversion_min,
    big5_extraversion_max,
    big5_agreeableness_min,
    big5_agreeableness_max,
    big5_neuroticism_min,
    big5_neuroticism_max,
    pref_relation_styles,
    pref_romantic_styles,
    diet,
    political_beliefs,
    mbti,
    relationship_status,
    languages,
    religion,
    orientation,
    neurotype,
    wants_kids_strength,
    has_kids,
    interests,
    causes,
    work,
    is_smoker,
    exercise,
    shortBio,
    psychedelics,
    cannabis,
    psychedelics_intention,
    cannabis_intention,
    psychedelics_pref,
    cannabis_pref,
    geodbCityIds,
    lat,
    lon,
    radius,
    raised_in_lat,
    raised_in_lon,
    raised_in_radius,
    compatibleWithUserId,
    orderBy: orderByParam = 'created_time',
    lastModificationWithin,
    userIds,
    skipCount,
    skipId,
    locale = 'en',
    last_active,
    projection = 'card',
  } = props

  log('get-profiles', {...props, userIds: userIds && `${userIds.length} ids`})

  const filterLocation = lat && lon && radius
  const filterRaisedInLocation = raised_in_lat && raised_in_lon && raised_in_radius

  const keywords = name
    ? name
        .split(',')
        .map((q) => q.trim())
        .filter(Boolean)
    : []
  // console.debug('keywords:', keywords)

  if (orderByParam === 'compatibility_score' && !compatibleWithUserId) {
    console.error('Incompatible with user ID')
    throw Error('Incompatible with user ID')
  }

  const tablePrefix =
    orderByParam === 'compatibility_score'
      ? 'compatibility_scores'
      : orderByParam === 'last_online_time'
        ? 'user_activity'
        : 'profiles'

  const userActivityJoin = 'user_activity on user_activity.user_id = profiles.user_id'

  // Need them in the output for the profile card even we don't filter by them
  const joinInterests = true // !!interests?.length
  const joinCauses = true // !!causes?.length
  const joinWork = true // !!work?.length

  // Pre-aggregated interests per profile
  function getManyToManyJoin(label: OptionTableKey) {
    return `(
        SELECT 
            profile_${label}.profile_id,
            ARRAY_AGG(${label}.id ORDER BY ${label}.id) AS ${label}
        FROM profile_${label}
        JOIN ${label} ON ${label}.id = profile_${label}.option_id
        GROUP BY profile_${label}.profile_id
    ) profile_${label} ON profile_${label}.profile_id = profiles.id`
  }

  const interestsJoin = getManyToManyJoin('interests')
  const causesJoin = getManyToManyJoin('causes')
  const workJoin = getManyToManyJoin('work')

  const compatibilityScoreJoin = pgp.as.format(
    `compatibility_scores cs on (cs.user_id_1 = LEAST(profiles.user_id, $(compatibleWithUserId)) and cs.user_id_2 = GREATEST(profiles.user_id, $(compatibleWithUserId)))`,
    {compatibleWithUserId},
  )

  const joins = [
    (orderByParam === 'last_online_time' || last_active) && leftJoin(userActivityJoin),
    orderByParam === 'compatibility_score' && compatibleWithUserId && join(compatibilityScoreJoin),
    joinInterests && leftJoin(interestsJoin),
    joinCauses && leftJoin(causesJoin),
    joinWork && leftJoin(workJoin),
  ]

  const _orderBy =
    orderByParam === 'compatibility_score' ? 'cs.score' : `${tablePrefix}.${orderByParam}`
  const afterFilter = renderSql(
    select(_orderBy),
    from('profiles'),
    ...joins,
    where('profiles.id = $(after)', {after}),
  )

  const tableSelection = compact([
    from('profiles'),
    join('users on users.id = profiles.user_id'),
    ...joins,
  ])

  function getManyToManyClause(label: OptionTableKey) {
    return `EXISTS (
      SELECT 1 FROM profile_${label}
      JOIN ${label} ON ${label}.id = profile_${label}.option_id
      WHERE profile_${label}.profile_id = profiles.id
        AND ${label}.id = ANY (ARRAY[$(values)])
      )`
  }

  /** "Has this profile picked any option at all?" — the `array_length(...) > 0` test on the
   *  aggregate join, expressed so it does not need the join. */
  function getManyToManyAnyClause(label: OptionTableKey) {
    return `EXISTS (
      SELECT 1 FROM profile_${label}
      JOIN ${label} ON ${label}.id = profile_${label}.option_id
      WHERE profile_${label}.profile_id = profiles.id
      )`
  }

  function getOptionClauseKeyword(label: OptionTableKey) {
    return `EXISTS (
      SELECT 1 FROM profile_${label}
      JOIN ${label} ON ${label}.id = profile_${label}.option_id
      LEFT JOIN ${label}_translations
        ON ${label}_translations.option_id = profile_${label}.option_id
          AND ${label}_translations.locale = $(locale)
      WHERE profile_${label}.profile_id = profiles.id
        AND lower(COALESCE(${label}_translations.name, ${label}.name)) ILIKE '%' || lower($(word)) || '%'
    )`
  }

  function getTextFieldClauseKeyword(field: string) {
    return `lower(${field}) ilike '%' || lower($(word)) || '%'`
  }

  // TODO: support locales (right now it only maps to english labels)
  function getChoiceFieldClauseKeyword(field: string, choices: Record<string, string>) {
    const choiceValues = Object.entries(choices)
      .map(([key, value]) => `('${value}', '${key}')`)
      .join(', ')
    return `(
      ${getTextFieldClauseKeyword(field)} OR
      EXISTS (
        SELECT 1 FROM (VALUES ${choiceValues}) AS t(choice_key, choice_value)
        WHERE t.choice_key = ${field}
          AND ${getTextFieldClauseKeyword('t.choice_value')}
      )
    )`
  }

  // TODO: support locales (right now it only maps to english labels)
  function getArrayChoiceFieldClauseKeyword(arrayField: string, choices: Record<string, string>) {
    const choiceValues = Object.entries(choices)
      .map(([key, value]) => `('${value}', '${key}')`)
      .join(', ')
    return `EXISTS (
      SELECT 1 FROM unnest(${arrayField}) AS choice_key
      WHERE ${getTextFieldClauseKeyword('choice_key')} OR
        EXISTS (
          SELECT 1 FROM (VALUES ${choiceValues}) AS t(choice_k, choice_value)
          WHERE t.choice_k = choice_key
            AND ${getTextFieldClauseKeyword('t.choice_value')}
        )
    )`
  }

  // Decide whether unfilled (null) profiles should be surfaced by a numeric range
  // filter. Rare searches — a narrow band, or one sitting near an extreme edge of
  // the field's domain — exclude nulls, since people who left the field blank
  // almost certainly aren't the rare match being sought. Broad, central searches
  // keep nulls. `lo`/`hi` are the field's full domain (used when only one bound is
  // set); `isRare` receives the effective [m, M] range.
  const numericRangeClause = (
    field: string,
    min: number | null | undefined,
    max: number | null | undefined,
    lo: number,
    hi: number,
    isRare: (m: number, M: number) => boolean,
  ) => {
    if (!min && !max) return undefined
    const m = min ?? lo
    const M = max ?? hi
    const bounds = compact([min && `${field} >= $(min)`, max && `${field} <= $(max)`]).join(' AND ')
    const clause = isRare(m, M) ? bounds : `(${bounds}) OR ${field} IS NULL`
    return where(clause, {min, max})
  }

  const filters = [
    where('looking_for_matches = true'),
    where(`profiles.disabled != true`),
    where(`not users.is_banned_from_posting`),
    // where(`data->>'userDeleted' != 'true' or data->>'userDeleted' is null`),

    ...keywords.map((word) =>
      where(
        [
          // Text field searches
          ...textFields.map((field) => getTextFieldClauseKeyword(field)),
          // Full-text search
          "search_tsv @@ phraseto_tsquery('english', $(word))",
          // Option table searches with translations
          getOptionClauseKeyword('interests'),
          getOptionClauseKeyword('causes'),
          getOptionClauseKeyword('work'),
          // Choice field searches
          ...choiceFields.map(({field, choices}) => getChoiceFieldClauseKeyword(field, choices)),
          // Array choice field searches
          ...arrayChoiceFields.map(({field, choices}) =>
            getArrayChoiceFieldClauseKeyword(field, choices),
          ),
          // Keywords search
          `EXISTS ( SELECT 1 FROM unnest(keywords) AS kw WHERE ${getTextFieldClauseKeyword('kw')} )`,
        ].join(' OR '),
        {word, locale},
      ),
    ),

    genders?.length && where(`gender = ANY($(genders))`, {genders}),

    education_levels?.length &&
      where(`education_level = ANY($(education_levels))`, {education_levels}),

    mbti?.length && where(`mbti = ANY($(mbti))`, {mbti}),

    pref_gender?.length &&
      where(`pref_gender is NULL or pref_gender = '{}' OR pref_gender && $(pref_gender)`, {
        pref_gender,
      }),

    // age domain 18–100; young (<30), older (>50), or narrow (<15yr) searches are rare
    numericRangeClause('age', pref_age_min, pref_age_max, 18, 100, (m, M) => {
      return M < 30 || m > 50 || M - m < 15
    }),

    // drinks/month domain 0–20; narrow band, near-teetotal, or heavy-drinker searches are rare
    numericRangeClause('drinks_per_month', drinks_min, drinks_max, 0, 20, (m, M) => {
      return M - m < 5 || M < 5 || m > 15
    }),

    // big5 traits are 0–100 percentiles; narrow band or outer-quartile searches are rare
    ...(
      [
        ['big5_openness', big5_openness_min, big5_openness_max],
        ['big5_conscientiousness', big5_conscientiousness_min, big5_conscientiousness_max],
        ['big5_extraversion', big5_extraversion_min, big5_extraversion_max],
        ['big5_agreeableness', big5_agreeableness_min, big5_agreeableness_max],
        ['big5_neuroticism', big5_neuroticism_min, big5_neuroticism_max],
      ] as const
    ).map(([field, min, max]) =>
      numericRangeClause(field, min, max, 0, 100, (m, M) => M - m < 25 || M < 25 || m > 75),
    ),

    pref_relation_styles?.length &&
      where(
        `pref_relation_styles IS NULL OR pref_relation_styles = '{}' OR pref_relation_styles && $(pref_relation_styles)`,
        {pref_relation_styles},
      ),

    pref_romantic_styles?.length &&
      where(
        `pref_romantic_styles IS NULL OR pref_romantic_styles = '{}' OR pref_romantic_styles && $(pref_romantic_styles)`,
        {pref_romantic_styles},
      ),

    diet?.length &&
      where(
        // most are omnivores, so we don't include the people who didn't answer if we're looking for other diets
        (!diet.includes('omnivore') ? '' : "diet IS NULL OR diet = '{}' OR ") + `diet && $(diet)`,
        {diet},
      ),

    // no dominant value, so unfilled profiles are never surfaced by a politics filter
    political_beliefs?.length &&
      where(`political_beliefs && $(political_beliefs)`, {political_beliefs}),

    relationship_status?.length &&
      where(
        // most are single, so we don't include the people who didn't answer unless looking for single
        (!relationship_status.includes('single')
          ? ''
          : "relationship_status IS NULL OR relationship_status = '{}' OR ") +
          `relationship_status && $(relationship_status)`,
        {relationship_status},
      ),

    languages?.length && where(`languages && $(languages)`, {languages}),

    // no dominant value, so unfilled profiles are never surfaced by a religion filter
    religion?.length && where(`religion && $(religion)`, {religion}),

    orientation?.length &&
      where(
        // most are straight, so we don't include the people who didn't answer if we're looking for non-straight
        (!orientation.includes('straight') ? '' : "orientation IS NULL OR orientation = '{}' OR ") +
          `orientation && $(orientation)`,
        {
          orientation,
        },
      ),

    neurotype?.length &&
      where(
        // most are neurotypical, so we don't include the people who didn't answer if we're looking for
        // anything else — a rare value is only meaningful when it was actually stated
        (!neurotype.includes('neurotypical') ? '' : "neurotype IS NULL OR neurotype = '{}' OR ") +
          `neurotype && $(neurotype)`,
        {
          neurotype,
        },
      ),

    interests?.length && where(getManyToManyClause('interests'), {values: interests.map(Number)}),

    causes?.length && where(getManyToManyClause('causes'), {values: causes.map(Number)}),

    work?.length && where(getManyToManyClause('work'), {values: work.map(Number)}),

    !!wants_kids_strength &&
      wants_kids_strength !== -1 &&
      where(
        'wants_kids_strength = -1 OR wants_kids_strength IS NULL OR ' +
          (wants_kids_strength >= 2
            ? `wants_kids_strength >= $(wants_kids_strength)`
            : `wants_kids_strength <= $(wants_kids_strength)`),
        {wants_kids_strength},
      ),

    has_kids === 0 && where(`has_kids IS NULL OR has_kids = 0`),
    has_kids && has_kids > 0 && where(`has_kids > 0`),

    is_smoker !== undefined &&
      where(
        (is_smoker ? '' : 'is_smoker IS NULL OR ') + // smokers are rare, so we don't include the people who didn't answer if we're looking for smokers
          `is_smoker = $(is_smoker)`,
        {is_smoker},
      ),

    exercise?.length && where(`exercise = ANY($(exercise))`, {exercise}),

    psychedelics?.length &&
      where(
        (psychedelics.includes('never_not_interested') ? 'psychedelics IS NULL OR ' : '') +
          `psychedelics = ANY($(psychedelics))`,
        {psychedelics},
      ),

    cannabis?.length &&
      where(
        (cannabis.includes('never_not_interested') ? 'cannabis IS NULL OR ' : '') +
          `cannabis = ANY($(cannabis))`,
        {cannabis},
      ),

    psychedelics_intention?.length &&
      where(
        `(psychedelics IS NOT NULL AND psychedelics != 'never_not_interested') AND (psychedelics_intention IS NULL OR psychedelics_intention = '{}') OR psychedelics_intention && $(psychedelics_intention)`,
        {psychedelics_intention},
      ),

    cannabis_intention?.length &&
      where(
        `(cannabis IS NOT NULL AND cannabis != 'never_not_interested') AND (cannabis_intention IS NULL OR cannabis_intention = '{}') OR cannabis_intention && $(cannabis_intention)`,
        {cannabis_intention},
      ),

    psychedelics_pref?.length &&
      where(
        `psychedelics_pref IS NULL OR psychedelics_pref = '{}' OR psychedelics_pref && $(psychedelics_pref)`,
        {psychedelics_pref},
      ),

    cannabis_pref?.length &&
      where(`cannabis_pref IS NULL OR cannabis_pref = '{}' OR cannabis_pref && $(cannabis_pref)`, {
        cannabis_pref,
      }),

    geodbCityIds?.length && where(`geodb_city_id = ANY($(geodbCityIds))`, {geodbCityIds}),

    // miles par degree of lat: earth's radius (3950 miles) * pi / 180 = 69.0
    filterLocation &&
      where(
        `
      city_latitude BETWEEN $(target_lat) - ($(radius) / 69.0)
           AND $(target_lat) + ($(radius) / 69.0)
      AND city_longitude BETWEEN $(target_lon) - ($(radius) / (69.0 * COS(RADIANS($(target_lat)))))
           AND $(target_lon) + ($(radius) / (69.0 * COS(RADIANS($(target_lat)))))
      AND SQRT(
            POWER(city_latitude - $(target_lat), 2)
          + POWER((city_longitude - $(target_lon)) * COS(RADIANS($(target_lat))), 2)
          ) <= $(radius) / 69.0
      `,
        {target_lat: lat, target_lon: lon, radius},
      ),

    filterRaisedInLocation &&
      where(
        `
      raised_in_lat BETWEEN $(target_lat) - ($(radius) / 69.0)
           AND $(target_lat) + ($(radius) / 69.0)
      AND raised_in_lon BETWEEN $(target_lon) - ($(radius) / (69.0 * COS(RADIANS($(target_lat)))))
           AND $(target_lon) + ($(radius) / (69.0 * COS(RADIANS($(target_lat)))))
      AND SQRT(
            POWER(raised_in_lat - $(target_lat), 2)
          + POWER((raised_in_lon - $(target_lon)) * COS(RADIANS($(target_lat))), 2)
          ) <= $(radius) / 69.0
      `,
        {target_lat: raised_in_lat, target_lon: raised_in_lon, radius: raised_in_radius},
      ),

    skipId && where(`profiles.user_id != $(skipId)`, {skipId}),

    userIds && where(`profiles.user_id = any($(userIds))`, {userIds}),

    // Deliberately EXISTS rather than `array_length(profile_work.work, 1) > 0`: reading the aggregate
    // joins here would tie this filter to joins that are only there to shape the output.
    !shortBio &&
      where(
        `bio_length >= ${100}
       OR headline IS NOT NULL
       OR ${getManyToManyAnyClause('work')}
       OR ${getManyToManyAnyClause('interests')}
       OR occupation_title IS NOT NULL
       `,
      ),

    hasPhoto && where("pinned_url IS NOT NULL AND pinned_url != ''"),

    lastModificationWithin &&
      where(`last_modification_time >= NOW() - INTERVAL $(lastModificationWithin)`, {
        lastModificationWithin,
      }),

    last_active &&
      where(`user_activity.last_online_time >= NOW() - INTERVAL $(last_active_interval)`, {
        last_active_interval:
          last_active === 'now'
            ? '30 minutes'
            : last_active === 'today'
              ? '1 day'
              : last_active === '3days'
                ? '3 days'
                : last_active === 'week'
                  ? '7 days'
                  : last_active === 'month'
                    ? '30 days'
                    : '90 days',
      }),

    // Precomputed scores can be nulled out (e.g. after the user deletes their last shared
    // prompt) instead of the row being removed — don't surface those as matches.
    orderByParam === 'compatibility_score' && where('cs.score IS NOT NULL'),

    // Exclude profiles that the requester has chosen to hide
    userId &&
      where(
        `NOT EXISTS (
         SELECT 1 FROM hidden_profiles hp
         WHERE hp.hider_user_id = $(userId)
           AND hp.hidden_user_id = profiles.user_id
       )`,
        {userId},
      ),

    // Exclude blocked profiles, in both directions. Hiding is a one-way "not interested" and lives in
    // its own table; blocking is mutual removal and lives on `private_users.data`, so it needs its own
    // clause rather than an entry in `hidden_profiles`. Both sides are checked here because a block
    // the other person initiated should take them out of your grid too — otherwise the person who did
    // the blocking keeps seeing the profile of someone who wanted nothing to do with them.
    userId &&
      where(
        `NOT EXISTS (
         SELECT 1 FROM private_users pu
         WHERE pu.id = $(userId)
           AND (pu.data->'blockedUserIds' @> to_jsonb(profiles.user_id)
             OR pu.data->'blockedByUserIds' @> to_jsonb(profiles.user_id))
       )`,
        {userId},
      ),
  ]

  const profileCols =
    projection === 'card'
      ? PROFILE_CARD_COLS.map((c) => `profiles.${c}`).join(', ')
      : ((await getProfileCols()) ?? 'profiles.*') // stored at module level
  // `users.name` / `users.username` feed `convertRow`, which folds them into the `user` object and
  // then drops the top-level copies — they are not part of the response.
  let selectCols = `${profileCols}, users.name, users.username, jsonb_build_object(
    'id', users.id,
    'name', users.name,
    'username', users.username,
    'avatarUrl', users.avatar_url,
    'createdTime', users.created_time,
    'isBannedFromPosting', users.is_banned_from_posting,
    'banReason', users.ban_reason
  ) as user`
  if (orderByParam === 'compatibility_score') {
    selectCols += ', cs.score as compatibility_score'
  } else if (orderByParam === 'last_online_time' || last_active) {
    selectCols += ', user_activity.last_online_time'
  }
  if (joinInterests) selectCols += `, COALESCE(profile_interests.interests, '{}') AS interests`
  if (joinCauses) selectCols += `, COALESCE(profile_causes.causes, '{}') AS causes`
  if (joinWork) selectCols += `, COALESCE(profile_work.work, '{}') AS work`

  const query = renderSql(
    select(selectCols),
    ...tableSelection,
    ...filters,
    orderBy(`${_orderBy} DESC`),
    after && where(`${_orderBy} < (${afterFilter})`),
    limitParam && limit(limitParam),
  )
  // console.debug('query:', query)

  const profiles = await pg.map(query, [], convertRow)

  if (projection === 'card') {
    for (const profile of profiles) {
      profile.bio_snippet = toBioSnippet(profile.bio)
      delete (profile as any).bio
    }
  }

  // console.debug('profiles:', profiles)

  const countQuery = renderSql(select(`count(*) as count`), ...tableSelection, ...filters)

  const count = skipCount
    ? profiles.length
    : await pg.one<number>(countQuery, [], (r) => Number(r.count))

  return {profiles, count}
}

export const getProfiles: APIHandler<'get-profiles'> = async (props, auth) => {
  try {
    if (!props.skipId) props.skipId = auth.uid
    const {profiles, count} = await loadProfiles({...props, userId: auth.uid})
    return {status: 'success', profiles: profiles, count: count}
  } catch (error) {
    console.log(error)
    Sentry.captureException(error, {extra: props})
    return {status: 'fail', profiles: [], count: 0}
  }
}
