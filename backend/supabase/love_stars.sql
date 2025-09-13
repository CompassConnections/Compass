CREATE TABLE IF NOT EXISTS love_stars (
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT NOT NULL,
    star_id TEXT DEFAULT random_alphanumeric(12) NOT NULL,
    target_id TEXT NOT NULL,
    CONSTRAINT love_stars_pkey PRIMARY KEY (creator_id, star_id)
);

-- Row Level Security
ALTER TABLE love_stars ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON love_stars;
CREATE POLICY "public read" ON love_stars
FOR SELECT USING (true);

-- Indexes
-- The primary key already creates a unique index on (creator_id, star_id), so no need to recreate it.

DROP INDEX IF EXISTS love_stars_target_id_idx;
CREATE INDEX love_stars_target_id_idx ON public.love_stars USING btree (target_id);
