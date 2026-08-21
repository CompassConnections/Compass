-- Migration: add_profile_spotlights
-- Created: 2026-08-12
--
-- Member spotlights for the logged-out home page: a few real members shown as people rather than as
-- percentages, beside the "Who's here" block that currently only has distributions.
--
-- Deliberately NOT a live read of `profiles`. A spotlight is an editorial object: an admin reads a
-- consenting member's profile, picks the sentence worth quoting, and that selection is what ships. If
-- the card re-read the profile every request, then any member who is spotlighted could rewrite what the
-- front page of Compass says about them — including replacing a thoughtful paragraph with an advert, a
-- slur, or a link — with no review in between. The snapshot below is the whole point of the feature,
-- not an optimisation.
--
-- Two independent gates, and both must be open:
--   1. `profiles.spotlight_consent` — the member opting in, revocable at any time from settings.
--   2. `profile_spotlights.status = 'live'` — an admin deciding this particular snapshot ships.
-- Withdrawing consent is enforced at read time (see `get-spotlights`), so a member who unticks the box
-- disappears from the home page immediately without an admin having to act.

-- ─── Consent ──────────────────────────────────────────────────────────────────
--
-- On `profiles` rather than in the spotlight table because it is a standing preference of the member,
-- not a property of any one snapshot: it has to exist before a snapshot does (that is how an admin
-- finds candidates) and it has to outlive one (retiring a card must not silently revoke consent).
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS spotlight_consent BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN profiles.spotlight_consent IS
    'Member has agreed that an admin may snapshot their profile into a home-page spotlight. '
        'Revocable; unticking it hides any live spotlight immediately.';

-- Partial: the admin candidate list is "everyone who said yes", which is a tiny fraction of the table.
CREATE INDEX IF NOT EXISTS idx_profiles_spotlight_consent
    ON profiles (user_id)
    WHERE spotlight_consent;

-- ─── Snapshots ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_spotlights
(
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Null once the account is gone. Used to re-check consent on every public read, to link the card
    -- to a live profile, and to stop two snapshots existing for one member. It is NOT where the card's
    -- content comes from.
    user_id       TEXT        REFERENCES users (id) ON DELETE SET NULL,

    -- ── The snapshot. Everything the card renders, frozen at capture time. ──
    -- Copied from users.name / users.username and profiles.{age, city, country, pinned_url, headline}
    -- by `create-spotlight`, and only ever refreshed when an admin explicitly asks for it.
    name          TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    username      TEXT,
    age           SMALLINT CHECK (age IS NULL OR age BETWEEN 18 AND 120),
    city          TEXT CHECK (city IS NULL OR char_length(city) <= 120),
    country       TEXT CHECK (country IS NULL OR char_length(country) <= 120),
    photo_url     TEXT,
    headline      TEXT CHECK (headline IS NULL OR char_length(headline) <= 500),
/
    -- The editorial part, and the reason a human is in this loop at all: the passage from the member's
    -- own writing that an admin judged worth putting on the front page. Prefilled from the bio, then
    -- trimmed by hand — a good pull quote is almost never the first N characters of anything.
    quote         TEXT        NOT NULL CHECK (char_length(quote) BETWEEN 40 AND 400),

    -- Optional framing, e.g. "on leaving academia". Sits above the quote as a small label.
    quote_context TEXT CHECK (quote_context IS NULL OR char_length(quote_context) <= 80),

    -- A few short chips under the card — causes, languages, whatever makes this person specific.
    -- Capped in the API rather than here; the array is free-form so the editorial choice stays cheap.
    tags          TEXT[]      NOT NULL DEFAULT '{}',

    -- ── Editorial state ──
    -- 'draft' is prepared but not shown. 'live' is on the home page. 'retired' was live and was pulled;
    -- distinct from deleting the row so that taking a card down is reversible and leaves a record.
    status        TEXT        NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'live', 'retired')),

    -- Higher floats to the front of the rail. Null sorts last, falling back to newest-first.
    featured_rank INT,

    admin_id      TEXT        REFERENCES users (id) ON DELETE SET NULL,
    admin_note    TEXT CHECK (admin_note IS NULL OR char_length(admin_note) <= 500),

    -- When the snapshot was taken, as opposed to when the row was first created. They differ after a
    -- refresh, and the difference is what tells an admin the card is quoting a two-month-old bio.
    captured_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_time  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_time  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The public read is always `status = 'live'`, ordered by rank then recency, then joined back to
-- profiles to re-check consent.
CREATE INDEX IF NOT EXISTS idx_profile_spotlights_status_rank
    ON profile_spotlights (status, featured_rank DESC NULLS LAST, created_time DESC);

-- One snapshot per member. A second one is an edit of the first, not a new row — otherwise the same
-- face appears twice in a five-card rail. Retired rows stay inside the constraint on purpose: bringing
-- one back should be a status flip, not a duplicate insert.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_spotlights_one_per_user
    ON profile_spotlights (user_id)
    WHERE user_id IS NOT NULL;

-- RLS on with no policies, i.e. a flat deny for anon and authenticated. Same reasoning as
-- `testimonials`: even the public rail is served through the API on the service-role connection, so a
-- draft spotlight of a member who has not been told yet is never one PostgREST query away.
ALTER TABLE profile_spotlights
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON profile_spotlights FROM anon, authenticated;
