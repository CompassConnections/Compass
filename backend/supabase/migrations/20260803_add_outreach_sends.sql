-- Migration: add_outreach_sends
-- Created: 2026-08-03
--
-- What automated outreach has already gone out, per member. `outreach_contacts` holds the state of a
-- hand-written founder thread; this holds the machine-sent messages, and the two are deliberately
-- separate tables because only one of them is a conversation.
--
-- It exists for three reasons, in order of importance:
--
--   1. Contact #E ("the empty room") is specified as one message, ever. Without a record of the send
--      there is nothing to check before sending it again, and a second copy of "there is nobody here
--      for you" is worse than never having sent the first.
--   2. The city-number email and Contact #E are mutually exclusive — one says how many people are
--      near you, the other says almost nobody is. A member must never receive both.
--   3. Nothing currently records that an automated message was sent at all, so the conversion of the
--      automated city-number email against the hand-written ask cannot be measured. That comparison
--      is the number that decides how much founder time the sequence deserves.

CREATE TABLE IF NOT EXISTS outreach_sends
(
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id   TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    -- 'city_number'  the personalised share email — how many members are near them
    -- 'empty_room'   Contact #E — the honest account of there being nobody near them
    --
    -- Saved-search alerts are deliberately not logged here: `bookmarked_searches.last_notified_at`
    -- already records that one reached a member, and a second copy of the same fact is a second thing
    -- that can disagree with the first.
    kind      TEXT        NOT NULL CHECK (kind IN ('city_number', 'empty_room')),

    sent_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Whatever the message asserted: the count it quoted, the city it named. Kept so a number that
    -- turned out to be wrong can be traced back to the message that quoted it.
    context   JSONB       NOT NULL DEFAULT '{}'::jsonb
);

-- Send-once, enforced rather than remembered: both kinds are one-shot, and a duplicate of either is
-- worse than never having sent it.
CREATE UNIQUE INDEX IF NOT EXISTS outreach_sends_once_per_kind
    ON outreach_sends (user_id, kind);

CREATE INDEX IF NOT EXISTS outreach_sends_user_kind_time
    ON outreach_sends (user_id, kind, sent_at DESC);

ALTER TABLE outreach_sends
    ENABLE ROW LEVEL SECURITY;

-- No policies: this is admin/server-side only, read through the service role. Members have no reason
-- to read the log of what was sent to them, and an anon-readable copy would expose the per-city member
-- counts the emails quote.
