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

One rule: **the feed carries the fields a member shows to everyone, and never photos.** There is no
feed setting of its own.

Each field of a profile has an audience ([`profile-visibility.md`](profile-visibility.md)): its own
choice when it has one, the profile-wide `visibility` otherwise. A feed item can carry five fields, and
carries each one only when it is public (`FEED_FIELDS` in `common/src/feed/feed.ts`):

| Field    | In the item as                     |
| -------- | ---------------------------------- |
| headline | the headline                       |
| location | city + country                     |
| keywords | the keyword list                   |
| gender   | the gender                         |
| bio      | a 400-character plain-text excerpt |

The display name and the link to the profile are always there. A profile appears in the feed when at
least one of those five fields is public. So a public profile is in it; a members-only profile is not;
and a members-only profile whose owner made the headline public appears with its headline alone.
`?country=` only matches profiles whose location is public.

Keywords are self-chosen labels rather than anything the profile discloses about a person, and they are
what makes an entry findable in a timeline — the fediverse reads them roughly as hashtags.

### The retired feed level

Until per-field visibility, a second column, `profiles.feed_visibility` (`none` / `basic` / `full`), said
how much of a public profile could be republished, on the reasoning that a federated post cannot be
recalled the way a page can be taken down. It was removed as a setting: a member who does not want
something broadcast sets that field to members, which also takes it off the open web. The column and
its enum are still in the table (older app builds send the value, and the API accepts it), but nothing
reads them.

This changed what is syndicated for existing members, with no action on their part: a public profile
that had chosen `none` is now in the feed, and one on the old default (`basic`) now also carries its
gender and bio excerpt.

## How it is wired

| Piece                                   | Where                                                              |
| --------------------------------------- | ------------------------------------------------------------------ |
| Level enum + `FeedItem` + truncation    | `common/src/feed/feed.ts`                                          |
| RSS rendering (pure string work)        | `common/src/feed/rss.ts`                                           |
| Query + **projection to public fields** | `backend/api/src/get-profile-feed.ts` (`get-profile-feed`, public) |
| XML response                            | `web/pages/api/feed.xml.ts`                                        |
| `/feed.xml` → `/api/feed.xml`           | `rewrites()` in `web/next.config.ts`                               |
| Member-facing control                   | `web/components/optional-profile-form.tsx` ("Who can see this")    |
| `<link rel="alternate">` autodiscovery  | `web/pages/_app.tsx`                                               |

The projection happens in the API, not in the renderer: the response simply does not contain a field its
owner shows to fewer people, so no consumer can leak one by forgetting to check.

`<guid>` is the profile URL, marked `isPermaLink`. Bridges dedupe on it, so it must not be derived from
anything that changes — otherwise every profile edit reposts the member to every follower.

## Attribution

Every outbound link in the feed carries `utm_source=feed`, `utm_medium=rss` and a per-country
`utm_campaign` (`feed-italy`, or `feed-all` for the unfiltered feed). PostHog reads `utm_*` off the landing
pageview by itself, so arrivals and signups from the feed are countable, and a country feed that converts
is distinguishable from one that does not.

The `<guid>` deliberately does **not** carry them. Bridges dedupe on the guid, so anything that moves with
a campaign name would repost every member to every follower.

## Getting into the fediverse

**No RSS→ActivityPub bridge.** A bridge (RSS Parrot and friends) is one toot and no code, but it fails on
the two things that decide whether this works: a bridge account cannot post hashtags, which is most of how
anything is discovered on the fediverse, and its followers belong to the bridge — they cannot be carried
over to a `@compass@compassmeet.com` actor later. A null result from a bridge would have measured the
bridge, not the idea.

\*\*Plan: post each new profile from [@compassmeet@mastodon.social](https://mastodon.social/@compassmeet),
three days after signup.

Why three days rather than on signup:

- Syndication cannot be recalled. Three days is the window in which a member can fill their profile in,
  notice the setting, switch it off, or go members-only — all before anything leaves the site.
- A profile at signup is usually empty. About a third of the entries in the live feed have no headline, no
  city and no keywords; posting those yields "New on Compass: verlish" and helps nobody.

What it would reuse rather than reinvent:

| Piece                      | Existing pattern to follow                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| Content and what is public | `get-profile-feed` — one projection, two transports                                                   |
| Posting                    | `sendDiscordMessage` in `common/src/discord/core.ts`, but `POST /api/v1/statuses` with a Bearer token |
| Scheduling                 | `internalOutreachJob` in `backend/api/src/app.ts` (Cloud Scheduler + `x-api-key`)                     |
| Not posting twice          | the send-ledger pattern from `outreach_sends` / `search_alert_sends`                                  |

Hashtags come from `keywords`, when the member shows them publicly. Cap them (~3): excessive
hashtags read as spam on most instances. Mark the account as a bot.

Accepted trade-off: posting from the main `@compassmeet` account rather than a separate bot account means a
moderation complaint against a profile post lands on the announcement channel too. Deliberate — worth
revisiting only if volume grows.

## After that: a native actor at `compassmeet.com`

Only worth it once the Mastodon account has followers to inherit — and they _do_ transfer, via
`alsoKnownAs` + a `Move` activity, which is the reason for posting from an account we own rather than a
bridge's.

Scope: read-only. WebFinger, an actor document, an outbox, and an inbox that accepts `Follow` and `Undo`
and ignores everything else. Roughly 500–700 lines hand-rolled, or ~200 with a library like
[Fedify](https://fedify.dev/) (which brings WebFinger, actor dispatch, HTTP Signatures, a delivery queue
and NodeInfo). Only `/.well-known/webfinger` has to be served from `compassmeet.com`; the actor, inbox and
outbox can live on the API, reached through a Vercel rewrite.

A full instance — every member as their own actor — is a different category of undertaking (per-member
keypairs, inbound replies, remote blocks and reports, moderation duties). If it is ever wanted, run
GoToSocial or Mastodon alongside rather than write it?
