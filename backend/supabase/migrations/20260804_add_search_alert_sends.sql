-- Migration: add_search_alert_sends
-- Created: 2026-08-04
--
-- The people one delivered saved-search alert was about, kept so the notification has somewhere to
-- land.
--
-- The matched set cannot be recomputed at click time, which is the whole reason this table exists.
-- It is a diff of the profile snapshot against the previous one, so it contains members whose
-- profile was *edited* into matching as well as members who just joined. Re-running the saved search
-- when the notification is opened returns neither group distinguishably: the new member sits
-- wherever the sort puts them among every older result, and the edited one is indistinguishable from
-- someone who has matched for months.
--
-- One row is one delivery — one email, one push, one bell entry — so a member whose three saved
-- searches all matched in the same run gets a single row listing all three.

CREATE TABLE IF NOT EXISTS search_alert_sends
(
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    creator_id       TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    -- Which of their saved searches matched. Not a foreign key: a member may delete a saved search
    -- afterwards, and the alert they already received still happened.
    search_ids       BIGINT[]    NOT NULL,

    -- The members the alert named. Kept as ids rather than a snapshot of the profiles, so an opened
    -- alert shows people as they are now — including someone who has since deleted their account,
    -- who then simply drops out of the list rather than being shown from a stale copy.
    matched_user_ids TEXT[]      NOT NULL,

    created_time     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_alert_sends_creator_time
    ON search_alert_sends (creator_id, created_time DESC);

ALTER TABLE search_alert_sends
    ENABLE ROW LEVEL SECURITY;

-- No policies: read through an owner-checked API endpoint only. Who someone is being shown is a
-- statement about who they are looking for, which is not public even though each matched profile is.
