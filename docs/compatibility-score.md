# Compatibility score

> The reference for the overall compatibility score: dealbreakers, factors, weights and aggregation. The code
> is `common/src/profiles/compatibility-factors.ts` (factors) and `compatibility-score.ts` (the prompt
> factor); the member-facing page is `/compatibility-score` (`web/public/md/compatibility-score.md`, plus
> `fr/` and `de/`). Change a weight or rule here first, then in the code and the three markdown pages, and
> run the admin "Rebuild all pair scores" after deploying — every pair moves. The "Code changes" and
> "Verification" sections below are the implementation plan this was built from and double as a map of
> where everything lives.

## Context

Today `compatibility_scores.score` is computed from compatibility-prompt answers only
(`common/src/profiles/compatibility-score.ts` → `getCompatibilityScore`), gated by `areGenderCompatible`
and by both members having answered at least one prompt. The profile carries many fields that bear on
"would this pair be happy long-term" (kids, monogamy, distance, religion, politics, languages, substances…)
and none of them enter the score. `getProfilesCompatibilityFactor` (same file) was a first attempt and has
no callers.

Goal: an **overall compatibility score** = dealbreaker gate + weighted geometric mean of per-field factors,
with the prompt score as one (large) factor. The prompt-only score stays visible in the prompts section
under a new name. Decisions already taken:

- Pairs with **no shared prompt answers still get a score** (profile factors only) and appear in the
  "Compatible" sort.
- Profile edits trigger a per-user recompute **in the `continue` continuation**, like answers do today.
  The profile form sends interests, causes and work inside the same `update-profile` request (they are
  written in one transaction with the row), so a save is one request and one recompute; `update-options`
  remains for callers that edit a single list.
- The per-user recompute is **one read, scoring in memory, one write**. The read returns the member's own
  row and every member with no dealbreaker against them (eligibility and the four dealbreakers below are
  expressed in SQL, mirroring `getDealbreakers`, which still runs on every row returned), each with the
  scored columns (`SCORING_PROFILE_COLUMNS`, never `p.*`: the row is ~9 KB, more than half of it bio text
  and search vectors), the answers without `explanation`, and the option labels as array columns. The
  scoring functions are typed against that column list, so a factor reading an unlisted column fails to
  compile. The write is a single statement: a CTE deletes every row of the member's that was not just
  scored, and the kept rows are upserted through one `unnest`, so there is no parameter ceiling and no
  chunking. The delete is what makes an edit that moves a pair out of the compatible set (changing gender
  or `pref_gender`) take effect: the other side is no longer returned, so an upsert alone never touched
  their old row and it survived with a score for a profile that no longer existed.
- Hard dealbreakers: gender sought, **connection type**, **monogamy conflict**, **wants-kids opposite
  halves**. Age range and max distance are _not_ dealbreakers: both are graded factors, heavily discounted
  (near-zero) outside the stated bounds.

---

## 1. Factor model (what counts, how it scores)

All checks are symmetric (both directions). Every factor returns a **point score and a likely range**
`{score, low, high}` in `[0, 1]`, not just the prompts. The "Applicable when" column says when the rule can
be evaluated; when it cannot (either side left the field empty) the factor is **not dropped** but scored at
its neutral prior with a much wider range and half its weight — see _Ranges_ below. So a blank never
counts as a mismatch, but it does make the overall range wider, and the breakdown shows what filling it in
would settle.

### Dealbreakers — evaluated first; if any fires, nothing else is computed and the pair has no row

| Key               | Rule (blank passes unless noted)                                                                        | Existing helper                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `gender`          | each one's `pref_gender` accepts the other's `gender`                                                   | `areGenderCompatible` (compatibility-util.ts) — unchanged semantics         |
| `connection_type` | `pref_relation_styles` must overlap                                                                     | `areRelationshipStyleCompatible`                                            |
| `monogamy`        | both seek `relationship`, both have `pref_romantic_styles`, no overlap (e.g. `{mono}` vs `{poly,open}`) | new                                                                         |
| `wants_kids`      | both seek `relationship`, both answered (`>= 0`), `abs(diff) > WANTS_KIDS_TOLERANCE`                    | `areWantKidsCompatible` / `WANTS_KIDS_TOLERANCE` (common/src/wants-kids.ts) |

### Preferences — weight and scoring

| Key              | Weight                                                                                                    | Applicable when                                                    | Score                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompts`        | `8 · min(1, √n / 10)` (n = shared answers; 0 at n=0, full at 100 — same curve as the existing 50% shrink) | n ≥ 1                                                              | existing `getCompatibilityScore().score`; its `low/high` feed the overall range                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `age`            | 3                                                                                                         | both have `age`, at least one side has a `pref_age_min`/`max`      | per direction, years outside the other's range: 0 → 1, 1–2 → 0.5, 3–5 → 0.2, > 5 → 0.05 (`satisfiesAgeRange` logic in compatibility-util.ts, made graded). Pair score = min of the two directions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `wants_kids`     | 3                                                                                                         | both seek relationship, both answered, inside the band             | diff 0 → 1, 1 → 0.85, 2 → 0.6                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `distance`       | 3                                                                                                         | at least one side has a location (coords, else `city`)             | `d` miles via the 69 mi/degree flat-earth formula already in get-profiles.ts (port to common). **Base curve, gentle**: `base(d) = 1 − 0.4 · min(1, log2(max(d, 25) / 25) / 6)` → 1 at ≤25 mi, 0.87 @100, 0.8 @200, 0.73 @400, 0.67 @800, floor **0.6** from 1600 mi. This is the whole score when neither side set a `pref_max_distance`. **A side set a cap `M`**: that direction = `base(d) · clamp(1 − (d/M − 1) / 1.5, 0.05, 1)` — unchanged up to the cap, then progressive: ×0.67 at 1.5·M, ×0.33 at 2·M, floor 0.05 from 2.5·M (e.g. M=100: 0.56 @150 mi, 0.27 @200, 0.05 @≥250). Pair score = min over the two directions. City fallback (no coords): same city → 1, different → 0.8. **Only one side located**: fixed 0.7 when the located side set no cap. If they set a cap `M`, the unknown is discounted by how tight the cap is: `0.2 + 0.5 · log(M / 100) / log(20)` → 0.2 @100 mi, 0.35 @250, 0.47 @500, 0.58 @1000, 0.7 @2000 (the `PREF_MAX_DISTANCE_CHOICES`). Neither located: not applicable |
| `availability`   | 2                                                                                                         | both seek relationship, both have `relationship_status`            | one `single`, other `married`/`long_term`, and neither lists `poly`/`open` in `pref_romantic_styles` → 0.1; else 1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `languages`      | 2                                                                                                         | both answered                                                      | overlap → 1, none → 0.1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `religion`       | 1.5                                                                                                       | both answered                                                      | overlap → 1, none → 0.4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `politics`       | 1.5                                                                                                       | both answered                                                      | overlap → 1, none → 0.4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `monogamy`       | 1                                                                                                         | both seek relationship, both answered (overlap guaranteed by gate) | identical sets → 1, partial overlap → 0.8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `cannabis`       | 1                                                                                                         | at least one side has `cannabis_pref` and the other has `cannabis` | per direction: pref `not` × {never\_\*→1, rarely→0.6, occasionally→0.3, regularly→0.1}; `open` → 1; `use` × {never\_\*→0.3, rarely→0.7, else 1}. Pair score = min of applicable directions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `psychedelics`   | 1                                                                                                         | same shape as cannabis                                             | same table on `psychedelics_pref` / `psychedelics`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `big5`           | 1                                                                                                         | all five traits on both sides                                      | `1 − mean(abs(diff)) / 100`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `shared_options` | 2                                                                                                         | both have ≥ 1 option across interests ∪ causes ∪ work              | **Cross-table**: each side's bag = the union of its interests, causes and work, by normalised option name (lowercased, trimmed), so "Effective altruism" filed as an interest by one and a cause by the other still matches. Jaccard `J` on the two bags → `min(1, 0.5 + 2J)`. The breakdown lists the shared items. Exact names only in v1; the `similarity()`-based fuzzy match used for option dedup (`OPTION_SIMILARITY_THRESHOLD`) is a later refinement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `smoking`        | 0.5                                                                                                       | both answered `is_smoker`                                          | same → 1, else 0.5                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `drinking`       | 0.5                                                                                                       | both answered `drinks_per_month`                                   | `1 − 0.6 · min(abs(diff), 20) / 20`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `diet`           | **2 if either side is plant-based (`vegan`/`veg`), else 0.5**                                             | both answered                                                      | Each side reduced to its strictest entry: vegan > veg > pescetarian > omnivore/keto/paleo (`other` alone → treat as not answered). **Plant-based involved** (weight 2): vegan+vegan or veg+veg → 1, vegan+veg → 0.9, plant-based+pescetarian → 0.6, plant-based+omnivore/keto/paleo → 0.3. **Neither plant-based** (weight 0.5): same entry → 0.8, different → 0.7 — two omnivores earn little from it, but still more than omnivore+vegan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `exercise`       | 0.5                                                                                                       | both answered                                                      | ordinal diff 0 → 1, 1 → 0.8, 2 → 0.5                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `education`      | 0.5                                                                                                       | both answered                                                      | ordinal diff ≤ 1 → 1, 2 → 0.8, ≥ 3 → 0.6                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

Weights live in one `FACTORS` registry so they can be tuned without touching the maths.

### Ranges — every factor carries a `low` / `high`

The rules above are crude proxies, so even a fully answered factor is uncertain. Each factor has a
half-width `u` in the registry; its range is `[max(score − u, 0.05), min(score + u, 1)]`.

| Factor kind                         | `u` when both answered                          | Examples                                                                                                 |
| ----------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| prompts                             | from the Beta posterior (existing `low`/`high`) | —                                                                                                        |
| exact rules (overlap / same-or-not) | ±0.10                                           | `languages`, `religion`, `politics`, `monogamy`, `availability`, `smoking`                               |
| graded rules                        | ±0.15                                           | `age`, `distance`, `wants_kids`, `diet`, `cannabis`, `psychedelics`, `education`, `exercise`, `drinking` |
| similarity proxies                  | ±0.20                                           | `big5`, `shared_options`                                                                                 |

**One side (or both) empty** — the spread is far larger: `score = prior`, `low = floor`, `high = 1`,
`weight × 0.5`. `prior` is the factor's typical value for a random pair and `floor` its worst attainable
score, both in the registry: e.g. `age` prior 0.8 / floor 0.05, `distance` prior 0.7 / floor 0.05 (the
one-side-located rule in the table overrides the prior when it applies), `languages` 0.9 / 0.1,
`religion` and `politics` 0.7 / 0.4, `wants_kids` 0.8 / 0.6, `diet` 0.75 / 0.3, substances 0.8 / 0.1,
`big5` 0.8 / 0.5, `shared_options` 0.6 / 0.5, everything else 0.8 / 0.5. The half weight keeps a blank
profile from scoring like a good one on the point estimate while the wide range says how little is known.
`prompts` at n = 0 follows the same rule: prior 0.5 (the shrink target), floor 0.05, weight 1.

### Deliberately excluded (document in the doc, not in code)

`ethnicity`, `height_in_inches` (no stated preference; we will not score on them), `mbti` (weak validity;
Big Five covers it), `neurotype`, `orientation` (gender preference already carries the match),
`has_kids` (no preference field; revisit if one is added), `relationship_status` beyond the availability
rule, grew-up location, `religious_belief_strength` (unused by the form), all free-text fields
(`bio`, `keywords`, `occupation`, `university`, `online_communities`…).

### Aggregation

Weighted **geometric** mean with a floor, consistent with the prompt score's geometric mean of the two
sides and so that one near-zero important factor sinks the total rather than averaging out:

```
overall.score = exp( Σ wᵢ · ln(max(sᵢ.score, 0.05)) / Σ wᵢ )   over all factors (blank ones at half weight)
overall.low   = same formula over sᵢ.low
overall.high  = same formula over sᵢ.high
confidence    = existing thresholds on shared answers (unchanged)
```

`low ≤ score ≤ high` holds by construction since each factor's range contains its score. Blank factors
widen the overall range without moving the point much, which is the behaviour wanted: a half-empty
profile reads as "could be anywhere from 40% to 90%", not as a confident 75%.

Tie-breaking noise (±0.0005) stays on the stored `score` only.

### Ranking: sort by the low edge, show the point

The profile grid's "Compatible" sort — the default order for members looking for matches — orders by
`score_low`, with `score` breaking ties, not by `score`. Profiles with no stored pair against the viewer
(a dealbreaker, a member not yet recomputed) are kept and ranked last, newest first among themselves,
rather than dropped: a default list must show everyone. Members not looking for matches, and callers with
nobody to be compatible with, get newest-first instead.
The point estimate is an honest expected value even for a sparse profile — blank rows sit at base-rate
priors — but two 86%s are not equal when one is "80–90" and the other "56–98", and the sort should
prefer the pair we know more about. Ranking by the lower bound does that (the same reason review sites
rank by the low end of a rating rather than the mean), and it gives the right incentive: filling in a
profile or answering prompts moves a member up, leaving fields blank never does. Cards, bars and the
breakdown keep showing the point estimate and its range; only the order changes. The priors are left
alone — pushing them down would turn "unknown" into "bad", which the blank rule deliberately avoids.

---

## 2. Code changes

### `common`

- **New `common/src/profiles/compatibility-factors.ts`**
  - `type ProfileForScoring = ProfileRow & Pick<ProfileOptions, 'interests_names' | 'causes_names' | 'work_names'>`
    (the `*_names` arrays already on `Profile`, common/src/profiles/profile.ts L25); `getOptionBag(p)`
    normalises and unions the three for the cross-table factor.
  - `DEALBREAKER_KEYS`, `getDealbreakers(a, b): DealbreakerKey[]` — reuse `areGenderCompatible`,
    `areRelationshipStyleCompatible`, `areWantKidsCompatible` from `compatibility-util.ts`; add monogamy.
    `areAgeCompatible` is no longer a gate; the age factor reuses its range check in graded form. Pure, so the web can call it too.
  - `FACTORS: {key, weight | (ctx) => number, u, prior, floor, score(a, b, ctx) => number | undefined}[]`
    (`undefined` from `score` = cannot be evaluated → prior/floor/half-weight path) with the tables
    above. `ctx` carries the prompt result (`getCompatibilityScore` output) so `prompts` is just another
    factor. Move `flatEarthMiles(lat1, lon1, lat2, lon2)` here (constant 69 mi/degree, cos(lat) on
    longitude, matching get-profiles.ts) and replace the Euclidean-degrees body of `areLocationCompatible`
    only if still referenced (it is unused outside `getProfilesCompatibilityFactor`).
  - `getOverallCompatibility(a, b, prompt: PromptInput): OverallCompatibility` where `PromptInput` is either
    `{answersA, answersB}` (backend recompute, runs `getCompatibilityScore`) or an already computed
    `{score, low, high, sharedAnswers}` (browser, from the API) — same function, so the modal and the stored
    overall agree whenever the profiles have not changed since the last recompute. Returns
    `{dealbreakers: DealbreakerKey[]} | {score, low, high, sharedAnswers, confidence, prompt?: {score, low, high}, factors: Record<FactorKey, {score, low, high, weight, blank: boolean}>}`.
  - Delete `getProfilesCompatibilityFactor` from `compatibility-score.ts` (dead code superseded by this).
- **`compatibility-score.ts`**: extend `CompatibilityScore` with optional `prompt?: {score, low?, high?}`
  (keeps the existing consumers compiling). The factor breakdown is a return value of
  `getOverallCompatibility`, never part of the wire type.
- **Tests** `common/tests/unit/compatibility-factors.test.ts`: one case per dealbreaker (fires / blank
  passes / not seeking relationship passes), one per factor including the blank path (prior, floor, half weight), per-factor ranges clamp to
  [0.05, 1], aggregation (low ≤ score ≤ high, blank factors widen the range, prompts at n=0 use the prior).

### Database

- **Migration `backend/supabase/migrations/20261031_compatibility_scores_factors.sql`**:

  ```sql
  alter table compatibility_scores
  -- real, not double: the UI shows whole percentages, these carry no tie-breaking noise, and it
  -- halves the three columns' footprint (12 bytes/row instead of 24).
  add column if not exists prompt_score real,
  add column if not exists prompt_score_low real,
  add column if not exists prompt_score_high real;
  
  comment on column compatibility_scores.score is 'Overall score (prompts + profile factors), see common/src/profiles/compatibility-factors.ts';
  ```

  No per-factor breakdown is stored: the breakdown is recomputed in the browser when the modal opens (see
  _Breakdown modal_), from the two profiles plus the stored prompt score. `compatible-profiles` returns
  every pair for the viewer in one response, so a JSON breakdown on each row would multiply that payload
  for data only one modal reads.

  `score`/`score_low`/`score_high` become the overall values; `shared_answers` stays. Row semantics change
  to: _row exists ⇔ both gender-compatible, at least one side eligible, no dealbreaker_ (update the doc
  comments in `compute-scores.ts` that state the old "has answers" invariant). The human runs the migration
  and then the admin "Rebuild all pair scores" button.

### `backend/shared`

- **`backend/shared/src/compatibility/compute-scores.ts`**
  - `recomputeCompatibilityScoresForUser`: drop the `hasAnsweredQuestions` early-return/delete; load
    option _names_ for the user + candidates (one query per table joining `profile_<table>` to its option
    table, `array_agg(name)` grouped by `profile_id` — see `backend/supabase/profile_interests.sql`), filled
    into `interests_names` / `causes_names` / `work_names`; call
    `getOverallCompatibility`; **delete** rows for pairs that now have a dealbreaker, upsert the rest with
    the new columns.
  - `recomputeAllCompatibilityScores`: load full profiles (`select p.*, eligible…`) instead of the three
    gender columns, plus the three option-name maps; same per-pair call. The O(n²) loop now runs over all
    gender-compatible pairs rather than only "scorable" ones — note in the log line.
  - `backend/shared/src/profiles/supabase.ts`: no change needed (the candidate query already
    returns full rows).
  - Update `backend/shared/tests/unit/compute-score.unit.test.ts` (mock `getOverallCompatibility`;
    assert delete-on-dealbreaker and the 10-column upsert).

### `backend/api`

- **Trigger recompute on profile edits**: add `continue: () => recomputeCompatibilityScoresForUser(auth.uid)`
  to `update-profile.ts` and `update-options.ts` (same shape as `set-compatibility-answer.ts`). Update their
  unit tests to assert the continuation is returned.
- **`compatible-profiles.ts`**: select and map the new columns → `{score, low, high, sharedAnswers,
confidence, prompt: {score, low, high} | undefined}`. Also fixes today's missing `confidence`.
  Update `compatible-profiles.unit.test.ts`.
- `common/src/api/schema.ts` `compatible-profiles.returns`: widen to the extended `CompatibilityScore`.
- `get-profiles.ts`: no change (sorts on `cs.score`, which is now the overall).

### `web`

- **Prompts section** (`web/components/answers/compatibility-questions-display.tsx` ~L316): render the bar
  from `compatibility.prompt` instead of the overall, _with_ a label: `t('compatibility.prompts_label',
'Prompt compatibility')`; drop `hideLabel` and the comment that justified it. Section heading
  (`profile-info.tsx` L713) stays "Compatibility Prompts". When `prompt` is undefined show the existing
  "answer prompts to see…" state if one exists, else nothing.
- **New overall block** `web/components/profile/compatibility-overview.tsx`, placed first in `RailBlocks`
  (`profile-info.tsx` ~L403) for other members' profiles when the viewer is signed in:
  - Overall `CompatibilityScoreBar` (label "Compatibility", existing tooltip + range), clickable, plus a
    "See breakdown" button that opens the modal below.
  - If `useCompatibleProfiles` has no row for this pair, run `getDealbreakers(viewerProfile, profile)`
    client-side (both profiles are already loaded; viewer's via the existing own-profile hook used for
    `youProfile` in `filters/search.tsx`) and show "Not a match: …" with one line per reason
    (`compatibility.dealbreaker.<key>`). If no dealbreaker either, show "No score yet".
- **Breakdown modal** `web/components/profile/compatibility-breakdown-modal.tsx`, using `Modal` from
  `web/components/layout/modal` with `size="lg"` (same as the edit/answer modals in
  `compatibility-questions-display.tsx` L836/L940):
  - Header: overall score bar with range.
  - On open, call `getOverallCompatibility(viewerProfile, profile, compatibility.prompt)` from `common`
    (both profiles with their `*_names` are already loaded on the page; nothing is fetched). The modal
    shows this live result; if a recompute is still pending after a profile edit it may differ slightly
    from the stored ring value, which catches up on the next recompute.
  - **Intermediate scores**: the prompt score (`compatibility.prompt`, its own bar with range and shared
    answer count) and then one row per factor from the live result: label, weight shown
    as "×w", value bar with its likely range band (same band the score bar draws) reusing the Big Five row styling in `profile-about.tsx` (`Big5Traits`). Factor
    labels via new keys `compatibility.factor.<key>`. Blank factors (one side empty) shown greyed with their wide band under
    "Unknown — missing on one side" so the member sees what filling in their profile would settle. The
    `shared_options` row expands to the shared interests / causes / work items (computed client-side from
    both profiles' `*_names`, same `getOptionBag`), tagged with the table each side filed it under.
  - Footer: one-line formula in words ("weighted geometric mean of the rows above") and a link to
    `/compatibility-score` ("How the score is computed →").
  - Also reachable from the prompts section's "Prompt compatibility" bar (same modal, same data) and
    from the ring on profile cards is _not_ in scope (cards stay a link to the profile).
- **Explainer page `/compatibility-score`** (`web/pages/compatibility-score.tsx` +
  `web/public/md/compatibility-score.md`, with `fr/` and `de/` copies): same build-time markdown pattern
  as `web/pages/values.tsx` (`parseDoc` → `DocPage`). Content = the member-facing version of the doc in
  §2 Docs: what a dealbreaker is and the five of them, the factor table with weights and how each is
  scored, the prompt score and its range, the aggregation, what is deliberately not scored and why, and
  links to the two source files on GitHub. Add to the footer (`web/components/site-footer.tsx` ~L82,
  next to "Our values") and to the `/help` index if it lists pages.
- **Links to the explainer page** (replace or add next to today's raw GitHub links):
  - `web/public/md/faq.md` L68–80 "How is the compatibility score calculated?" (+ `fr/`, `de/`): rewrite
    to prompts + profile, link to `/compatibility-score`, keep the GitHub link.
  - `web/public/md/privacy.md` L153–154 and `web/public/md/terms.md` L67–69 (+ locales): "arithmetic on
    your own answers" → "arithmetic on your answers and profile fields", link to the page.
  - `web/pages/onboarding/index.tsx` `Step3CompatibilityInspect` (L214–258): body1 → "comes from the
    compatibility questions and the dealbreakers and preferences on your profile"; add a link line to
    `/compatibility-score` (new keys `onboarding.step3.body1.v2`, `onboarding.step3.link`).
  - `web/components/home/home.tsx` L994–1010: retitle `home.score.title` → "Compatibility scores come
    from your prompts and your profile."; the `ClaimBlock` link goes to `/compatibility-score` instead of
    GitHub (new key `home.score.link.v2`, "How it's computed →"); adjust `home.score.text` (new key).
  - `web/components/widgets/compatible-badge.tsx` tooltip (`useCompatibilityTooltip`): append "Tap for
    the breakdown" where the bar opens the modal.
  - `web/pages/compatibility.tsx` (the prompts page): a short note under the title linking to the page.
- **Cards / ring** (`profile-grid.tsx`): unchanged, `score` is now the overall.
- **Translations**: add the new keys to `common/messages/de.json` and `fr.json` (factor labels,
  dealbreaker reasons, `compatibility.prompts_label`, modal strings, onboarding, home copy, footer).

### Docs

- `docs/compatibility-questions.md` L26–28 and L387–399: prompt score is now one factor; link to the new doc.
- New `docs/compatibility-score.md`: the two tables above (dealbreakers, factors + weights), the aggregation
  formula, the exclusion list with reasons, the row-existence invariant, and "run the admin rebuild after
  deploying".
- `docs/database-schema.md` L311–325: fix the stale column list and add the new columns.
- Add the doc to the root `CLAUDE.md` docs list.

---

## 3. Verification

1. `yarn --cwd=common test compatibility-factors compatibility-score`, `yarn --cwd=backend/shared test
compute-score`, `yarn --cwd=backend/api test compatible-profiles update-profile update-options`.
2. `yarn typecheck && yarn lint`.
3. Human approves the migration (see [database-migrations.md](database-migrations.md)) and runs `regen-types-dev`; I rebuild via the
   admin button on the dev stack (`yarn dev`, `/admin/compatibility-questions`) and check the
   `RecomputeAllResult` pair count rises (pairs without answers now included).
4. In the browser: open another member's profile → rail shows the overall block; "See breakdown" opens
   the modal with the prompt score and each factor row; its footer link opens `/compatibility-score`
   (also reachable from the footer, FAQ, onboarding step 3 and the home claim); prompts section shows
   "Prompt compatibility" with the prompt-only number; set own `pref_age_max` below their age → after the
   continuation, the age row in the breakdown drops to 0.05 and the overall falls; set own connection type
   to friendship-only against a relationship-only profile → the block shows "Not a match: connection type"; browse sorted by Compatible → ring values match
   the rail.
