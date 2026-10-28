-- Close profile_likes and profile_ships to the client roles. Same pattern as
-- 20260731_lock_activity_stars_compat.sql: drop the public-read policy and revoke the anon/authenticated
-- SELECT grant.
--
-- Neither table is read by the web directly — every read goes through the API on the service role
-- (like-profile, ship-profiles, get-user-data-export, the notification helpers), which bypasses RLS
-- and keeps its grant. The anon grant only ever served scrapers: with it, the whole like graph could
-- be pulled over PostgREST with the public key, and it bypassed the members-only redaction that the
-- API applies to everything else about a profile.
--
-- No replacement RPC, because there is no client read shape to replace.

drop policy if exists "public read" on profile_likes;
drop policy if exists "public read" on profile_ships;

revoke select on table profile_likes, profile_ships from anon, authenticated;

notify pgrst, 'reload schema';
