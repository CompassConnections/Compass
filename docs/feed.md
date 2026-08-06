# The public feed (`/feed.xml`)

An RSS 2.0 feed of the newest public profiles. It exists so Compass can be followed from outside Compass —
a feed reader today, the fediverse next, via an off-the-shelf RSS→ActivityPub bridge rather than code we
have to maintain.

```
https://www.compassmeet.com/feed.xml                   every country
https://www.compassmeet.com/feed.xml?country=Italy     one country (the `profiles.country` name, case-insensitive)
https://www.compassmeet.com/feed.xml?limit=20          default 50, max 200
```

Per-country feeds are the ones worth subscribing to: the bottleneck for members is local density, and a
worldwide firehose reads as activity while every individual city stays as empty as it was.

## What goes in it

Two separate settings gate an entry, and the distinction is load-bearing:

| Column                     | Question it answers                        |
| -------------------------- | ------------------------------------------ |
| `profiles.visibility`      | Who may read the profile page              |
| `profiles.feed_visibility` | How much of it may be republished off-site |

Only `visibility = 'public'` profiles are ever syndicated — `feed_visibility` can only narrow further. The
levels (`common/src/feed/feed.ts`):

| Level             | Carries                                           |
| ----------------- | ------------------------------------------------- |
| `none`            | nothing — the profile never appears               |
| `basic` (default) | name, city + country, headline, keywords, link    |
| `full`            | the above, plus gender and a 400-char bio excerpt |

Keywords sit in `basic` because they are self-chosen labels rather than anything the profile discloses
about a person, and they are what makes an entry findable in a timeline — the fediverse reads them roughly
as hashtags.

No level carries photos. Switching a profile to members-only also switches `feed_visibility` to `none` for
anyone still on the default (`feedVisibilityForMembersOnly`) — going members-only is a request to leave the
open web, and syndication is the most open-web thing a profile does. It is deliberately one-way: switching
back to public does not re-enable syndication. The migration backfills existing members-only profiles by
the same rule, so the column default never opts them in behind their backs.

Why `basic` rather than `none` by default: those fields are exactly what a public profile already shows to
any crawler (`robots.txt` is `Allow: /`, and `noindex` is set only for members-only, banned or deleted
profiles), so the default changes distribution, not exposure. What is _not_ already true of a crawled page
is that syndication cannot be recalled — a post that has federated stays federated after the profile
changes — which is why the level is a member's choice and not a site-wide policy.

## How it is wired

| Piece                                  | Where                                                              |
| -------------------------------------- | ------------------------------------------------------------------ |
| Level enum + `FeedItem` + truncation   | `common/src/feed/feed.ts`                                          |
| RSS rendering (pure string work)       | `common/src/feed/rss.ts`                                           |
| Query + **projection by level**        | `backend/api/src/get-profile-feed.ts` (`get-profile-feed`, public) |
| XML response                           | `web/pages/api/feed.xml.ts`                                        |
| `/feed.xml` → `/api/feed.xml`          | `rewrites()` in `web/next.config.ts`                               |
| Member-facing control                  | `web/components/optional-profile-form.tsx` ("Who can see this")    |
| `<link rel="alternate">` autodiscovery | `web/pages/_app.tsx`                                               |

The projection happens in the API, not in the renderer: the response for a `basic` member simply does not
contain their bio or gender, so no consumer can leak a field by forgetting to check the level.

`<guid>` is the profile URL, marked `isPermaLink`. Bridges dedupe on it, so it must not be derived from
anything that changes — otherwise every profile edit reposts the member to every follower.

## Attribution

Every outbound link in the feed carries `utm_source=feed`, `utm_medium=rss` and a per-country
`utm_campaign` (`feed-italy`, or `feed-all` for the unfiltered feed). PostHog reads `utm_*` off the landing
pageview by itself, so arrivals and signups from the feed are countable, and a country feed that converts
is distinguishable from one that does not.

The `<guid>` deliberately does **not** carry them. Bridges dedupe on the guid, so anything that moves with
a campaign name would repost every member to every follower.

## Next steps

1. **Point an RSS→ActivityPub bridge at a country feed** and watch the `utm_campaign` numbers. No code —
   [RSS Parrot](https://rss-parrot.net/) is self-serve and one-way, which is exactly the scope we want: from
   [@compassmeet@mastodon.social](https://mastodon.social/@compassmeet), post a toot mentioning
   `@birb@rss-parrot.net` with the feed URL (`https://www.compassmeet.com/feed.xml?country=Italy`), and it
   replies with the account it created for that feed — which then has to be followed for anything to appear
   in a timeline. It reads `<description>`, so what members see is exactly the projection above.
   Prerequisite: the migration applied and web deployed, so the URL actually answers.
2. Only if that converts: a native read-only actor (WebFinger, actor, outbox, accepting `Follow` and
   `Undo`, nothing else). Inbound DMs are deliberately out of scope — a federated sender arrives with no
   email, no profile and no history, which imports the scam problem, and Compass messages are encrypted.
