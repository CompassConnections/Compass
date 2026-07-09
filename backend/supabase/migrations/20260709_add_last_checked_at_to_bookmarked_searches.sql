-- Add the alert-run watermark to bookmarked searches
-- Created: 2026-07-09

-- Search alerts diff the current profiles against a snapshot of the profiles as they were at the end
-- of the last successful notification run, so a profile only alerts on the run where it *starts*
-- matching a search rather than on every later edit to it.
--
-- The snapshot schemas (profile_snapshot, profile_snapshot_staging) are created and swapped by the
-- notification job itself (backend/api/src/profile-snapshot.ts), which rebuilds them from `public` on
-- every run. They are deliberately not declared here: a later migration on `profiles` then needs no
-- matching change, and the job detects the drift and reseeds itself.

ALTER TABLE bookmarked_searches
    ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN bookmarked_searches.last_checked_at IS
    'Last time the alert job evaluated this search. Watermark that lets a crashed run resume without re-sending emails.';
