CREATE TABLE IF NOT EXISTS profile_ships (
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT NOT NULL,
    ship_id TEXT DEFAULT random_alphanumeric(12) NOT NULL,
    target1_id TEXT NOT NULL,
    target2_id TEXT NOT NULL,
    CONSTRAINT profile_ships_pkey PRIMARY KEY (creator_id, ship_id)
);

ALTER TABLE profile_ships
    ADD CONSTRAINT profile_ships_creator_id_fkey
        FOREIGN KEY (creator_id)
            REFERENCES users(id)
            ON DELETE CASCADE;

-- Row Level Security
ALTER TABLE profile_ships ENABLE ROW LEVEL SECURITY;

-- No SELECT policy: RLS is enabled with no read policy AND the anon/authenticated SELECT grant is
-- revoked, so the client cannot read this table at all (migration 20261028_lock_likes_ships.sql
-- dropped the former "public read" policy). Only the service-role backend reads it, bypassing RLS.

-- Indexes
-- Primary key automatically creates a unique index on (creator_id, ship_id), so no need to recreate it.
CREATE INDEX IF NOT EXISTS profile_ships_target1_id ON public.profile_ships USING btree (target1_id);

CREATE INDEX IF NOT EXISTS profile_ships_target2_id ON public.profile_ships USING btree (target2_id);
