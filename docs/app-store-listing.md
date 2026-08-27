# App store listing copy

Store metadata for the Google Play and App Store listings: title, short description, full description,
and the iOS-only fields that have no Play equivalent.

**Status: draft.** Nothing here is submitted yet. The iOS listing is a blocker in
[ios.md](ios.md) §8 ("App Store Connect metadata"); the Play listing exists but predates the
[marketing-copy.md](marketing-copy.md) rewrite and says none of this.

Companion to [marketing-copy.md](marketing-copy.md) (what the home and about pages say) and
[marketing-visuals.md](marketing-visuals.md) (what they show). The rules there apply here, with one
addition: **a store listing cannot render a live number.** `StatBand` and `MemberGrowth` re-query on
every load; a store description is frozen until the next release. So every claim below is either
structural (200-character minimum, open source, no ads) or deliberately unquantified ("hundreds of
conversations", "growing every month"). Do not paste a member count in — it will be wrong within weeks
and it is the comparison Compass loses anyway.

---

## Title — 27 / 30 characters

```
Compass: Social Connections
```

Play caps the title at 30 characters, App Store caps the name at 30. "Compass" alone is unsearchable —
it collides with navigation apps, browsers and a dozen SaaS products — so the qualifier is load-bearing
for store search, not decoration.

Alternates, if the primary reads too close to something already listed:

| Option                       | Chars |
| ---------------------------- | ----- |
| `Compass: Find Your People`  | 25    |
| `Compass: Meet Your People`  | 25    |
| `Compass — Deep Connections` | 26    |

---

## Short description

```
Search friends and dates by values and personality. Open source, no swiping.
```

This is Play's `short description` field (80 max), shown above the fold and the single highest-leverage
string in the listing. It leads with the mechanism ("search... by values") because that is the one thing
no competing listing can claim, and closes with the three-part free/open/no-swipe badge that the home
page hero already carries (`home.eyebrow.v3`).

The App Store has no 80-character field. Its **subtitle** is 30 characters — see the mapping below.

---

## Full description — 2,751 / 4,000 characters

Reads on both stores as-is except for one line, flagged after the block.

```
Compass is a free, open-source directory for finding your people — friends, a partner, or collaborators — based on who they are, not how they look.

Most apps hand you a queue and an algorithm you never see. Compass hands you a search bar and the whole directory.

SEARCH, DON'T SWIPE
Read every profile. Filter by location, age, values, causes, politics, religion, diet, languages, education and personality — more than twenty filters. Or type a single word like "meditation" or "indie film": free-text search reads what people wrote in their bios, not just the boxes they ticked.

PROFILES THAT TAKE TWENTY MINUTES, NOT TWO
A bio in your own words, answers to prompts, the causes you care about, and what kind of connection you are after — platonic, romantic, collaborative, or all three. Photos are optional and never the point. Every field is optional: what you leave blank stays blank.

ONE ALGORITHM, AND YOU SET THE WEIGHTS
For each compatibility question you give three things: your answer, the answers you would accept from someone else, and how much it matters to you. Your score with someone is those three things compared. No engagement optimization, no hidden ranking, no paid boosts — and you can read the source code.

NO "HEY"
A first message is 200 characters minimum and requires a verified email address. You have to say something real about the person you are writing to before it will send.

SAVED SEARCHES INSTEAD OF SCROLLING
Save a search and get an email the day someone new matches it. No daily allowance of people, no reason to open the app out of habit.

YOU CONTROL WHAT IS PUBLIC
Compass is a directory, so profiles are public pages by default — that is what makes searching work at all. One tap makes yours members-only, and search engines are told not to index it. Hide profiles you would rather not see, block someone outright, report them to moderators, export everything we hold about you, or delete your account and its data for good. Messages are encrypted at rest. Your data is never sold — there is nobody to sell it to.

FREE, AND STRUCTURALLY SO
No ads, no subscriptions, no paid tiers, no venture capital, nobody on payroll. Compass runs on donations and publishes every expense. It is governed by a written constitution: proposals and ballots are public, and members who contribute can vote on them.

EARLY
Compass launched in October 2025 and is growing every month. That has been enough to start hundreds of conversations, and not enough to guarantee somebody in your town. So save a search — and if you know someone who belongs here, bring them.

Available in English, French and German.

Source code: github.com/CompassConnections/Compass
Website: compassmeet.com
```

**One platform-specific edit.** Apple's review guideline 2.3.10 forbids naming other mobile platforms in
metadata, so the App Store version must not mention Android or Google Play. The block above already
avoids it; if a "web, Android and iOS" line is ever added for Play, strip it for Apple.

### Why each section is there

| Section              | Source of truth                                                        |
| -------------------- | ---------------------------------------------------------------------- |
| Twenty-plus filters  | `web/components/filters/` — 25 filter components                       |
| Free-text reads bios | The hero search demo, `marketing-visuals.md` H1                        |
| Profile field list   | `home.profile.chip.*` in `web/components/home/home.tsx`                |
| Compatibility score  | `common/src/profiles/compatibility-score.ts`                           |
| 200-char minimum     | `MIN_CHARS`, `web/components/messaging/send-message-button.tsx`        |
| Verified email gate  | `backend/api/src/create-private-user-message-channel.ts` (server-side) |
| Saved-search alerts  | `NotifySpotlight`, `web/pages/about.tsx`                               |
| Public vs. members   | marketing-copy.md, Section C                                           |
| Encryption at rest   | FAQ, "Is my data safe?" — AES-256                                      |
| Constitution / votes | `web/public/md/constitution.md`, `/vote`                               |
| Launched Oct 2025    | FAQ, "How fast is Compass growing?"                                    |
| Three languages      | `LOCALES` in `common/src/constants.ts` — en, fr, de                    |

### Deliberately left out

- **Events.** `upcomingEvents` is 0. A store listing that promises events and delivers an empty page is
  a one-star review. Same call as marketing-copy.md.
- **Member and country counts.** Frozen text, stale within weeks, and the comparison a visitor makes
  against apps with millions of users is the one Compass loses. Composition persuades; size does not.
- **The Linux / Wikipedia / Firefox line.** A vision claim a stranger cannot check, and store reviewers
  read it as puffery.
- **Any donation ask.** Both stores treat solicitation in a listing as a payments-policy risk. The
  funding model is stated as a fact ("runs on donations"), never as a request.

---

## Localised listings

Play stores one listing per language, and the fields are the same three. The French cut lives in
[app-store-listing.fr-FR.json](app-store-listing.fr-FR.json), shaped as a Play Developer API `Listing`
resource — drop it straight into `edits.listings.update` (or paste field by field into the Play Console
under _Grow > Store presence > Main store listing > fr-FR_).

| Field              | Limit | fr-FR value                                                  | Chars |
| ------------------ | ----- | ------------------------------------------------------------ | ----- |
| `title`            | 30    | `Compass : Amis & Rencontres`                                | 27    |
| `shortDescription` | 80    | Leads with the mechanism, closes on open source / no swiping | 80    |
| `fullDescription`  | 4000  | Section-for-section mirror of the English block              | 3,281 |

Two deliberate departures from a literal translation:

- **Title.** "Social Connections" has no natural French equivalent that also works as a search term —
  _rencontres sociales_ reads like a corporate event. `Amis & Rencontres` gives up the abstraction and
  buys the two words French users actually search for.
- **Short description.** The English plural ("friends and dates") does not fit 80 characters in French,
  so it is singular: _ami ou partenaire_. Note the English string still reads "Open surce" — fix that
  before either listing is submitted.

The German listing is not written yet; the app ships `de`, so Play will fall back to English there.

---

## No price outside the description (guideline 2.3.7)

Submission 1.42.0 (11) was **rejected on 27 Aug 2026** under 2.3.7: "the app screenshots include
references to the price of the app or the service it provides". The offender was screenshot 8 —
"Free forever. Open source." over badges reading "No ads" and "No subscriptions" — plus screenshot 7's
caption, "what it costs to run".

Two things to hold on to:

- **"Free" is a price.** Apple's notice says it outright: "references to free or discounted services
  are considered a price reference". So are "no subscriptions", "no paywall", "no in-app purchases",
  "donations", a currency figure, or a running-cost number. Anything that answers "what does this
  cost" is a price reference, including the answer "nothing".
- **The description is the one exception.** Apple's own next step is "if you would like to advertise
  changes to the app's price, consider including this information in the app description." The
  FREE, AND STRUCTURALLY SO section above therefore stays exactly as it is — that argument is
  load-bearing for the pitch and the description is where Apple has said to put it.

| Field                      | Price talk? | Note                                                     |
| -------------------------- | ----------- | -------------------------------------------------------- |
| Name, Subtitle             | No          | Neither has ever mentioned it                            |
| **Screenshots / previews** | **No**      | What got 1.42.0 (11) rejected                            |
| Promotional text           | No          | Sits above the description but is not the description    |
| Keywords                   | No          | Also where competitor brand names are banned, same 2.3.7 |
| What's New                 | No          | Safer to treat it as promo copy than as description      |
| **Description**            | **Yes**     | Explicitly allowed, and where Apple says to put it       |

What to reply to Apple, and the order to change the fields in, is in
[app-review-reply.md](app-review-reply.md#round-2--guideline-237-metadata-reply-this) — round 2.

The screenshot set is generated, not hand-made, so the fix lives in code: frame 8 of `FRAMES` in
[`media-creator/scripts/render-store.mjs`](../media-creator/scripts/render-store.mjs) is now
"Built in the open." (open source / member governed / no hidden ranking) and outputs `08-open.png`
rather than `08-free.png`; frame 7's caption reads "how the place is run". Re-render with
`node media-creator/scripts/render-store.mjs --only 7,8`. The file carries the same rule as a comment
so the next person editing the copy sees it before Apple does.

**This is metadata only.** The rule covers what App Store Connect holds — listing text, screenshots,
app previews — not the app itself. The hero eyebrow (`home.eyebrow.v3`, "Free forever · Open source"),
the "Open Source & Free Forever" strip on the home page, the "$0 / Cost to join" stat in
`components/about/platform-stats.tsx` and the funding copy in `/terms` are all untouched and fine:
2.3.7 does not police in-app copy. The one crossover is that a _screenshot of_ an in-app screen is
metadata, so a captured screen must not have price wording in frame either. None does today — the
store captures shoot search, filters, profiles, the composer, alerts and /stats, and never the home
or about page — but that is now a constraint on which screens `capture-store.mjs` may shoot, not a
coincidence.

---

## App Store Connect field mapping

The App Store splits what Play puts in two fields across four. Same copy, re-cut.

### Version-page fields

Set on the version record rather than at app creation, and editable between releases.

| Field                         | Value                          | Note                                                     |
| ----------------------------- | ------------------------------ | -------------------------------------------------------- |
| **Support URL**               | `https://compassmeet.com/help` | **Not** `/support` — that route is the donations page    |
| **Marketing URL**             | `https://compassmeet.com`      | Optional                                                 |
| **Version**                   | `1.42.0`                       | Must match `MARKETING_VERSION` in the uploaded build     |
| **Copyright**                 | `2026 Martin Braquet`          | Year + rights holder; no legal entity, so the individual |
| **Routing App Coverage File** | (empty)                        | Navigation apps only                                     |

The Support URL is the one with a trap in it. `/support` renders `web/public/md/support.md`, which
solicits donations — Open Collective, Liberapay, Ko-fi, PayPal. A reviewer following a "Support" link to
a donation page is a plausible rejection on an app already under guideline 1.2 scrutiny. `/help` is the
actual help page.

### App Review Information

Not part of the public listing — this is what the reviewer sees and how Apple reaches you.

**Sign-In Information.** The same demo account as Google Play: one seeded account, one backend, and
both reviewers can hold sessions concurrently. Two hard requirements:

- **Email + password**, not a social login. A reviewer cannot complete a Google or Apple sign-in on
  their own account, so the demo user must have a password set.
- **The email must be verified.** `web/lib/dev-flags.ts:16` gates `skipEmailVerification` on
  `IS_LOCAL`, so it is off in every shipped build, and `send-message-button.tsx:359` hides messaging
  behind `firebaseUser?.emailVerified`. An unverified demo account leaves the reviewer unable to
  message anyone — the core feature — which reads as a broken app rather than a locked one.

Seed it with a populated profile (photo, bio past the 200-character minimum, a few prompt answers),
a saved search, and at least one existing conversation, so search, filtering and messaging can all be
exercised without the reviewer having to create content.

**Contact Information.** Real name, a phone number Apple can actually reach, and an email that is
monitored during review — `hello@compassmeet.com` forwards, so it works. This is how Apple asks a
clarifying question instead of rejecting outright; an unreachable contact turns a question into a
rejection round.

**The draft below is superseded.** Submission 1.42.0 (11) was rejected under guideline 2.1 for
thin App Review Information; the text that answers Apple's seven questions, and the screen-recording
shot list that goes with it, are in [app-review-reply.md](app-review-reply.md).

**Notes.** 4,000 characters, and worth using properly — it is the cheapest way to pre-empt the four
rejections [ios.md](ios.md) §8 flags. Draft:

```
Compass is a free, open-source directory for finding friends, partners or collaborators based on
values and interests rather than photos. It is community-governed and non-commercial: no ads, no
subscriptions, no in-app purchases, no data sales.

DEMO ACCOUNT
The credentials above have a populated profile, a saved search and an existing conversation. Sign in
with email and password (social sign-in is available but not needed for review).

NATIVE INTEGRATION (guideline 4.2)
This is not a website wrapper. The entire web bundle ships inside the binary and loads from local
assets — the app works with no network for everything except live data. Native integrations: push
notifications (APNs via FCM), Sign in with Apple, native Google Sign-In, the iOS share sheet,
Universal Links, and data export through the Files/share sheet.

SIGN IN WITH APPLE (guideline 4.8)
Offered alongside Google on both the sign-in and registration screens.

ACCOUNT DELETION (guideline 5.1.1(v))
Settings > General > "Delete account", reachable in-app without contacting support. It deletes the
profile, messages and uploaded media, and removes the authentication record.

USER-GENERATED CONTENT AND MODERATION (guideline 1.2)
- Report: the "..." menu at the top of any profile, and inside any conversation.
- Block: the same "..." menu on a profile.
- Terms acceptance is an explicit checkbox at registration.
- The published moderation policy is at https://compassmeet.com/terms — see "Community standards"
  and "Safety tools, moderation, and holds". Reports go to human moderators.
- Accounts are 18+ only; the profile form rejects any age below 18.
- Automated spam limits put an account on hold after more than five new conversations in 24 hours.

Happy to clarify anything — the contact above is monitored.
```

Trim the sections that stop being true, but keep the guideline numbers: they tell the reviewer you
have already considered the thing they are about to check.

**Attachment.** Optional and normally skipped. Worth using only if a feature needs a walkthrough the
notes cannot carry.

### Record-creation fields (set once, immutable)

Entered when the app record is created, before any listing copy exists. None of them are public.

| Field                | Value                        | Note                                                            |
| -------------------- | ---------------------------- | --------------------------------------------------------------- |
| **Platforms**        | iOS only                     | macOS would mean a Catalyst build and its own review            |
| **Bundle ID**        | `com.compassconnections.app` | Same as Android; must match the App ID and every profile        |
| **SKU**              | `compass-ios`                | Internal only, appears in sales reports, **cannot be changed**  |
| **Primary Language** | English (U.S.)               | The listing's base language, independent of the app's `fr`/`de` |
| **User Access**      | Full Access                  | Only matters on multi-person teams                              |

The SKU is deliberately not the bundle id: it sits next to it in reports, and a distinct slug leaves
room for a matching `compass-android` if Play reporting is ever unified.

| Field                | Limit | Value                                                                 |
| -------------------- | ----- | --------------------------------------------------------------------- |
| **Name**             | 30    | `Compass: Social Connections` (27) — matches the Title above          |
| **Subtitle**         | 30    | `Search by values, not photos` (28)                                   |
| **Promotional text** | 170   | See below — editable without a new build, so use it for what changes. |
| **Description**      | 4000  | The full description above, minus any other-platform mention.         |
| **Keywords**         | 100   | See below — comma-separated, **no spaces after commas** (they count). |

**Promotional text** (149 chars) — sits above the description and can be updated between releases, so
it is the only place a time-sensitive claim belongs. It is _not_ the description, so guideline 2.3.7
applies to it: no price, and "free" counts as a price (see "No price outside the description" above).
The earlier draft ended "no ads … Free forever, and open source" and has been cut back to the
mechanism:

```
New: search every profile by values, causes, politics and personality — no swiping, no hidden ranking, and every line of the source public on GitHub.
```

**Keywords** (97 chars) — do not repeat words already in the name or subtitle; Apple indexes those
separately. No competitor brand names (guideline 2.3.7).

```
friendship,meetup,values,community,relationship,platonic,opensource,nonprofit,connect,intentional
```

---

## Pre-submission checklist

- [ ] **No price references** in the name, subtitle, screenshots, app preview, promotional text,
      keywords or What's New — "free" included (guideline 2.3.7, above). The description is exempt.
- [ ] **Age rating 18+** on both stores. Compass carries romantic intent and user-to-user messaging;
      rating it lower invites a takedown, not just a rejection.
- [ ] **Data safety / privacy nutrition label** must match what the app does: account data, messages,
      photos, approximate location. "Data is never sold" in the description has to agree with the form.
- [ ] **Demo account** for App Store review (ios.md §8) — a seeded profile with a saved search and at
      least one conversation, so a reviewer can exercise search, messaging and the 200-character gate.
- [ ] **Account deletion** must be reachable in-app, not only on the web (`/delete-account`). Both
      stores require it for any app that creates an account.
- [ ] Re-read the description against the shipped app the week of submission. Every claim here is a
      feature that must still exist and still work.
