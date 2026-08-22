DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_visibility') THEN
            CREATE TYPE profile_visibility AS ENUM ('public', 'member');
        END IF;
    END
$$;

CREATE TABLE IF NOT EXISTS profiles
(
    -- Derived from birth_date by profiles_sync_age() and refreshed daily — never written by hand.
    age                       INTEGER                                                 NULL,
    bio                       JSONB,
    -- Always the 1st of July of the birth year — a year is all we ask for and all this may hold.
    birth_date                DATE,
    bio_length                integer                                                 null,
    born_in_location          TEXT,
    city                      TEXT,
    city_latitude             NUMERIC(9, 6),
    city_longitude            NUMERIC(9, 6),
    comments_enabled          BOOLEAN            DEFAULT TRUE                         NOT NULL,
    company                   TEXT,
    country                   TEXT,
    created_time              TIMESTAMPTZ        DEFAULT now()                        NOT NULL,
    diet                      TEXT[],
    disabled                  BOOLEAN            DEFAULT FALSE                        NOT NULL,
    drinks_per_month          INTEGER,
    education_level           TEXT,
    ethnicity                 TEXT[],
    gender                    TEXT,
    geodb_city_id             TEXT,
    has_kids                  INTEGER,
    headline                  TEXT,
    height_in_inches          float4,
    id                        BIGINT GENERATED ALWAYS AS IDENTITY                     NOT NULL,
    image_descriptions        jsonb,
    is_smoker                 BOOLEAN,
    last_modification_time    TIMESTAMPTZ        DEFAULT now()                        NOT NULL,
    links                     JSONB              default '{}'::jsonb                  not null,
    looking_for_matches       BOOLEAN            DEFAULT TRUE                         NOT NULL,
    allow_direct_messaging    BOOLEAN            DEFAULT TRUE                         NOT NULL,
    allow_interest_indicating BOOLEAN            DEFAULT TRUE                         NOT NULL,
    occupation                TEXT,
    occupation_title          TEXT,
    photo_urls                TEXT[],
    pinned_url                TEXT,
    political_beliefs         TEXT[],
    political_details         TEXT,
    pref_age_max              INTEGER                                                 NULL,
    pref_age_min              INTEGER                                                 NULL,
    pref_gender               TEXT[],
    pref_relation_styles      TEXT[],
    pref_romantic_styles      TEXT[],
    raised_in_city            TEXT,
    raised_in_country         TEXT,
    raised_in_geodb_city_id   TEXT,
    raised_in_lat             NUMERIC(9, 6),
    raised_in_lon             NUMERIC(9, 6),
    raised_in_radius          INTEGER,
    raised_in_region_code     TEXT,
    referred_by_username      TEXT,
    -- Resolved from referred_by_username once at signup; NULL when the name matched no member.
    -- This is the column the referral tree is walked over — an id survives a rename, a username
    -- does not, and a rename mid-tree would otherwise sever every descendant below it.
    referred_by_user_id       TEXT,
    region_code               TEXT,
    relationship_status       TEXT[],
    religion                  TEXT[],
    religious_belief_strength INTEGER,
    religious_beliefs         TEXT,
    university                TEXT,
    user_id                   TEXT                                                    NOT NULL,
    visibility                profile_visibility DEFAULT 'member'::profile_visibility NOT NULL,
    wants_kids_strength       INTEGER            DEFAULT 0,
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);


ALTER TABLE profiles
    ADD CONSTRAINT profiles_user_id_fkey
        FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE CASCADE;

-- SET NULL, not CASCADE: deleting a member must not delete the people they brought. The
-- introduction still happened; only the pointer back to someone no longer here is lost.
ALTER TABLE profiles
    ADD CONSTRAINT profiles_referred_by_user_id_fkey
        FOREIGN KEY (referred_by_user_id)
            REFERENCES users (id)
            ON DELETE SET NULL;

-- Row Level Security
ALTER TABLE profiles
    ENABLE ROW LEVEL SECURITY;

-- Policies

-- Indexes
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles USING btree (user_id);

-- Partial, and on the referrer rather than the referee: the only question asked of this column is
-- "who did X bring?", asked once per generation by the recursive walk behind /referrals.
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_user_id
    ON profiles (referred_by_user_id)
    WHERE referred_by_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_id ON public.profiles USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_last_mod_24h
    ON public.profiles USING btree (last_modification_time);

CREATE INDEX IF NOT EXISTS idx_profiles_bio_length
    ON profiles (bio_length);

-- Fastest general-purpose index
CREATE INDEX IF NOT EXISTS profiles_lat_lon_idx ON profiles (city_latitude, city_longitude);
CREATE INDEX IF NOT EXISTS profiles_lat_lon_idx ON profiles (raised_in_lat, raised_in_lon);

-- Optional additional index for large tables / clustered inserts
CREATE INDEX IF NOT EXISTS profiles_lat_lon_brin_idx ON profiles USING BRIN (city_latitude, city_longitude) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS profiles_lat_lon_brin_idx ON profiles USING BRIN (raised_in_lat, raised_in_lon) WITH (pages_per_range = 32);

CREATE INDEX profiles_pref_gender_gin ON profiles USING GIN (pref_gender);
CREATE INDEX profiles_pref_relation_styles_gin ON profiles USING GIN (pref_relation_styles);
CREATE INDEX profiles_pref_romantic_styles_gin ON profiles USING GIN (pref_romantic_styles);
CREATE INDEX profiles_diet_gin ON profiles USING GIN (diet);
CREATE INDEX profiles_political_beliefs_gin ON profiles USING GIN (political_beliefs);
CREATE INDEX profiles_relationship_status_gin ON profiles USING GIN (relationship_status);
CREATE INDEX profiles_religion_gin ON profiles USING GIN (religion);
CREATE INDEX profiles_ethnicity_gin ON profiles USING GIN (ethnicity);

CREATE INDEX profiles_active_idx
    ON profiles (created_time DESC)
    WHERE looking_for_matches = true
        AND disabled = false;

CREATE INDEX profiles_age_idx ON profiles (age);
CREATE INDEX profiles_birth_date_idx ON profiles (birth_date);
CREATE INDEX profiles_drinks_idx ON profiles (drinks_per_month);
CREATE INDEX profiles_has_kids_idx ON profiles (has_kids);
CREATE INDEX profiles_wants_kids_idx ON profiles (wants_kids_strength);
CREATE INDEX profiles_smoker_idx ON profiles (is_smoker);
CREATE INDEX profiles_education_level_idx ON profiles (education_level);
CREATE INDEX profiles_gender_idx ON profiles (gender);
CREATE INDEX profiles_geodb_city_idx ON profiles (geodb_city_id);
CREATE INDEX profiles_raised_in_geodb_city_idx ON profiles (raised_in_geodb_city_id);

CREATE INDEX profiles_recent_active_idx
    ON profiles (last_modification_time DESC)
    WHERE looking_for_matches = true
        AND disabled = false;

CREATE INDEX users_name_trgm_idx
    ON users USING gin (lower(name) gin_trgm_ops);


-- Functions and Triggers
CREATE
    OR REPLACE FUNCTION update_last_modification_time()
    RETURNS TRIGGER AS
$$
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
ALTER TABLE profiles
    ADD COLUMN bio_text TEXT;

ALTER TABLE profiles
    ADD COLUMN bio_tsv tsvector
        GENERATED ALWAYS AS (to_tsvector('english', coalesce(bio_text, ''))) STORED;

CREATE INDEX profiles_bio_tsv_idx ON profiles USING GIN (bio_tsv);

ALTER TABLE profiles
    ADD COLUMN search_text TEXT,
    ADD COLUMN search_tsv  tsvector;

-- Rebuild search (search_txt and search_tsv)
CREATE OR REPLACE FUNCTION trg_profiles_rebuild_search()
    RETURNS trigger AS
$$
BEGIN
    RAISE LOG 'trg_profiles_rebuild_search fired for profile id: %', NEW.id;

    IF pg_trigger_depth() = 1 THEN -- only run on the first (real) trigger, not recursive ones
        PERFORM rebuild_profile_search(NEW.id);
    END IF;

    RAISE LOG 'rebuild_profile_search completed for id: %', NEW.id;
    RETURN NEW;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in trg_profiles_rebuild_search for id %: % %',
            NEW.id, SQLERRM, SQLSTATE;
        RETURN NEW; -- or RETURN NULL to suppress the row change
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS update_bio_text;
DROP TRIGGER IF EXISTS trg_update_bio_text ON profiles;

CREATE OR REPLACE TRIGGER trg_profiles_rebuild_search
    AFTER INSERT OR UPDATE OF
        headline, occupation, occupation_title, company,
        university, city, country, born_in_location,
        raised_in_city, raised_in_country, political_details,
        religious_beliefs, bio
    ON profiles
    FOR EACH ROW
EXECUTE FUNCTION trg_profiles_rebuild_search();

CREATE INDEX profiles_search_tsv_idx
    ON profiles USING GIN (search_tsv);


