-- Migration: add_referred_by_user_id
-- Created: 2026-08-22
--
-- Puts the referral edge on `users.id` so it can be walked recursively.
--
-- `referred_by_username` is the raw contents of `?referrer=` and has to stay that way: it can name a
-- member, a member who has since renamed, or nobody at all, and knowing which of those happened is
-- worth keeping. But it is a poor edge to recurse over. Reading one generation off a username costs
-- one member their credit when they rename; reading a whole tree off it *severs the subtree* — every
-- descendant of the renamer disappears from the constellation of everyone above them, for a reason
-- none of those people can see or fix. An id does not move.
--
-- So the two columns split the job. `referred_by_username` records what the link said;
-- `referred_by_user_id` records who that turned out to be, resolved once at signup and never again.
-- Rows where the name resolved to nobody keep the name and get a NULL id, which is the honest
-- representation of "we were told someone sent them and we cannot tell you who".
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS referred_by_user_id TEXT;

-- Backfill: only names that resolve to a live member get an id. Everything else stays NULL, which is
-- also what makes the foreign key below validate on the first try.
UPDATE profiles p
SET referred_by_user_id = u.id
FROM users u
WHERE u.username = p.referred_by_username
  AND p.referred_by_user_id IS NULL;

-- ON DELETE SET NULL, not CASCADE: deleting a member must not delete the people they brought. The
-- introduction still happened; all that is lost is the pointer back to someone who is no longer here
-- to be credited. Their descendants keep their own edges and simply become roots of their own.
--
-- Guarded rather than written inline because `migration.sql` replays this file against schemas that
-- may already have the constraint, and ADD CONSTRAINT has no IF NOT EXISTS.
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1
                       FROM pg_constraint
                       WHERE conname = 'profiles_referred_by_user_id_fkey'
                         AND conrelid = 'public.profiles'::regclass) THEN
            ALTER TABLE profiles
                ADD CONSTRAINT profiles_referred_by_user_id_fkey
                    FOREIGN KEY (referred_by_user_id)
                        REFERENCES users (id)
                        ON DELETE SET NULL;
        END IF;
    END
$$;

COMMENT ON COLUMN profiles.referred_by_user_id IS
    'The member whose link this profile signed up through, resolved from referred_by_username once at '
        'signup. NULL when nobody referred them, or when the name in ?referrer= matched no member. '
        'Nulled rather than cascaded when that member is deleted. This is the column the referral '
        'tree is walked over; referred_by_username is kept as the unresolved audit trail.';

-- Partial, and on the referrer rather than the referee: the only question ever asked of this column
-- is "who did X bring?", asked once per generation by the recursive walk behind /referrals. Rows with
-- no referrer are the overwhelming majority and are never a starting point, so they stay out of the
-- index entirely.
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_user_id
    ON profiles (referred_by_user_id)
    WHERE referred_by_user_id IS NOT NULL;
