import {type APIHandler} from 'api/helpers/endpoint'
import {convertRow} from 'shared/profiles/supabase'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {from, join, leftJoin, limit, orderBy, renderSql, select, where,} from 'shared/supabase/sql-builder'
import {getCompatibleProfiles} from 'api/compatible-profiles'
import {intersection} from 'lodash'
import {MAX_INT, MIN_BIO_LENGTH, MIN_INT} from "common/constants";

export type profileQueryType = {
  limit?: number | undefined,
  after?: string | undefined,
  // Search and filter parameters
  name?: string | undefined,
  genders?: String[] | undefined,
  pref_gender?: String[] | undefined,
  pref_age_min?: number | undefined,
  pref_age_max?: number | undefined,
  pref_relation_styles?: String[] | undefined,
  pref_romantic_styles?: String[] | undefined,
  diet?: String[] | undefined,
  political_beliefs?: String[] | undefined,
  wants_kids_strength?: number | undefined,
  has_kids?: number | undefined,
  is_smoker?: boolean | undefined,
  shortBio?: boolean | undefined,
  geodbCityIds?: String[] | undefined,
  lat?: number | undefined,
  lon?: number | undefined,
  radius?: number | undefined,
  compatibleWithUserId?: string | undefined,
  skipId?: string | undefined,
  orderBy?: string | undefined,
  lastModificationWithin?: string | undefined,
}

const userActivityColumns = ['last_online_time']


export const loadProfiles = async (props: profileQueryType) => {
  const pg = createSupabaseDirectClient()
  console.debug(props)
  const {
    limit: limitParam,
    after,
    name,
    genders,
    pref_gender,
    pref_age_min,
    pref_age_max,
    pref_relation_styles,
    pref_romantic_styles,
    diet,
    political_beliefs,
    wants_kids_strength,
    has_kids,
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

  // compatibility. TODO: do this in sql
  if (orderByParam === 'compatibility_score') {
    if (!compatibleWithUserId) {
      console.error('Incompatible with user ID')
      throw Error('Incompatible with user ID')
    }

    const {compatibleProfiles} = await getCompatibleProfiles(compatibleWithUserId)
    const profiles = compatibleProfiles.filter(
      (l) =>
        (!name || l.user.name.toLowerCase().includes(name.toLowerCase())) &&
        (!genders || genders.includes(l.gender)) &&
        (!pref_gender || intersection(pref_gender, l.pref_gender).length) &&
        (!pref_age_min || (l.age ?? MAX_INT) >= pref_age_min) &&
        (!pref_age_max || (l.age ?? MIN_INT) <= pref_age_max) &&
        (!pref_relation_styles ||
          intersection(pref_relation_styles, l.pref_relation_styles).length) &&
        (!pref_romantic_styles ||
          intersection(pref_romantic_styles, l.pref_romantic_styles).length) &&
        (!diet ||
          intersection(diet, l.diet).length) &&
        (!political_beliefs ||
          intersection(political_beliefs, l.political_beliefs).length) &&
        (!wants_kids_strength ||
          wants_kids_strength == -1 ||
          !l.wants_kids_strength ||
          l.wants_kids_strength == -1 ||
          (wants_kids_strength >= 2
            ? l.wants_kids_strength >= wants_kids_strength
            : l.wants_kids_strength <= wants_kids_strength)) &&
        (has_kids == undefined ||
          has_kids == -1 ||
          (has_kids == 0 && !l.has_kids) ||
          (l.has_kids && l.has_kids > 0)) &&
        (!is_smoker || l.is_smoker === is_smoker) &&
        (l.id.toString() != skipId) &&
        (!geodbCityIds ||
          (l.geodb_city_id && geodbCityIds.includes(l.geodb_city_id))) &&
        (!filterLocation ||(
          l.city_latitude && l.city_longitude &&
          Math.abs(l.city_latitude - lat) < radius / 69.0 &&
          Math.abs(l.city_longitude - lon) < radius / (69.0 * Math.cos(lat * Math.PI / 180)) &&
          Math.pow(l.city_latitude - lat, 2) + Math.pow((l.city_longitude - lon) * Math.cos(lat * Math.PI / 180), 2) < Math.pow(radius / 69.0, 2)
          )) &&
        (shortBio || (l.bio_length ?? 0) >= MIN_BIO_LENGTH)
    )

    const cursor = after
      ? profiles.findIndex((l) => l.id.toString() === after) + 1
      : 0
    console.debug(cursor)

    if (limitParam) return profiles.slice(cursor, cursor + limitParam)

    return profiles
  }

  const tablePrefix = userActivityColumns.includes(orderByParam) ? 'user_activity' : 'profiles'
  const userActivityJoin = 'user_activity on user_activity.user_id = profiles.user_id'

  const query = renderSql(
    select('profiles.*, name, username, users.data as user, user_activity.last_online_time'),
    from('profiles'),
    join('users on users.id = profiles.user_id'),
    leftJoin(userActivityJoin),
    where('looking_for_matches = true'),
    // where(`pinned_url is not null and pinned_url != ''`),
    where(
      `(data->>'isBannedFromPosting' != 'true' or data->>'isBannedFromPosting' is null)`
    ),
    where(`data->>'userDeleted' != 'true' or data->>'userDeleted' is null`),

    ...keywords.map(word => where(
      `lower(users.name) ilike '%' || lower($(word)) || '%' or lower(bio::text) ilike '%' || lower($(word)) || '%' or bio_tsv @@ phraseto_tsquery('english', $(word))`,
      {word}
    )),

    genders?.length && where(`gender = ANY($(gender))`, {gender: genders}),

    pref_gender?.length &&
    where(`pref_gender is NULL or pref_gender = '{}' OR pref_gender && $(pref_gender)`, {pref_gender}),

    pref_age_min &&
    where(`age >= $(pref_age_min) or age is null`, {pref_age_min}),

    pref_age_max &&
    where(`age <= $(pref_age_max) or age is null`, {pref_age_max}),

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

    !!wants_kids_strength &&
    wants_kids_strength !== -1 &&
    where(
      'wants_kids_strength = -1 OR wants_kids_strength IS NULL OR ' + (wants_kids_strength >= 2 ? `wants_kids_strength >= $(wants_kids_strength)` : `wants_kids_strength <= $(wants_kids_strength)`),
      {wants_kids_strength}
    ),

    has_kids === 0 && where(`has_kids IS NULL OR has_kids = 0`),
    has_kids && has_kids > 0 && where(`has_kids > 0`),

    is_smoker !== undefined && where(`is_smoker = $(is_smoker)`, {is_smoker}),

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

    orderBy(`${tablePrefix}.${orderByParam} DESC`),
    after &&
    where(
      `${tablePrefix}.${orderByParam} < (
      SELECT ${tablePrefix}.${orderByParam}
      FROM profiles
      LEFT JOIN ${userActivityJoin}
      WHERE profiles.id = $(after)
    )`,
      {after}
    ),

    !shortBio && where(`bio_length >= ${MIN_BIO_LENGTH}`, {MIN_BIO_LENGTH}),

    lastModificationWithin && where(`last_modification_time >= NOW() - INTERVAL $(lastModificationWithin)`, {lastModificationWithin}),

    limitParam && limit(limitParam)
  )

  // console.debug('query:', query)

  return await pg.map(query, [], convertRow)
}

export const getProfiles: APIHandler<'get-profiles'> = async (props, _auth) => {
  try {
    const profiles = await loadProfiles(props)
    return {status: 'success', profiles: profiles}
  } catch {
    return {status: 'fail', profiles: []}
  }
}
