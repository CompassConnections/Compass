-- Migration: add_social_media_consent
-- Created: 2026-08-22
--
-- The second half of "Let Compass feature your profile": permission to feature a member off-site, on
-- Compass's own social accounts — the Instagram/TikTok profile-scroll clip that `media-creator`
-- renders (`media-creator/src/scenes/ProfileScroll.tsx`, `npm run render:scroll <username>`).
--
-- Kept as its own column rather than folded into `spotlight_consent` because the two ask for very
-- different things, and a member can reasonably say yes to one and no to the other:
--
--   * a home-page spotlight is a quoted passage, on a page we control, that we can pull down in a
--     minute — unticking the box does exactly that, at read time.
--   * a social clip is the profile itself, scrolled, published to a third party. Once it is on
--     Instagram it can be reposted, screenshotted and mirrored, and no toggle here reaches it.
--
-- Consequently this consent is *narrower*, not broader: it only means anything while
-- `spotlight_consent` is also true (the settings toggle is nested under it, and revoking the parent
-- revokes this too — see `web/components/settings/spotlight-consent-setting.tsx`). Withdrawing it
-- stops us making anything new; it cannot unpublish what is already out there, and the setting says
-- so in as many words rather than implying a takedown we cannot perform.
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS social_media_consent BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN profiles.social_media_consent IS
    'Member has agreed that Compass may feature their profile on its own social media accounts '
        '(e.g. an Instagram scroll of the profile page). Only meaningful together with '
        'spotlight_consent. Revocable, but only stops future posts — it cannot unpublish.';

-- Partial, and on the pair: the only question ever asked of this column is "who may we film?", which
-- is a tiny fraction of the table and always carries the parent consent with it.
CREATE INDEX IF NOT EXISTS idx_profiles_social_media_consent
    ON profiles (user_id)
    WHERE social_media_consent AND spotlight_consent;
