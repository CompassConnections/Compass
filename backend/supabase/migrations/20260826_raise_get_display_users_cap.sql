-- Raise the get_display_users() row cap from 100 to 500.
--
-- The cap exists to stop a caller from turning this function into a full-table pull of `users`
-- (see 20260730_cap_profiles_users_reads.sql). 100 was tight enough that the messages page had to
-- fetch avatars one channel at a time; with the chat list now batching every member id into a
-- single call, and the channel list itself capped at MAX_CHAT_CHANNELS (500), 500 is the matching
-- ceiling. It is still a bounded, ids-required read, so the enumeration guarantee is unchanged.

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
limit 500;
$$;

grant execute on function get_display_users(text[]) to anon, authenticated;

-- Make PostgREST pick up the new definition immediately (Supabase also auto-reloads on DDL).
notify pgrst, 'reload schema';
