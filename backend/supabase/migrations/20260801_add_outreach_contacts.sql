-- Migration: add_outreach_contacts
-- Created: 2026-08-01
--
-- Admin-only bookkeeping for member outreach. Everything that can be derived from existing tables
-- (signup date, profile completeness, last activity, who spoke last in a thread) stays derived and is
-- not stored here. This table holds only the two things no query can infer: where a conversation
-- stands, which depends on what was actually said, and a one-line reminder of what is owed next.
--
-- A row exists only for members whose state has been set by hand; absence means "not started".

CREATE TABLE IF NOT EXISTS outreach_contacts
(
    user_id      TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    -- Values mirror OUTREACH_STAGES in common/src/outreach/outreach.ts. 'excluded' marks accounts that
    -- are deliberately outside outreach (people already known personally, test accounts) so they stop
    -- appearing in the queue instead of being skipped over by memory every time.
    stage        TEXT        CHECK (stage IN ('not_started', 'opened', 'replied', 'suggestions_sent',
                                              'nudged', 'closed', 'excluded')),
    next_action  TEXT        CHECK (next_action IS NULL OR char_length(next_action) <= 200),
    created_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outreach_contacts_stage ON outreach_contacts (stage);

-- RLS enabled with no policies: this denies the anon and authenticated roles outright. Reads and
-- writes go through the API on the service-role connection, which bypasses RLS.
ALTER TABLE outreach_contacts
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON outreach_contacts FROM anon, authenticated;
