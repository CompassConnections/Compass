# Feature ideas from the dating-app builders community

Ideas harvested from the `#dating-app-features` channel of the _Dating App Discussions_ Discord
([channel](https://discord.com/channels/1440906863926579241/1524593757704556665)), raw transcript in
`martin/feature-suggestions.md`.

Only ideas that (a) fit Compass's mission — transparent, non-profit, intentional 1-on-1 connections — and (b)
are **not already implemented** are kept. Everything already covered is listed at the bottom so the same
ideas don't get re-litigated.

Each entry states the idea, why it fits, and a concrete implementation sketch against the current codebase.
Nothing here is scheduled; treat it as a backlog to pull from.

---

## 1. Profile & matching

### 1.1 "Want to learn" hobbies (hobby swapping)

**Idea** (ChippingCoder) — split hobbies into two sections: _what I already do_ and _what I want to learn or
start_. A match happens when one person's "want to learn" meets another's "already do" — an instant,
non-generic conversation opener, and a reason to meet in person rather than chat forever.

**Why it fits** — Compass already models interests as a shared, user-extensible vocabulary, so this is a
second edge on an existing graph rather than a new taxonomy. It also produces _activity-shaped_ matches
(go do the thing together), which is exactly the behaviour the platform wants to encourage.

**Sketch**

- `profile_interests` gains a `kind TEXT NOT NULL DEFAULT 'current'` column (`'current' | 'wants_to_learn'`),
  or a parallel `profile_interests_wanted` table if the join is simpler to keep separate.
- Reuse the existing interests picker in the optional profile form with a second section; the `interests`
  option table and its translations are unchanged.
- Surface in `get-profiles` as a filter (`wants_to_learn && $(interests)`) and, more valuably, as a
  compatibility signal in `common/src/profiles/compatibility-score.ts`: reward _complementary_ pairs
  (my "want to learn" ∩ your "current"), not just overlap.
- Profile UI: a "Curious about" rail next to the interests rail, and a badge on profile cards when a
  complementary pair exists ("You could teach them bouldering").

**Effort** — small-to-medium. One migration, one form section, one scoring rule.

### 1.2 Structured accessibility / disability field

**Idea** (ChippingCoder) — a profile field for disabilities.

**Why it fits** — Compass has `accessibility_notes` (free text), which is good for nuance but invisible to
search, filters and matching. People who want to find each other on this axis currently can't. A small
structured multi-select alongside the existing free text makes it filterable without flattening anyone into
a checkbox.

**Sketch**

- Follow [`profile-fields.md`](profile-fields.md): `ACCESSIBILITY_CHOICES` in `common/src/choices.ts`,
  `accessibility TEXT[]` column, GIN index, zod entry, `get-profiles` array filter.
- Keep `accessibility_notes` as the free-text companion (the pattern already used by `gender_details`,
  `neurotype_details`).
- Default to _not_ filtering on it in the main search; expose it as an opt-in filter so it never becomes an
  exclusion default.

**Effort** — small; the field-adding path is well-trodden. The hard part is choosing the vocabulary, which
should be drafted with affected members rather than invented.

### 1.3 Income / salary — only if public

**Idea** (azir) — an optional salary field, _hidden on the profile_ but usable as a filter by others.

**Why it partially fits** — financial situation is a real compatibility axis and other apps handle it badly.
But "hidden from the profile, visible to the filter" is precisely the asymmetry Compass exists to remove:
it lets people be screened on a criterion they can't see being applied. The idea is worth keeping **only**
in a symmetric form: an optional, publicly displayed income band (like `education_level` or `occupation`),
filterable by anyone, visible to everyone including the owner's own profile view.

**Sketch**

- `income_band TEXT` with coarse buckets, currency-normalised at display time (Compass is multi-country;
  raw numbers would mislead).
- Standard choice field per [`profile-fields.md`](profile-fields.md), rendered in the profile rail.
- If it can't be made public, don't build it.

**Effort** — small, but decide the values question first.

### 1.4 Something to _do_ on a new connection

**Idea** ([Reddit thread](https://www.reddit.com/r/Entrepreneurs/s/2qMZ0Ddtl3), endorsed with a caveat by mb)
— when two people connect, hand them something concrete rather than an empty text box. mb's caveat is the
interesting part: randomly paired couples like each other ~1 in 5 times, so no algorithm meaningfully
improves compatibility — what matchmaking features actually buy you is _conversation starters_ and momentum.

**Why it fits** — Compass already owns the perfect raw material: compatibility prompts, answers, and the
per-pair compatibility score. Nothing new needs to be invented, only surfaced at the right moment.

**Sketch**

- On a new message channel, seed a system card: the highest-signal prompt where both have answered
  differently, plus one where they agree strongly (`compatibility_answers` + `compatibility_prompts`).
- Alternative/complementary: suggest a shared activity drawn from §1.1 ("you both want to learn pottery").
- Keep it dismissible and never auto-send a message on the user's behalf.

**Effort** — small-to-medium; mostly a query and a UI card in the messages pane.

---

## 2. Intent signals & user control

The strongest thread in the channel (Tomas ↔ ChippingCoder) was about _showing intention_ and, crucially,
letting each user choose what they expose. The design principle they converged on — **reciprocal
visibility: if you hide a signal, you can't see it on others** — is a good fit for Compass and should be the
rule for everything in this section.

### 2.1 Active-conversation signal

**Idea** — show how many conversations someone is actively holding. Rationale: there's a natural ceiling on
how many people anyone can genuinely date at once; exceeding it marks either a non-serious user or a bot. It
also nudges people to close dead threads.

**Why it fits** — this is transparency applied to behaviour rather than to profile fields, and it makes the
platform's own honesty norms legible between members.

**Sketch**

- Three display modes, member-chosen in settings, defaulting to the soft one:
  1. exact count of active conversations,
  2. soft label — _"open to new conversations"_ / _"focused on a few right now"_,
  3. hidden.
- Reciprocity enforced server-side: mode 3 hides the signal on everyone else's profile for that member.
- "Active" needs a definition — a channel with messages from both sides in the last N days beats raw channel
  count, which would count every dead thread. Derive from `private_user_messages`, cached on the profile row
  or in a small materialised view; `get-channels-count` is a global stat and can't be reused as-is.

**Effort** — medium. The counting query and its caching are the real work.

### 2.2 Optional self-imposed conversation cap

**Idea** (bemidate, via ChippingCoder) — cap simultaneous _active_ conversations (they use 5). Matches
beyond the cap still exist; only active talking is limited.

**Why it fits** — Compass already ships the intentionality-by-scarcity idea in a stronger form (one like per
day). A conversation cap is the same philosophy at the other end of the funnel, and it doubles as
anti-scammer friction (see §3).

**Sketch**

- Start as a _self-imposed, displayed_ commitment rather than a platform-wide rule: a member opts into a cap,
  and their profile shows it. This preserves user control and gives real data before considering a default.
- Enforce in `create-private-user-message-channel` for members who opted in.
- A platform-wide cap is a governance question — it changes the product for everyone, so it belongs in a
  proposal/vote, not a settings toggle.

**Effort** — small if opt-in, large if global (needs a vote).

### 2.3 Like with an optional short note

**Idea** (Tomas, ChippingCoder) — allow attaching a short message to a like. Keep it **optional** — forcing
it produces copy-paste openers, while optional makes it a genuine signal of effort — and let the _receiver_
choose whether they accept notes at all.

**Why it fits** — Compass's one-like-per-day rule already makes a like expensive and therefore meaningful; a
note makes it legible. And the receiver-side control matches `allow_direct_messaging`, which already exists.

**Sketch**

- `profile_likes` gains `note TEXT` (short, hard-capped, plain text).
- `like-profile` accepts an optional `note` and rejects it when the target has notes disabled.
- New profile flag `allow_like_notes` alongside `allow_direct_messaging`.
- The like notification renders the note; abuse reporting must reach it (`reports` already covers likes'
  parents — check the report target type).

**Effort** — small.

### 2.4 The general principle: per-signal opt-outs

ChippingCoder's summary — _"allowing user control over all of these features is what makes a good app"_ —
is worth writing into the settings design: every behavioural signal Compass introduces (§2.1, §2.2, §2.3,
last-online, spotlight consent) should be individually toggleable and, where it's a signal _about_ people,
reciprocal. Worth a short section in the settings page and in the constitution's transparency language.

---

## 3. Trust & safety

Nullism (GoodDate) reported ~100 scam signups/day after a single press mention — on a free app with no
payment wall. Compass is free by design, so it should assume the same wave and build for it _before_ the
press hit, not after.

### 3.1 In-chat scam-pattern nudges

**Idea** (azir, ChippingCoder) — detect the well-known scam trajectory in conversation (immediate push to
WhatsApp/Telegram before knowing each other, crypto/investment talk, urgency, money requests) and nudge the
_receiving_ member with a short, non-alarmist warning.

**Why it fits** — it protects members without accusing anyone, and it's the one intervention both sides of
the channel agreed on: _"the real solution is teaching users how to identify scams"_.

**Sketch**

- Keyword/pattern pass on outgoing messages (server-side, in `create-private-user-message`), producing a
  hint shown to the recipient, never a block.
- Deliberately no message-content storage beyond what's already stored, and no per-user "suspicion score"
  visible to members — that's moderation data.
- Pair with a short, linkable safety page (see §3.2) so the nudge has somewhere to point.

**Effort** — medium; the rule list and the false-positive tuning are the work, not the plumbing.

### 3.2 A real safety page

**Idea** — Compass currently has `/security` (platform security), `/help`, `/faq`, but no member-facing
guidance on romance scams, catfishing, or safe first meetings.

**Why it fits** — cheap, high-value, and consistent with a platform that teaches rather than gates.
Also the destination for §3.1's nudges and for onboarding.

**Sketch** — a `/safety` page + one onboarding step, i18n'd like every other page. Content: the off-platform
push pattern, the reluctance-to-video-call pattern, money asks, meeting in public, telling a friend, and how
to report. Link it from the messages pane.

**Effort** — small; mostly writing.

### 3.3 Moderation signals against fake accounts

**Idea** (azir, ChippingCoder, mb) — several converging signals, all **internal to moderation**, never shown
to members as accusations:

- IP-derived country vs stated city mismatch (Cloudflare / request geo).
- Signup velocity per IP/ASN and device, on top of the existing per-endpoint rate limiting.
- AI-generated photo tells. mb's field note is directly usable: Nano-Banana-style images repeat poses and
  scenes, and the mirror-selfie hand position is near-identical across ~9/10 samples; implausible physical
  details (white trousers on a dirty kerb) are another tell.

**Why it fits** — moderation already exists (`ban-user`, `reports`, account-on-hold), and
`profiles.image_descriptions` means photos are already being described. Adding signals to the moderator's
view is much cheaper than automated enforcement, and far less likely to misfire on real members.

**Sketch**

- A moderation queue page under `web/pages/admin/` listing new profiles with the signals above as flags.
- Store geo/velocity signals on signup in a moderation-only table; never expose via the public API.
- Photo tells stay a _human_ checklist in the moderator UI. Automated AI-image detection is a losing arms
  race and produces confident false positives against real people.
- Explicitly **not** recommended: the "name + country ⇒ scammer" heuristic floated in the channel. It's
  nationality profiling, it would ban real members, and it's incompatible with the constitution.

**Effort** — medium.

### 3.4 "We've met" confirmation

**Idea** (ChippingCoder, referencing Hinge) — let a pair confirm that a date actually happened, and design
the product around helping dates _happen_ rather than around chat volume, since scammers and time-wasters
never reach that step.

**Why it fits** — this is the one metric that would make Compass's public statistics genuinely unique.
Every platform publishes signups; almost none publishes _dates that happened_, and Compass already publishes
live stats and financials. It also feeds the reputation work in [`reputation.md`](reputation.md) and gives
moderation a very strong positive signal.

**Sketch**

- Double opt-in confirmation on a channel ("did you two meet?"), stored on the channel or in a small
  `meetups` table; only a mutual confirmation counts.
- Never public per-member; aggregate only, on `/stats`.
- Keep it low-pressure and dismissible — a nag here would be worse than no feature.

**Effort** — medium.

---

## 4. Growth & local liquidity

### 4.1 In-app city critical-mass loop

**Idea** (azir) — new members in an empty city hit a gate: they can either _invite people to unlock the
city together_, or browse globally in the meantime, and get notified when their city unlocks.

**Why it fits** — Compass already computes local density and emails members their city number
(`send-city-number-emails`, `shared/outreach/local-density`), and [`reputation.md`](reputation.md) already
designs an invite loop. This is the same argument delivered _in the product at the moment it's felt_, which
is when it's most persuasive.

**Sketch**

- Reuse `getLocalDensity` on the home page: show the member their city's real number and the threshold.
- An invite CTA carrying the "why I thought of you" note from `reputation.md`, plus a notification when the
  threshold is crossed.
- Compass should **not** copy the hard swipe-lock — gating the product on invites is coercive. Show the
  number, make the ask, keep global browsing fully open.

**Effort** — medium; most of the backend already exists.

### 4.2 A public comparison of dating platforms

**Idea** (Martin's own thread in the channel) — no one publishes a data-driven, honest comparison of dating
platforms: registered users, monthly actives, launch date, open source or not, funding model, ads, swipe
mechanics. The Wikipedia comparison page is stale, and most platforms won't self-report. The proposed method
— ask each founder to fill a form and mark non-responders as _declined to disclose_ — turns non-answers into
signal.

**Why it fits** — it's the same thesis as `/stats` and `/financials`, pointed outward. Compass is one of the
very few platforms that already publishes live numbers, so it can credibly host the comparison and is the
obvious winner of the "who is transparent" column. It's also a strong acquisition page: "which app should I
use?" is the first question anyone dating actually asks.

**Sketch**

- A static-ish `/compare` page (a JSON/YAML data file in `common/` or `web/data/`, rendered as a sortable
  table), with a "last verified" date per row and a link to each platform's source.
- Compass's own row pulls live from the existing stats endpoints — the point is that it's the only one that
  can.
- Editorially: state the methodology, link the form, and mark non-responses neutrally. Overclaiming here
  would destroy the page's credibility, which is its only asset.

**Effort** — small to build, ongoing to maintain. The maintenance is the real cost and should be decided
deliberately.

---

## Already covered — do not re-add

| Suggested in the channel              | Status in Compass                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| Web **and** mobile (75% of the poll)  | Next.js web + Capacitor Android shipped; iOS planned ([`ios.md`](ios.md))         |
| Non-profit / donation funding         | `/donate`, `/financials`, published finances                                      |
| Tags for age, gender, country, intent | Full filter set incl. relationship & romantic styles ([`filters.md`](filters.md)) |
| Rate limits as anti-spam              | One like per day (`has-free-like`), per-endpoint `rateLimited`                    |
| Blocking / reporting / bans           | `block-user`, `report`, `ban-user`, account-on-hold                               |
| Receiver control over who can message | `allow_direct_messaging`, `allow_interest_indicating`, `messaging_status`         |
| AI help writing a profile             | `llm-extract-profile`, `/tips-bio`, bio editor assistance                         |
| Published platform statistics         | `/stats`, `/financials`, `repo-stats`                                             |
| Free-text accessibility info          | `accessibility_notes` (see §1.2 for the structured upgrade)                       |
| Photo moderation                      | Manual review + `image_descriptions` (see §3.3 for tooling)                       |

## Discarded

- **Nationality/name-based scammer heuristics** — profiling; would hit real members. See §3.3.
- **Hard swipe-lock until you invite friends** — coercive growth mechanic. See §4.1.
- **Salary hidden from the profile but exposed to filters** — the exact asymmetry Compass exists to remove.
  See §1.3.
- **Discord server organisation** (forums vs channels, ethnicity tags) — about the Discord itself, not Compass.
