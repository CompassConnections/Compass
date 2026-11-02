-- Editing a proposal, with the previous versions kept — the same arrangement as vote_comment_edits.
--
-- A proposal is what people vote on. Letting the author rewrite it silently after votes were cast
-- would let "add a dark theme" collect 30 votes and then become "remove the light theme" with the
-- tally intact. Keeping every earlier title and description, readable by anyone, is what makes it
-- safe to allow editing at all: a voter who arrives after an edit can check what the earlier voters
-- actually agreed to, and the author knows they can.
ALTER TABLE votes
    ADD COLUMN IF NOT EXISTS edited_time TIMESTAMPTZ;

-- One row per edit, holding the title and description *before* that edit. The live text stays on
-- votes, so listing proposals never touches this table.
--
-- No creator_id here: the votes table hides the author of an anonymous proposal, and copying the id
-- into a public table would undo that.
CREATE TABLE IF NOT EXISTS vote_edits (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vote_id      BIGINT  NOT NULL,
    title        TEXT    NOT NULL,
    description  JSONB,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE vote_edits
    DROP CONSTRAINT IF EXISTS vote_edits_vote_id_fkey;
ALTER TABLE vote_edits
    ADD CONSTRAINT vote_edits_vote_id_fkey
        FOREIGN KEY (vote_id) REFERENCES votes (id) ON DELETE CASCADE;

ALTER TABLE vote_edits ENABLE ROW LEVEL SECURITY;

-- Public read, like the tallies. A private edit history would defeat the point: the record only
-- helps if the people who vote can check it.
DROP POLICY IF EXISTS "public read" ON vote_edits;
CREATE POLICY "public read" ON vote_edits
    FOR SELECT USING (true);

GRANT SELECT ON TABLE vote_edits TO anon, authenticated;

CREATE INDEX IF NOT EXISTS vote_edits_vote_id_idx
    ON public.vote_edits USING btree (vote_id, created_time);

-- Same function as 20261029_private_votes_and_stars.sql plus edited_time, so the card and the
-- proposal page can show "(edited)" without a second query. Dropped first: `create or replace`
-- cannot change the return type.
drop function if exists get_votes_with_results(text, bigint);

create or replace function get_votes_with_results(
    order_by text default 'recent',
    only_vote_id bigint default null
)
    returns table
            (
                id            bigint,
                title         text,
                description   jsonb,
                created_time  timestamptz,
                edited_time   timestamptz,
                creator_id    text,
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
    language sql
    stable
    security definer
    set search_path = public
as
$$
with results as (select v.id,
                        v.title,
                        v.description,
                        v.created_time,
                        v.edited_time,
                        case when v.is_anonymous then null else v.creator_id end   as creator_id,
                        v.is_anonymous,
                        v.status,
                        coalesce(sum(case when r.choice = 1 then 1 else 0 end), 0)  as votes_for,
                        coalesce(sum(case when r.choice = -1 then 1 else 0 end), 0) as votes_against,
                        coalesce(sum(case when r.choice = 0 then 1 else 0 end), 0)  as votes_abstain,
                        coalesce(sum(r.priority), 0)::float /
                        greatest(coalesce(sum(case when r.choice = 1 then 1 else 0 end), 1), 1) * 100 /
                        3                                                           as priority,
                        -- Counted in a subquery rather than another left join: joining both children
                        -- multiplies the rows and inflates every vote tally.
                        (select count(*)
                         from vote_comments c
                         where c.vote_id = v.id
                           and not c.hidden)                                        as comment_count,
                        top_argument(v.id, 'for')                                   as top_for,
                        top_argument(v.id, 'against')                               as top_against
                 from votes v
                          left join vote_results r on v.id = r.vote_id
                 where only_vote_id is null
                    or v.id = only_vote_id
                 group by v.id)
select id,
       title,
       description,
       created_time,
       edited_time,
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
from results
order by case when order_by = 'recent' then created_time end desc,
         case when order_by = 'mostVoted' then (votes_for + votes_against + votes_abstain) end desc,
         case when order_by = 'mostVoted' then created_time end desc,
         case when order_by = 'mostDiscussed' then comment_count end desc,
         case when order_by = 'mostDiscussed' then created_time end desc,
         case when order_by = 'priority' then priority end desc,
         case when order_by = 'priority' then created_time end desc;
$$;

grant execute on function get_votes_with_results(text, bigint) to anon, authenticated;

notify pgrst, 'reload schema';
