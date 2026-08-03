-- Migration: add_testimonials
-- Created: 2026-08-03
--
-- The public testimonials wall (/testimonials). Members write their own; a moderator decides what goes
-- live. Nothing is visible until it is approved, so a spam submission is never publicly reachable even
-- for the minutes before someone notices it.
--
-- The author is denormalised on purpose. The testimonials most worth having come from people leaving
-- because they found someone here, and those accounts are destroyed seconds after the text is written
-- — a `on delete cascade` would delete precisely the ones that matter. `author_id` is nulled instead,
-- and the name/avatar/username captured at submission time keep the card renderable afterwards.

CREATE TABLE IF NOT EXISTS testimonials
(
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Null once the account is gone. Only used to prove one-per-member and to decide whether the card
    -- may still link to a live profile.
    author_id         TEXT        REFERENCES users (id) ON DELETE SET NULL,

    -- Snapshot taken at submission time. Never refreshed: a testimonial is a statement made on a date,
    -- and a later rename should not rewrite who is on record as having said it.
    author_name       TEXT        NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 100),
    author_username   TEXT,
    author_avatar_url TEXT,

    -- Values mirror the limits in common/src/testimonials/testimonials.ts. The lower bound exists
    -- because "great app!" is not a testimonial and moderating it costs more than it is worth.
    body              TEXT        NOT NULL CHECK (char_length(body) BETWEEN 40 AND 1500),
    headline          TEXT        CHECK (headline IS NULL OR char_length(headline) <= 100),
    rating            SMALLINT    CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),

    -- False publishes the words without the name. Kept separate from the snapshot columns so a
    -- moderator can still see who wrote an anonymous one.
    show_author       BOOLEAN     NOT NULL DEFAULT TRUE,

    -- 'deletion_survey' marks the ones written on the way out after saying they found someone here.
    -- Worth distinguishing: it is the only testimonial that is also an outcome.
    source            TEXT        NOT NULL DEFAULT 'member'
                                  CHECK (source IN ('member', 'deletion_survey')),

    -- 'pending' → 'approved' | 'rejected'; 'approved' → 'hidden' for a later takedown. Only
    -- 'approved' is ever served publicly.
    status            TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),

    moderator_id      TEXT        REFERENCES users (id) ON DELETE SET NULL,
    moderator_note    TEXT        CHECK (moderator_note IS NULL OR char_length(moderator_note) <= 500),
    moderated_time    TIMESTAMPTZ,

    -- Hand-set ordering for the wall. Higher floats to the top; null sorts last and falls back to
    -- newest-first, which is the ordering when nobody has curated anything.
    featured_rank     INT,

    created_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_time      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The public read is always `status = 'approved'` ordered by rank then recency.
CREATE INDEX IF NOT EXISTS idx_testimonials_status_created
    ON testimonials (status, featured_rank DESC NULLS LAST, created_time DESC);

-- One live testimonial per member. Rejected ones are excluded from the constraint so a member whose
-- first attempt was turned down can write another instead of being locked out permanently. Orphaned
-- rows (author_id null) are excluded because there is no member left to rate-limit.
CREATE UNIQUE INDEX IF NOT EXISTS idx_testimonials_one_per_author
    ON testimonials (author_id)
    WHERE author_id IS NOT NULL AND status <> 'rejected';

-- RLS enabled with no policies: this denies the anon and authenticated roles outright. Even the
-- public wall is served through the API on the service-role connection, so a pending or rejected
-- testimonial is never one PostgREST query away from being read by the person it was written about.
ALTER TABLE testimonials
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON testimonials FROM anon, authenticated;
