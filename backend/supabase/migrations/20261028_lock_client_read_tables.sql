-- Close the last three tables the browser read straight from PostgREST on the anon key:
-- bookmarked_searches, compatibility_answers and profile_comments. Same pattern as
-- 20260731_lock_activity_stars_compat.sql and 20261028_lock_likes_ships.sql: drop the public-read
-- policy and revoke the anon/authenticated SELECT grant.
--
-- Unlike the earlier locks there is no replacement RPC. Each read moved to an API endpoint instead,
-- because what these tables hold depends on who is asking in a way a security-definer function with
-- no caller identity cannot express:
--
--   bookmarked_searches   get-bookmarked-searches   the caller's own rows, nobody else's
--   compatibility_answers get-profile-answers       empty for a members-only, disabled, banned or
--                                                   blocked profile
--   profile_comments      get-profile-comments      the same, plus hidden comments and comments by
--                                                   blocked authors left out
--
-- With this, no table is readable by the client roles except through a capped security-definer
-- function or a table that is public by design (prompts, options, votes, ...). Writes to all three
-- already went through the service-role backend, so the grant revoke touches nothing on that side.
--
-- get_compatibility_prompts_with_answer_count (security invoker, reads compatibility_answers) stops
-- working for the client roles as a consequence. Its only web caller was dead code and is removed.

drop policy if exists "public read" on bookmarked_searches;
drop policy if exists "public read" on compatibility_answers;
drop policy if exists "public read" on profile_comments;

revoke select on table bookmarked_searches, compatibility_answers, profile_comments
  from anon, authenticated;

notify pgrst, 'reload schema';
