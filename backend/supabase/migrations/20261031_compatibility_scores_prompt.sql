-- The compatibility score becomes an overall score: a dealbreaker gate, then a weighted geometric mean
-- of profile factors (age, distance, kids, languages, religion, ...) with the prompt score as one
-- factor — see common/src/profiles/compatibility-factors.ts and docs/compatibility-score.md.
-- `score`, `score_low` and `score_high` now hold the overall; the prompt-only numbers move here so the
-- prompts section can keep showing them. No per-factor breakdown is stored: the browser recomputes it
-- from the two profiles plus these three numbers when the breakdown modal opens.
--
-- `real`, not double, for all six: the UI shows whole percentages, these carry no tie-breaking noise,
-- and it halves the footprint (12 bytes/row per trio instead of 24). The type change rewrites the table
-- and rebuilds compatibility_scores_score_desc_idx; it holds an access-exclusive lock for the duration.
--
-- Nullable: rows written before this exist until the next recompute. Pairs without shared answers now
-- get a row too, and pairs with a dealbreaker lose theirs — run the admin "Rebuild all pair scores"
-- once after applying.
alter table compatibility_scores
    alter column score      type real,
    alter column score_low  type real,
    alter column score_high type real,
    add column if not exists prompt_score      real,
    add column if not exists prompt_score_low  real,
    add column if not exists prompt_score_high real;

comment on column compatibility_scores.score is
    'Overall score (prompts + profile factors), see common/src/profiles/compatibility-factors.ts';
comment on column compatibility_scores.prompt_score is
    'Prompt-only factor of `score`; null when the pair shares no answered prompt';

-- The compatibility sort in get-profiles ranks by the low edge of the range (score_low), with score
-- as the tie-breaker, so a sparse profile that happens to match on its few filled fields does not
-- outrank a well-documented pair with the same point estimate.
create index if not exists compatibility_scores_score_low_desc_idx
    on compatibility_scores (score_low desc, score desc);
