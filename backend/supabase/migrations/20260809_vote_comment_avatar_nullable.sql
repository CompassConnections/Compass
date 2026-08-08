-- `user_avatar_url` was copied as NOT NULL from profile_comments, but `users.avatar_url` is nullable
-- and `User.avatarUrl` is only typed `string` — TS says it is always there, Postgres disagrees. A
-- member without an avatar posting an argument hit the constraint and got a 500.
--
-- Nullable is also the honest shape now: the comment row is the only avatar source for the thread
-- (it stopped fetching profiles per comment), and `Avatar` already falls back to an initial when it
-- has nothing, so "no avatar" needs to be representable rather than rejected.
ALTER TABLE vote_comments
    ALTER COLUMN user_avatar_url DROP NOT NULL;

ALTER TABLE profile_comments
    ALTER COLUMN user_avatar_url DROP NOT NULL;