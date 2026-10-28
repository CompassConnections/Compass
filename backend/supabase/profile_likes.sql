CREATE TABLE IF NOT EXISTS profile_likes (
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT NOT NULL,
    like_id TEXT DEFAULT random_alphanumeric(12) NOT NULL,
    target_id TEXT NOT NULL,
    CONSTRAINT profile_likes_pkey PRIMARY KEY (creator_id, like_id)
);

ALTER TABLE profile_likes
    ADD CONSTRAINT profile_likes_creator_id_fkey
        FOREIGN KEY (creator_id)
            REFERENCES users(id)
            ON DELETE CASCADE;

-- Row Level Security
ALTER TABLE profile_likes ENABLE ROW LEVEL SECURITY;

-- No SELECT policy: RLS is enabled with no read policy AND the anon/authenticated SELECT grant is
-- revoked, so the client cannot read this table at all (migration 20261028_lock_likes_ships.sql
-- dropped the former "public read" policy). Only the service-role backend reads it, bypassing RLS,
-- which keeps the like graph from being enumerated over PostgREST.

-- Indexes
-- The primary key already creates a unique index on (creator_id, like_id)
-- so we do not recreate that. Additional indexes:

CREATE INDEX IF NOT EXISTS user_likes_target_id_raw
    ON public.profile_likes (target_id);
