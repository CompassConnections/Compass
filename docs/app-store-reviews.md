# Asking members for an App Store / Play Store review

When to prompt members of the iOS and Android apps to rate Compass, what to trigger on, what never to
do, and how it is built.

Status as of 2026-08-24: **implemented, not yet applied**. The code is in the tree; the migration has
to be applied by hand and the card has to be verified on a device — see [§8](#8-what-is-left-to-do).

Context at time of writing: ~800 members, ~100 of them on the Android app, `0` Play reviews. The iOS
app has an App Store Connect record but no live listing yet.

---

## 1. When to start

**Now**, assuming the app shell is stable (no crash loops, no broken photo upload). The gate is app
quality, not member count. Three reasons not to wait for a bigger install base:

- "No ratings yet" is the worst listing-conversion state there is on either store, and it suppresses
  ranking. Reaching ~20 reviews at 4.5+ is worth more than reaching 200 installs.
- The current cohort is the warmest one there will ever be. Early adopters who found someone here are
  gone in six months, and their goodwill goes with them.
- Both stores impose a **per-user quota** on the native review card. Each member's asks are scarce,
  but they don't accrue interest — hoarding them buys nothing.

For iOS specifically the highest-leverage window is the **first two to three weeks after launch**, so
the review hook ships _in_ the launch build rather than as a follow-up. The
`REVIEW_PROMPT_MIN_SESSIONS` floor is deliberately low (3) for exactly this reason.

### Expected yield

The native card converts far better than a link to the store listing — a redirect lands in the low
single digits, the native card commonly converts 20–40% of prompts that actually render. On ~100
Android installs with maybe 50–60 active members, a first wave reaching ~40 eligible members plausibly
yields 10–15 reviews, then settles into a drip as new installs hit the trigger conditions. That is
enough to change the listing.

### The zero-code first move

With 800 members, the highest-ROI action is still a personal message to the warmest app members. A
human ask outconverts any dialog. Asking for an **honest** review is allowed; offering anything in
return is not, and neither is suggesting what to write or what score to give.

---

## 2. Mechanism

One plugin covers both stores:

```
@capacitor-community/in-app-review@7.1.0   →  RateApp.requestReview()
```

It wraps the **Google Play In-App Review API** on Android and **`SKStoreReviewController` /
`AppStore.requestReview(in:)`** on iOS. Version matters: `8.x` peers on `@capacitor/core >= 8` and
`web` is on Capacitor `7.4.4`, so `7.1.0` is the last release on the 7 line. The plugin is listed in
`capacitor.config.ts`'s `includePlugins` allowlist — without that entry `cap sync` silently leaves it
out of both native projects.

Never link out to the store listing as the _automatic_ ask. (A manual, member-initiated "Rate
Compass" row is a different thing — see [§7](#7-the-manual-rate-compass-row).)

Two properties of the API shape everything downstream, and they hold on both platforms:

1. **It reports nothing back.** The call resolves successfully whether the member left a review,
   dismissed the card, or never saw it because of quota. There is no "did it work" signal, so there is
   no retrying the ones who didn't convert — every gating decision has to be made up front and has to
   be conservative. It is also why the attempt is recorded _before_ the card is invoked rather than
   after some confirmation that never arrives.
2. **Neither card can be tested where you would want to.** Android needs a Play-signed build on the
   internal testing track (or internal app sharing) with a Play Store present on the device. iOS shows
   the card _always_ in a debug/simulator build — unthrottled, so useless for verifying the gating —
   and **never** in a TestFlight build. Only a production build is throttled the way a member's will
   be.

---

## 3. Policy: behavioural triggers yes, sentiment gating no

**Review gating violates both stores' policies** — Play's developer policy and App Store Review
Guideline 1.1.7. Asking "how do you like Compass?" and routing only the happy answers to the review
card is prohibited, as is incentivising reviews in any form.

Choosing _when_ to ask based on **what the member did** is explicitly fine, and is what both Google
and Apple recommend — trigger the flow once someone has experienced enough of the app to have an
opinion. The forbidden thing is branching on **stated sentiment**.

This bears directly on the existing testimonials flow. Chaining "gave 4–5 stars in
`web/components/testimonials/testimonial-form.tsx` → show the review card" is functionally a sentiment
filter and is not done. The trigger is **submitting a testimonial at all**, whatever the rating —
submission is itself the behavioural signal, and it keeps the logic clean.

---

## 4. Triggers

Strongest first. The client names the _moment_ it is in; the server decides which trigger, if any,
that moment qualifies as.

| Moment (client)             | Trigger (server)       | Qualifies when                                                        |
| --------------------------- | ---------------------- | --------------------------------------------------------------------- |
| `inbox`                     | `got-reply`            | A conversation reached genuine two-way exchange in the last 7 days    |
| `testimonial-submitted`     | `testimonial`          | Always — submission is the signal                                     |
| `profile-from-notification` | `notification-profile` | Always — a notification tap led to a profile view                     |
| `quiet`                     | `backfill`             | Never prompted before, and the evidence predates the feature shipping |

1. **Got a reply.** Two-way exchange means 2+ inbound messages from someone else in one channel, or
   4+ messages total in both directions (`REVIEW_REPLY_INBOUND_MIN` /
   `REVIEW_CONVERSATION_TOTAL_MIN`). This is the "the thing worked" moment and it is the best single
   trigger available for Compass. It fires on _returning to the inbox_, never inside the open thread.
2. **Submitted a testimonial** — any rating. Fired from the wall's composer when the modal closes,
   not when it submits: the modal stays open on its success state, and a store card cannot be asked
   for over the top of an open dialog.

   The `deletion_survey` testimonial — the "I found someone here" parting path — is deliberately
   **not** a trigger, despite being the most emotionally apt moment on the site. It is written
   server-side inside `me/delete` (`backend/api/src/delete-me.ts`) seconds before the account is
   destroyed: there is no client moment to hook, the member is being signed out, and the
   `review_prompts` row would cascade away with the user anyway. Asking someone to rate the app in
   the same breath as deleting their account is also just the wrong thing to do.

3. **Opened a notification that led to a profile view.** Every notification tap on either platform —
   push, email link, universal/app link — funnels through `handleAppLink` in `web/pages/_app.tsx`,
   which is where the tap is recorded. The ask happens a few seconds into the profile page, not on
   arrival, so it lands after they have looked rather than over the top of what they came to see.
4. **Backfill.** See below.

"Completed profile" was considered and dropped. A long form ends in relief, not delight; it is effort
we asked of them, not value we delivered.

### The backfill trigger

The three triggers above only fire on events happening _after_ the feature ships. Everyone who already
had the experience that would have qualified them — the members with a real conversation behind them,
or a testimonial already written — would never be asked, which is most of the people worth asking
today.

So there is a fourth trigger that catches them up. At a **quiet moment** (the app has been open and
settled for a while, no modal, nothing mid-flow), a member qualifies for `backfill` when:

- they have **never been prompted** — `attempts = 0`; and
- the qualifying evidence **predates `REVIEW_BACKFILL_CUTOFF`**, the date the feature shipped.

The cutoff is what keeps backfill from double-covering the live triggers: an event after that date
will reach the member through its own moment, so backfill deliberately can't see it. It also means
the trigger drains itself — once everyone with pre-cutoff history has been asked once, it stops
firing, and it never fires for anyone who joins later.

Only two kinds of evidence are reconstructable from history: a qualifying conversation, and a
submitted testimonial. A past notification tap leaves no record, so trigger 3 has no backfill. The
testimonial half only ever matches `member` testimonials in practice — `deletion_survey` rows have
their `author_id` nulled when the account goes, so they can never belong to a member who is still
here to be asked.

Because backfill can only ever fire once per member, the client asks for it **at most once per
install** and remembers that it did, so an app that is opened daily doesn't re-ask the server on every
launch.

---

## 5. Suppression rules

These carry as much weight as the triggers — a prompt at a bad moment converts negatively. They split
by who knows the fact.

**The install knows** (`localStorage`, checked in `isInstallEligible`):

- Native app only (`isNativeApp()` from `web/lib/util/webview.ts`), signed-in members only.
- Minimum 3 sessions and 2 distinct days since install (2 sessions for `backfill`, which is a
  one-shot). Never during the first session.
- Calm moment only: no open modal (`[role="dialog"]`), no keyboard up (`body.keyboard-open`), page
  visible, not mid-flow.
- At most one ask per session, however many moments occur.

**The server knows** (`evaluateReviewPrompt`, fed by one query):

- Cooldown of 120 days between attempts; lifetime cap of 3 attempts per member. Both are set to the
  tighter of the two platforms' quotas — Apple hard-caps at 3 prompts per device per 365 days and
  silently no-ops past that; Play's quota is undocumented but similarly small — so no rule here has to
  branch on platform.
- Never within 14 days of a support message (`contact`) or a report they filed (`reports`).
- Never while the account is on hold or banned (`is_banned_from_posting` / `ban_reason`).

`localStorage` for the first group and Postgres for the second is a deliberate split, not an
inconsistency. Sessions and install date are facts _about this install_ and have no meaning
server-side — the same member on a new phone genuinely is a new install, and should serve the same
"not in the first session" wait. The attempt log is the opposite: it must survive a reinstall or
cleared WebView storage, has to be deduped across devices, and — since the API itself is silent — is
the only measurement of the feature that exists.

Members can also switch the card off globally: Settings → App Store → In-App Ratings & Reviews on
iOS. Nothing tells us when they have; it is one more reason the call's silence is load-bearing.

---

## 6. Implementation

Six pieces, following the house conventions.

**Migration** — `backend/supabase/migrations/20260824_add_review_prompts.sql`, appended to
`backend/supabase/migration.sql` before the closing `COMMIT;`. One row per attempt:

```
review_prompts (user_id, prompted_at, prompt_trigger, platform, attempt_no)
```

RLS on with no policies and the grants revoked — the client never reads this table, only the API's
service-role connection does. (`prompt_trigger` rather than `trigger` because the latter is a keyword
in enough SQL dialects to be worth not testing.)

**Rules** — `common/src/reviews/prompt.ts`. Every threshold in §4 and §5 is a named constant, and the
two decisions are pure functions: `isInstallEligible` for the install-local half, `evaluateReviewPrompt`
for the account half. Pure so both are unit-testable without a database or a WebView, which matters
because every rule above is a branch worth a test — `common/tests/unit/review-prompt.test.ts`.

**Endpoint** — `request-review-prompt` (schema entry in `common/src/api/schema.ts`, handler in
`backend/api/src/request-review-prompt.ts`, registered in the `handlers` map in
`backend/api/src/app.ts`). One POST does the whole thing: gathers the account facts in a **single**
query, evaluates, and — if the answer is yes — records the attempt and returns the trigger. Read and
write are the same call on purpose. Splitting them would mean either a round trip on app open (for a
flag that is null for almost everyone almost always) or a window in which two moments both think they
may prompt.

The handler writes raw SQL through `pg` rather than the typed `insert` helper from
`shared/supabase/utils`, because that helper is typed against `common/src/supabase/schema.ts`, which
is regenerated from the live database — and the migration has not been applied yet. Switch it over
after the regen if you like; there is no other reason to.

**Hook** — `web/hooks/use-review-prompt.ts` owns the install counters, the calm-moment check, the
one-ask-per-session cap, the API call and the plugin call. Three entry points: `useQuietReviewPrompt`
(mounted once, for backfill), `useReviewPromptMoment(moment, enabled)` for a page, and the imperative
`requestReviewPrompt(moment)` for a callback.

**Call sites** — `<ReviewPrompts/>` in `web/pages/_app.tsx` (quiet), the inbox in
`web/pages/messages/index.tsx`, the profile page in `web/pages/[username]/index.tsx`, and the
testimonial modal in `web/components/testimonials/write-testimonial-modal.tsx`.

**Instrumentation** — `track('review prompt shown', {trigger, platform})` on every card actually
invoked. The store's own conversion is invisible to us, so the attempt count and the store's review
count over the same window are the only two numbers there are.

There is no copy of ours anywhere in this feature: the card is rendered and localised by the store, so
nothing here goes through `useT()` except the manual row below.

---

## 7. The manual "Rate Compass" row

A member-initiated row in the sidebar, shown only inside the app. It links out to the store, which is
the one place linking out is right:

- **iOS** — `${IOS_APP_URL}?action=write-review`. Apple's HIG forbids calling `requestReview` from a
  button tap, so for an explicit control the deep link is the _only_ correct mechanism. Gated on
  `IS_IOS_APP_PUBLISHED`, since `IOS_APP_URL` is a placeholder until App Store Connect assigns the id.
- **Android** — the listing URL. Play has no documented write-review anchor.

It exists because of the quota: a member who wants to say something after their three system prompts
are spent has no other route, and the row costs nothing.

---

## 8. What is left to do

- [ ] Apply the migration: `./scripts/migrate.sh backend/supabase/migrations/20260824_add_review_prompts.sql`
- [ ] `yarn --cwd=backend/api regen-types-dev` so `review_prompts` appears in
      `common/src/supabase/schema.ts`.
- [ ] Set `REVIEW_BACKFILL_CUTOFF` in `common/src/reviews/prompt.ts` to the date the release actually
      ships, if it is not the date already there. Too early and backfill double-covers the live
      triggers; too late and it swallows events that would have fired on their own.
- [ ] Verify the plumbing on each platform — the **Store review card** button under Diagnostics on
      `/admin` (see below).
- [ ] Verify the gating by watching `review_prompts` rows appear, not by watching for a card.
- [ ] Put the real App Store id in `IOS_APP_URL` when the listing goes live — the manual row in §7 is
      hidden on iOS until then.

### Testing the plumbing

`/admin` → Diagnostics → **Store review card** (`web/components/admin/review-card-tester.tsx`) calls
the plugin directly, bypassing every trigger and cooldown, and deliberately records nothing — an
admin testing the wiring must not spend one of their own three yearly asks, nor leave a row that the
yield numbers are later read out of.

What a result means depends on the platform, because the two natives disagree about what failure is:

| Where                | Expect                      | Because                                                                               |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------------- |
| Browser              | throws `unimplemented`      | No web implementation. Still proves the JS side is wired.                             |
| Android, sideloaded  | throws                      | Play cannot verify an install it did not make, so `requestReviewFlow` fails outright. |
| Android, Play-signed | resolves, card may show     | Play ran the flow. Quota is silent, so no card is not a failure.                      |
| iOS, debug/simulator | resolves, card always shows | Unthrottled here. This is the one build where seeing the card is easy.                |
| iOS, TestFlight      | resolves, no card           | TestFlight never shows it. Nothing is wrong.                                          |
| iOS, production      | resolves, throttled         | The real behaviour.                                                                   |

The iOS "resolves" is nearly worthless on its own: the Swift plugin calls `call.resolve()`
unconditionally, even when it found no foreground window scene and did nothing at all. Android's
resolve is meaningful — it only comes after Play has actually run the flow.

### Testing the gating

The card is the wrong thing to watch, on both platforms: a member who is out of quota gets no card
while every call resolves normally. Watch the table instead.

```sql
select
  prompt_trigger,
  platform,
  prompted_at,
  attempt_no
from
  review_prompts
where
  user_id = '<uid>'
order by
  prompted_at desc;
```

To exercise a live trigger end-to-end, sign in on a build older than
`REVIEW_PROMPT_MIN_DAYS_INSTALLED` days ago with `REVIEW_PROMPT_MIN_SESSIONS` launches behind it —
or clear the `review-prompt-install-v1` key in the WebView's `localStorage` and relaunch that many
times — then open the inbox on an account with a real two-way conversation. A row appearing with
`prompt_trigger = 'got-reply'` is the whole feature working; whether a card was drawn on top of it is
the store's business.

## 9. Two things this does not fix

**The web-only ceiling.** Roughly 700 of the 800 members are web-only and **cannot** leave a review on
either store — both APIs require the app installed from the store under that account. This whole track
only ever addresses the app slice, and the review ceiling is the install count. The same trigger events
in §4 should also feed a **"get the app" nudge on web**; without that, the reviews plan is capped at
~100 people no matter how well the prompt is tuned. The two features share their trigger logic and
should probably be built together.

**Per-storefront ratings on iOS.** Apple shows ratings per country storefront, so reviews from French
members do not lift the US listing and vice versa. For an app this size that is a real fragmentation
of an already small number, and there is nothing to do about it except be aware that the US number is
not the number. Related: App Store Connect offers to reset the summary rating when a new version
ships. Never take it.
