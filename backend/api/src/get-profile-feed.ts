import {APIHandler} from 'api/helpers/endpoint'
import {
  DEFAULT_FEED_LIMIT,
  FEED_FIELDS,
  FeedItem,
  MAX_FEED_BIO_CHARS,
  truncateAtWord,
} from 'common/feed/feed'
import {normalizeCountry} from 'common/geodb'
import {effectiveAudience, type ProfileFieldKey} from 'common/profiles/visibility'
import {compact} from 'lodash'
import {createSupabaseDirectClient} from 'shared/supabase/init'

type FeedQueryRow = {
  username: string
  name: string
  created_time: string
  headline: string | null
  city: string | null
  country: string | null
  gender: string | null
  keywords: string[] | null
  bio_text: string | null
  visibility: string
  field_visibility: unknown
}

/**
 * Whether one field of the row is public: its own entry in `field_visibility` when it has one, the
 * profile-wide `visibility` otherwise. The SQL twin of `effectiveAudience(...) === 'public'`; the key
 * is one of our own constants, never input.
 */
const publicSql = (field: ProfileFieldKey) =>
  `coalesce(profiles.field_visibility ->> '${field}', profiles.visibility::text) = 'public'`

/**
 * Newest profiles with something public to show, for the RSS feed at /feed.xml (and, later, an
 * ActivityPub outbox built on the same rows).
 *
 * There is no separate feed setting any more (docs/feed.md): the feed carries exactly the fields a
 * member shows to everyone, and never photos. A profile appears when at least one of the fields the
 * feed can carry is public — so a public profile is in it, a members-only profile is not, and a
 * members-only profile whose owner made the headline public appears with its headline alone.
 *
 * The projection happens here rather than in the renderer on purpose: the response simply does not
 * contain a field its owner shows to fewer people, so no downstream consumer can leak one by
 * forgetting to check.
 */
export const getProfileFeed: APIHandler<'get-profile-feed'> = async ({country, limit}) => {
  const pg = createSupabaseDirectClient()

  const rows = await pg.any<FeedQueryRow>(
    `select users.username,
            users.name,
            profiles.created_time,
            profiles.headline,
            profiles.city,
            profiles.country,
            profiles.gender,
            profiles.keywords,
            profiles.bio_text,
            profiles.visibility,
            profiles.field_visibility
     from profiles
              join users on users.id = profiles.user_id
     where (${FEED_FIELDS.map(publicSql).join(' or ')})
       and profiles.disabled != true
       and profiles.looking_for_matches = true
       and not users.is_banned_from_posting
       and (users.data ->> 'userDeleted' is null or users.data ->> 'userDeleted' != 'true')
       -- Filtering by country reads the location, so it only matches where the location is public.
       and ($(country) is null
         or (lower(profiles.country) = lower($(country)) and ${publicSql('location')}))
     order by profiles.created_time desc
     limit $(limit)`,
    {country: normalizeCountry(country) ?? null, limit: limit ?? DEFAULT_FEED_LIMIT},
  )

  return {items: rows.map(toFeedItem)}
}

function toFeedItem(row: FeedQueryRow): FeedItem {
  const isPublic = (field: ProfileFieldKey) => effectiveAudience(row, field) === 'public'
  const location = isPublic('location') ? compact([row.city, row.country]).join(', ') : ''

  return {
    username: row.username,
    name: row.name,
    createdTime: new Date(row.created_time).toISOString(),
    headline: (isPublic('headline') && row.headline) || undefined,
    location: location || undefined,
    keywords: isPublic('keywords') && row.keywords?.length ? row.keywords : undefined,
    gender: (isPublic('gender') && row.gender) || undefined,
    // `bio_text` is the plain-text projection of the rich-text `bio`, maintained by
    // trg_profiles_rebuild_search — so the excerpt never carries markup into the feed.
    bioExcerpt:
      isPublic('bio') && row.bio_text
        ? truncateAtWord(row.bio_text, MAX_FEED_BIO_CHARS)
        : undefined,
  }
}
