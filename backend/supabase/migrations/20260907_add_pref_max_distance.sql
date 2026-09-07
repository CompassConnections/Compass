-- The absolute maximum distance (in miles) a member is willing to consider between their own city
-- and someone else's. Stated in the "Who I'm looking for" section of the profile, the same unit the
-- search radius uses. NULL — the default — means no limit, i.e. distance is not a dealbreaker.
--
-- Unlike the search radius this is not a search preference of the person browsing: it is a fact
-- about *this* member that the two-way search reads off the other side, to hide profiles whose
-- owner has already said someone this far away is out of range.
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS pref_max_distance INTEGER;

-- Two-way search compares every candidate's `pref_max_distance` against a single fixed point, so the
-- column is read on its own rather than alongside the city coordinates; a plain btree index lets the
-- planner skip the (large) majority of rows that stated no limit at all.
CREATE INDEX IF NOT EXISTS idx_profiles_pref_max_distance ON profiles USING btree (pref_max_distance);
