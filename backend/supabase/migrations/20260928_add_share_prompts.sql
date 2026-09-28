-- Migration: add_share_prompts
-- Created: 2026-09-28
--
-- One row per time a member was shown Martin's "help Compass grow" video (share or donate).
--
-- Cooldown (60 days) and lifetime cap (3) are read from here. Server-side rather than localStorage
-- for the same reasons as review_prompts: storage gets cleared, and a member on a second device is
-- the same member. Rules live in common/src/share/prompt.ts.

CREATE TABLE IF NOT EXISTS share_prompts
(
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id        TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    prompted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Values mirror SHARE_TRIGGERS in common/src/share/prompt.ts.
    prompt_trigger TEXT        NOT NULL
        CHECK (prompt_trigger IN ('got-reply', 'testimonial', 'established')),

    -- Unlike the store card, this one runs on the web too.
    platform       TEXT        NOT NULL CHECK (platform IN ('web', 'ios', 'android')),

    -- 1-based, so a row states on its own how far into the lifetime cap it was.
    attempt_no     INT         NOT NULL CHECK (attempt_no >= 1)
);

CREATE INDEX IF NOT EXISTS share_prompts_user_time
    ON share_prompts (user_id, prompted_at DESC);

-- Only the API's service-role connection reads or writes this.
ALTER TABLE share_prompts
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON share_prompts FROM anon, authenticated;
