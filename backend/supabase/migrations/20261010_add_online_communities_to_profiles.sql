-- Add online communities to profiles table
-- Created: 2026-10-10
--
-- "Where do you hang out online besides here?" Free text on purpose: the answer is a Telegram group, a
-- Slack, a subreddit, a Discord server, a newsletter — a list nobody can enumerate into choices, and one
-- that is not visible from the social handles in `links`. It tells a reader where the member's world is,
-- and tells us where Compass is worth sharing. Keyword-searchable (see `textFields` in
-- backend/api/src/get-profiles.ts), no filter of its own.

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS online_communities TEXT;
