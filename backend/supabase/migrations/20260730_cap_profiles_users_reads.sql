-- Cap direct client reads of the two largest tables (profiles ~6.6 KB/row, users) so they can no
-- longer be bulk-enumerated through PostgREST. PostgREST has no per-table max-rows, so instead of a
-- (global) row cap we REVOKE the anon/authenticated SELECT grant and route the client's only read
-- shapes through SECURITY DEFINER functions that require a filter and cap the row count.
--
-- After this: GET /profiles?select=*  and  GET /users?select=*  return "permission denied" (no rows).
-- The app reads these through get_display_users()/get_profile_by_user_id() (client) or the service-role
-- direct client in backend/api (unaffected — the service role keeps its grant). The old public-read RLS
-- policies become moot once the grant is gone, but are harmless and left in place.

-- Display info (avatars, names) for a bounded set of users. Requires ids; hard-capped at 100 so a
-- caller passing a huge id array can't turn this into a full-table pull. Columns mirror
-- `displayUserColumns` in common/src/supabase/users.ts.
create or replace function get_display_users(ids text[])
    returns table
            (
                id                     text,
                name                   text,
                username               text,
                avatar_url             text,
                is_banned_from_posting boolean,
                ban_reason             text
            )
    language sql
    stable
    security definer
    set search_path = public
as
$$
select id, name, username, avatar_url, is_banned_from_posting, ban_reason
from users
where id = any (ids)
limit 100;
$$;

-- A single profile by user_id — the only shape the client reads profiles in (see
-- getProfileRowWithFrontendSupabase). Returns the full row like the old select('*'), but for exactly
-- one known user, so it can't enumerate.
create or replace function get_profile_by_user_id(uid text)
    returns setof profiles
    language sql
    stable
    security definer
    set search_path = public
as
$$
select *
from profiles
where user_id = uid
limit 1;
$$;

drop policy if exists "public read" on users;
drop policy if exists "public read" on profiles;

-- Lock the base tables: no more unfiltered bulk pulls via the anon/authenticated roles.
revoke select on table users, profiles from anon, authenticated;

grant execute on function get_display_users(text[]) to anon, authenticated;
grant execute on function get_profile_by_user_id(text) to anon, authenticated;

-- Make PostgREST expose the new functions immediately (Supabase also auto-reloads on DDL).
notify pgrst, 'reload schema';
