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
    diet                TEXT[],
    disabled            BOOLEAN DEFAULT FALSE NOT NULL,
    drinks_per_month INTEGER,
    education_level TEXT,
    ethnicity TEXT[],
    gender TEXT NOT NULL,
    geodb_city_id TEXT,
    has_kids INTEGER,
    height_in_inches INTEGER,
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    image_descriptions jsonb,
    is_smoker BOOLEAN,
    last_modification_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    looking_for_matches BOOLEAN DEFAULT TRUE NOT NULL,
    messaging_status TEXT DEFAULT 'open'::TEXT NOT NULL,
    occupation TEXT,
    occupation_title TEXT,
    photo_urls TEXT[],
    pinned_url TEXT,
    political_beliefs TEXT[],
    political_details   TEXT,
    pref_age_max INTEGER NULL,
    pref_age_min INTEGER NULL,
    pref_gender TEXT[] NOT NULL,
    pref_relation_styles TEXT[] NOT NULL,
    pref_romantic_styles TEXT[],
    referred_by_username TEXT,
    region_code TEXT,
    relationship_status TEXT[],
    religion            TEXT[],
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

CREATE INDEX profiles_pref_gender_gin ON profiles USING GIN (pref_gender);
CREATE INDEX profiles_pref_relation_styles_gin ON profiles USING GIN (pref_relation_styles);
CREATE INDEX profiles_pref_romantic_styles_gin ON profiles USING GIN (pref_romantic_styles);
CREATE INDEX profiles_diet_gin ON profiles USING GIN (diet);
CREATE INDEX profiles_political_beliefs_gin ON profiles USING GIN (political_beliefs);
CREATE INDEX profiles_relationship_status_gin ON profiles USING GIN (relationship_status);
CREATE INDEX profiles_languages_gin ON profiles USING GIN (languages);
CREATE INDEX profiles_religion_gin ON profiles USING GIN (religion);
CREATE INDEX profiles_ethnicity_gin ON profiles USING GIN (ethnicity);

CREATE INDEX profiles_active_idx
    ON profiles (created_time DESC)
    WHERE looking_for_matches = true
        AND disabled = false;

CREATE INDEX profiles_age_idx ON profiles (age);
CREATE INDEX profiles_drinks_idx ON profiles (drinks_per_month);
CREATE INDEX profiles_has_kids_idx ON profiles (has_kids);
CREATE INDEX profiles_wants_kids_idx ON profiles (wants_kids_strength);
CREATE INDEX profiles_smoker_idx ON profiles (is_smoker);
CREATE INDEX profiles_education_level_idx ON profiles (education_level);
CREATE INDEX profiles_gender_idx ON profiles (gender);
CREATE INDEX profiles_geodb_city_idx ON profiles (geodb_city_id);

CREATE INDEX profiles_recent_active_idx
    ON profiles (last_modification_time DESC)
    WHERE looking_for_matches = true
        AND disabled = false;

CREATE INDEX users_name_trgm_idx
    ON users USING gin (lower(name) gin_trgm_ops);


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

ALTER TABLE profiles ADD COLUMN bio_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', coalesce(bio_text, ''))) STORED;

CREATE INDEX profiles_bio_tsv_idx ON profiles USING GIN (bio_tsv);

ALTER TABLE profiles
    ADD COLUMN search_text TEXT,
    ADD COLUMN search_tsv  tsvector;

-- Rebuild search (search_txt and search_tsv)
CREATE OR REPLACE FUNCTION trg_profiles_rebuild_search()
    RETURNS trigger AS $$
BEGIN
    PERFORM rebuild_profile_search(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS update_bio_text;
DROP TRIGGER IF EXISTS trg_update_bio_text ON profiles;

CREATE TRIGGER trg_profiles_rebuild_search
    AFTER INSERT OR UPDATE OF bio
    ON profiles
    FOR EACH ROW
EXECUTE FUNCTION trg_profiles_rebuild_search();

CREATE INDEX profiles_search_tsv_idx
    ON profiles USING GIN (search_tsv);


