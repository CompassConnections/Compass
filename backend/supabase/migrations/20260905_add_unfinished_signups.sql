-- Migration: add_unfinished_signups
-- Created: 2026-09-05
--
-- The ledger for logins that never became accounts.
--
-- A Firebase login exists from the first step of sign-up; the `users` row only from the last. Anyone
-- who stops in between has left an email address in Firebase with nothing behind it, and nothing in
-- the database knew those logins existed — they could be neither told about nor cleaned up. This
-- table is what the daily sweep (`sweepUnfinishedSignups`) writes to, and it exists for the same
-- reason `outreach_sends` does: the notice is one message, ever, and the deletion it announces must
-- happen on the date it announced and not a day sooner.
--
-- Deliberately not a foreign key to `users`: the whole point is that these rows are about logins with
-- no `users` row. The one case where a `users` row appears later — the person came back and finished —
-- is handled by the code, which checks for it before ever deleting anything.
--
-- No email address is stored. Firebase already holds it, and a second copy in a table about people who
-- never joined would be the least justified column in the schema.

CREATE TABLE IF NOT EXISTS unfinished_signups
(
    firebase_uid    TEXT        NOT NULL PRIMARY KEY,

    -- When the login was created, from Firebase's own metadata. Kept so the ledger explains itself
    -- once the login is gone and Firebase can no longer be asked.
    auth_created_at TIMESTAMPTZ NOT NULL,

    -- The secret in the "delete it now" link. Random, never reused, and the only way the unauthed
    -- endpoint can act on a login: the person holding the email holds the token.
    token           TEXT        NOT NULL UNIQUE,

    -- When the one notice went out. NULL for logins deleted without one (`stale`, `no_email`).
    notified_at     TIMESTAMPTZ,

    -- Set when the Firebase login was deleted. The row stays: it is the record that the policy was
    -- followed, and it contains nothing personal once the uid points at nothing.
    deleted_at      TIMESTAMPTZ,
    delete_reason   TEXT CHECK (delete_reason IN ('grace_expired', 'stale', 'no_email', 'self')),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The sweep asks "which of this page of uids do we already know about" once per Firebase page.
CREATE INDEX IF NOT EXISTS unfinished_signups_pending
    ON unfinished_signups (notified_at)
    WHERE deleted_at IS NULL;

ALTER TABLE unfinished_signups
    ENABLE ROW LEVEL SECURITY;

-- No policies: server-side only, through the service role. Members have nothing to read here, and an
-- anon-readable copy would hand out the delete tokens.
