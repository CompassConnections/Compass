import {type APIHandler} from 'api/helpers/endpoint'
import {convertRow} from 'shared/love/supabase'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {from, join, limit, orderBy, renderSql, select, where,} from 'shared/supabase/sql-builder'
import {getCompatibleLovers} from 'api/compatible-lovers'
import {intersection} from 'lodash'

export const getLovers: APIHandler<'get-lovers'> = async (props, _auth) => {
  const pg = createSupabaseDirectClient()
  const {
    limit: limitParam,
    after,
    name,
    genders,
    pref_gender,
    pref_age_min,
    pref_age_max,
    pref_relation_styles,
    wants_kids_strength,
    has_kids,
    is_smoker,
    geodbCityIds,
    compatibleWithUserId,
    orderBy: orderByParam,
  } = props

  const keywords = name ? name.split(",").map(q => q.trim()).filter(Boolean) : []
  // console.debug('keywords:', keywords)

  // compatibility. TODO: do this in sql
  if (orderByParam === 'compatibility_score') {
    if (!compatibleWithUserId) return {status: 'fail', lovers: []}

    const {compatibleLovers} = await getCompatibleLovers(compatibleWithUserId)
    const lovers = compatibleLovers.filter(
      (l) =>
        (!name || l.user.name.toLowerCase().includes(name.toLowerCase())) &&
        (!genders || genders.includes(l.gender)) &&
        (!pref_gender || intersection(pref_gender, l.pref_gender).length) &&
        (!pref_age_min || l.age >= pref_age_min) &&
        (!pref_age_max || l.age <= pref_age_max) &&
        (!pref_relation_styles ||
          intersection(pref_relation_styles, l.pref_relation_styles).length) &&
        (!wants_kids_strength ||
          wants_kids_strength == -1 ||
          (wants_kids_strength >= 2
            ? l.wants_kids_strength >= wants_kids_strength
            : l.wants_kids_strength <= wants_kids_strength)) &&
        (has_kids == undefined ||
          has_kids == -1 ||
          (has_kids == 0 && !l.has_kids) ||
          (l.has_kids && l.has_kids > 0)) &&
        (!is_smoker || l.is_smoker === is_smoker) &&
        (!geodbCityIds ||
          (l.geodb_city_id && geodbCityIds.includes(l.geodb_city_id)))
    )

    const cursor = after
      ? lovers.findIndex((l) => l.id.toString() === after) + 1
      : 0
    console.log(cursor)

    return {
      status: 'success',
      lovers: lovers.slice(cursor, cursor + limitParam),
    }
  }

  const query = renderSql(
    select('lovers.*, name, username, users.data as user'),
    from('lovers'),
    join('users on users.id = lovers.user_id'),
    where('looking_for_matches = true'),
    // where(`pinned_url is not null and pinned_url != ''`),
    where(
      `(data->>'isBannedFromPosting' != 'true' or data->>'isBannedFromPosting' is null)`
    ),
    where(`data->>'userDeleted' != 'true' or data->>'userDeleted' is null`),

    ...keywords.map(word => where(
      `lower(users.name) ilike '%' || lower($(word)) || '%' or lower(bio::text) ilike '%' || lower($(word)) || '%'`,
      {word}
    )),

    genders?.length && where(`gender = ANY($(gender))`, {gender: genders}),

    pref_gender?.length &&
    where(`pref_gender && $(pref_gender)`, {pref_gender}),

    pref_age_min !== undefined &&
    where(`age >= $(pref_age_min)`, {pref_age_min}),

    pref_age_max !== undefined &&
    where(`age <= $(pref_age_max)`, {pref_age_max}),

    pref_relation_styles?.length &&
    where(`pref_relation_styles && $(pref_relation_styles)`, {
      pref_relation_styles,
    }),

    wants_kids_strength !== undefined &&
    wants_kids_strength !== -1 &&
    where(
      wants_kids_strength >= 2
        ? `wants_kids_strength >= $(wants_kids_strength)`
        : `wants_kids_strength <= $(wants_kids_strength)`,
      {wants_kids_strength}
    ),

    has_kids === 0 && where(`has_kids IS NULL OR has_kids = 0`),
    has_kids && has_kids > 0 && where(`has_kids > 0`),

    is_smoker !== undefined && where(`is_smoker = $(is_smoker)`, {is_smoker}),

    geodbCityIds?.length &&
    where(`geodb_city_id = ANY($(geodbCityIds))`, {geodbCityIds}),

    orderBy(`${orderByParam} desc`),
    after &&
    where(
      `lovers.${orderByParam} < (select lovers.${orderByParam} from lovers where id = $(after))`,
      {after}
    ),

    limit(limitParam)
  )

  // console.debug('query:', query)

  const lovers = await pg.map(query, [], convertRow)

  return {status: 'success', lovers: lovers}
}
