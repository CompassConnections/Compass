# Asking members for a Google Play review

Plan for prompting Android members to rate Compass on the Play Store: when to start, what to trigger on,
what never to do, and how it would be built against the current codebase.

Nothing here is scheduled — it is a plan, not a changelog. Status as of 2026-08-17: **not implemented**.

Context at time of writing: ~800 members, ~100 of them on the Android app, `0` Play reviews.

---

## 1. When to start

**Now**, assuming the Android shell is stable (no crash loops, no broken photo upload). The gate is app
quality, not member count. Three reasons not to wait for a bigger install base:

- Play's "no ratings yet" state is the worst listing-conversion state there is, and it suppresses ranking.
  Reaching ~20 reviews at 4.5+ is worth more than reaching 200 installs.
- The current cohort is the warmest one there will ever be. Early adopters who found someone here are gone
  in six months, and their goodwill goes with them.
- Play imposes a **per-user quota** on the in-app review card (it can only surface a small number of times
  per user per year). Each user's asks are scarce, but they don't accrue interest — hoarding them buys
  nothing.

### Expected yield

The native in-app card converts far better than a link to the store listing — a redirect lands in the low
single digits, the native card commonly converts 20–40% of prompts that actually render. On ~100 installs
with maybe 50–60 active members, a first wave reaching ~40 eligible users plausibly yields 10–15 reviews,
then settles into a drip as new installs hit the trigger conditions. That is enough to change the listing.

### The zero-code first move

With 800 members, the highest-ROI action is a personal message to the ~30 warmest Android members. A human
ask outconverts any dialog. Asking for an **honest** review is allowed; offering anything in return is not,
and neither is suggesting what to write or what score to give.

---

## 2. Mechanism

Use the Google Play In-App Review API. Never link out to the store listing.

```bash
yarn --cwd=web add @capacitor-community/in-app-review@7.1.0
```

Version matters: `@capacitor-community/in-app-review@8.x` peers on `@capacitor/core >= 8`, and `web` is on
Capacitor `7.4.4`. `7.1.0` is the last release on the 7 line. (`capacitor-rate-app` is the other option but
its latest peers on Capacitor 5, so it is further behind.)

Two properties of the API shape everything downstream:

1. **It reports nothing back.** The call resolves successfully whether the member left a review, dismissed
   the card, or never saw it because of quota. There is no "did it work" signal, so there is no retrying
   the ones who didn't convert — every gating decision has to be made up front and has to be conservative.
2. **The card cannot be tested on a sideloaded debug build.** Verification needs a Play-signed build on the
   internal testing track (or internal app sharing) with a Play Store present on the device.

---

## 3. Policy: behavioural triggers yes, sentiment gating no

**Review gating is a Play policy violation.** Asking "how do you like Compass?" and routing only the happy
answers to the review card is prohibited, as is incentivising reviews in any form.

Choosing _when_ to ask based on **what the member did** is explicitly fine, and is what Google recommends —
trigger the flow once someone has experienced enough of the app to have an opinion. The forbidden thing is
branching on **stated sentiment**.

This bears directly on the existing testimonials flow. Chaining "gave 4–5 stars in
`web/components/testimonials/testimonial-form.tsx` → show the Play card" is functionally a sentiment
filter and should be avoided. Trigger on **submitting a testimonial at all**, whatever the rating —
submission is itself the behavioural signal, and it keeps the logic clean.

---

## 4. Triggers, strongest first

1. **Got a reply.** A conversation reaching genuine two-way exchange — say 2+ inbound messages from a new
   match, or 4+ messages total in both directions. This is the "the thing worked" moment and it is the best
   single trigger available for Compass. Fire on returning to the inbox, never inside the open thread.
2. **Submitted a testimonial** — any rating, any source. That includes the `deletion_survey` source (the
   "I found someone here" parting path in `common/src/testimonials/testimonials.ts`), which is an excellent
   moment: the outcome is confirmed and the member is already in a reflective, generous frame.
3. **Opened a match / search-alert notification** that led to a profile view.
4. **Completed profile** — weakest of the four. A long form ends in relief, not delight; it is effort we
   asked of them, not value we delivered. Use only as a fallback, and only combined with a return visit on
   a later day.

---

## 5. Suppression rules

These carry as much weight as the triggers — a prompt at a bad moment converts negatively.

- Android app only (`isAndroidApp()` from `web/lib/util/webview.ts`), signed-in members only.
- Minimum ≥3 sessions and ≥2 distinct days since install. Never during the first session.
- Never within ~14 days of: a support message, a report they filed, a moderation action against them, an
  account hold (`web/components/moderation/account-on-hold.tsx`), or a client error in the session.
- Calm moment only: no open modal, no keyboard up, not mid-flow.
- Cooldown ~120 days between attempts; lifetime cap ~3 attempts per member.

---

## 6. Implementation sketch

Five pieces, following the house conventions.

**Migration** — `backend/supabase/migrations/<YYYYMMDD>_add_review_prompts.sql`, appended to
`backend/supabase/migration.sql` before the closing `COMMIT;`. One row per attempt:

```
review_prompts (user_id, prompted_at timestamptz, trigger text, attempt_no int)
```

Server-side rather than `localStorage`: WebView storage gets cleared, reinstalls need to be deduped, and
the attempts are the only measurement available given that the API itself is silent.

**Eligibility logic** — a pure function in `common/src/reviews/prompt.ts` taking the member's counters and
returning `{shouldPrompt, trigger} | null`. Pure so it is unit-testable in `common` without a database,
which matters because every rule in §5 is a branch worth a test.

**Read path** — do _not_ add a round trip on app open. Per the root `CLAUDE.md` rule against splitting
batchable data, fold `reviewPrompt: {trigger} | null` into whatever the app already fetches at startup.

**Write path** — one small `record-review-prompt` endpoint (schema entry in `common/src/api/schema.ts`,
handler in `backend/api/src/record-review-prompt.ts`, registered in the `handlers` map in
`backend/api/src/app.ts`), called when the card is invoked. Worth a `withRateLimit` wrapper.

**Hook** — `web/hooks/use-review-prompt.ts`: reads the flag from the bootstrap payload, checks the calm-
moment conditions client-side, calls the plugin, then fires the write. Any user-visible copy goes through
`useT()` with `common/messages/` entries — though note the Play card itself is rendered and localised by
Play, so there may be no copy of ours at all.

---

## 7. The web-only ceiling

Roughly 700 of the 800 members are web-only and **cannot** leave a Play review — the API requires the app
installed from Play under that account. So this whole track only ever addresses the Android slice, and the
review ceiling is the install count.

Which means the same trigger events in §4 should also feed a **"get the app" nudge on web**. Without that,
the reviews plan is capped at ~100 people no matter how well the prompt is tuned. The two features share
their trigger logic and should probably be built together.
