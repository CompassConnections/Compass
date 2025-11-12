DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_visibility') THEN
CREATE TYPE profile_visibility AS ENUM ('public', 'member');
END IF;
END$$;

CREATE TABLE IF NOT EXISTS profiles (
    age INTEGER NULL,
    bio JSONB,
    bio_length integer null,
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
    diet TEXT[],
    last_modification_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    looking_for_matches BOOLEAN DEFAULT TRUE NOT NULL,
    messaging_status TEXT DEFAULT 'open'::TEXT NOT NULL,
    occupation TEXT,
    occupation_title TEXT,
    photo_urls TEXT[],
    pinned_url TEXT,
    political_details TEXT,
    political_beliefs TEXT[],
    relationship_status TEXT[],
    pref_age_max INTEGER NULL,
    pref_age_min INTEGER NULL,
    pref_gender TEXT[] NOT NULL,
    pref_relation_styles TEXT[] NOT NULL,
    pref_romantic_styles TEXT[],
    referred_by_username TEXT,
    region_code TEXT,
    religious_belief_strength INTEGER,
    religious_beliefs TEXT,
    religion TEXT[],
    twitter TEXT,
    university TEXT,
    user_id TEXT NOT NULL,
    visibility profile_visibility DEFAULT 'member'::profile_visibility NOT NULL,
    wants_kids_strength INTEGER DEFAULT 0 NOT NULL,
    website TEXT,
    disabled BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
    );


ALTER TABLE profiles
    ADD CONSTRAINT profiles_user_id_fkey
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON profiles;
CREATE POLICY "public read" ON profiles
FOR SELECT USING (true);

DROP POLICY IF EXISTS "self update" ON profiles;

CREATE POLICY "self update" ON profiles
FOR UPDATE
                    WITH CHECK ((user_id = firebase_uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles USING btree (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_id ON public.profiles USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_last_mod_24h
    ON public.profiles USING btree (last_modification_time);

CREATE INDEX IF NOT EXISTS idx_profiles_bio_length
    ON profiles (bio_length);

-- Fastest general-purpose index
CREATE INDEX IF NOT EXISTS profiles_lat_lon_idx ON profiles (city_latitude, city_longitude);

-- Optional additional index for large tables / clustered inserts
CREATE INDEX IF NOT EXISTS profiles_lat_lon_brin_idx ON profiles USING BRIN (city_latitude, city_longitude) WITH (pages_per_range = 32);


-- Functions and Triggers
CREATE
OR REPLACE FUNCTION update_last_modification_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modification_time = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trigger_update_last_mod_time
    BEFORE UPDATE
    ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modification_time();

-- pg_trgm
create extension if not exists pg_trgm;

CREATE INDEX profiles_bio_trgm_idx
    ON profiles USING gin ((bio::text) gin_trgm_ops);


--- bio_text
ALTER TABLE profiles ADD COLUMN bio_text TEXT;
UPDATE profiles
SET bio_text = (
    SELECT string_agg(DISTINCT trim(both '"' from value::text), ' ')
    FROM jsonb_path_query(bio, '$.**.text') AS t(value)
);

ALTER TABLE profiles ADD COLUMN bio_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', coalesce(bio_text, ''))) STORED;

CREATE INDEX profiles_bio_tsv_idx ON profiles USING GIN (bio_tsv);

CREATE OR REPLACE FUNCTION update_bio_text()
    RETURNS trigger AS $$
BEGIN
    NEW.bio_text := (
        SELECT string_agg(DISTINCT trim(both '"' from value::text), ' ')
        FROM jsonb_path_query(NEW.bio, '$.**.text') AS t(value)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_bio_text
    BEFORE INSERT OR UPDATE OF bio ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_bio_text();
