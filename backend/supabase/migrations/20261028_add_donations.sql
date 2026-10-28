-- Migration: add_donations
-- Created: 2026-10-28
--
-- One row per donation a member made to Compass. Recorded by hand from the admin page
-- (/admin/donations) — there is no payment webhook — which is why `admin_id` is kept: every row
-- states who typed it in.
--
-- Read by the supporter badge on the profile page, which shows the sum of a member's donations over
-- the trailing 365 days (see common/src/donations.ts). The window is computed at read time, so a
-- badge quietly expires a year after the last gift without any row having to change.
--
-- Amounts are stored as integer cents: a NUMERIC would also do, but every sum and comparison in the
-- codebase is then an exact integer, and the admin page only ever shows whole dollars anyway.

CREATE TABLE IF NOT EXISTS donations
(
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id      TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    amount_cents INT         NOT NULL CHECK (amount_cents > 0),

    -- When the money arrived, not when the row was typed in; an admin catching up on a month of
    -- receipts should be able to date each one properly, because the badge window depends on it.
    donated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Free text for the admin's own benefit (e.g. "Stripe", "bank transfer, Oct invoice"). Never
    -- shown to members.
    note         TEXT,

    admin_id     TEXT        REFERENCES users (id) ON DELETE SET NULL,

    created_time TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS donations_user_time
    ON donations (user_id, donated_at DESC);

-- Only the API's service-role connection reads or writes this. The badge total reaches the browser
-- through `get-donor-badge`, which also honours the member's opt-out below; a direct PostgREST read
-- would not.
ALTER TABLE donations
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON donations FROM anon, authenticated;

-- The member's half: the badge is shown by default once a donation is recorded, and this is the
-- switch (Settings → Data & Privacy) that takes it off the profile. Stored as "hidden" rather than
-- "shown" so the default row value is the default behaviour and no backfill is needed.
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS donor_badge_hidden BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN profiles.donor_badge_hidden IS
    'Member opted out of the supporter badge that shows their past-year donation total on their profile.';
