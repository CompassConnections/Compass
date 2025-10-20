CREATE TABLE IF NOT EXISTS profile_ships (
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT NOT NULL,
    ship_id TEXT DEFAULT random_alphanumeric(12) NOT NULL,
    target1_id TEXT NOT NULL,
    target2_id TEXT NOT NULL,
    CONSTRAINT profile_ships_pkey PRIMARY KEY (creator_id, ship_id)
);

-- Row Level Security
ALTER TABLE profile_ships ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON profile_ships;
CREATE POLICY "public read" ON profile_ships
FOR SELECT USING (true);

-- Indexes
-- Primary key automatically creates a unique index on (creator_id, ship_id), so no need to recreate it.
-- Keep additional indexes for query optimization:
DROP INDEX IF EXISTS profile_ships_target1_id;
CREATE INDEX profile_ships_target1_id ON public.profile_ships USING btree (target1_id);

DROP INDEX IF EXISTS profile_ships_target2_id;
CREATE INDEX profile_ships_target2_id ON public.profile_ships USING btree (target2_id);
