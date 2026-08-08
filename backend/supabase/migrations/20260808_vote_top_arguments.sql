-- Move the "highlighted arguments" ranking out of the client and into this function.
--
-- It used to live in TS (`pickHighlightedArguments`), which meant the proposal list had to download
-- every comment body on every proposal just to pick two per card and throw the rest away. Ranking
-- here means both the list and the detail page read the same two rows from the same query, so there
-- is one implementation rather than one per page, and the list stops fetching comments entirely.
--
-- Ranked by reply count, tie-broken by age — attention, not correctness, which is why the UI calls
-- them "highlighted" and not "strongest".
--
-- One deliberate divergence from the old TS behaviour: `reply_to_comment_id is null` means a reply
-- whose parent was hidden is not a candidate here, whereas `buildThreads` promotes such an orphan to
-- a parent for rendering. That only bites when a moderator hides a parent whose reply carries a
-- stance, and reproducing the promotion in SQL is not worth the join.

-- The ranking counts replies per candidate, which is an index lookup on the child side.
CREATE INDEX IF NOT EXISTS vote_comments_reply_to_comment_id_idx
    ON public.vote_comments USING btree (reply_to_comment_id)
    WHERE reply_to_comment_id IS NOT NULL;

-- Split out rather than inlined as a lateral: the caller groups by v.id, and a lateral join would
-- have to sit outside that grouping, which is a lot of noise for "one row per side".
DROP FUNCTION IF EXISTS top_argument(bigint, text);
CREATE OR REPLACE FUNCTION top_argument(vote_id_param bigint, stance_param text)
    RETURNS jsonb
AS
$$
SELECT to_jsonb(c)
FROM vote_comments c
WHERE c.vote_id = vote_id_param
  AND NOT c.hidden
  AND c.reply_to_comment_id IS NULL
  AND c.stance = stance_param
ORDER BY (SELECT COUNT(*)
          FROM vote_comments r
          WHERE r.reply_to_comment_id = c.id
            AND NOT r.hidden) DESC,
         c.created_time ASC
LIMIT 1;
$$ LANGUAGE sql STABLE;

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
                comment_count int,
                top_for       jsonb,
                top_against   jsonb
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
                           AND NOT c.hidden)                                        AS comment_count,
                        top_argument(v.id, 'for')                                   AS top_for,
                        top_argument(v.id, 'against')                               AS top_against
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
       comment_count,
       top_for,
       top_against
FROM results
ORDER BY CASE WHEN order_by = 'recent' THEN created_time END DESC,
         CASE WHEN order_by = 'mostVoted' THEN (votes_for + votes_against + votes_abstain) END DESC,
         CASE WHEN order_by = 'mostVoted' THEN created_time END DESC,
         CASE WHEN order_by = 'mostDiscussed' THEN comment_count END DESC,
         CASE WHEN order_by = 'mostDiscussed' THEN created_time END DESC,
         CASE WHEN order_by = 'priority' THEN priority END DESC,
         CASE WHEN order_by = 'priority' THEN created_time END DESC;
$$ LANGUAGE sql STABLE;
