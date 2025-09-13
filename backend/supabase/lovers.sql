
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lover_visibility') THEN
CREATE TYPE lover_visibility AS ENUM ('public', 'member');
END IF;
END$$;

CREATE TABLE IF NOT EXISTS lovers (
    age INTEGER DEFAULT 18 NOT NULL,
    bio JSON,
    born_in_location TEXT,
    city TEXT NOT NULL,
    city_latitude NUMERIC(9, 6),
    city_longitude NUMERIC(9, 6),
    comments_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    company TEXT,
    country TEXT,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    drinks_per_month INTEGER,
    education_level TEXT,
    ethnicity TEXT[],
    gender TEXT NOT NULL,
    geodb_city_id TEXT,
    has_kids INTEGER,
    height_in_inches INTEGER,
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    is_smoker BOOLEAN,
    is_vegetarian_or_vegan BOOLEAN,
    last_online_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    looking_for_matches BOOLEAN DEFAULT TRUE NOT NULL,
    messaging_status TEXT DEFAULT 'open'::TEXT NOT NULL,
    occupation TEXT,
    occupation_title TEXT,
    photo_urls TEXT[],
    pinned_url TEXT,
    political_beliefs TEXT[],
    pref_age_max INTEGER DEFAULT 100 NOT NULL,
    pref_age_min INTEGER DEFAULT 18 NOT NULL,
    pref_gender TEXT[] NOT NULL,
    pref_relation_styles TEXT[] NOT NULL,
    referred_by_username TEXT,
    region_code TEXT,
    religious_belief_strength INTEGER,
    religious_beliefs TEXT,
    twitter TEXT,
    university TEXT,
    user_id TEXT NOT NULL,
    visibility lover_visibility DEFAULT 'member'::lover_visibility NOT NULL,
    wants_kids_strength INTEGER DEFAULT 0 NOT NULL,
    website TEXT,
    CONSTRAINT lovers_pkey PRIMARY KEY (id)
    );

-- Row Level Security
ALTER TABLE lovers ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON lovers;

CREATE POLICY "public read" ON lovers
FOR SELECT
                    USING (true);

DROP POLICY IF EXISTS "self update" ON lovers;

CREATE POLICY "self update" ON lovers
FOR UPDATE
                    WITH CHECK ((user_id = firebase_uid()));

-- Indexes
DROP INDEX IF EXISTS lovers_user_id_idx;

CREATE INDEX lovers_user_id_idx ON public.lovers USING btree (user_id);

DROP INDEX IF EXISTS unique_user_id;

CREATE UNIQUE INDEX unique_user_id ON public.lovers USING btree (user_id);
