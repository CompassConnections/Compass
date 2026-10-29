-- Make ballots, anonymous proposal authors and stars private.
-- Created: 2026-10-29
--
-- Three reads were open to anyone holding the public anon key:
--
--   vote_results       "public read" policy: every member's ballot on every proposal.
--   votes              "public read" policy: creator_id on every row, including the proposals
--                      posted with is_anonymous = true.
--   get_profile_stars  security definer, granted to anon, takes any member id: who anyone has saved.
--
-- Same pattern as 20261028_lock_client_read_tables.sql: drop the public-read policies and revoke the
-- anon/authenticated SELECT grant. The client's remaining read shapes move to:
--
--   proposal list + tallies   get_votes_with_results(), now security definer and with creator_id
--                             nulled on anonymous proposals. Tallies stay public; ballots do not.
--   viewer's own ballots      the get-my-vote-choices API endpoint (needs the caller's identity,
--                             which a function on the anon key does not have).
--   commenters' ballots       get_vote_commenter_choices(), below. Shown next to a comment so readers
--                             know which way its author voted; limited to members who commented on
--                             that proposal, since they argued in public under their own name.
--   proposal/ballot counts    the /stats endpoint.
--   viewer's own stars        the get-my-stars API endpoint. get_profile_stars() is dropped.
--
-- Writes to votes and vote_results already go through the service-role backend, which bypasses RLS and
-- keeps its grant.

drop policy if exists "public read" on votes;
drop policy if exists "public read" on vote_results;

revoke select on table votes, vote_results from anon, authenticated;

-- Same columns and ranking as 20260808_vote_top_arguments.sql. Two changes: security definer, so the
-- client roles can still read the tallies without a grant on the tables, and creator_id is null when
-- the proposal is anonymous.
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

-- The ballot of each member with a visible comment on one proposal. Nobody else's.
create or replace function get_vote_commenter_choices(vid bigint)
    returns table
            (
                user_id text,
                choice  smallint
            )
    language sql
    stable
    security definer
    set search_path = public
as
$$
select r.user_id, r.choice
from vote_results r
where r.vote_id = vid
  and exists (select 1
              from vote_comments c
              where c.vote_id = vid
                and c.user_id = r.user_id
                and not c.hidden);
$$;

grant execute on function get_votes_with_results(text, bigint) to anon, authenticated;
grant execute on function get_vote_commenter_choices(bigint) to anon, authenticated;

drop function if exists get_profile_stars(text);

-- Make PostgREST pick up the changes immediately (Supabase also auto-reloads on DDL).
notify pgrst, 'reload schema';
