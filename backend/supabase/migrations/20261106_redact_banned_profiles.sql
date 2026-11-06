-- Banned profiles must not be readable with the public anon key.
-- Created: 2026-11-06
--
-- A banned member's profile was hidden only in the browser. `getUserAndProfile` now redacts it, and this
-- closes the other road to the whole row: get_profile_by_user_id() still returned it in full when the
-- profile was public.
--
-- The function runs on the anon key and cannot tell the owner or a moderator from a stranger, so it
-- redacts for everyone, as it does for members-only and disabled profiles. That costs nothing: anyone
-- signed in reads through the authenticated `get-profile` endpoint (see web/hooks/use-profile.tsx), which
-- still gives the owner and moderators the whole profile.

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
    banned       boolean;
begin
    select * into full_row from profiles where user_id = uid limit 1;
    if not found then
        return;
    end if;

    select is_banned_from_posting into banned from users where id = uid;

    if full_row.visibility <> 'member' and not full_row.disabled and not banned then
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
