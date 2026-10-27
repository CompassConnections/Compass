-- The likely range of each precomputed compatibility score, and the number of shared answers it
-- rests on (see getSideEstimate in common/src/profiles/compatibility-score.ts). Nullable: rows
-- written before this exist until the next recompute — run the admin rebuild once after applying.
ALTER TABLE compatibility_scores
    ADD COLUMN IF NOT EXISTS score_low DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS score_high DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS shared_answers INTEGER;
