-- Discussion threads on proposals.
--
-- Mirrors profile_comments (same denormalized author columns, same public-read RLS) rather than
-- generalizing that table into a polymorphic comments table: profile_comments' RLS, broadcast topic
-- and notification path are all keyed on on_user_id, and unpicking that is a bigger change than
-- repeating nine columns here.
CREATE TABLE IF NOT EXISTS vote_comments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vote_id BIGINT NOT NULL,
    user_id TEXT NOT NULL,
    reply_to_comment_id BIGINT,
    content JSONB NOT NULL,
    -- Whether the author is arguing for or against the proposal, or just asking. NULL = neutral.
    -- Deliberately independent of the author's row in vote_results: you can argue against a proposal
    -- you voted for, and noticing that gap is the point of having the discussion at all.
    stance TEXT CHECK (stance IN ('for', 'against', 'question')),
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    hidden BOOLEAN DEFAULT false NOT NULL,
    user_avatar_url TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_username TEXT NOT NULL
);

-- Foreign Keys
ALTER TABLE vote_comments
    DROP CONSTRAINT IF EXISTS vote_comments_vote_id_fkey;
ALTER TABLE vote_comments
    ADD CONSTRAINT vote_comments_vote_id_fkey
        FOREIGN KEY (vote_id) REFERENCES votes (id) ON DELETE CASCADE;

ALTER TABLE vote_comments
    DROP CONSTRAINT IF EXISTS vote_comments_user_id_fkey;
ALTER TABLE vote_comments
    ADD CONSTRAINT vote_comments_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE vote_comments
    DROP CONSTRAINT IF EXISTS vote_comments_reply_to_comment_id_fkey;
ALTER TABLE vote_comments
    ADD CONSTRAINT vote_comments_reply_to_comment_id_fkey
        FOREIGN KEY (reply_to_comment_id) REFERENCES vote_comments (id) ON DELETE CASCADE;

-- Row Level Security
ALTER TABLE vote_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON vote_comments;
CREATE POLICY "public read" ON vote_comments
    FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS vote_comments_vote_id_idx
    ON public.vote_comments USING btree (vote_id, created_time);

CREATE INDEX IF NOT EXISTS vote_comments_user_id_idx
    ON public.vote_comments USING btree (user_id);


-- One row per (person, proposal) holding both halves of "should we ping this person": whether they
-- muted the thread, and when they were last pinged about it.
--
-- last_notified_time lives here rather than being derived from user_notifications because the
-- throttle has to be destination-independent — a user_notifications row only exists for people who
-- get browser notifications, so deriving from it would email the email-only users on every comment.
CREATE TABLE IF NOT EXISTS vote_subscriptions (
    user_id            TEXT    NOT NULL,
    vote_id            BIGINT  NOT NULL,
    muted              BOOLEAN NOT NULL DEFAULT false,
    last_notified_time TIMESTAMPTZ,
    created_time       TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, vote_id)
);

ALTER TABLE vote_subscriptions
    DROP CONSTRAINT IF EXISTS vote_subscriptions_user_id_fkey;
ALTER TABLE vote_subscriptions
    ADD CONSTRAINT vote_subscriptions_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE vote_subscriptions
    DROP CONSTRAINT IF EXISTS vote_subscriptions_vote_id_fkey;
ALTER TABLE vote_subscriptions
    ADD CONSTRAINT vote_subscriptions_vote_id_fkey
        FOREIGN KEY (vote_id) REFERENCES votes (id) ON DELETE CASCADE;

ALTER TABLE vote_subscriptions ENABLE ROW LEVEL SECURITY;

-- No public read policy: who muted what is nobody else's business. The client reads its own row
-- through the API, not PostgREST.
DROP POLICY IF EXISTS "public read" ON vote_subscriptions;


-- Rebuilt to carry comment_count (so the list page doesn't N+1) and to accept an optional vote_id
-- filter (so the detail page can reuse the same aggregation for one proposal).
DROP FUNCTION IF EXISTS get_votes_with_results(text);
DROP FUNCTION IF EXISTS get_votes_with_results(text, bigint);
CREATE OR REPLACE FUNCTION get_votes_with_results(
    order_by text DEFAULT 'recent',
    only_vote_id bigint DEFAULT NULL
)
    RETURNS TABLE
            (
                id            BIGINT,
                title         text,
                description   jsonb,
                created_time  timestamptz,
                creator_id    TEXT,
                is_anonymous  boolean,
                status        text,
                votes_for     int,
                votes_against int,
                votes_abstain int,
                priority      int,
                comment_count int
            )
AS
$$
WITH results AS (SELECT v.id,
                        v.title,
                        v.description,
                        v.created_time,
                        v.creator_id,
                        v.is_anonymous,
                        v.status,
                        COALESCE(SUM(CASE WHEN r.choice = 1 THEN 1 ELSE 0 END), 0)  AS votes_for,
                        COALESCE(SUM(CASE WHEN r.choice = -1 THEN 1 ELSE 0 END), 0) AS votes_against,
                        COALESCE(SUM(CASE WHEN r.choice = 0 THEN 1 ELSE 0 END), 0)  AS votes_abstain,
                        COALESCE(SUM(r.priority), 0)::float /
                        GREATEST(COALESCE(SUM(CASE WHEN r.choice = 1 THEN 1 ELSE 0 END), 1), 1) * 100 /
                        3                                                           AS priority,
                        -- Counted in a subquery rather than another LEFT JOIN: joining both children
                        -- multiplies the rows and inflates every vote tally.
                        (SELECT COUNT(*)
                         FROM vote_comments c
                         WHERE c.vote_id = v.id
                           AND NOT c.hidden)                                        AS comment_count
                 FROM votes v
                          LEFT JOIN vote_results r ON v.id = r.vote_id
                 WHERE only_vote_id IS NULL
                    OR v.id = only_vote_id
                 GROUP BY v.id)
SELECT id,
       title,
       description,
       created_time,
       creator_id,
       is_anonymous,
       status,
       votes_for,
       votes_against,
       votes_abstain,
       priority,
       comment_count
FROM results
ORDER BY CASE WHEN order_by = 'recent' THEN created_time END DESC,
         CASE WHEN order_by = 'mostVoted' THEN (votes_for + votes_against + votes_abstain) END DESC,
         CASE WHEN order_by = 'mostVoted' THEN created_time END DESC,
         CASE WHEN order_by = 'mostDiscussed' THEN comment_count END DESC,
         CASE WHEN order_by = 'mostDiscussed' THEN created_time END DESC,
         CASE WHEN order_by = 'priority' THEN priority END DESC,
         CASE WHEN order_by = 'priority' THEN created_time END DESC;
$$ LANGUAGE sql STABLE;
