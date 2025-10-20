CREATE TABLE IF NOT EXISTS profile_stars (
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT NOT NULL,
    star_id TEXT DEFAULT random_alphanumeric(12) NOT NULL,
    target_id TEXT NOT NULL,
    CONSTRAINT profile_stars_pkey PRIMARY KEY (creator_id, star_id)
);

-- Row Level Security
ALTER TABLE profile_stars ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON profile_stars;
CREATE POLICY "public read" ON profile_stars
FOR SELECT USING (true);

-- Indexes
-- The primary key already creates a unique index on (creator_id, star_id), so no need to recreate it.

DROP INDEX IF EXISTS profile_stars_target_id_idx;
CREATE INDEX profile_stars_target_id_idx ON public.profile_stars USING btree (target_id);
