-- Migration: add_review_prompts
-- Created: 2026-08-24
--
-- One row per time a member was shown the native App Store / Play Store review card.
--
-- The store APIs report nothing back: `requestReview()` resolves identically whether a review was
-- written, the card was dismissed, or the card never rendered because the member's per-year quota was
-- already spent. So this table is not a record of reviews — it cannot be. It is the record of *asks*,
-- and it exists for two reasons that both follow from that silence:
--
--   1. Every gating decision has to be made before the ask, because there is no signal afterwards to
--      react to. Cooldown and lifetime cap are read from here.
--   2. Attempts against the store's review count over the same window are the only measurement of the
--      feature that exists.
--
-- Server-side rather than localStorage, unlike the session counters that gate the same prompt: WebView
-- storage gets cleared, reinstalls have to be deduped, and a member on a second device is the same
-- member. See docs/app-store-reviews.md §5 for why the other half of the rules is deliberately local.

CREATE TABLE IF NOT EXISTS review_prompts
(
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id        TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    prompted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Which behavioural moment earned the ask. Values mirror REVIEW_TRIGGERS in
    -- common/src/reviews/prompt.ts. Named `prompt_trigger` because `trigger` is a keyword in enough
    -- SQL dialects to be worth not testing.
    prompt_trigger TEXT        NOT NULL
        CHECK (prompt_trigger IN ('got-reply', 'testimonial',
                                  'notification-profile', 'backfill')),

    -- Kept even though no rule branches on it: the two stores have different quotas and different
    -- conversion, and without this column the attempt count cannot be compared against either
    -- listing's review count separately.
    platform       TEXT        NOT NULL CHECK (platform IN ('ios', 'android')),

    -- 1-based. Denormalised from count(*) so a row states, on its own, how far into the member's
    -- lifetime cap it was.
    attempt_no     INT         NOT NULL CHECK (attempt_no >= 1)
);

-- The only read: this member's attempts, newest first, for the cooldown and cap checks.
CREATE INDEX IF NOT EXISTS review_prompts_user_time
    ON review_prompts (user_id, prompted_at DESC);

-- RLS on with no policies, and the grants revoked: nothing outside the API's service-role connection
-- has any business reading when a member was asked to rate the app.
ALTER TABLE review_prompts
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON review_prompts FROM anon, authenticated;
