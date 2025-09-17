
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_visibility') THEN
CREATE TYPE profile_visibility AS ENUM ('public', 'member');
END IF;
END$$;

CREATE TABLE IF NOT EXISTS profiles (
    age INTEGER NULL,
    bio JSONB,
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
    last_modification_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    looking_for_matches BOOLEAN DEFAULT TRUE NOT NULL,
    messaging_status TEXT DEFAULT 'open'::TEXT NOT NULL,
    occupation TEXT,
    occupation_title TEXT,
    photo_urls TEXT[],
    pinned_url TEXT,
    political_beliefs TEXT[],
    pref_age_max INTEGER NULL,
    pref_age_min INTEGER NULL,
    pref_gender TEXT[] NOT NULL,
    pref_relation_styles TEXT[] NOT NULL,
    referred_by_username TEXT,
    region_code TEXT,
    religious_belief_strength INTEGER,
    religious_beliefs TEXT,
    twitter TEXT,
    university TEXT,
    user_id TEXT NOT NULL,
    visibility profile_visibility DEFAULT 'member'::profile_visibility NOT NULL,
    wants_kids_strength INTEGER DEFAULT 0 NOT NULL,
    website TEXT,
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
    );

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON profiles;

CREATE POLICY "public read" ON profiles
FOR SELECT
                    USING (true);

DROP POLICY IF EXISTS "self update" ON profiles;

CREATE POLICY "self update" ON profiles
FOR UPDATE
                    WITH CHECK ((user_id = firebase_uid()));

-- Indexes
DROP INDEX IF EXISTS profiles_user_id_idx;
CREATE INDEX profiles_user_id_idx ON public.profiles USING btree (user_id);

DROP INDEX IF EXISTS unique_user_id;
CREATE UNIQUE INDEX unique_user_id ON public.profiles USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_last_mod_24h
    ON public.profiles USING btree (last_modification_time);

-- Functions and Triggers
CREATE
OR REPLACE FUNCTION update_last_modification_time()
RETURNS TRIGGER AS $$
BEGIN
   IF NEW.last_online_time IS DISTINCT FROM OLD.last_online_time AND row(NEW.*) = row(OLD.*) THEN
      -- Only last_online_time changed, do nothing
      RETURN NEW;
END IF;

   -- Some other column changed
   NEW.last_modification_time = now();
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

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
-- ALTER TABLE profiles ADD COLUMN bio_text tsvector;
--
-- CREATE OR REPLACE FUNCTION profiles_bio_tsvector_update()
-- RETURNS trigger AS $$
-- BEGIN
--   new.bio_text := to_tsvector(
--     'english',
--     (
--       SELECT string_agg(trim(both '"' from x::text), ' ')
--       FROM jsonb_path_query(new.bio, '$.**.text'::jsonpath) AS x
--     )
--   );
-- RETURN new;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER profiles_bio_tsvector_trigger
--     BEFORE INSERT OR UPDATE OF bio ON profiles
--     FOR EACH ROW EXECUTE FUNCTION profiles_bio_tsvector_update();
--
-- create index on profiles using gin(bio_text);

