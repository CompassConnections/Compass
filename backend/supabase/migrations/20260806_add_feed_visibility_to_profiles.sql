-- Add per-profile control over how much goes into the public feed
-- Created: 2026-08-06
--
-- `visibility` already answers "who can see my profile". This answers the separate question "how much of
-- it may be republished off-site" — today the RSS feed at /feed.xml, later an ActivityPub actor built on
-- the same projection. The two are deliberately distinct settings: syndication is un-retractable in a way
-- that a web page is not (a fediverse post that has been federated cannot be recalled), so opting into a
-- public profile must not silently opt you into being broadcast.
--
--   'none'  — never appears in the feed
--   'basic' — name, city, headline, keywords, link (the default)
--   'full'  — the above plus gender and a short bio excerpt
--
-- Default 'basic' rather than 'none': the fields it carries are exactly what a public profile already
-- shows to any crawler, so the default changes distribution, not exposure. `feed_visibility` only ever
-- narrows — a members-only profile is excluded from the feed whatever this column says.

DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_feed_visibility') THEN
            CREATE TYPE profile_feed_visibility AS ENUM ('none', 'basic', 'full');
        END IF;
    END
$$;

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS feed_visibility profile_feed_visibility
        DEFAULT 'basic'::profile_feed_visibility NOT NULL;

-- Backfill by the same rule the app applies when someone switches to members-only
-- (feedVisibilityForMembersOnly in common/src/feed/feed.ts): a members-only profile is already a
-- request not to be on the open web, so the column default must not opt those members into
-- syndication behind their backs. Guarded on 'basic' so re-running never overwrites a level someone
-- has since chosen deliberately.
UPDATE profiles
SET feed_visibility = 'none'::profile_feed_visibility
WHERE visibility = 'member'
  AND feed_visibility = 'basic'::profile_feed_visibility;

-- The feed query is "newest public, syndicatable, listable profiles first", so index exactly that.
CREATE INDEX IF NOT EXISTS profiles_feed_idx
    ON profiles (created_time DESC)
    WHERE visibility = 'public'
        AND feed_visibility <> 'none'
        AND disabled = false
        AND looking_for_matches = true;
