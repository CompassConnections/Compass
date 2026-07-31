-- Close the remaining anon-readable tables that leak user_ids in bulk (which is what let a scraper
-- harvest ids and then pull profiles/users through the capped RPCs). Same pattern as
-- 20260730_cap_profiles_users_reads.sql: REVOKE the anon/authenticated SELECT grant and route the
-- client's only read shapes through SECURITY DEFINER functions that require a filter.
--
--   compatibility_scores — not read by the client at all (backend get-profiles joins it via the
--                          service role, which is unaffected). Drop the public-read policy + grant.
--   user_activity        — client read the whole table (active-member count, now in /stats) and a single
--                          row by user_id (now get_user_activity()).
--   profile_stars        — client read all of a creator's stars (now get_profile_stars()).
--
-- Writes to these tables already go through the service-role backend, so revoking the anon/authenticated
-- SELECT grant doesn't touch them. The service role keeps its grant and bypasses RLS.

-- One user's activity row (last_online_time). Requires uid; returns at most one row, so it can't be
-- turned into a full-table pull the way select('*') on user_activity could.
create or replace function get_user_activity(uid text)
    returns setof user_activity
    language sql
    stable
    security definer
    set search_path = public
as $$
    select * from user_activity where user_id = uid limit 1;
$$;

-- All stars created by one profile, newest first (mirrors the old getStars query). Requires the
-- creator id, so it reads one person's stars rather than enumerating the whole table.
create or replace function get_profile_stars(creator text)
    returns setof profile_stars
    language sql
    stable
    security definer
    set search_path = public
as $$
    select * from profile_stars where creator_id = creator order by created_time desc;
$$;

-- Drop the public-read policies and revoke the base-table SELECT grant from the client roles.
drop policy if exists "public read" on compatibility_scores;
drop policy if exists "public read" on user_activity;
drop policy if exists "public read" on profile_stars;

revoke select on table compatibility_scores, user_activity, profile_stars from anon, authenticated;

grant execute on function get_user_activity(text) to anon, authenticated;
grant execute on function get_profile_stars(text) to anon, authenticated;

-- Make PostgREST expose the new functions immediately (Supabase also auto-reloads on DDL).
notify pgrst, 'reload schema';
