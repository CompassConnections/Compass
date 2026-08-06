import {APIHandler} from 'api/helpers/endpoint'
import {
  DEFAULT_FEED_LIMIT,
  FeedItem,
  FeedVisibility,
  MAX_FEED_BIO_CHARS,
  truncateAtWord,
} from 'common/feed/feed'
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
  feed_visibility: FeedVisibility
}

/**
 * Newest public profiles, for the RSS feed at /feed.xml (and, later, an ActivityPub outbox built on the
 * same rows).
 *
 * The projection happens here rather than in the renderer on purpose: the response for a `basic` member
 * simply does not contain their bio or keywords, so no downstream consumer can leak a field by
 * forgetting to check the level.
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
            profiles.feed_visibility
     from profiles
              join users on users.id = profiles.user_id
     where profiles.visibility = 'public'
       and profiles.feed_visibility <> 'none'
       and profiles.disabled != true
       and profiles.looking_for_matches = true
       and not users.is_banned_from_posting
       and (users.data ->> 'userDeleted' is null or users.data ->> 'userDeleted' != 'true')
       and ($(country) is null or lower(profiles.country) = lower($(country)))
     order by profiles.created_time desc
     limit $(limit)`,
    {country: country ?? null, limit: limit ?? DEFAULT_FEED_LIMIT},
  )

  return {items: rows.map(toFeedItem)}
}

function toFeedItem(row: FeedQueryRow): FeedItem {
  const location = compact([row.city, row.country]).join(', ')

  const item: FeedItem = {
    username: row.username,
    name: row.name,
    createdTime: new Date(row.created_time).toISOString(),
    headline: row.headline ?? undefined,
    location: location || undefined,
    keywords: row.keywords?.length ? row.keywords : undefined,
  }

  if (row.feed_visibility !== 'full') return item

  return {
    ...item,
    gender: row.gender ?? undefined,
    // `bio_text` is the plain-text projection of the rich-text `bio`, maintained by
    // trg_profiles_rebuild_search — so the excerpt never carries markup into the feed.
    bioExcerpt: row.bio_text ? truncateAtWord(row.bio_text, MAX_FEED_BIO_CHARS) : undefined,
  }
}
