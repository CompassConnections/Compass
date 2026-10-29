-- Disabled profiles must not be readable with the public anon key either.
-- Created: 2026-10-29
--
-- 20260901_redact_member_only_profiles.sql taught get_profile_by_user_id() to redact members-only
-- profiles, but a disabled profile with `visibility = 'public'` still came back in full. The API
-- (`getUserAndProfile`) already hides a disabled profile from everyone but its owner and admins, so
-- this function was the one road left to the whole row.
--
-- The function runs on the anon key and cannot tell the owner or an admin from a stranger, so it
-- redacts for everyone, exactly as it does for members-only profiles. That costs nothing: the owner's
-- own profile is read through the authenticated `get-profile` endpoint (see web/hooks/use-profile.tsx),
-- and admins review profiles through the API too. The redacted row keeps `disabled`, which is how the
-- page still says "disabled" rather than pretending the account does not exist.

create or replace function get_profile_by_user_id(uid text)
    returns setof profiles
    language plpgsql
    stable
    security definer
    set search_path = public
as
$$
declare
    full_row     profiles;
    redacted_row profiles;
begin
    select * into full_row from profiles where user_id = uid limit 1;
    if not found then
        return;
    end if;

    if full_row.visibility <> 'member' and not full_row.disabled then
        return next full_row;
        return;
    end if;

    -- Fields are copied across one by one rather than nulled out of a copy, so a column added to
    -- `profiles` later is excluded by default instead of leaking until someone remembers this file.
    redacted_row.user_id := full_row.user_id;
    redacted_row.visibility := full_row.visibility;
    redacted_row.disabled := full_row.disabled;
    return next redacted_row;
end;
$$;

grant execute on function get_profile_by_user_id(text) to anon, authenticated;

-- Make PostgREST pick up the new definition immediately (Supabase also auto-reloads on DDL).
notify pgrst, 'reload schema';
