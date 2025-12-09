import {type APIHandler} from 'api/helpers/endpoint'
import {convertRow} from 'shared/profiles/supabase'
import {createSupabaseDirectClient, pgp} from 'shared/supabase/init'
import {from, join, leftJoin, limit, orderBy, renderSql, select, where,} from 'shared/supabase/sql-builder'
import {MIN_BIO_LENGTH} from "common/constants";
import {compact} from "lodash";
import {OptionTableKey} from "common/profiles/constants";

export type profileQueryType = {
  limit?: number | undefined,
  after?: string | undefined,
  // Search and filter parameters
  name?: string | undefined,
  genders?: string[] | undefined,
  education_levels?: string[] | undefined,
  pref_gender?: string[] | undefined,
  pref_age_min?: number | undefined,
  pref_age_max?: number | undefined,
  drinks_min?: number | undefined,
  drinks_max?: number | undefined,
  pref_relation_styles?: string[] | undefined,
  pref_romantic_styles?: string[] | undefined,
  diet?: string[] | undefined,
  political_beliefs?: string[] | undefined,
  mbti?: string[] | undefined,
  relationship_status?: string[] | undefined,
  languages?: string[] | undefined,
  religion?: string[] | undefined,
  wants_kids_strength?: number | undefined,
  has_kids?: number | undefined,
  is_smoker?: boolean | undefined,
  shortBio?: boolean | undefined,
  geodbCityIds?: string[] | undefined,
  lat?: number | undefined,
  lon?: number | undefined,
  radius?: number | undefined,
  compatibleWithUserId?: string | undefined,
  skipId?: string | undefined,
  orderBy?: string | undefined,
  lastModificationWithin?: string | undefined,
} & {
  [K in OptionTableKey]?: string[] | undefined
}

// const userActivityColumns = ['last_online_time']


export const loadProfiles = async (props: profileQueryType) => {
  const pg = createSupabaseDirectClient()
  console.debug('loadProfiles', props)
  const {
    limit: limitParam,
    after,
    name,
    genders,
    education_levels,
    pref_gender,
    pref_age_min,
    pref_age_max,
    drinks_min,
    drinks_max,
    pref_relation_styles,
    pref_romantic_styles,
    diet,
    political_beliefs,
    mbti,
    relationship_status,
    languages,
    religion,
    wants_kids_strength,
    has_kids,
    interests,
    causes,
    work,
    is_smoker,
    shortBio,
    geodbCityIds,
    lat,
    lon,
    radius,
    compatibleWithUserId,
    orderBy: orderByParam = 'created_time',
    lastModificationWithin,
    skipId,
  } = props

  const filterLocation = lat && lon && radius

  const keywords = name ? name.split(",").map(q => q.trim()).filter(Boolean) : []
  // console.debug('keywords:', keywords)

  if (orderByParam === 'compatibility_score' && !compatibleWithUserId) {
    console.error('Incompatible with user ID')
    throw Error('Incompatible with user ID')
  }

  const tablePrefix = orderByParam === 'compatibility_score'
    ? 'compatibility_scores'
    : orderByParam === 'last_online_time'
      ? 'user_activity'
      : 'profiles'

  const userActivityJoin = 'user_activity on user_activity.user_id = profiles.user_id'

  // Pre-aggregated interests per profile
  function getManyToManyJoin(label: OptionTableKey) {
    return `(
        SELECT 
            profile_${label}.profile_id,
            ARRAY_AGG(${label}.name ORDER BY ${label}.name) AS ${label}
        FROM profile_${label}
        JOIN ${label} ON ${label}.id = profile_${label}.option_id
        GROUP BY profile_${label}.profile_id
    ) profile_${label} ON profile_${label}.profile_id = profiles.id`
  }
  const interestsJoin = getManyToManyJoin('interests')
  const causesJoin = getManyToManyJoin('causes')
  const workJoin = getManyToManyJoin('work')

  const compatibilityScoreJoin = pgp.as.format(`compatibility_scores cs on (cs.user_id_1 = LEAST(profiles.user_id, $(compatibleWithUserId)) and cs.user_id_2 = GREATEST(profiles.user_id, $(compatibleWithUserId)))`, {compatibleWithUserId})

  const joins = [
    orderByParam === 'last_online_time' && leftJoin(userActivityJoin),
    orderByParam === 'compatibility_score' && compatibleWithUserId && join(compatibilityScoreJoin),
    interests && leftJoin(interestsJoin),
    causes && leftJoin(causesJoin),
    work && leftJoin(workJoin),
  ]

  const _orderBy = orderByParam === 'compatibility_score' ? 'cs.score' : `${tablePrefix}.${orderByParam}`
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
        AND ${label}.name = ANY (ARRAY[$(values)])
      )`
  }

  const filters = [
    where('looking_for_matches = true'),
    where(`profiles.disabled != true`),
    // where(`pinned_url is not null and pinned_url != ''`),
    where(
      `(data->>'isBannedFromPosting' != 'true' or data->>'isBannedFromPosting' is null)`
    ),
    where(`data->>'userDeleted' != 'true' or data->>'userDeleted' is null`),

    ...keywords.map(word => where(
      `lower(users.name) ilike '%' || lower($(word)) || '%' or lower(bio::text) ilike '%' || lower($(word)) || '%' or bio_tsv @@ phraseto_tsquery('english', $(word))`,
      {word}
    )),

    genders?.length && where(`gender = ANY($(genders))`, {genders}),

    education_levels?.length && where(`education_level = ANY($(education_levels))`, {education_levels}),

    mbti?.length && where(`mbti = ANY($(mbti))`, {mbti}),

    pref_gender?.length &&
    where(`pref_gender is NULL or pref_gender = '{}' OR pref_gender && $(pref_gender)`, {pref_gender}),

    pref_age_min &&
    where(`age >= $(pref_age_min) or age is null`, {pref_age_min}),

    pref_age_max &&
    where(`age <= $(pref_age_max) or age is null`, {pref_age_max}),

    drinks_min &&
    where(`drinks_per_month >= $(drinks_min) or drinks_per_month is null`, {drinks_min}),

    drinks_max &&
    where(`drinks_per_month <= $(drinks_max) or drinks_per_month is null`, {drinks_max}),

    pref_relation_styles?.length &&
    where(
      `pref_relation_styles IS NULL OR pref_relation_styles = '{}' OR pref_relation_styles && $(pref_relation_styles)`,
      {pref_relation_styles}
    ),

    pref_romantic_styles?.length &&
    where(
      `pref_romantic_styles IS NULL OR pref_romantic_styles = '{}' OR pref_romantic_styles && $(pref_romantic_styles)`,
      {pref_romantic_styles}
    ),

    diet?.length &&
    where(
      `diet IS NULL OR diet = '{}' OR diet && $(diet)`,
      {diet}
    ),

    political_beliefs?.length &&
    where(
      `political_beliefs IS NULL OR political_beliefs = '{}' OR political_beliefs && $(political_beliefs)`,
      {political_beliefs}
    ),

    relationship_status?.length &&
    where(
      `relationship_status IS NULL OR relationship_status = '{}' OR relationship_status && $(relationship_status)`,
      {relationship_status}
    ),

    languages?.length &&
    where(
      `languages && $(languages)`,
      {languages}
    ),

    religion?.length &&
    where(
      `religion IS NULL OR religion = '{}' OR religion && $(religion)`,
      {religion}
    ),

    interests?.length && where(getManyToManyClause('interests'), {values: interests}),

    causes?.length && where(getManyToManyClause('causes'), {values: causes}),

    work?.length && where(getManyToManyClause('work'), {values: work}),

    !!wants_kids_strength &&
    wants_kids_strength !== -1 &&
    where(
      'wants_kids_strength = -1 OR wants_kids_strength IS NULL OR ' + (wants_kids_strength >= 2 ? `wants_kids_strength >= $(wants_kids_strength)` : `wants_kids_strength <= $(wants_kids_strength)`),
      {wants_kids_strength}
    ),

    has_kids === 0 && where(`has_kids IS NULL OR has_kids = 0`),
    has_kids && has_kids > 0 && where(`has_kids > 0`),

    is_smoker !== undefined && (
      where(
        (is_smoker ? '' : 'is_smoker IS NULL OR ') + // smokers are rare, so we don't include the people who didn't answer if we're looking for smokers
        `is_smoker = $(is_smoker)`, {is_smoker}
      )
    ),

    geodbCityIds?.length &&
    where(`geodb_city_id = ANY($(geodbCityIds))`, {geodbCityIds}),

    // miles par degree of lat: earth's radius (3950 miles) * pi / 180 = 69.0
    filterLocation && where(`
      city_latitude BETWEEN $(target_lat) - ($(radius) / 69.0)
           AND $(target_lat) + ($(radius) / 69.0)
      AND city_longitude BETWEEN $(target_lon) - ($(radius) / (69.0 * COS(RADIANS($(target_lat)))))
           AND $(target_lon) + ($(radius) / (69.0 * COS(RADIANS($(target_lat)))))
      AND SQRT(
            POWER(city_latitude - $(target_lat), 2)
          + POWER((city_longitude - $(target_lon)) * COS(RADIANS($(target_lat))), 2)
          ) <= $(radius) / 69.0
      `, {target_lat: lat, target_lon: lon, radius}),

    skipId && where(`profiles.user_id != $(skipId)`, {skipId}),

    !shortBio && where(`bio_length >= ${MIN_BIO_LENGTH}`, {MIN_BIO_LENGTH}),

    lastModificationWithin && where(`last_modification_time >= NOW() - INTERVAL $(lastModificationWithin)`, {lastModificationWithin}),
  ]

  let selectCols = 'profiles.*, users.name, users.username, users.data as user'
  if (orderByParam === 'compatibility_score') {
    selectCols += ', cs.score as compatibility_score'
  } else if (orderByParam === 'last_online_time') {
    selectCols += ', user_activity.last_online_time'
  }
  if (interests) selectCols += `, COALESCE(profile_interests.interests, '{}') AS interests`
  if (causes) selectCols += `, COALESCE(profile_causes.causes, '{}') AS causes`
  if (work) selectCols += `, COALESCE(profile_work.work, '{}') AS work`

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

  // console.debug('profiles:', profiles)

  const countQuery = renderSql(
    select(`count(*) as count`),
    ...tableSelection,
    ...filters,
  )

  const count = await pg.one<number>(countQuery, [], (r) => Number(r.count))

  return {profiles, count}
}

export const getProfiles: APIHandler<'get-profiles'> = async (props, auth) => {
  try {
    if (!props.skipId) props.skipId = auth.uid
    const {profiles, count} = await loadProfiles(props)
    return {status: 'success', profiles: profiles, count: count}
  } catch (error) {
    console.log(error)
    return {status: 'fail', profiles: [], count: 0}
  }
}
