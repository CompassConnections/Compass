-- Members-only profiles must not be readable with the public anon key.
-- Created: 2026-09-01
--
-- `profiles.visibility = 'member'` means "signed-in members only", and it is the column default, so
-- most profiles on the site are gated. Until now that gate lived entirely in the frontend: the page
-- rendered a placeholder, while the row itself travelled to the browser in full — through the API,
-- through the statically generated page props, and through this function.
--
-- get_profile_by_user_id() is reachable by `anon`, which is the key every browser on the site holds
-- (the web client never swaps in a per-user JWT — see updateSupabaseAuth in web/lib/supabase/db.ts),
-- so anything it returns is effectively public regardless of who is signed in. It therefore has to
-- redact members-only profiles for everyone, and the two client reads that legitimately need the
-- whole row for a signed-in member — the profile page and the owner's own profile — now go through
-- the authenticated `get-profile` API instead.
--
-- The redacted row keeps only the identity columns the app needs in order to render "this profile is
-- members only": user_id, visibility, disabled. Not `id`: profile_interests, profile_causes and
-- profile_work are joined on it and are readable by anon, so returning it would hand back the tags
-- the rest of this removes. Not `pinned_url` or `photo_urls`: a photo is profile content. The one
-- thing a gated profile still says out loud is the display name, and that lives on `users`.
--
-- Still one row, still the same shape, so callers that only ask "does this profile exist" (the
-- post-signup redirect) are unaffected.

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

    if full_row.visibility <> 'member' then
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
