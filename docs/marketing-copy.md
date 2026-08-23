# Marketing copy — home & about

Replacement copy for the logged-out home page (`web/components/home/home.tsx`) and the about page
(`web/pages/about.tsx`). Companion to [marketing-visuals.md](marketing-visuals.md), which covers what those
pages _show_; this one covers what they _say_.

**Status: draft.** Nothing here is in the app yet.

## Why this document exists

Both pages sell a mechanism ("search, don't swipe") and a politics ("free, open, democratic"). Neither says
who is actually on Compass, what a profile contains, how the compatibility score works, what happens when
you write to someone, or how early the project is — even though all five are shipped, measurable, and more
persuasive than anything currently on the page. Three specific problems drove the rewrite:

1. **"No matching algorithms" is false.** `common/src/profiles/compatibility-score.ts` is 133 lines of
   scoring. The truthful version is also the stronger one: every competitor claims a great algorithm, none
   can say _you set its weights and can read its source_. The onboarding already says this correctly
   (`web/pages/onboarding/index.tsx:234`); the marketing page contradicts it.
2. **Nobody says who is here.** The population is the sharpest differentiator Compass has — secular, highly
   educated, globally scattered, EA/rationalist-adjacent, a third vegetarian — and it is described nowhere.
   "Find people who share your values, ideas, and intentions" describes every social product ever built.
3. **The logged-out page is less honest than the logged-in one.** Members see "Compass is in its early
   growth phase — 800+ members and ~100 new people joining every month" (`profiles-home.tsx:337`).
   Visitors see a finished product. The gap between what the page implies and what a new member finds in
   their city is the biggest churn driver available, and it is fixable in copy alone.

## Ground rules

- **Never hardcode a measured number.** `StatBand` and `MemberGrowth` both query live and render _nothing_
  on an empty response rather than a zero or a skeleton. Sections 1, 4 and 5 below carry numbers and must
  follow the same rule — `stats` already returns everything needed (`common/src/stats.ts`), so the
  percentages are arithmetic on `stats.demographics`, not a new endpoint.
- **State the denominator.** Most demographic fields are optional, so every percentage below is of _people
  who answered_, not of the membership. Saying so is not a hedge to bury; it is the one sentence no
  competitor can write, on the page arguing for transparency.
- **New keys for reworded strings.** `useT` resolves `common/messages/{fr,de}.json` _ahead of_ the English
  fallback (`web/lib/locale.ts:21-41`). Changing the English under an existing key leaves French and German
  silently showing the old meaning. Roughly 20 new keys × 2 locales.
- **Never fabricate social proof.** Same rule as H3 in marketing-visuals.md.
- **Say the size once per page, and never in the hero.** 726 is a small number next to what a visitor is
  reflexively comparing it to, and repeating it makes headcount the dominant fact about Compass. Three
  kinds of number, three different jobs:
  - _Size_ (members, countries) invites the losing comparison. Once per page, late, where it does work.
  - _Activity_ (378 conversations, 2,283 messages) answers the real fear — "is this dead?" — without
    stating how small the pool is. Use freely.
  - _Composition_ (70% with a degree, two-thirds atheist or agnostic, INTJ and INFJ most common) describes
    a club rather than a queue, and reads identically at 726 members or 7,000. This is where the
    persuasion belongs.
- **Country count is not a reach stat.** Fifty-five countries across 726 people is dispersion — the number
  that quietly says "nobody near you". It should not headline anything.

## Which page gets what

**Home answers "why would I bother?" in thirty seconds. About answers "can I trust this, and how does it
actually work?" in five minutes.** Two rules fall out of that, and they settle almost every allocation
question below:

- Anything that needs a denominator, a caveat, or a link to a source document belongs on **about**. A
  stranger will not read "of the 394 members who answered"; someone deciding whether to publish a profile
  about themselves will, and will trust the page more for it.
- **The same claim must never appear on both pages at the same depth.** Today "free, open, community-owned"
  is stated three times on each page in nearly identical words, which is most of why both read as thin.
  Home states it once; about _proves_ it, with the books, the constitution and a real ballot.

| Content                                | Home                | About                                       | Note                                                                        |
| -------------------------------------- | ------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| What Compass is                        | one line, a pitch   | one line, factual                           | Different registers on purpose                                              |
| Who's here                             | 3 lines, headline % | full, with bases                            | The qualifier on home; the evidence on about                                |
| Search demo clip                       | owns it             | —                                           | It is the hero's proof; a second copy would compete with itself             |
| What's in a profile                    | short list          | full field list                             |                                                                             |
| Compatibility score                    | headline claim      | the mechanism                               | Home: "you set the weights". About: the three inputs and the source link    |
| Saved searches / email alerts          | one clause          | owns it                                     | The phone clip and the three steps already live on about                    |
| 200-character first message            | headline claim      | with the email gate and where it's enforced |                                                                             |
| Profile visibility, public vs. members | one reassuring line | owns it                                     | Too heavy for home; the main objection, so it needs a real answer somewhere |
| Safety, blocking, data controls        | —                   | owns it                                     | Nobody signs up _because_ of it; plenty decline for lack of it              |
| Early-stage honesty                    | owns it             | short version                               | It has to be pre-signup or it isn't honesty                                 |
| Free, no ads, no VC                    | one strip           | —                                           | Stated on home, proven below                                                |
| The books ($457 / $145)                | one line in strip   | owns it                                     |                                                                             |
| Governance, constitution, real votes   | —                   | owns it                                     | `VoteEvidence` is already there and is the right home for it                |
| Who's behind it                        | —                   | owns it                                     | Currently only in the FAQ; neither page has a human on it                   |
| Where it runs (Android, PWA, langs)    | —                   | owns it                                     | Nobody joins for the platform list, but they look for it before trusting    |
| Press                                  | one line            | full list                                   |                                                                             |
| Linux / Wikipedia / Firefox            | remove              | owns it                                     | A vision claim a stranger can't verify; it belongs on the reference page    |
| Events                                 | —                   | —                                           | `upcomingEvents` is 0. Neither page, until there is supply                  |
| Ways to help, donate, share            | join CTA only       | owns it                                     | Already correct today                                                       |

---

# Home page

## Hero

**Badge** — `home.eyebrow`

|     |                                                     |
| --- | --------------------------------------------------- |
| Now | Free forever · Open source · No matching algorithms |
| New | **Free forever · Open source · No swiping**         |

The third claim was the false one. "No swiping" is true, keeps the rhythm, and is what the headline already
says.

**Headline** — unchanged. `Don't Swipe.` + typewriter `Search.` / `Connect.` The demo clip beside it proves
the claim; leave it alone.

**Subtitle** — `home.subtitle.*`

> Read and search every profile — by values, interests, politics, or a single word like _meditation_. You
> decide who's worth writing to. No algorithm decides for you.

**Social proof** — `home.proof.*`, live

> 378 conversations started · 2,283 messages sent

Deliberately activity rather than headcount, and deliberately no country count. The hero is where a visitor
reflexively compares Compass to apps with millions of users, and it is the worst possible place to hand them
the number that loses that comparison. Conversations answer the question they are actually asking at this
point in the page — is anyone here, does anyone reply — and they will meet the membership figure once,
lower down, where it comes with context.

---

## Section 1 — Who's here

New section. The single biggest gap on the page.

**Label:** Who's here
**Heading:** You can see exactly who you'd be joining.

> No generic adjectives. Most members are
> between 25 and 45. Among those who filled the field: 70% hold a bachelor's degree or higher, two-thirds
> are atheist or agnostic, and 44% are vegetarian or vegan. 70% are looking for a relationship, 50% for friendship, 40%
> for collaborators — and most for
> more than one of those.

**Link:** See the full breakdown → `/stats`

Composition, not headcount: this section describes a club, and it reads the same at 726 members as at 7,000.
**Check the percentages before shipping** — 373 / 341 / 263 against the 477 who answered is 78 / 71 / 55%,
and against the whole membership 51 / 47 / 36%; the draft's 70 / 50 / 40 matches neither base.

---

## Section 2 — What a profile contains

**Label:** What you're searching
**Heading:** A profile here takes twenty minutes to write, not two.

> Not a photo and a one-liner. A bio in your own words, answers to prompts, the causes you care about, your
> politics, religion, diet, languages, education, personality type, and what kind of connection you're
> after. More than twenty filters run across all of it — and free-text search reads the prose, so
> "meditation" finds the person who wrote about it in their bio, not just the one who tagged it.

The bio-vs-tag detail is real and worth keeping: it is exactly why the hero clip uses that query (two
results, one matching on a visible chip and one only through prose — see marketing-visuals.md, H1).

---

## Section 3 — Compatibility

Replaces the "Radically Transparent / No algorithms" feature card.

**Label:** The only algorithm
**Heading:** One algorithm. You set the weights, and you can read the source.

> For each compatibility question you give three things: your answer, the answers you'd accept from someone
> else, and how much it matters to you. The score is those three things compared — 130 lines of open code,
> no engagement optimization, no hidden ranking, no boost for paying. There is no paying.

**Link:** Read the implementation → `common/src/profiles/compatibility-score.ts` on GitHub

---

## Section 4 — Messaging

**Label:** How people talk here
**Heading:** The shortest message you can send is 200 characters.

> No "hey". To open a conversation you have to say something real about the person you're writing to — the
> composer won't send until you do, and you need a verified email before your first message. So far: 2,283
> messages across 378 conversations. About six messages each, which means people are answering.

The 200-character minimum is `MIN_CHARS` in `web/components/messaging/send-message-button.tsx:173`; the
email gate is enforced server-side in `backend/api/src/create-private-user-message-channel.ts`, not just in
the UI. This is the most concrete anti-swipe-app fact in the codebase and it currently appears on no
marketing page.

---

## Section 5 — Where it stands

Replaces the Linux / Wikipedia / Firefox quote block, which moves to `/about` under "Why we exist" — it is a
vision claim, and about is the reference page.

**Label:** Where we are
**Heading:** Compass is early, and we'd rather you hear it from us.

> Compass has 726 members and is growing every month, which is enough to have started 378 conversations and
> not enough to guarantee somebody in your town. So do two things: save a search, and we'll email you the
> day someone who fits joins. And if you know someone who belongs here, bring them — at this size, one
> person you introduce changes your odds more than any feature we could ship.

**This is the only place on the home page that states the membership**, and it earns it: the number arrives
attached to what the reader should do about it, rather than as a boast that invites a comparison. An earlier
draft named the largest national group (88 members) and the country count here as well. Both are cut — that
is candour spent on nothing, and it hands a hesitant reader the two most discouraging figures available.
"Not enough to guarantee somebody in your town" sets the same expectation without quantifying the
disappointment.

**Verify the growth claim before it ships.** The draft says "growing every month" rather than the in-app
"~100 new people joining every month" (`profiles-home.tsx:337`) because the two data points available
disagree with it: the press page reports "just over 400 users" in January 2026, and prod reported 726 in
July 2026 — about 54 a month. Check the member-growth series and use the real figure, which is a good number
and does not need inflating.

---

## Section 6 — Open source strip

Title unchanged: _Open Source & Free Forever_.

**Description** — `home.strip.description`

|     |                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Now | No venture capital. No ads. No subscription fees. Built transparently by the community, for the community.                                                                                                   |
| New | **No venture capital, no ads, no subscriptions, and nobody on payroll. Compass has cost $457 to run since launch; members have donated $145. One person covers the difference. Every expense is published.** |

**Badges:** GitHub · Discord · **See the books →** (`/financials`) · Join Now →

"Every contribution keeps the lights on" is a charity cliché. The deficit is the same ask, is true, is
verifiable one click away, and is the only version consistent with a transparency pitch.

---

## Section 7 — Press

One line above the footer. Five items sit in `web/pages/press.tsx` — including an RCF radio interview — and
neither marketing page links to any of them.

> Covered by RCF, La DH, L'Avenir and Matélé → `/press`

---

# About page

The page's job, per marketing-visuals.md, is to be a reference doc rather than a pitch — it needs evidence,
not a hero. The copy below takes that seriously: every section is either a mechanism the reader can try or a
claim they can check, and the page says so up front.

Order of sections, with the existing blocks kept where they already work:

1. Header · 2. `StatBand` (existing) · 3. How it works, with `NotifySpotlight` as step 3 (existing) · 4.
   Who's here · 5. What's public and what's yours · 6. Why we exist, with `MissionStatement` (existing) · 7.
   How a decision gets made, with `VoteEvidence` + `RepoActivity` (existing) · 8. Who's behind it · 9. What
   it costs · 10. Where it runs · 11. Press · 12. Help Compass grow (existing)

## Header

**Eyebrow** — `about.eyebrow`, unchanged: _About Compass_

**Headline** — `about.title`

|     |                                        |
| --- | -------------------------------------- |
| Now | Why Choose Compass?                    |
| New | **What Compass is, and how it works.** |

"Why choose" is a shopping-comparison frame on a page whose job is evidence, and it argues Compass is better
before saying what it is — which is exactly the reader arriving cold from a press article.

**Subtitle** — `about.subtitle`

> A free, public directory of people looking for depth — friends, partners, or collaborators. Built by
> volunteers, funded by donations, governed by its members. This is the long version: nothing on this page
> is a claim you can't check.

That last clause is the page's contract with the reader, and everything below has to keep it.

## Stat band

The existing `StatBand` shows Members · Countries · Conversations · $0. **Drop Countries and keep three
stats.** Fifty-five countries across 726 people is dispersion, not reach — it is the figure that says
"nobody near you" while presenting itself as an achievement, and it is the second thing on the page. The
component already hides it conditionally (`countryCount > 1`), so removing it is a small change.

Replace it with new members this month if the growth series supports the claim, or with messages sent, which
sits naturally beside conversations. Either way this is the one place on either page that a country
breakdown belongs — `/stats`, where someone came to read numbers.

**Caption, one line under the band:**

> Read live from the database, not from a press kit.

An earlier draft added a second sentence here calling out how thin the membership is spread. Cut: it is the
page's second element, the reader has not yet been given a single reason to want in, and self-criticism
before value is just discouragement. The same point lands properly in "Where it stands" on home, attached to
an action.

## Section A — How it works

New. The about page currently jumps from the stat band into saved-search alerts without ever explaining the
basic loop, so a reader who has not used the product is being sold step three of four.

**Label:** How it works
**Heading:** Four steps, and you control all four.

1. **Write a profile.** Twenty minutes, not two: a bio in your own words, prompt answers, the causes you
   care about, your politics, religion, diet, languages, education, personality type, and what you're
   looking for. Every field is optional — what you leave blank stays blank.
2. **Search everyone.** No feed, no queue, no daily allowance of people. More than twenty filters, plus
   free-text search that reads the prose in people's bios — so "meditation" finds the person who wrote about
   it, not only the one who tagged it.
3. **Save the search.** _(the existing `NotifySpotlight` block owns this step — keep its copy and its phone
   clip)_
4. **Write something real.** A first message is 200 characters minimum and needs a verified email address.
   No "hey": the composer will not send until you've said something about the person you're writing to.

## Section B — Who's here

The full version of the home page's Section 1. Home qualifies the reader in three lines; this one shows the
work.

**Label:** Who's here
**Heading:** The membership, in public.

> Most profile fields are optional, so each figure below is a share of the people who answered that
> question, not of the membership — the number who answered is in brackets.
>
> - **Age** (481) — 63% are 25–44, 21% are 18–24, 16% are 45 or older.
> - **Education** (394) — 70% hold a bachelor's degree or higher, including 35 doctorates.
> - **Religion** (304) — two-thirds atheist or agnostic; after those, the most common answers are
>   "spiritual" and Christian.
> - **Diet** (251) — 44% vegetarian or vegan.
> - **Personality** (122) — INTJ and INFJ are the two most common types.
> - **Looking for** (477) — 373 a relationship, 341 friendship, 263 collaborators; most people chose more
>   than one.
> - **Languages** (725) — 670 speak English, 103 French, 37 Spanish, 31 German.
>
> Every distribution, including the ones we haven't picked out here → `/stats`

The closing line matters: it pre-empts the obvious objection that these seven were cherry-picked.

No total here — the stat band states it once, four sections up, and that is the about page's single
allowance. Everything in this list is composition, which is the part that persuades and the part that does
not get weaker as the number gets smaller.

## Section C — What's public, and what's yours

New. The main objection to a "radically transparent directory" and currently unanswered on either page,
although the product answers it well.

**Label:** What's public
**Heading:** Your profile is a web page. That's the point — and it's a switch.

> Compass is a directory, so by default your profile is a public page that anyone can read and search
> engines can index. That is the deal that makes searching work at all: everyone can be found, so you can
> find anyone.
>
> If that isn't what you want, one tap makes your profile members-only — logged-out visitors see nothing,
> and we tell search engines not to index it. You can switch back whenever you like.
>
> The rest is yours too: hide profiles you'd rather not see, block someone outright, report them to
> moderators, download everything we hold about you, or delete your account and its data for good. Messages
> are encrypted at rest. Nothing you write is sold — there is nobody to sell it to.

## Section D — Why we exist

Keep the existing `MissionStatement` block ("One Mission") unchanged. Bring back the vision line underneath
it — it is already written and translated, sitting commented out at `web/pages/about.tsx:679-683` under
`about.block.vision.*`:

> Compass is to human connection what Linux is to software, Wikipedia to knowledge, and Firefox to browsing
> — a public digital good designed to serve people, not profit.

This is the block moved off the home page. It reads as self-congratulation in front of a stranger who has
not decided anything yet; it reads as positioning next to a mission statement on the reference page.

## Section E — How a decision gets made

Keep `VoteEvidence` and `RepoActivity`. Add the copy the section is missing — today it shows a ballot with
no explanation of the machinery behind it.

**Label:** How a decision gets made _(unchanged)_
**Intro:**

> Compass runs on a written constitution. Members who contribute — five hours of work, or $20 a year — can
> become voting members; new administrators need a unanimous vote of the current ones. Proposals are public,
> ballots are public, and the outcome binds the project. The vote below is a real one: require email
> verification before messaging, 11 for, 1 against, shipped.

**Kicker, under the tally:**

> Twelve voters is a small turnout. We would rather show you the real one than a bigger number that isn't
> real.
>
> → `/constitution` · `/vote` · `/members`

That kicker is the resolution of the turnout tension flagged in marketing-visuals.md (A1). The tension does
not go away by hiding it; naming it converts the page's weakest number into its strongest demonstration.

## Section F — Who's behind it

New. Neither page has a human on it; the founder story lives only in the FAQ.

**Label:** Who's behind it
**Heading:** Somebody has to start these things.

> Compass was started by Martin Braquet, an engineer from Belgium, after years of living across Europe, the
> U.S., India and Indonesia and finding that the connections that mattered most were the hardest to make on
> purpose. He still stewards the project, but he cannot decide it alone: the constitution puts direction in
> the members' hands, and the source is public, so nothing here depends on his goodwill.
>
> Everyone who has built Compass is a volunteer. Nobody has ever been paid.

**Verify before shipping:** the founding year is not asserted above because I couldn't confirm it from the
repo. The press page implies a launch around September 2025 ("four months after launch… just over 400
users", January 2026). Add the year if you want it.

Link Martin Braquet to his profile: /Martin.

## Section G — What it costs, and who pays

New. Today this argument exists only as a help card reading "Every contribution keeps the lights on".

**Label:** What it costs
**Heading:** The entire budget, in three numbers.

> Since launch, Compass has cost $457 to run — hosting, infrastructure, domains. Members have donated $145.
> The remaining $312 came out of the founder's pocket. There are no salaries, no marketing budget and no
> private costs, and every line of it is published.
>
> → See the books `/financials` · Donate `/support`

Make it read from a constant JS dict so it doesn't duplicate across pages.

## Section H — Where it runs

New, short.

**Label:** Where it runs
**Heading:** Browser, Android, and a home-screen app on iPhone.

> The web app works in any browser. There's an Android app on Google Play. On iPhone, add Compass to your
> home screen from Safari and it behaves like an app, notifications included — Safari only, because iOS
> allows it nowhere else; a native iOS app is waiting for someone to build it. The interface is in English,
> French and German, and there is a public API.

## Section I — Press

> Compass has been covered by RCF, La DH, L'Avenir and Matélé. → `/press`

## Section J — Help Compass grow

Keep the section as it stands: `MemberGrowth`, then `ShareStrip`, then the featured help card and the row of
three. One change — the donate card (`about.donate.text`) should stop saying "Every contribution keeps the
lights on" and point at Section G instead, so the ask and the numbers agree:

|     |                                                                                            |
| --- | ------------------------------------------------------------------------------------------ |
| Now | Support our not-for-profit infrastructure. Every contribution keeps the lights on.         |
| New | **$457 spent, $145 donated, no salaries. Every expense is published before we ask again.** |

---

## Number provenance

Fetched from `https://api.compassmeet.com/stats` on 2026-07-27. These drift; re-check before shipping, and
render them live rather than pasting them in.

| Claim                              | Source                                       | Value at capture        |
| ---------------------------------- | -------------------------------------------- | ----------------------- |
| Members / countries                | `profiles`, `countryCount`                   | 726 / 55                |
| Conversations / messages           | `conversations`, `messages`                  | 378 / 2,283             |
| Most between 25 and 44             | `demographics.age`, base 481                 | 302 / 481 = 63%         |
| Bachelor's or higher               | `demographics.education_level`, base 394     | 277 / 394 = 70%         |
| Atheist or agnostic                | `demographics.religion`, base 304            | 205 / 304 = 67%         |
| Vegetarian or vegan                | `demographics.diet`, base 251                | 110 / 251 = 44%         |
| INTJ / INFJ most common            | `demographics.mbti`, base 122                | 26 / 25                 |
| Relationship / friendship / collab | `demographics.pref_relation_styles`          | 373 / 341 / 263         |
| Largest national group             | `countries[0]`                               | United States, 88       |
| Age split 63 / 21 / 16%            | `demographics.age`, base 481                 | 302 / 100 / 79          |
| 35 doctorates                      | `demographics.education_level`               | 35                      |
| "Spiritual" then Christian         | `demographics.religion`                      | 50 / 49                 |
| Languages 670 / 103 / 37 / 31      | `demographics.languages`, base 725           | en / fr / es / de       |
| Vote tally 11 for, 1 against       | marketing-visuals.md A1, captured from prod  | shipped                 |
| 5 hours or $20/year to vote        | `web/public/md/constitution.md`, Article II  | —                       |
| $312 out of pocket                 | `web/public/md/financials.md`                | −$311.95                |
| ~100 new members per month         | existing in-app claim, `profiles-home.tsx`   | unverified against data |
| $457 spent / $145 donated          | `web/public/md/financials.md`                | $456.65 / $144.70       |
| 130 lines of scoring code          | `common/src/profiles/compatibility-score.ts` | 133 lines               |
| More than twenty filters           | `web/components/filters/`                    | 25 filter components    |

One of these deserves a second look before it goes on a public page: the ~100/month growth claim is asserted
in the app but was not verified against the member-growth series.

The gender split (73% male / 27% female among the 512 who answered) was originally kept off both pages —
see below for why that call was reversed.

## Deliberately out of scope

- **Events.** `upcomingEvents` is **0**. Neither page should promote them until there is supply — and the
  FAQ deserves a second look too, since it calls events "at the core of Compass's mission" and sends readers
  to an empty `/events`.
- **Real member photos.** Still the right end state for social proof (option 1 in marketing-visuals.md, H3),
  still blocked on consent that has to be collected by a human.

## Reversed: the gender split

The original draft kept the gender split (73% male / 27% female among the 512 who answered) off both pages
entirely, on the reasoning that it's a motivator for writing the safety and profile-visibility copy, not a
number to lead with. That call has since been reversed: the home page's Who's here paragraph now includes it
as one plain clause ("...and N% are men"), sourced live from `stats.genderRatio` the same way every other
figure in that section is. The original reasoning still constrains _how_ it's shown — one clause among
several rather than a headline stat or a full breakdown — but no longer whether it's shown at all.

## Source files this copy touches

| Section                     | File                                                                |
| --------------------------- | ------------------------------------------------------------------- |
| Home, all sections          | `web/components/home/home.tsx`                                      |
| About header, sections A–J  | `web/pages/about.tsx`                                               |
| Stat band caption           | `web/components/about/platform-stats.tsx`                           |
| Saved-search step           | `NotifySpotlight` in `web/pages/about.tsx:163`                      |
| Vote section copy           | `web/components/about/vote-evidence.tsx`, `web/pages/about.tsx:690` |
| Translations for both pages | `common/messages/de.json`, `common/messages/fr.json`                |
