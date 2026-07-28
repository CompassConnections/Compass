-- Migration: add_ban_reason_to_users
-- Created: 2026-07-28
--
-- `is_banned_from_posting` alone can't say *why* an account is banned, so every banned member saw the
-- same message. The two cases need opposite handling: an automatic rate-limit hold is provisional and
-- deserves an explanation plus the promise of a human review, while a confirmed scam is final and
-- should be told so flatly — no duration, no review promise, no hint at what gave them away.
--
-- Values match `BAN_REASONS` in common/src/moderation/ban.ts:
--   auto_rate_limit  — tripped MAX_NEW_CHANNELS_PER_DAY, awaiting review
--   under_review     — moderator paused the account precautionarily, awaiting review
--   confirmed_abuse  — moderator confirmed scam / spam / harassment; permanent
--
-- Null for accounts in good standing. We keep the row rather than deleting confirmed scam accounts:
-- the profile and threads are the evidence that lets us recognise the operator's next signup, and
-- victims sometimes come back to us weeks later.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS ban_reason TEXT;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_ban_reason_check;

ALTER TABLE users
    ADD CONSTRAINT users_ban_reason_check
        CHECK (ban_reason IS NULL OR
               ban_reason IN ('auto_rate_limit', 'under_review', 'confirmed_abuse'));

-- Backfill: every ban that exists today was placed by hand by a moderator, so it is a decided case,
-- not a provisional hold. Accounts banned automatically from here on are written as auto_rate_limit
-- by backend/api/src/create-private-user-message-channel.ts.
UPDATE users
SET ban_reason = 'confirmed_abuse'
WHERE is_banned_from_posting
  AND ban_reason IS NULL;
