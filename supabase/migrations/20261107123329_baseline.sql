


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "profile_snapshot";


ALTER SCHEMA "profile_snapshot" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."profile_feed_visibility" AS ENUM (
    'none',
    'basic',
    'full'
);


ALTER TYPE "public"."profile_feed_visibility" OWNER TO "postgres";


CREATE TYPE "public"."profile_visibility" AS ENUM (
    'public',
    'member'
);


ALTER TYPE "public"."profile_visibility" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_earth_distance_km"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) RETURNS double precision
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  radius_earth_km CONSTANT FLOAT := 6371;
  delta_lat FLOAT;
  delta_lon FLOAT;
  a FLOAT;
  c FLOAT;
BEGIN
  -- Convert degrees to radians
  lat1 := RADIANS(lat1);
  lon1 := RADIANS(lon1);
  lat2 := RADIANS(lat2);
  lon2 := RADIANS(lon2);

  -- Calculate differences
  delta_lat := lat2 - lat1;
  delta_lon := lon2 - lon1;

  -- Apply Haversine formula
  a := SIN(delta_lat / 2) ^ 2 + COS(lat1) * COS(lat2) * SIN(delta_lon / 2) ^ 2;
  c := 2 * ATAN2(SQRT(a), SQRT(1 - a));

  -- Calculate distance
  RETURN radius_earth_km * c;
END;
$$;


ALTER FUNCTION "public"."calculate_earth_distance_km"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_private_messages"("channel_id" bigint, "user_id" "text") RETURNS boolean
    LANGUAGE "sql" PARALLEL SAFE
    AS $_$
select exists (
    select 1 from private_user_message_channel_members
    where private_user_message_channel_members.channel_id = $1
      and private_user_message_channel_members.user_id = $2
)
$_$;


ALTER FUNCTION "public"."can_access_private_messages"("channel_id" bigint, "user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."firebase_uid"() RETURNS "text"
    LANGUAGE "sql" STABLE PARALLEL SAFE
    AS $$
select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$;


ALTER FUNCTION "public"."firebase_uid"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_average_rating"("user_id" "text") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result numeric;
BEGIN
  SELECT AVG(rating)::numeric INTO result
  FROM reviews
  WHERE vendor_id = user_id;
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_average_rating"("user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_display_users"("ids" "text"[]) RETURNS TABLE("id" "text", "name" "text", "username" "text", "avatar_url" "text", "is_banned_from_posting" boolean, "ban_reason" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
select id, name, username, avatar_url, is_banned_from_posting, ban_reason
from users
where id = any (ids)
limit 500;
$$;


ALTER FUNCTION "public"."get_display_users"("ids" "text"[]) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "age" integer,
    "bio" "jsonb",
    "born_in_location" "text",
    "city" "text",
    "city_latitude" numeric(9,6),
    "city_longitude" numeric(9,6),
    "comments_enabled" boolean DEFAULT true NOT NULL,
    "company" "text",
    "country" "text",
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "drinks_per_month" integer,
    "education_level" "text",
    "ethnicity" "text"[],
    "gender" "text",
    "geodb_city_id" "text",
    "has_kids" integer,
    "height_in_inches" real,
    "id" bigint NOT NULL,
    "is_smoker" boolean,
    "diet" "text"[],
    "last_modification_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "looking_for_matches" boolean DEFAULT true NOT NULL,
    "occupation" "text",
    "occupation_title" "text",
    "photo_urls" "text"[],
    "pinned_url" "text",
    "political_beliefs" "text"[],
    "pref_age_max" integer,
    "pref_age_min" integer,
    "pref_gender" "text"[],
    "pref_relation_styles" "text"[],
    "referred_by_username" "text",
    "region_code" "text",
    "religious_belief_strength" integer,
    "religious_beliefs" "text",
    "university" "text",
    "user_id" "text" NOT NULL,
    "visibility" "public"."profile_visibility" DEFAULT 'member'::"public"."profile_visibility" NOT NULL,
    "wants_kids_strength" integer DEFAULT 0,
    "bio_length" integer,
    "bio_text" "text",
    "bio_tsv" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", COALESCE("bio_text", ''::"text"))) STORED,
    "pref_romantic_styles" "text"[],
    "religion" "text"[],
    "political_details" "text",
    "disabled" boolean DEFAULT false NOT NULL,
    "languages" "text"[],
    "relationship_status" "text"[],
    "mbti" "text",
    "image_descriptions" "jsonb",
    "search_text" "text",
    "search_tsv" "tsvector",
    "big5_openness" smallint,
    "big5_conscientiousness" smallint,
    "big5_extraversion" smallint,
    "big5_agreeableness" smallint,
    "big5_neuroticism" smallint,
    "raised_in_city" "text",
    "raised_in_country" "text",
    "raised_in_geodb_city_id" "text",
    "raised_in_lat" numeric(9,6),
    "raised_in_lon" numeric(9,6),
    "raised_in_radius" integer,
    "raised_in_region_code" "text",
    "allow_direct_messaging" boolean DEFAULT true NOT NULL,
    "allow_interest_indicating" boolean DEFAULT true NOT NULL,
    "headline" "text",
    "keywords" "text"[],
    "links" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "psychedelics" "text",
    "psychedelics_intention" "text"[],
    "psychedelics_pref" "text"[],
    "cannabis" "text",
    "cannabis_intention" "text"[],
    "cannabis_pref" "text"[],
    "orientation" "text"[],
    "orientation_details" "text",
    "gender_details" "text",
    "accessibility_notes" "text",
    "neurotype" "text"[],
    "neurotype_details" "text",
    "exercise" "text",
    "feed_visibility" "public"."profile_feed_visibility" DEFAULT 'basic'::"public"."profile_feed_visibility" NOT NULL,
    "birth_date" "date",
    "spotlight_consent" boolean DEFAULT false NOT NULL,
    "social_media_consent" boolean DEFAULT false NOT NULL,
    "referred_by_user_id" "text",
    "pref_max_distance" integer,
    "online_communities" "text",
    "donor_badge_hidden" boolean DEFAULT false NOT NULL,
    CONSTRAINT "big5_range_check" CHECK ((("big5_openness" >= 0) AND ("big5_openness" <= 100) AND (("big5_conscientiousness" >= 0) AND ("big5_conscientiousness" <= 100)) AND (("big5_extraversion" >= 0) AND ("big5_extraversion" <= 100)) AND (("big5_agreeableness" >= 0) AND ("big5_agreeableness" <= 100)) AND (("big5_neuroticism" >= 0) AND ("big5_neuroticism" <= 100)))),
    CONSTRAINT "profiles_birth_date_mid_year_check" CHECK ((("birth_date" IS NULL) OR ((EXTRACT("month" FROM "birth_date") = (7)::numeric) AND (EXTRACT("day" FROM "birth_date") = (1)::numeric))))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."spotlight_consent" IS 'Member has agreed that an admin may snapshot their profile into a home-page spotlight. Revocable; unticking it hides any live spotlight immediately.';



COMMENT ON COLUMN "public"."profiles"."social_media_consent" IS 'Member has agreed that Compass may feature their profile on its own social media accounts (e.g. an Instagram scroll of the profile page). Only meaningful together with spotlight_consent. Revocable, but only stops future posts — it cannot unpublish.';



COMMENT ON COLUMN "public"."profiles"."referred_by_user_id" IS 'The member whose link this profile signed up through, resolved from referred_by_username once at signup. NULL when nobody referred them, or when the name in ?referrer= matched no member. Nulled rather than cascaded when that member is deleted. This is the column the referral tree is walked over; referred_by_username is kept as the unresolved audit trail.';



COMMENT ON COLUMN "public"."profiles"."donor_badge_hidden" IS 'Member opted out of the supporter badge that shows their past-year donation total on their profile.';



CREATE OR REPLACE FUNCTION "public"."get_profile_by_user_id"("uid" "text") RETURNS SETOF "public"."profiles"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    full_row     profiles;
    redacted_row profiles;
    banned       boolean;
begin
    select * into full_row from profiles where user_id = uid limit 1;
    if not found then
        return;
    end if;

    select is_banned_from_posting into banned from users where id = uid;

    if full_row.visibility <> 'member' and not full_row.disabled and not banned then
        return next full_row;
        return;
    end if;

    -- Fields are copied across one by one rather than nulled out of a copy, so a column added to
    -- `profiles` later is excluded by default instead of leaking until someone remembers this file.
    redacted_row.user_id := full_row.user_id;
    redacted_row.visibility := full_row.visibility;
    redacted_row.disabled := full_row.disabled;
    return next redacted_row;
end;
$$;


ALTER FUNCTION "public"."get_profile_by_user_id"("uid" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activity" (
    "user_id" "text" NOT NULL,
    "last_online_time" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."user_activity" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_activity"("uid" "text") RETURNS SETOF "public"."user_activity"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select * from user_activity where user_id = uid limit 1;
$$;


ALTER FUNCTION "public"."get_user_activity"("uid" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vote_commenter_choices"("vid" bigint) RETURNS TABLE("user_id" "text", "choice" smallint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
select r.user_id, r.choice
from vote_results r
where r.vote_id = vid
  and exists (select 1
              from vote_comments c
              where c.vote_id = vid
                and c.user_id = r.user_id
                and not c.hidden);
$$;


ALTER FUNCTION "public"."get_vote_commenter_choices"("vid" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_votes_with_results"("order_by" "text" DEFAULT 'recent'::"text", "only_vote_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("id" bigint, "title" "text", "description" "jsonb", "created_time" timestamp with time zone, "edited_time" timestamp with time zone, "creator_id" "text", "is_anonymous" boolean, "status" "text", "votes_for" integer, "votes_against" integer, "votes_abstain" integer, "priority" integer, "comment_count" integer, "top_for" "jsonb", "top_against" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
with results as (select v.id,
                        v.title,
                        v.description,
                        v.created_time,
                        v.edited_time,
                        case when v.is_anonymous then null else v.creator_id end   as creator_id,
                        v.is_anonymous,
                        v.status,
                        coalesce(sum(case when r.choice = 1 then 1 else 0 end), 0)  as votes_for,
                        coalesce(sum(case when r.choice = -1 then 1 else 0 end), 0) as votes_against,
                        coalesce(sum(case when r.choice = 0 then 1 else 0 end), 0)  as votes_abstain,
                        coalesce(sum(r.priority), 0)::float /
                        greatest(coalesce(sum(case when r.choice = 1 then 1 else 0 end), 1), 1) * 100 /
                        3                                                           as priority,
                        -- Counted in a subquery rather than another left join: joining both children
                        -- multiplies the rows and inflates every vote tally.
                        (select count(*)
                         from vote_comments c
                         where c.vote_id = v.id
                           and not c.hidden)                                        as comment_count,
                        top_argument(v.id, 'for')                                   as top_for,
                        top_argument(v.id, 'against')                               as top_against
                 from votes v
                          left join vote_results r on v.id = r.vote_id
                 where only_vote_id is null
                    or v.id = only_vote_id
                 group by v.id)
select id,
       title,
       description,
       created_time,
       edited_time,
       creator_id,
       is_anonymous,
       status,
       votes_for,
       votes_against,
       votes_abstain,
       priority,
       comment_count,
       top_for,
       top_against
from results
order by case when order_by = 'recent' then created_time end desc,
         case when order_by = 'mostVoted' then (votes_for + votes_against + votes_abstain) end desc,
         case when order_by = 'mostVoted' then created_time end desc,
         case when order_by = 'mostDiscussed' then comment_count end desc,
         case when order_by = 'mostDiscussed' then created_time end desc,
         case when order_by = 'priority' then priority end desc,
         case when order_by = 'priority' then created_time end desc;
$$;


ALTER FUNCTION "public"."get_votes_with_results"("order_by" "text", "only_vote_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
begin
  return false;
end;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
begin
  return false;
end;
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lovers_bio_tsvector_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
  new.bio_text := to_tsvector(
    'english',
    (
      SELECT string_agg(trim(both '"' from x::text), ' ')
      FROM jsonb_path_query(new.bio, '$.**.text'::jsonpath) AS x
    )
  );
RETURN new;
END;
$_$;


ALTER FUNCTION "public"."lovers_bio_tsvector_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."millis_interval"("start_millis" bigint, "end_millis" bigint) RETURNS interval
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    AS $$
select millis_to_ts(end_millis) - millis_to_ts(start_millis)
           $$;


ALTER FUNCTION "public"."millis_interval"("start_millis" bigint, "end_millis" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."millis_to_ts"("millis" bigint) RETURNS timestamp with time zone
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    AS $$
select to_timestamp(millis / 1000.0)
           $$;


ALTER FUNCTION "public"."millis_to_ts"("millis" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_option_name"("raw" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $_$
DECLARE
    s TEXT;
BEGIN
    -- Non-breaking spaces arrive via paste and are not matched by `\s`, so they are folded to an
    -- ordinary space first rather than being smuggled into the character class.
    s := replace(coalesce(raw, ''), E'\u00A0', ' ');
    s := btrim(regexp_replace(s, '\s+', ' ', 'g'));
    s := btrim(regexp_replace(s, '[.,;:!?]+$', ''));
    IF s = '' THEN
        RETURN '';
    END IF;
    -- Only when the name carries no capital of its own: uppercasing the first character
    -- unconditionally turns "iOS" into "IOS", and a capital anywhere is taken as evidence that the
    -- writer meant the casing they typed.
    IF s ~ '[[:upper:]]' THEN
        RETURN s;
    END IF;
    RETURN upper(left(s, 1)) || substr(s, 2);
END;
$_$;


ALTER FUNCTION "public"."normalize_option_name"("raw" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."profile_age"("birth_date" "date") RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
select case
           when birth_date is null then null
           else extract(year from age(current_date, birth_date))::integer
           end;
$$;


ALTER FUNCTION "public"."profile_age"("birth_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."profiles_sync_age"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if new.birth_date is not null then
        new.age := profile_age(new.birth_date);
    end if;
    return new;
end;
$$;


ALTER FUNCTION "public"."profiles_sync_age"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."random_alphanumeric"("length" integer) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result TEXT;
BEGIN
  WITH alphanum AS (
    SELECT ARRAY['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'] AS chars
  )
  SELECT array_to_string(ARRAY (
    SELECT alphanum.chars[1 + floor(random() * 62)::integer]
    FROM alphanum, generate_series(1, length)
  ), '') INTO result;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."random_alphanumeric"("length" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rebuild_profile_search"("profile_id_param" bigint) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    bio_part               TEXT;
    interests_part         TEXT;
    causes_part            TEXT;
    work_part              TEXT;
    headline_part          TEXT;
    occupation_part        TEXT;
    occupation_title_part  TEXT;
    company_part           TEXT;
    university_part        TEXT;
    city_part              TEXT;
    country_part           TEXT;
    born_in_location_part  TEXT;
    raised_in_city_part    TEXT;
    raised_in_country_part TEXT;
    political_details_part TEXT;
    religious_beliefs_part TEXT;
    keywords_part          TEXT;
BEGIN
    -- Bio text
    SELECT string_agg(DISTINCT trim(both '"' from value::text), ' ')
    INTO bio_part
    FROM profiles p,
         jsonb_path_query(p.bio, '$.**.text') AS t(value)
    WHERE p.id = profile_id_param;

    -- Interests text
    SELECT string_agg(i.name, ' ')
    INTO interests_part
    FROM profile_interests pi
             JOIN interests i ON i.id = pi.option_id
    WHERE pi.profile_id = profile_id_param;

    -- Causes text
    SELECT string_agg(i.name, ' ')
    INTO causes_part
    FROM profile_causes pc
             JOIN causes i ON i.id = pc.option_id
    WHERE pc.profile_id = profile_id_param;

    -- Work text
    SELECT string_agg(i.name, ' ')
    INTO work_part
    FROM profile_work pw
             JOIN work i ON i.id = pw.option_id
    WHERE pw.profile_id = profile_id_param;

    -- Direct text fields from profiles table
    SELECT headline,
           occupation,
           occupation_title,
           company,
           university,
           city,
           country,
           born_in_location,
           raised_in_city,
           raised_in_country,
           political_details,
           religious_beliefs
    INTO
        headline_part, occupation_part, occupation_title_part, company_part,
        university_part, city_part, country_part, born_in_location_part,
        raised_in_city_part, raised_in_country_part, political_details_part, religious_beliefs_part
    FROM profiles
    WHERE id = profile_id_param;

    -- Keywords array
    SELECT string_agg(keyword, ' ')
    INTO keywords_part
    FROM profiles p,
         unnest(p.keywords) AS keyword
    WHERE p.id = profile_id_param;

    UPDATE profiles
    SET bio_text    = bio_part,
        search_text = concat_ws(' ', bio_part, interests_part, causes_part, work_part,
                                headline_part, occupation_part, occupation_title_part, company_part,
                                university_part, city_part, country_part, born_in_location_part,
                                raised_in_city_part, raised_in_country_part, political_details_part,
                                religious_beliefs_part, keywords_part),
        search_tsv  = to_tsvector('english', concat_ws(' ', bio_part, interests_part, causes_part, work_part,
                                                       headline_part, occupation_part, occupation_title_part,
                                                       company_part,
                                                       university_part, city_part, country_part, born_in_location_part,
                                                       raised_in_city_part, raised_in_country_part,
                                                       political_details_part,
                                                       religious_beliefs_part, keywords_part))
    WHERE id = profile_id_param;
END;
$_$;


ALTER FUNCTION "public"."rebuild_profile_search"("profile_id_param" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_profile_ages"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
declare
    updated integer;
begin
    with bumped as (
        update profiles
            set age = profile_age(birth_date)
            where birth_date is not null
                and age is distinct from profile_age(birth_date)
            returning 1)
    select count(*)::integer into updated from bumped;
    return updated;
end;
$$;


ALTER FUNCTION "public"."refresh_profile_ages"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_modified_time_compat_scores"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.modified_time = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_modified_time_compat_scores"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."to_jsonb"("jsonb") RETURNS "jsonb"
    LANGUAGE "sql" IMMUTABLE STRICT PARALLEL SAFE
    AS $_$ select $1 $_$;


ALTER FUNCTION "public"."to_jsonb"("jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."top_argument"("vote_id_param" bigint, "stance_param" "text") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
SELECT to_jsonb(c)
FROM vote_comments c
WHERE c.vote_id = vote_id_param
  AND NOT c.hidden
  AND c.reply_to_comment_id IS NULL
  AND c.stance = stance_param
ORDER BY (SELECT COUNT(*)
          FROM vote_comments r
          WHERE r.reply_to_comment_id = c.id
            AND NOT r.hidden) DESC,
         c.created_time ASC
LIMIT 1;
$$;


ALTER FUNCTION "public"."top_argument"("vote_id_param" bigint, "stance_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_causes_name_rebuild_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
                    BEGIN
                        PERFORM rebuild_profile_search(po.profile_id)
                        FROM profile_causes po
                        WHERE po.option_id = NEW.id;
                        RETURN NULL;
                    END;
                    $$;


ALTER FUNCTION "public"."trg_causes_name_rebuild_search"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_interests_name_rebuild_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
                    BEGIN
                        PERFORM rebuild_profile_search(po.profile_id)
                        FROM profile_interests po
                        WHERE po.option_id = NEW.id;
                        RETURN NULL;
                    END;
                    $$;


ALTER FUNCTION "public"."trg_interests_name_rebuild_search"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_profile_causes_rebuild_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM rebuild_profile_search(
            COALESCE(NEW.profile_id, OLD.profile_id)
            );
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trg_profile_causes_rebuild_search"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_profile_causes_usage_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
                    BEGIN
                        IF TG_OP = 'INSERT' THEN
                            UPDATE causes SET usage_count = usage_count + 1 WHERE id = NEW.option_id;
                        ELSE
                            -- greatest(...) so a miscount can never park the column at a negative
                            -- number that the ORDER BY would then sort to the bottom forever. When
                            -- the option row itself is being deleted this UPDATE matches nothing.
                            UPDATE causes SET usage_count = greatest(usage_count - 1, 0) WHERE id = OLD.option_id;
                        END IF;
                        RETURN NULL;
                    END;
                    $$;


ALTER FUNCTION "public"."trg_profile_causes_usage_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_profile_interests_rebuild_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM rebuild_profile_search(
            COALESCE(NEW.profile_id, OLD.profile_id)
            );
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trg_profile_interests_rebuild_search"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_profile_interests_usage_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
                    BEGIN
                        IF TG_OP = 'INSERT' THEN
                            UPDATE interests SET usage_count = usage_count + 1 WHERE id = NEW.option_id;
                        ELSE
                            -- greatest(...) so a miscount can never park the column at a negative
                            -- number that the ORDER BY would then sort to the bottom forever. When
                            -- the option row itself is being deleted this UPDATE matches nothing.
                            UPDATE interests SET usage_count = greatest(usage_count - 1, 0) WHERE id = OLD.option_id;
                        END IF;
                        RETURN NULL;
                    END;
                    $$;


ALTER FUNCTION "public"."trg_profile_interests_usage_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_profile_work_rebuild_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM rebuild_profile_search(
            COALESCE(NEW.profile_id, OLD.profile_id)
            );
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trg_profile_work_rebuild_search"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_profile_work_usage_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
                    BEGIN
                        IF TG_OP = 'INSERT' THEN
                            UPDATE work SET usage_count = usage_count + 1 WHERE id = NEW.option_id;
                        ELSE
                            -- greatest(...) so a miscount can never park the column at a negative
                            -- number that the ORDER BY would then sort to the bottom forever. When
                            -- the option row itself is being deleted this UPDATE matches nothing.
                            UPDATE work SET usage_count = greatest(usage_count - 1, 0) WHERE id = OLD.option_id;
                        END IF;
                        RETURN NULL;
                    END;
                    $$;


ALTER FUNCTION "public"."trg_profile_work_usage_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_profiles_rebuild_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."trg_profiles_rebuild_search"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_work_name_rebuild_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
                    BEGIN
                        PERFORM rebuild_profile_search(po.profile_id)
                        FROM profile_work po
                        WHERE po.option_id = NEW.id;
                        RETURN NULL;
                    END;
                    $$;


ALTER FUNCTION "public"."trg_work_name_rebuild_search"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_compatibility_prompt_community_importance_score"("p_question_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE compatibility_prompts cp
    SET answer_count               = sub.total,
        community_importance_score = sub.important
    FROM (SELECT COUNT(*)                                                      as total,
                 SUM(CASE WHEN importance >= 2 THEN importance - 1 ELSE 0 END) AS important
          FROM compatibility_answers
          WHERE question_id = p_question_id
            AND multiple_choice IS NOT NULL
            AND multiple_choice >= 0) sub
    WHERE cp.id = p_question_id;
END;
$$;


ALTER FUNCTION "public"."update_compatibility_prompt_community_importance_score"("p_question_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_last_modification_time"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if to_jsonb(new) - 'age' - 'last_modification_time'
        is not distinct from to_jsonb(old) - 'age' - 'last_modification_time' then
        return new;
    end if;
    new.last_modification_time = now();
    return new;
end;
$$;


ALTER FUNCTION "public"."update_last_modification_time"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "profile_snapshot"."meta" (
    "taken_at" timestamp with time zone
);


ALTER TABLE "profile_snapshot"."meta" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "profile_snapshot"."profile_causes" (
    "id" bigint,
    "profile_id" bigint,
    "option_id" bigint
);


ALTER TABLE "profile_snapshot"."profile_causes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "profile_snapshot"."profile_interests" (
    "id" bigint,
    "profile_id" bigint,
    "option_id" bigint
);


ALTER TABLE "profile_snapshot"."profile_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "profile_snapshot"."profile_work" (
    "id" bigint,
    "profile_id" bigint,
    "option_id" bigint
);


ALTER TABLE "profile_snapshot"."profile_work" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "profile_snapshot"."profiles" (
    "age" integer,
    "bio" "jsonb",
    "born_in_location" "text",
    "city" "text",
    "city_latitude" numeric(9,6),
    "city_longitude" numeric(9,6),
    "comments_enabled" boolean,
    "company" "text",
    "country" "text",
    "created_time" timestamp with time zone,
    "drinks_per_month" integer,
    "education_level" "text",
    "ethnicity" "text"[],
    "gender" "text",
    "geodb_city_id" "text",
    "has_kids" integer,
    "height_in_inches" real,
    "id" bigint,
    "is_smoker" boolean,
    "diet" "text"[],
    "last_modification_time" timestamp with time zone,
    "looking_for_matches" boolean,
    "occupation" "text",
    "occupation_title" "text",
    "photo_urls" "text"[],
    "pinned_url" "text",
    "political_beliefs" "text"[],
    "pref_age_max" integer,
    "pref_age_min" integer,
    "pref_gender" "text"[],
    "pref_relation_styles" "text"[],
    "referred_by_username" "text",
    "region_code" "text",
    "religious_belief_strength" integer,
    "religious_beliefs" "text",
    "university" "text",
    "user_id" "text",
    "visibility" "public"."profile_visibility",
    "wants_kids_strength" integer,
    "bio_length" integer,
    "bio_text" "text",
    "bio_tsv" "tsvector",
    "pref_romantic_styles" "text"[],
    "religion" "text"[],
    "political_details" "text",
    "disabled" boolean,
    "languages" "text"[],
    "relationship_status" "text"[],
    "mbti" "text",
    "image_descriptions" "jsonb",
    "search_text" "text",
    "search_tsv" "tsvector",
    "big5_openness" smallint,
    "big5_conscientiousness" smallint,
    "big5_extraversion" smallint,
    "big5_agreeableness" smallint,
    "big5_neuroticism" smallint,
    "raised_in_city" "text",
    "raised_in_country" "text",
    "raised_in_geodb_city_id" "text",
    "raised_in_lat" numeric(9,6),
    "raised_in_lon" numeric(9,6),
    "raised_in_radius" integer,
    "raised_in_region_code" "text",
    "allow_direct_messaging" boolean,
    "allow_interest_indicating" boolean,
    "headline" "text",
    "keywords" "text"[],
    "links" "jsonb",
    "psychedelics" "text",
    "psychedelics_intention" "text"[],
    "psychedelics_pref" "text"[],
    "cannabis" "text",
    "cannabis_intention" "text"[],
    "cannabis_pref" "text"[],
    "orientation" "text"[],
    "orientation_details" "text",
    "gender_details" "text",
    "accessibility_notes" "text",
    "neurotype" "text"[],
    "neurotype_details" "text",
    "exercise" "text",
    "feed_visibility" "public"."profile_feed_visibility",
    "birth_date" "date",
    "spotlight_consent" boolean,
    "social_media_consent" boolean,
    "referred_by_user_id" "text",
    "pref_max_distance" integer,
    "online_communities" "text",
    "donor_badge_hidden" boolean
);


ALTER TABLE "profile_snapshot"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "profile_snapshot"."users" (
    "created_time" timestamp with time zone,
    "data" "jsonb",
    "id" "text",
    "name" "text",
    "name_username_vector" "tsvector",
    "username" "text",
    "avatar_url" "text",
    "is_banned_from_posting" boolean,
    "ban_reason" "text"
);


ALTER TABLE "profile_snapshot"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."banned_networks" (
    "id" bigint NOT NULL,
    "network" "cidr",
    "device_token" "text",
    "source_user_id" "text",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "banned_networks_one_identifier" CHECK ((("network" IS NULL) <> ("device_token" IS NULL)))
);


ALTER TABLE "public"."banned_networks" OWNER TO "postgres";


ALTER TABLE "public"."banned_networks" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."banned_networks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" bigint NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "excerpt" "text",
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "content_text" "text" DEFAULT ''::"text" NOT NULL,
    "cover_image_url" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "author_id" "text",
    "published_time" timestamp with time zone,
    "notified_time" timestamp with time zone,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "blog_posts_excerpt_check" CHECK ((("excerpt" IS NULL) OR ("char_length"("excerpt") <= 400))),
    CONSTRAINT "blog_posts_slug_check" CHECK ((("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::"text") AND (("char_length"("slug") >= 3) AND ("char_length"("slug") <= 120)))),
    CONSTRAINT "blog_posts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"]))),
    CONSTRAINT "blog_posts_title_check" CHECK ((("char_length"("title") >= 3) AND ("char_length"("title") <= 200)))
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


COMMENT ON TABLE "public"."blog_posts" IS 'Long-form editorial posts shown at /blog. Written by admins in the rich-text editor; published and broadcast from /admin/blog.';



ALTER TABLE "public"."blog_posts" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."blog_posts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."bookmarked_searches" (
    "id" bigint NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "creator_id" "text" NOT NULL,
    "search_filters" "jsonb",
    "last_notified_at" timestamp with time zone,
    "search_name" "text",
    "location" "jsonb",
    "last_checked_at" timestamp with time zone
);


ALTER TABLE "public"."bookmarked_searches" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bookmarked_searches"."last_checked_at" IS 'Last time the alert job evaluated this search. Watermark that lets a crashed run resume without re-sending emails.';



ALTER TABLE "public"."bookmarked_searches" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."bookmarked_searches_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."causes" (
    "id" bigint NOT NULL,
    "creator_id" "text",
    "name" "text" NOT NULL,
    "usage_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."causes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."causes_aliases" (
    "option_id" bigint NOT NULL,
    "alias" "text" NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."causes_aliases" OWNER TO "postgres";


ALTER TABLE "public"."causes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."causes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."causes_translations" (
    "option_id" bigint NOT NULL,
    "locale" "text" NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."causes_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compatibility_answers" (
    "id" bigint NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "creator_id" "text" NOT NULL,
    "explanation" "text",
    "importance" integer NOT NULL,
    "multiple_choice" integer NOT NULL,
    "pref_choices" integer[] NOT NULL,
    "question_id" bigint NOT NULL,
    CONSTRAINT "compatibility_answers_importance_range" CHECK ((("importance" >= '-1'::integer) AND ("importance" <= 3)))
);


ALTER TABLE "public"."compatibility_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compatibility_prompts" (
    "answer_type" "text" DEFAULT 'free_response'::"text" NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "creator_id" "text",
    "id" bigint NOT NULL,
    "importance_score" numeric DEFAULT 0 NOT NULL,
    "multiple_choice_options" "jsonb",
    "question" "text" NOT NULL,
    "category" "text",
    "community_importance_score" bigint DEFAULT 0,
    "answer_count" bigint DEFAULT 0
);


ALTER TABLE "public"."compatibility_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compatibility_prompts_pinned" (
    "id" bigint NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text" NOT NULL,
    "question_id" bigint NOT NULL
);


ALTER TABLE "public"."compatibility_prompts_pinned" OWNER TO "postgres";


ALTER TABLE "public"."compatibility_prompts_pinned" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."compatibility_prompts_pinned_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."compatibility_prompts_translations" (
    "question_id" bigint NOT NULL,
    "locale" "text" NOT NULL,
    "multiple_choice_options" "jsonb",
    "question" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."compatibility_prompts_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compatibility_scores" (
    "id" bigint NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "modified_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id_1" "text" NOT NULL,
    "user_id_2" "text" NOT NULL,
    "score" real,
    "score_low" real,
    "score_high" real,
    "shared_answers" integer,
    "prompt_score" real,
    "prompt_score_low" real,
    "prompt_score_high" real
);


ALTER TABLE "public"."compatibility_scores" OWNER TO "postgres";


COMMENT ON COLUMN "public"."compatibility_scores"."score" IS 'Overall score (prompts + profile factors), see common/src/profiles/compatibility-factors.ts';



COMMENT ON COLUMN "public"."compatibility_scores"."prompt_score" IS 'Prompt-only factor of `score`; null when the pair shares no answered prompt';



ALTER TABLE "public"."compatibility_scores" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."compatibility_scores_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."connection_interests" (
    "id" bigint NOT NULL,
    "user_id" "text" NOT NULL,
    "target_user_id" "text" NOT NULL,
    "connection_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "connection_interests_check" CHECK (("user_id" <> "target_user_id")),
    CONSTRAINT "connection_interests_connection_type_check" CHECK (("connection_type" = ANY (ARRAY['relationship'::"text", 'friendship'::"text", 'collaboration'::"text"])))
);


ALTER TABLE "public"."connection_interests" OWNER TO "postgres";


ALTER TABLE "public"."connection_interests" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."connection_interests_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."contact" (
    "id" "text" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"(),
    "user_id" "text",
    "content" "jsonb"
);


ALTER TABLE "public"."contact" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deleted_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "username" "text",
    "reason_category" "text",
    "reason_details" "text",
    "deleted_time" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deleted_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."donations" (
    "id" bigint NOT NULL,
    "user_id" "text" NOT NULL,
    "amount_cents" integer NOT NULL,
    "donated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "note" "text",
    "admin_id" "text",
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "donations_amount_cents_check" CHECK (("amount_cents" > 0))
);


ALTER TABLE "public"."donations" OWNER TO "postgres";


ALTER TABLE "public"."donations" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."donations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."email_unsubscribe_tokens" (
    "token" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "notification_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "used_at" timestamp with time zone
);


ALTER TABLE "public"."email_unsubscribe_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "text" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "creator_id" "text",
    "title" "text" NOT NULL,
    "description" "text",
    "location_type" "text" NOT NULL,
    "location_address" "text",
    "location_url" "text",
    "event_start_time" timestamp with time zone NOT NULL,
    "event_end_time" timestamp with time zone,
    "is_public" boolean DEFAULT true NOT NULL,
    "max_participants" integer,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    CONSTRAINT "events_location_type_check" CHECK (("location_type" = ANY (ARRAY['in_person'::"text", 'online'::"text"]))),
    CONSTRAINT "events_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events_participants" (
    "id" "text" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "rsvp_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'going'::"text" NOT NULL,
    CONSTRAINT "events_participants_status_check" CHECK (("status" = ANY (ARRAY['going'::"text", 'maybe'::"text", 'not_going'::"text"])))
);


ALTER TABLE "public"."events_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hidden_profiles" (
    "id" bigint NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "hider_user_id" "text" NOT NULL,
    "hidden_user_id" "text" NOT NULL
);


ALTER TABLE "public"."hidden_profiles" OWNER TO "postgres";


ALTER TABLE "public"."hidden_profiles" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."hidden_profiles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."interests" (
    "id" bigint NOT NULL,
    "creator_id" "text",
    "name" "text" NOT NULL,
    "usage_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interests_aliases" (
    "option_id" bigint NOT NULL,
    "alias" "text" NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."interests_aliases" OWNER TO "postgres";


ALTER TABLE "public"."interests" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."interests_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."interests_translations" (
    "option_id" bigint NOT NULL,
    "locale" "text" NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."interests_translations" OWNER TO "postgres";


ALTER TABLE "public"."compatibility_answers" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."love_compatibility_answers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."compatibility_prompts" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."love_questions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profile_comments" (
    "id" bigint NOT NULL,
    "content" "jsonb" NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "hidden" boolean DEFAULT false NOT NULL,
    "on_user_id" "text" NOT NULL,
    "reply_to_comment_id" bigint,
    "user_avatar_url" "text",
    "user_id" "text" NOT NULL,
    "user_name" "text" NOT NULL,
    "user_username" "text" NOT NULL
);


ALTER TABLE "public"."profile_comments" OWNER TO "postgres";


ALTER TABLE "public"."profile_comments" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."lover_comments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."notification_template_translations" (
    "template_id" "text" NOT NULL,
    "locale" "text" NOT NULL,
    "title" "text",
    "source_text" "text" NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_template_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_templates" (
    "id" "text" NOT NULL,
    "source_type" "text" NOT NULL,
    "title" "text",
    "source_text" "text" NOT NULL,
    "source_slug" "text",
    "source_user_avatar_url" "text",
    "source_update_type" "text",
    "created_time" bigint NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."notification_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."outreach_contacts" (
    "user_id" "text" NOT NULL,
    "stage" "text",
    "next_action" "text",
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "outreach_contacts_next_action_check" CHECK ((("next_action" IS NULL) OR ("char_length"("next_action") <= 200))),
    CONSTRAINT "outreach_contacts_stage_check" CHECK (("stage" = ANY (ARRAY['not_started'::"text", 'opened'::"text", 'replied'::"text", 'suggestions_sent'::"text", 'nudged'::"text", 'closed'::"text", 'excluded'::"text"])))
);


ALTER TABLE "public"."outreach_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."outreach_sends" (
    "id" bigint NOT NULL,
    "user_id" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "context" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "outreach_sends_kind_check" CHECK (("kind" = ANY (ARRAY['city_number'::"text", 'empty_room'::"text"])))
);


ALTER TABLE "public"."outreach_sends" OWNER TO "postgres";


ALTER TABLE "public"."outreach_sends" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."outreach_sends_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."private_user_message_channel_members" (
    "channel_id" bigint NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" bigint NOT NULL,
    "notify_after_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "status" "text" DEFAULT 'proposed'::"text" NOT NULL,
    "user_id" "text" NOT NULL
);


ALTER TABLE "public"."private_user_message_channel_members" OWNER TO "postgres";


ALTER TABLE "public"."private_user_message_channel_members" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."private_user_message_channel_members_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."private_user_message_channels" (
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" bigint NOT NULL,
    "last_updated_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text"
);


ALTER TABLE "public"."private_user_message_channels" OWNER TO "postgres";


ALTER TABLE "public"."private_user_message_channels" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."private_user_message_channels_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."private_user_messages" (
    "channel_id" bigint NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" bigint NOT NULL,
    "user_id" "text",
    "visibility" "text" DEFAULT 'private'::"text" NOT NULL,
    "ciphertext" "text",
    "iv" "text",
    "tag" "text",
    "is_edited" boolean DEFAULT false,
    "reactions" "jsonb" DEFAULT '{}'::"jsonb",
    "deleted" boolean DEFAULT false,
    "edited_at" timestamp with time zone
);


ALTER TABLE "public"."private_user_messages" OWNER TO "postgres";


ALTER TABLE "public"."private_user_messages" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."private_user_messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."private_user_seen_message_channels" (
    "channel_id" bigint NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" bigint NOT NULL,
    "user_id" "text" NOT NULL
);


ALTER TABLE "public"."private_user_seen_message_channels" OWNER TO "postgres";


ALTER TABLE "public"."private_user_seen_message_channels" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."private_user_seen_message_channels_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."private_users" (
    "data" "jsonb" NOT NULL,
    "id" "text" NOT NULL
);


ALTER TABLE "public"."private_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_causes" (
    "id" bigint NOT NULL,
    "profile_id" bigint NOT NULL,
    "option_id" bigint NOT NULL
);


ALTER TABLE "public"."profile_causes" OWNER TO "postgres";


ALTER TABLE "public"."profile_causes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."profile_causes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profile_interests" (
    "id" bigint NOT NULL,
    "profile_id" bigint NOT NULL,
    "option_id" bigint NOT NULL
);


ALTER TABLE "public"."profile_interests" OWNER TO "postgres";


ALTER TABLE "public"."profile_interests" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."profile_interests_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profile_likes" (
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "creator_id" "text" NOT NULL,
    "like_id" "text" DEFAULT "public"."random_alphanumeric"(12) NOT NULL,
    "target_id" "text" NOT NULL
);


ALTER TABLE "public"."profile_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_ships" (
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "creator_id" "text" NOT NULL,
    "ship_id" "text" DEFAULT "public"."random_alphanumeric"(12) NOT NULL,
    "target1_id" "text" NOT NULL,
    "target2_id" "text" NOT NULL
);


ALTER TABLE "public"."profile_ships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_spotlights" (
    "id" bigint NOT NULL,
    "user_id" "text",
    "name" "text" NOT NULL,
    "username" "text",
    "age" smallint,
    "city" "text",
    "country" "text",
    "photo_url" "text",
    "headline" "text",
    "quote" "text" NOT NULL,
    "quote_context" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "featured_rank" integer,
    "admin_id" "text",
    "admin_note" "text",
    "captured_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profile_spotlights_admin_note_check" CHECK ((("admin_note" IS NULL) OR ("char_length"("admin_note") <= 500))),
    CONSTRAINT "profile_spotlights_age_check" CHECK ((("age" IS NULL) OR (("age" >= 18) AND ("age" <= 120)))),
    CONSTRAINT "profile_spotlights_city_check" CHECK ((("city" IS NULL) OR ("char_length"("city") <= 120))),
    CONSTRAINT "profile_spotlights_country_check" CHECK ((("country" IS NULL) OR ("char_length"("country") <= 120))),
    CONSTRAINT "profile_spotlights_headline_check" CHECK ((("headline" IS NULL) OR ("char_length"("headline") <= 500))),
    CONSTRAINT "profile_spotlights_name_check" CHECK ((("char_length"("name") >= 1) AND ("char_length"("name") <= 100))),
    CONSTRAINT "profile_spotlights_quote_check" CHECK ((("char_length"("quote") >= 40) AND ("char_length"("quote") <= 400))),
    CONSTRAINT "profile_spotlights_quote_context_check" CHECK ((("quote_context" IS NULL) OR ("char_length"("quote_context") <= 80))),
    CONSTRAINT "profile_spotlights_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'live'::"text", 'retired'::"text"])))
);


ALTER TABLE "public"."profile_spotlights" OWNER TO "postgres";


ALTER TABLE "public"."profile_spotlights" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."profile_spotlights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profile_stars" (
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "creator_id" "text" NOT NULL,
    "star_id" "text" DEFAULT "public"."random_alphanumeric"(12) NOT NULL,
    "target_id" "text" NOT NULL
);


ALTER TABLE "public"."profile_stars" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_work" (
    "id" bigint NOT NULL,
    "profile_id" bigint NOT NULL,
    "option_id" bigint NOT NULL
);


ALTER TABLE "public"."profile_work" OWNER TO "postgres";


ALTER TABLE "public"."profile_work" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."profile_work_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."profiles" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."profiles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" integer NOT NULL,
    "user_id" "text",
    "endpoint" "text" NOT NULL,
    "keys" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."push_subscriptions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."push_subscriptions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."push_subscriptions_id_seq" OWNED BY "public"."push_subscriptions"."id";



CREATE TABLE IF NOT EXISTS "public"."push_subscriptions_mobile" (
    "id" integer NOT NULL,
    "user_id" "text" NOT NULL,
    "token" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."push_subscriptions_mobile" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."push_subscriptions_mobile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."push_subscriptions_mobile_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."push_subscriptions_mobile_id_seq" OWNED BY "public"."push_subscriptions_mobile"."id";



CREATE TABLE IF NOT EXISTS "public"."reports" (
    "content_id" "text" NOT NULL,
    "content_owner_id" "text",
    "content_type" "text" NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "id" "text" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parent_id" "text",
    "parent_type" "text",
    "user_id" "text"
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_prompts" (
    "id" bigint NOT NULL,
    "user_id" "text" NOT NULL,
    "prompted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "prompt_trigger" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "attempt_no" integer NOT NULL,
    CONSTRAINT "review_prompts_attempt_no_check" CHECK (("attempt_no" >= 1)),
    CONSTRAINT "review_prompts_platform_check" CHECK (("platform" = ANY (ARRAY['ios'::"text", 'android'::"text"]))),
    CONSTRAINT "review_prompts_prompt_trigger_check" CHECK (("prompt_trigger" = ANY (ARRAY['got-reply'::"text", 'testimonial'::"text", 'notification-profile'::"text", 'backfill'::"text"])))
);


ALTER TABLE "public"."review_prompts" OWNER TO "postgres";


ALTER TABLE "public"."review_prompts" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."review_prompts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."search_alert_sends" (
    "id" bigint NOT NULL,
    "creator_id" "text" NOT NULL,
    "search_ids" bigint[] NOT NULL,
    "matched_user_ids" "text"[] NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_match_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."search_alert_sends" OWNER TO "postgres";


ALTER TABLE "public"."search_alert_sends" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."search_alert_sends_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."share_prompts" (
    "id" bigint NOT NULL,
    "user_id" "text" NOT NULL,
    "prompted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "prompt_trigger" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "attempt_no" integer NOT NULL,
    CONSTRAINT "share_prompts_attempt_no_check" CHECK (("attempt_no" >= 1)),
    CONSTRAINT "share_prompts_platform_check" CHECK (("platform" = ANY (ARRAY['web'::"text", 'ios'::"text", 'android'::"text"]))),
    CONSTRAINT "share_prompts_prompt_trigger_check" CHECK (("prompt_trigger" = ANY (ARRAY['got-reply'::"text", 'testimonial'::"text", 'established'::"text"])))
);


ALTER TABLE "public"."share_prompts" OWNER TO "postgres";


ALTER TABLE "public"."share_prompts" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."share_prompts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."testimonials" (
    "id" bigint NOT NULL,
    "author_id" "text",
    "author_name" "text" NOT NULL,
    "author_username" "text",
    "author_avatar_url" "text",
    "body" "text" NOT NULL,
    "headline" "text",
    "rating" smallint,
    "show_author" boolean DEFAULT true NOT NULL,
    "source" "text" DEFAULT 'member'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "moderator_id" "text",
    "moderator_note" "text",
    "moderated_time" timestamp with time zone,
    "featured_rank" integer,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "testimonials_author_name_check" CHECK ((("char_length"("author_name") >= 1) AND ("char_length"("author_name") <= 100))),
    CONSTRAINT "testimonials_body_check" CHECK ((("char_length"("body") >= 40) AND ("char_length"("body") <= 1500))),
    CONSTRAINT "testimonials_headline_check" CHECK ((("headline" IS NULL) OR ("char_length"("headline") <= 100))),
    CONSTRAINT "testimonials_moderator_note_check" CHECK ((("moderator_note" IS NULL) OR ("char_length"("moderator_note") <= 500))),
    CONSTRAINT "testimonials_rating_check" CHECK ((("rating" IS NULL) OR (("rating" >= 1) AND ("rating" <= 5)))),
    CONSTRAINT "testimonials_source_check" CHECK (("source" = ANY (ARRAY['member'::"text", 'deletion_survey'::"text"]))),
    CONSTRAINT "testimonials_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'hidden'::"text"])))
);


ALTER TABLE "public"."testimonials" OWNER TO "postgres";


ALTER TABLE "public"."testimonials" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."testimonials_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."unfinished_signups" (
    "firebase_uid" "text" NOT NULL,
    "auth_created_at" timestamp with time zone NOT NULL,
    "token" "text" NOT NULL,
    "notified_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "delete_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "unfinished_signups_delete_reason_check" CHECK (("delete_reason" = ANY (ARRAY['grace_expired'::"text", 'stale'::"text", 'no_email'::"text", 'self'::"text"])))
);


ALTER TABLE "public"."unfinished_signups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_events" (
    "id" bigint NOT NULL,
    "ad_id" "text",
    "comment_id" "text",
    "contract_id" "text",
    "data" "jsonb" NOT NULL,
    "name" "text" NOT NULL,
    "ts" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text"
);


ALTER TABLE "public"."user_events" OWNER TO "postgres";


ALTER TABLE "public"."user_events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."user_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_notifications" (
    "notification_id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "template_id" "text"
);


ALTER TABLE "public"."user_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "data" "jsonb" NOT NULL,
    "id" "text" DEFAULT "public"."random_alphanumeric"(12) NOT NULL,
    "name" "text" NOT NULL,
    "name_username_vector" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", (("name" || ' '::"text") || "username"))) STORED,
    "username" "text" NOT NULL,
    "avatar_url" "text",
    "is_banned_from_posting" boolean DEFAULT false NOT NULL,
    "ban_reason" "text",
    CONSTRAINT "users_ban_reason_check" CHECK ((("ban_reason" IS NULL) OR ("ban_reason" = ANY (ARRAY['auto_rate_limit'::"text", 'under_review'::"text", 'confirmed_abuse'::"text"]))))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vote_comment_edits" (
    "id" bigint NOT NULL,
    "comment_id" bigint NOT NULL,
    "content" "jsonb" NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vote_comment_edits" OWNER TO "postgres";


ALTER TABLE "public"."vote_comment_edits" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."vote_comment_edits_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."vote_comments" (
    "id" bigint NOT NULL,
    "vote_id" bigint NOT NULL,
    "user_id" "text" NOT NULL,
    "reply_to_comment_id" bigint,
    "content" "jsonb" NOT NULL,
    "stance" "text",
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "hidden" boolean DEFAULT false NOT NULL,
    "user_avatar_url" "text",
    "user_name" "text" NOT NULL,
    "user_username" "text" NOT NULL,
    "edited_time" timestamp with time zone,
    CONSTRAINT "vote_comments_stance_check" CHECK (("stance" = ANY (ARRAY['for'::"text", 'against'::"text", 'both'::"text", 'question'::"text", 'answer'::"text"])))
);


ALTER TABLE "public"."vote_comments" OWNER TO "postgres";


ALTER TABLE "public"."vote_comments" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."vote_comments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."vote_edits" (
    "id" bigint NOT NULL,
    "vote_id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "description" "jsonb",
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vote_edits" OWNER TO "postgres";


ALTER TABLE "public"."vote_edits" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."vote_edits_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."vote_results" (
    "id" bigint NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text" NOT NULL,
    "vote_id" bigint NOT NULL,
    "choice" smallint NOT NULL,
    "priority" smallint NOT NULL,
    CONSTRAINT "vote_results_choice_check" CHECK (("choice" = ANY (ARRAY['-1'::integer, 0, 1]))),
    CONSTRAINT "vote_results_priority_check" CHECK (("priority" = ANY (ARRAY[0, 1, 2, 3])))
);


ALTER TABLE "public"."vote_results" OWNER TO "postgres";


ALTER TABLE "public"."vote_results" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."vote_results_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."vote_subscriptions" (
    "user_id" "text" NOT NULL,
    "vote_id" bigint NOT NULL,
    "muted" boolean DEFAULT false NOT NULL,
    "last_notified_time" timestamp with time zone,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vote_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votes" (
    "id" bigint NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "creator_id" "text",
    "title" "text" NOT NULL,
    "description" "jsonb",
    "is_anonymous" boolean NOT NULL,
    "status" "text",
    "edited_time" timestamp with time zone
);


ALTER TABLE "public"."votes" OWNER TO "postgres";


ALTER TABLE "public"."votes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."votes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."work" (
    "id" bigint NOT NULL,
    "creator_id" "text",
    "name" "text" NOT NULL,
    "usage_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."work" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_aliases" (
    "option_id" bigint NOT NULL,
    "alias" "text" NOT NULL,
    "created_time" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."work_aliases" OWNER TO "postgres";


ALTER TABLE "public"."work" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."work_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."work_translations" (
    "option_id" bigint NOT NULL,
    "locale" "text" NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."work_translations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."push_subscriptions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."push_subscriptions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."push_subscriptions_mobile" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."push_subscriptions_mobile_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."banned_networks"
    ADD CONSTRAINT "banned_networks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."bookmarked_searches"
    ADD CONSTRAINT "bookmarked_searches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."causes_aliases"
    ADD CONSTRAINT "causes_aliases_pkey" PRIMARY KEY ("option_id", "alias");



ALTER TABLE ONLY "public"."causes"
    ADD CONSTRAINT "causes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."causes_translations"
    ADD CONSTRAINT "causes_translations_pkey" PRIMARY KEY ("option_id", "locale");



ALTER TABLE ONLY "public"."compatibility_prompts_pinned"
    ADD CONSTRAINT "compatibility_prompts_pinned_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compatibility_prompts_pinned"
    ADD CONSTRAINT "compatibility_prompts_pinned_user_id_question_id_key" UNIQUE ("user_id", "question_id");



ALTER TABLE ONLY "public"."compatibility_prompts_translations"
    ADD CONSTRAINT "compatibility_prompts_translations_pkey" PRIMARY KEY ("question_id", "locale");



ALTER TABLE ONLY "public"."compatibility_scores"
    ADD CONSTRAINT "compatibility_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."connection_interests"
    ADD CONSTRAINT "connection_interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."connection_interests"
    ADD CONSTRAINT "connection_interests_user_id_target_user_id_connection_type_key" UNIQUE ("user_id", "target_user_id", "connection_type");



ALTER TABLE ONLY "public"."contact"
    ADD CONSTRAINT "contact_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deleted_users"
    ADD CONSTRAINT "deleted_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."donations"
    ADD CONSTRAINT "donations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_unsubscribe_tokens"
    ADD CONSTRAINT "email_unsubscribe_tokens_pkey" PRIMARY KEY ("token");



ALTER TABLE ONLY "public"."events_participants"
    ADD CONSTRAINT "events_participants_event_id_user_id_key" UNIQUE ("event_id", "user_id");



ALTER TABLE ONLY "public"."events_participants"
    ADD CONSTRAINT "events_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interests_aliases"
    ADD CONSTRAINT "interests_aliases_pkey" PRIMARY KEY ("option_id", "alias");



ALTER TABLE ONLY "public"."interests"
    ADD CONSTRAINT "interests_name_unique2" UNIQUE ("name");



ALTER TABLE ONLY "public"."interests"
    ADD CONSTRAINT "interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interests_translations"
    ADD CONSTRAINT "interests_translations_pkey" PRIMARY KEY ("option_id", "locale");



ALTER TABLE ONLY "public"."compatibility_answers"
    ADD CONSTRAINT "love_compatibility_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_likes"
    ADD CONSTRAINT "love_likes_pkey" PRIMARY KEY ("creator_id", "like_id");



ALTER TABLE ONLY "public"."compatibility_prompts"
    ADD CONSTRAINT "love_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_ships"
    ADD CONSTRAINT "love_ships_pkey" PRIMARY KEY ("creator_id", "ship_id");



ALTER TABLE ONLY "public"."profile_stars"
    ADD CONSTRAINT "love_stars_pkey" PRIMARY KEY ("creator_id", "star_id");



ALTER TABLE ONLY "public"."profile_comments"
    ADD CONSTRAINT "lover_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interests"
    ADD CONSTRAINT "name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."notification_template_translations"
    ADD CONSTRAINT "notification_template_translations_pkey" PRIMARY KEY ("template_id", "locale");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."outreach_contacts"
    ADD CONSTRAINT "outreach_contacts_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."outreach_sends"
    ADD CONSTRAINT "outreach_sends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."private_user_message_channel_members"
    ADD CONSTRAINT "private_user_message_channel_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."private_user_message_channels"
    ADD CONSTRAINT "private_user_message_channels_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."private_user_messages"
    ADD CONSTRAINT "private_user_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."private_user_seen_message_channels"
    ADD CONSTRAINT "private_user_seen_message_channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."private_users"
    ADD CONSTRAINT "private_users_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."private_users"
    ADD CONSTRAINT "private_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_causes"
    ADD CONSTRAINT "profile_causes_option_unique" UNIQUE ("profile_id", "option_id");



ALTER TABLE ONLY "public"."profile_causes"
    ADD CONSTRAINT "profile_causes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_interests"
    ADD CONSTRAINT "profile_interests_option_unique" UNIQUE ("profile_id", "option_id");



ALTER TABLE ONLY "public"."profile_interests"
    ADD CONSTRAINT "profile_interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_interests"
    ADD CONSTRAINT "profile_option_unique" UNIQUE ("profile_id", "option_id");



ALTER TABLE ONLY "public"."profile_spotlights"
    ADD CONSTRAINT "profile_spotlights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_work"
    ADD CONSTRAINT "profile_work_option_unique" UNIQUE ("profile_id", "option_id");



ALTER TABLE ONLY "public"."profile_work"
    ADD CONSTRAINT "profile_work_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE ("endpoint");



ALTER TABLE ONLY "public"."push_subscriptions_mobile"
    ADD CONSTRAINT "push_subscriptions_mobile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions_mobile"
    ADD CONSTRAINT "push_subscriptions_mobile_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("content_id");



ALTER TABLE ONLY "public"."review_prompts"
    ADD CONSTRAINT "review_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_alert_sends"
    ADD CONSTRAINT "search_alert_sends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."share_prompts"
    ADD CONSTRAINT "share_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unfinished_signups"
    ADD CONSTRAINT "unfinished_signups_pkey" PRIMARY KEY ("firebase_uid");



ALTER TABLE ONLY "public"."unfinished_signups"
    ADD CONSTRAINT "unfinished_signups_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."compatibility_answers"
    ADD CONSTRAINT "unique_question_creator" UNIQUE ("question_id", "creator_id");



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_events"
    ADD CONSTRAINT "user_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("notification_id", "user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vote_comment_edits"
    ADD CONSTRAINT "vote_comment_edits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vote_comments"
    ADD CONSTRAINT "vote_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vote_edits"
    ADD CONSTRAINT "vote_edits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vote_results"
    ADD CONSTRAINT "vote_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vote_results"
    ADD CONSTRAINT "vote_results_user_id_vote_id_key" UNIQUE ("user_id", "vote_id");



ALTER TABLE ONLY "public"."vote_subscriptions"
    ADD CONSTRAINT "vote_subscriptions_pkey" PRIMARY KEY ("user_id", "vote_id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_aliases"
    ADD CONSTRAINT "work_aliases_pkey" PRIMARY KEY ("option_id", "alias");



ALTER TABLE ONLY "public"."work"
    ADD CONSTRAINT "work_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_translations"
    ADD CONSTRAINT "work_translations_pkey" PRIMARY KEY ("option_id", "locale");



CREATE INDEX "profile_causes_profile_id_idx" ON "profile_snapshot"."profile_causes" USING "btree" ("profile_id");



CREATE INDEX "profile_interests_profile_id_idx" ON "profile_snapshot"."profile_interests" USING "btree" ("profile_id");



CREATE INDEX "profile_work_profile_id_idx" ON "profile_snapshot"."profile_work" USING "btree" ("profile_id");



CREATE INDEX "profiles_id_idx" ON "profile_snapshot"."profiles" USING "btree" ("id");



CREATE INDEX "profiles_user_id_idx" ON "profile_snapshot"."profiles" USING "btree" ("user_id");



CREATE INDEX "users_id_idx" ON "profile_snapshot"."users" USING "btree" ("id");



CREATE INDEX "banned_networks_device_token" ON "public"."banned_networks" USING "btree" ("device_token") WHERE ("device_token" IS NOT NULL);



CREATE INDEX "banned_networks_network" ON "public"."banned_networks" USING "gist" ("network" "inet_ops");



CREATE INDEX "banned_networks_source_user_id" ON "public"."banned_networks" USING "btree" ("source_user_id") WHERE ("source_user_id" IS NOT NULL);



CREATE INDEX "bookmarked_searches_creator_id_created_time_idx" ON "public"."bookmarked_searches" USING "btree" ("creator_id", "created_time" DESC);



CREATE INDEX "bookmarked_searches_creator_id_idx" ON "public"."bookmarked_searches" USING "btree" ("creator_id");



CREATE INDEX "bookmarked_searches_search_name_idx" ON "public"."bookmarked_searches" USING "btree" ("search_name");



CREATE INDEX "compatibility_scores_score_desc_idx" ON "public"."compatibility_scores" USING "btree" ("score" DESC);



CREATE INDEX "compatibility_scores_user1_idx" ON "public"."compatibility_scores" USING "btree" ("user_id_1");



CREATE INDEX "compatibility_scores_user2_idx" ON "public"."compatibility_scores" USING "btree" ("user_id_2");



CREATE UNIQUE INDEX "compatibility_scores_user_pair_unique" ON "public"."compatibility_scores" USING "btree" ("user_id_1", "user_id_2");



CREATE INDEX "creator_id_idx" ON "public"."votes" USING "btree" ("creator_id");



CREATE INDEX "donations_user_time" ON "public"."donations" USING "btree" ("user_id", "donated_at" DESC);



CREATE INDEX "email_unsubscribe_tokens_created_at_idx" ON "public"."email_unsubscribe_tokens" USING "btree" ("created_at");



CREATE INDEX "email_unsubscribe_tokens_user_id_idx" ON "public"."email_unsubscribe_tokens" USING "btree" ("user_id");



CREATE INDEX "endpoint_idx" ON "public"."push_subscriptions" USING "btree" ("endpoint");



CREATE INDEX "endpoint_user_id_idx" ON "public"."push_subscriptions" USING "btree" ("endpoint", "user_id");



CREATE INDEX "hidden_profiles_hidden_idx" ON "public"."hidden_profiles" USING "btree" ("hidden_user_id");



CREATE INDEX "hidden_profiles_hider_idx" ON "public"."hidden_profiles" USING "btree" ("hider_user_id");



CREATE UNIQUE INDEX "hidden_profiles_unique_hider_hidden" ON "public"."hidden_profiles" USING "btree" ("hider_user_id", "hidden_user_id");



CREATE INDEX "idx_blog_posts_published" ON "public"."blog_posts" USING "btree" ("published_time" DESC) WHERE ("status" = 'published'::"text");



CREATE UNIQUE INDEX "idx_causes_aliases_lower" ON "public"."causes_aliases" USING "btree" ("lower"("alias"));



CREATE UNIQUE INDEX "idx_causes_name_lower" ON "public"."causes" USING "btree" ("lower"("name"));



CREATE INDEX "idx_causes_name_trgm" ON "public"."causes" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_causes_translations_name_trgm" ON "public"."causes_translations" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_causes_translations_option_locale" ON "public"."causes_translations" USING "btree" ("option_id", "locale");



CREATE INDEX "idx_causes_usage_count" ON "public"."causes" USING "btree" ("usage_count" DESC, "id");



CREATE INDEX "idx_ci_target_user_type" ON "public"."connection_interests" USING "btree" ("target_user_id", "user_id", "connection_type");



CREATE INDEX "idx_ci_user_target_type" ON "public"."connection_interests" USING "btree" ("user_id", "target_user_id", "connection_type");



CREATE INDEX "idx_compatibility_prompts_importance_counts" ON "public"."compatibility_prompts" USING "btree" ("answer_count" DESC, "community_importance_score" DESC);



CREATE INDEX "idx_compatibility_prompts_translations_locale" ON "public"."compatibility_prompts_translations" USING "btree" ("locale");



CREATE INDEX "idx_compatibility_prompts_translations_question_id" ON "public"."compatibility_prompts_translations" USING "btree" ("question_id");



CREATE INDEX "idx_cpp_user_created_time" ON "public"."compatibility_prompts_pinned" USING "btree" ("user_id", "created_time" DESC);



CREATE INDEX "idx_cpp_user_question" ON "public"."compatibility_prompts_pinned" USING "btree" ("user_id", "question_id");



CREATE INDEX "idx_cpt_locale" ON "public"."compatibility_prompts_translations" USING "btree" ("question_id", "locale");



CREATE INDEX "idx_creator_id" ON "public"."compatibility_answers" USING "btree" ("creator_id");



CREATE INDEX "idx_creator_id_importance" ON "public"."compatibility_answers" USING "btree" ("creator_id", "importance" DESC);



CREATE INDEX "idx_deleted_users_deleted_time" ON "public"."deleted_users" USING "btree" ("deleted_time");



CREATE INDEX "idx_deleted_users_reason_category" ON "public"."deleted_users" USING "btree" ("reason_category");



CREATE INDEX "idx_deleted_users_username" ON "public"."deleted_users" USING "btree" ("username");



CREATE INDEX "idx_events_creator" ON "public"."events" USING "btree" ("creator_id");



CREATE INDEX "idx_events_participants_event" ON "public"."events_participants" USING "btree" ("event_id");



CREATE INDEX "idx_events_participants_user" ON "public"."events_participants" USING "btree" ("user_id");



CREATE INDEX "idx_events_start_time" ON "public"."events" USING "btree" ("event_start_time");



CREATE INDEX "idx_events_status" ON "public"."events" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_interests_aliases_lower" ON "public"."interests_aliases" USING "btree" ("lower"("alias"));



CREATE UNIQUE INDEX "idx_interests_name_lower" ON "public"."interests" USING "btree" ("lower"("name"));



CREATE INDEX "idx_interests_name_trgm" ON "public"."interests" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_interests_translations_name_trgm" ON "public"."interests_translations" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_interests_translations_option_locale" ON "public"."interests_translations" USING "btree" ("option_id", "locale");



CREATE INDEX "idx_interests_usage_count" ON "public"."interests" USING "btree" ("usage_count" DESC, "id");



CREATE INDEX "idx_outreach_contacts_stage" ON "public"."outreach_contacts" USING "btree" ("stage");



CREATE INDEX "idx_profile_causes_interest" ON "public"."profile_causes" USING "btree" ("option_id");



CREATE INDEX "idx_profile_causes_profile" ON "public"."profile_causes" USING "btree" ("profile_id");



CREATE INDEX "idx_profile_interests_interest" ON "public"."profile_interests" USING "btree" ("option_id");



CREATE INDEX "idx_profile_interests_profile" ON "public"."profile_interests" USING "btree" ("profile_id");



CREATE UNIQUE INDEX "idx_profile_spotlights_one_per_user" ON "public"."profile_spotlights" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_profile_spotlights_status_rank" ON "public"."profile_spotlights" USING "btree" ("status", "featured_rank" DESC NULLS LAST, "created_time" DESC);



CREATE INDEX "idx_profile_work_interest" ON "public"."profile_work" USING "btree" ("option_id");



CREATE INDEX "idx_profile_work_profile" ON "public"."profile_work" USING "btree" ("profile_id");



CREATE INDEX "idx_profiles_bio_length" ON "public"."profiles" USING "btree" ("bio_length");



CREATE INDEX "idx_profiles_languages" ON "public"."profiles" USING "gin" ("languages");



CREATE INDEX "idx_profiles_last_mod_24h" ON "public"."profiles" USING "btree" ("last_modification_time");



CREATE INDEX "idx_profiles_mbti" ON "public"."profiles" USING "btree" ("mbti");



CREATE INDEX "idx_profiles_pref_max_distance" ON "public"."profiles" USING "btree" ("pref_max_distance");



CREATE INDEX "idx_profiles_referred_by_user_id" ON "public"."profiles" USING "btree" ("referred_by_user_id") WHERE ("referred_by_user_id" IS NOT NULL);



CREATE INDEX "idx_profiles_social_media_consent" ON "public"."profiles" USING "btree" ("user_id") WHERE ("social_media_consent" AND "spotlight_consent");



CREATE INDEX "idx_profiles_spotlight_consent" ON "public"."profiles" USING "btree" ("user_id") WHERE "spotlight_consent";



CREATE UNIQUE INDEX "idx_testimonials_one_per_author" ON "public"."testimonials" USING "btree" ("author_id") WHERE (("author_id" IS NOT NULL) AND ("status" <> 'rejected'::"text"));



CREATE INDEX "idx_testimonials_status_created" ON "public"."testimonials" USING "btree" ("status", "featured_rank" DESC NULLS LAST, "created_time" DESC);



CREATE INDEX "idx_user_activity_last_online_time" ON "public"."user_activity" USING "btree" ("last_online_time" DESC);



CREATE INDEX "idx_vote_results_vote_choice" ON "public"."vote_results" USING "btree" ("vote_id", "choice");



CREATE INDEX "idx_vote_results_vote_choice_priority" ON "public"."vote_results" USING "btree" ("vote_id", "choice", "priority");



CREATE INDEX "idx_votes_created_time" ON "public"."votes" USING "btree" ("created_time" DESC);



CREATE UNIQUE INDEX "idx_work_aliases_lower" ON "public"."work_aliases" USING "btree" ("lower"("alias"));



CREATE UNIQUE INDEX "idx_work_name_lower" ON "public"."work" USING "btree" ("lower"("name"));



CREATE INDEX "idx_work_name_trgm" ON "public"."work" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_work_translations_name_trgm" ON "public"."work_translations" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_work_translations_option_locale" ON "public"."work_translations" USING "btree" ("option_id", "locale");



CREATE INDEX "idx_work_usage_count" ON "public"."work" USING "btree" ("usage_count" DESC, "id");



CREATE INDEX "love_compatibility_answers_creator_id_created_time_idx" ON "public"."compatibility_answers" USING "btree" ("creator_id", "created_time" DESC);



CREATE UNIQUE INDEX "love_compatibility_answers_question_creator_unique" ON "public"."compatibility_answers" USING "btree" ("question_id", "creator_id");



CREATE INDEX "love_compatibility_answers_question_id_idx" ON "public"."compatibility_answers" USING "btree" ("question_id");



CREATE INDEX "love_ships_target1_id" ON "public"."profile_ships" USING "btree" ("target1_id");



CREATE INDEX "love_ships_target2_id" ON "public"."profile_ships" USING "btree" ("target2_id");



CREATE INDEX "love_stars_target_id_idx" ON "public"."profile_stars" USING "btree" ("target_id");



CREATE INDEX "lover_comments_user_id_idx" ON "public"."profile_comments" USING "btree" ("on_user_id");



CREATE INDEX "notification_template_translations_locale_idx" ON "public"."notification_template_translations" USING "btree" ("locale");



CREATE INDEX "notification_template_translations_template_id_idx" ON "public"."notification_template_translations" USING "btree" ("template_id");



CREATE INDEX "notification_templates_source_type_idx" ON "public"."notification_templates" USING "btree" ("source_type");



CREATE UNIQUE INDEX "outreach_sends_once_per_kind" ON "public"."outreach_sends" USING "btree" ("user_id", "kind");



CREATE INDEX "outreach_sends_user_kind_time" ON "public"."outreach_sends" USING "btree" ("user_id", "kind", "sent_at" DESC);



CREATE INDEX "platform_idx" ON "public"."push_subscriptions_mobile" USING "btree" ("platform");



CREATE INDEX "platform_user_id_idx" ON "public"."push_subscriptions_mobile" USING "btree" ("platform", "user_id");



CREATE UNIQUE INDEX "private_user_message_channels_pkey" ON "public"."private_user_message_channels" USING "btree" ("id");



CREATE INDEX "private_user_messages_channel_id_idx" ON "public"."private_user_messages" USING "btree" ("channel_id", "created_time" DESC);



CREATE INDEX "profiles_active_idx" ON "public"."profiles" USING "btree" ("created_time" DESC) WHERE (("looking_for_matches" = true) AND ("disabled" = false));



CREATE INDEX "profiles_age_idx" ON "public"."profiles" USING "btree" ("age");



CREATE INDEX "profiles_big5_agree_idx" ON "public"."profiles" USING "btree" ("big5_agreeableness");



CREATE INDEX "profiles_big5_cons_idx" ON "public"."profiles" USING "btree" ("big5_conscientiousness");



CREATE INDEX "profiles_big5_extra_idx" ON "public"."profiles" USING "btree" ("big5_extraversion");



CREATE INDEX "profiles_big5_neur_idx" ON "public"."profiles" USING "btree" ("big5_neuroticism");



CREATE INDEX "profiles_big5_open_idx" ON "public"."profiles" USING "btree" ("big5_openness");



CREATE INDEX "profiles_bio_trgm_idx" ON "public"."profiles" USING "gin" ((("bio")::"text") "public"."gin_trgm_ops");



CREATE INDEX "profiles_bio_tsv_idx" ON "public"."profiles" USING "gin" ("bio_tsv");



CREATE INDEX "profiles_birth_date_idx" ON "public"."profiles" USING "btree" ("birth_date");



CREATE INDEX "profiles_cannabis_idx" ON "public"."profiles" USING "btree" ("cannabis");



CREATE INDEX "profiles_cannabis_intention_gin" ON "public"."profiles" USING "gin" ("cannabis_intention");



CREATE INDEX "profiles_cannabis_pref_gin" ON "public"."profiles" USING "gin" ("cannabis_pref");



CREATE INDEX "profiles_diet_gin" ON "public"."profiles" USING "gin" ("diet");



CREATE INDEX "profiles_drinks_idx" ON "public"."profiles" USING "btree" ("drinks_per_month");



CREATE INDEX "profiles_education_level_idx" ON "public"."profiles" USING "btree" ("education_level");



CREATE INDEX "profiles_ethnicity_gin" ON "public"."profiles" USING "gin" ("ethnicity");



CREATE INDEX "profiles_exercise_idx" ON "public"."profiles" USING "btree" ("exercise");



CREATE INDEX "profiles_feed_idx" ON "public"."profiles" USING "btree" ("created_time" DESC) WHERE (("visibility" = 'public'::"public"."profile_visibility") AND ("feed_visibility" <> 'none'::"public"."profile_feed_visibility") AND ("disabled" = false) AND ("looking_for_matches" = true));



CREATE INDEX "profiles_gender_idx" ON "public"."profiles" USING "btree" ("gender");



CREATE INDEX "profiles_geodb_city_idx" ON "public"."profiles" USING "btree" ("geodb_city_id");



CREATE INDEX "profiles_has_kids_idx" ON "public"."profiles" USING "btree" ("has_kids");



CREATE INDEX "profiles_languages_gin" ON "public"."profiles" USING "gin" ("languages");



CREATE INDEX "profiles_lat_lon_brin_idx" ON "public"."profiles" USING "brin" ("city_latitude", "city_longitude") WITH ("pages_per_range"='32');



CREATE INDEX "profiles_lat_lon_idx" ON "public"."profiles" USING "btree" ("city_latitude", "city_longitude");



CREATE INDEX "profiles_neurotype_gin" ON "public"."profiles" USING "gin" ("neurotype");



CREATE INDEX "profiles_orientation_gin" ON "public"."profiles" USING "gin" ("orientation");



CREATE INDEX "profiles_political_beliefs_gin" ON "public"."profiles" USING "gin" ("political_beliefs");



CREATE INDEX "profiles_pref_gender_gin" ON "public"."profiles" USING "gin" ("pref_gender");



CREATE INDEX "profiles_pref_relation_styles_gin" ON "public"."profiles" USING "gin" ("pref_relation_styles");



CREATE INDEX "profiles_pref_romantic_styles_gin" ON "public"."profiles" USING "gin" ("pref_romantic_styles");



CREATE INDEX "profiles_psychedelics_idx" ON "public"."profiles" USING "btree" ("psychedelics");



CREATE INDEX "profiles_psychedelics_intention_gin" ON "public"."profiles" USING "gin" ("psychedelics_intention");



CREATE INDEX "profiles_psychedelics_pref_gin" ON "public"."profiles" USING "gin" ("psychedelics_pref");



CREATE INDEX "profiles_raised_in_geodb_city_idx" ON "public"."profiles" USING "btree" ("raised_in_geodb_city_id");



CREATE INDEX "profiles_recent_active_idx" ON "public"."profiles" USING "btree" ("last_modification_time" DESC) WHERE (("looking_for_matches" = true) AND ("disabled" = false));



CREATE INDEX "profiles_relationship_status_gin" ON "public"."profiles" USING "gin" ("relationship_status");



CREATE INDEX "profiles_religion_gin" ON "public"."profiles" USING "gin" ("religion");



CREATE INDEX "profiles_smoker_idx" ON "public"."profiles" USING "btree" ("is_smoker");



CREATE INDEX "profiles_user_id_idx" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "profiles_wants_kids_idx" ON "public"."profiles" USING "btree" ("wants_kids_strength");



CREATE INDEX "pumcm_members_idx" ON "public"."private_user_message_channel_members" USING "btree" ("channel_id", "user_id");



CREATE INDEX "review_prompts_user_time" ON "public"."review_prompts" USING "btree" ("user_id", "prompted_at" DESC);



CREATE INDEX "search_alert_sends_creator_time" ON "public"."search_alert_sends" USING "btree" ("creator_id", "created_time" DESC);



CREATE INDEX "share_prompts_user_time" ON "public"."share_prompts" USING "btree" ("user_id", "prompted_at" DESC);



CREATE INDEX "unfinished_signups_pending" ON "public"."unfinished_signups" USING "btree" ("notified_at") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "unique_user_channel" ON "public"."private_user_message_channel_members" USING "btree" ("channel_id", "user_id");



CREATE UNIQUE INDEX "unique_user_id" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "user_events_ts" ON "public"."user_events" USING "btree" ("ts" DESC);



CREATE INDEX "user_id_idx" ON "public"."push_subscriptions" USING "btree" ("user_id");



CREATE INDEX "user_likes_target_id_raw" ON "public"."profile_likes" USING "btree" ("target_id");



CREATE INDEX "user_notifications_template_id_idx" ON "public"."user_notifications" USING "btree" ("template_id");



CREATE INDEX "user_notifications_user_id_created_time" ON "public"."user_notifications" USING "btree" ("user_id", ((("data" ->> 'createdTime'::"text"))::bigint) DESC);



CREATE INDEX "user_seen_private_messages_created_time_desc_idx" ON "public"."private_user_seen_message_channels" USING "btree" ("user_id", "channel_id", "created_time" DESC);



CREATE INDEX "user_username_idx" ON "public"."users" USING "btree" ("username");



CREATE INDEX "users_created_time" ON "public"."users" USING "btree" ("created_time" DESC);



CREATE INDEX "users_name_idx" ON "public"."users" USING "btree" ("name");



CREATE INDEX "users_name_trgm_idx" ON "public"."users" USING "gin" ("lower"("name") "public"."gin_trgm_ops");



CREATE INDEX "vote_comment_edits_comment_id_idx" ON "public"."vote_comment_edits" USING "btree" ("comment_id", "created_time");



CREATE INDEX "vote_comments_reply_to_comment_id_idx" ON "public"."vote_comments" USING "btree" ("reply_to_comment_id") WHERE ("reply_to_comment_id" IS NOT NULL);



CREATE INDEX "vote_comments_user_id_idx" ON "public"."vote_comments" USING "btree" ("user_id");



CREATE INDEX "vote_comments_vote_id_idx" ON "public"."vote_comments" USING "btree" ("vote_id", "created_time");



CREATE INDEX "vote_edits_vote_id_idx" ON "public"."vote_edits" USING "btree" ("vote_id", "created_time");



CREATE INDEX "vote_id_idx" ON "public"."vote_results" USING "btree" ("vote_id");



CREATE OR REPLACE TRIGGER "profiles_sync_age_trigger" BEFORE INSERT OR UPDATE OF "birth_date", "age" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."profiles_sync_age"();



CREATE OR REPLACE TRIGGER "set_modified_time_compat_scores_trigger" BEFORE UPDATE ON "public"."compatibility_scores" FOR EACH ROW EXECUTE FUNCTION "public"."set_modified_time_compat_scores"();



CREATE OR REPLACE TRIGGER "trg_causes_name_search_upd" AFTER UPDATE OF "name" ON "public"."causes" FOR EACH ROW WHEN (("old"."name" IS DISTINCT FROM "new"."name")) EXECUTE FUNCTION "public"."trg_causes_name_rebuild_search"();



CREATE OR REPLACE TRIGGER "trg_interests_name_search_upd" AFTER UPDATE OF "name" ON "public"."interests" FOR EACH ROW WHEN (("old"."name" IS DISTINCT FROM "new"."name")) EXECUTE FUNCTION "public"."trg_interests_name_rebuild_search"();



CREATE OR REPLACE TRIGGER "trg_profile_causes_search_del" AFTER DELETE ON "public"."profile_causes" FOR EACH ROW EXECUTE FUNCTION "public"."trg_profile_causes_rebuild_search"();



CREATE OR REPLACE TRIGGER "trg_profile_causes_search_ins" AFTER INSERT ON "public"."profile_causes" FOR EACH ROW EXECUTE FUNCTION "public"."trg_profile_causes_rebuild_search"();



CREATE OR REPLACE TRIGGER "trg_profile_causes_usage_del" AFTER DELETE ON "public"."profile_causes" FOR EACH ROW EXECUTE FUNCTION "public"."trg_profile_causes_usage_count"();



CREATE OR REPLACE TRIGGER "trg_profile_causes_usage_ins" AFTER INSERT ON "public"."profile_causes" FOR EACH ROW EXECUTE FUNCTION "public"."trg_profile_causes_usage_count"();



CREATE OR REPLACE TRIGGER "trg_profile_interests_search_del" AFTER DELETE ON "public"."profile_interests" FOR EACH ROW EXECUTE FUNCTION "public"."trg_profile_interests_rebuild_search"();



CREATE OR REPLACE TRIGGER "trg_profile_interests_search_ins" AFTER INSERT ON "public"."profile_interests" FOR EACH ROW EXECUTE FUNCTION "public"."trg_profile_interests_rebuild_search"();



CREATE OR REPLACE TRIGGER "trg_profile_interests_usage_del" AFTER DELETE ON "public"."profile_interests" FOR EACH ROW EXECUTE FUNCTION "public"."trg_profile_interests_usage_count"();



CREATE OR REPLACE TRIGGER "trg_profile_interests_usage_ins" AFTER INSERT ON "public"."profile_interests" FOR EACH ROW EXECUTE FUNCTION "public"."trg_profile_interests_usage_count"();



CREATE OR REPLACE TRIGGER "trg_profile_work_search_del" AFTER DELETE ON "public"."profile_work" FOR EACH ROW EXECUTE FUNCTION "public"."trg_profile_work_rebuild_search"();



CREATE OR REPLACE TRIGGER "trg_profile_work_search_ins" AFTER INSERT ON "public"."profile_work" FOR EACH ROW EXECUTE FUNCTION "public"."trg_profile_work_rebuild_search"();



CREATE OR REPLACE TRIGGER "trg_profile_work_usage_del" AFTER DELETE ON "public"."profile_work" FOR EACH ROW EXECUTE FUNCTION "public"."trg_profile_work_usage_count"();



CREATE OR REPLACE TRIGGER "trg_profile_work_usage_ins" AFTER INSERT ON "public"."profile_work" FOR EACH ROW EXECUTE FUNCTION "public"."trg_profile_work_usage_count"();



CREATE OR REPLACE TRIGGER "trg_profiles_rebuild_search" AFTER INSERT OR UPDATE OF "headline", "occupation", "occupation_title", "company", "university", "city", "country", "born_in_location", "raised_in_city", "raised_in_country", "political_details", "religious_beliefs", "bio" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."trg_profiles_rebuild_search"();



CREATE OR REPLACE TRIGGER "trg_work_name_search_upd" AFTER UPDATE OF "name" ON "public"."work" FOR EACH ROW WHEN (("old"."name" IS DISTINCT FROM "new"."name")) EXECUTE FUNCTION "public"."trg_work_name_rebuild_search"();



CREATE OR REPLACE TRIGGER "trigger_update_last_mod_time" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_last_modification_time"();



CREATE OR REPLACE TRIGGER "update_compatibility_prompts_translations_updated_at" BEFORE UPDATE ON "public"."compatibility_prompts_translations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."banned_networks"
    ADD CONSTRAINT "banned_networks_source_user_id_fkey" FOREIGN KEY ("source_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookmarked_searches"
    ADD CONSTRAINT "bookmarked_searches_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."causes_aliases"
    ADD CONSTRAINT "causes_aliases_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."causes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."causes"
    ADD CONSTRAINT "causes_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."causes_translations"
    ADD CONSTRAINT "causes_translations_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."causes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."private_user_message_channel_members"
    ADD CONSTRAINT "channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."private_user_message_channels"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."private_user_seen_message_channels"
    ADD CONSTRAINT "channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."private_user_message_channels"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compatibility_answers"
    ADD CONSTRAINT "compatibility_answers_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compatibility_answers"
    ADD CONSTRAINT "compatibility_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."compatibility_prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compatibility_prompts"
    ADD CONSTRAINT "compatibility_prompts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."compatibility_prompts_pinned"
    ADD CONSTRAINT "compatibility_prompts_pinned_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."compatibility_prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compatibility_prompts_pinned"
    ADD CONSTRAINT "compatibility_prompts_pinned_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compatibility_scores"
    ADD CONSTRAINT "compatibility_scores_user_id_1_fkey" FOREIGN KEY ("user_id_1") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compatibility_scores"
    ADD CONSTRAINT "compatibility_scores_user_id_2_fkey" FOREIGN KEY ("user_id_2") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connection_interests"
    ADD CONSTRAINT "connection_interests_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connection_interests"
    ADD CONSTRAINT "connection_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact"
    ADD CONSTRAINT "contact_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."donations"
    ADD CONSTRAINT "donations_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."donations"
    ADD CONSTRAINT "donations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_unsubscribe_tokens"
    ADD CONSTRAINT "email_unsubscribe_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events_participants"
    ADD CONSTRAINT "events_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events_participants"
    ADD CONSTRAINT "events_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hidden_profiles"
    ADD CONSTRAINT "fk_hidden_profiles_hidden" FOREIGN KEY ("hidden_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hidden_profiles"
    ADD CONSTRAINT "fk_hidden_profiles_hider" FOREIGN KEY ("hider_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compatibility_prompts_translations"
    ADD CONSTRAINT "fk_question" FOREIGN KEY ("question_id") REFERENCES "public"."compatibility_prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interests_aliases"
    ADD CONSTRAINT "interests_aliases_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."interests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interests"
    ADD CONSTRAINT "interests_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interests_translations"
    ADD CONSTRAINT "interests_translations_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."interests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_template_translations"
    ADD CONSTRAINT "notification_template_translations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outreach_contacts"
    ADD CONSTRAINT "outreach_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outreach_sends"
    ADD CONSTRAINT "outreach_sends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."private_user_message_channel_members"
    ADD CONSTRAINT "private_user_message_channel_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."private_user_messages"
    ADD CONSTRAINT "private_user_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."private_user_message_channels"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."private_user_messages"
    ADD CONSTRAINT "private_user_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."private_user_seen_message_channels"
    ADD CONSTRAINT "private_user_seen_message_channels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."private_users"
    ADD CONSTRAINT "private_users_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_causes"
    ADD CONSTRAINT "profile_causes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."causes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_causes"
    ADD CONSTRAINT "profile_causes_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_comments"
    ADD CONSTRAINT "profile_comments_on_user_id_fkey" FOREIGN KEY ("on_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_comments"
    ADD CONSTRAINT "profile_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_interests"
    ADD CONSTRAINT "profile_interests_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."interests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_interests"
    ADD CONSTRAINT "profile_interests_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_likes"
    ADD CONSTRAINT "profile_likes_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_likes"
    ADD CONSTRAINT "profile_likes_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_ships"
    ADD CONSTRAINT "profile_ships_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_ships"
    ADD CONSTRAINT "profile_ships_target1_id_fkey" FOREIGN KEY ("target1_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_ships"
    ADD CONSTRAINT "profile_ships_target2_id_fkey" FOREIGN KEY ("target2_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_spotlights"
    ADD CONSTRAINT "profile_spotlights_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profile_spotlights"
    ADD CONSTRAINT "profile_spotlights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profile_stars"
    ADD CONSTRAINT "profile_stars_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_stars"
    ADD CONSTRAINT "profile_stars_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_work"
    ADD CONSTRAINT "profile_work_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."work"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_work"
    ADD CONSTRAINT "profile_work_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referred_by_user_id_fkey" FOREIGN KEY ("referred_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions_mobile"
    ADD CONSTRAINT "push_subscriptions_mobile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_content_owner_id_fkey" FOREIGN KEY ("content_owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."review_prompts"
    ADD CONSTRAINT "review_prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."search_alert_sends"
    ADD CONSTRAINT "search_alert_sends_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."share_prompts"
    ADD CONSTRAINT "share_prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_events"
    ADD CONSTRAINT "user_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vote_comment_edits"
    ADD CONSTRAINT "vote_comment_edits_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."vote_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vote_comments"
    ADD CONSTRAINT "vote_comments_reply_to_comment_id_fkey" FOREIGN KEY ("reply_to_comment_id") REFERENCES "public"."vote_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vote_comments"
    ADD CONSTRAINT "vote_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vote_comments"
    ADD CONSTRAINT "vote_comments_vote_id_fkey" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vote_edits"
    ADD CONSTRAINT "vote_edits_vote_id_fkey" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vote_results"
    ADD CONSTRAINT "vote_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vote_results"
    ADD CONSTRAINT "vote_results_vote_id_fkey" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id");



ALTER TABLE ONLY "public"."vote_subscriptions"
    ADD CONSTRAINT "vote_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vote_subscriptions"
    ADD CONSTRAINT "vote_subscriptions_vote_id_fkey" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."work_aliases"
    ADD CONSTRAINT "work_aliases_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."work"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work"
    ADD CONSTRAINT "work_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."work_translations"
    ADD CONSTRAINT "work_translations_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."work"("id") ON DELETE CASCADE;



CREATE POLICY "anyone can insert" ON "public"."user_events" FOR INSERT TO "anon" WITH CHECK (true);



ALTER TABLE "public"."banned_networks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookmarked_searches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."causes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."causes_aliases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."causes_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compatibility_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compatibility_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compatibility_prompts_pinned" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compatibility_prompts_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compatibility_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."connection_interests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deleted_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."donations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_unsubscribe_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "events select" ON "public"."events" FOR SELECT USING (("is_public" = true));



ALTER TABLE "public"."events_participants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "events_participants select" ON "public"."events_participants" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "events_participants"."event_id") AND ("e"."is_public" = true)))));



ALTER TABLE "public"."hidden_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interests_aliases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interests_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_template_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."outreach_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."outreach_sends" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."private_user_message_channel_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."private_user_message_channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."private_user_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."private_user_seen_message_channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."private_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_causes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_interests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_ships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_spotlights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_stars" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_work" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public read" ON "public"."causes" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."causes_aliases" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."causes_translations" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."compatibility_prompts" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."compatibility_prompts_translations" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."interests" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."interests_aliases" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."interests_translations" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."notification_template_translations" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."notification_templates" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."profile_causes" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."profile_interests" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."profile_work" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."vote_comment_edits" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."vote_comments" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."vote_edits" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."work" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."work_aliases" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."work_translations" FOR SELECT USING (true);



ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."push_subscriptions_mobile" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."search_alert_sends" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."share_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."testimonials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unfinished_signups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vote_comment_edits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vote_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vote_edits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vote_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vote_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_aliases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_translations" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."calculate_earth_distance_km"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_earth_distance_km"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_earth_distance_km"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_private_messages"("channel_id" bigint, "user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_private_messages"("channel_id" bigint, "user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_private_messages"("channel_id" bigint, "user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."firebase_uid"() TO "anon";
GRANT ALL ON FUNCTION "public"."firebase_uid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."firebase_uid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_average_rating"("user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_average_rating"("user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_average_rating"("user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_display_users"("ids" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_display_users"("ids" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_display_users"("ids" "text"[]) TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."profiles" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_by_user_id"("uid" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profile_by_user_id"("uid" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_by_user_id"("uid" "text") TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."user_activity" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."user_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_activity"("uid" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_activity"("uid" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_activity"("uid" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vote_commenter_choices"("vid" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_vote_commenter_choices"("vid" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vote_commenter_choices"("vid" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_votes_with_results"("order_by" "text", "only_vote_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_votes_with_results"("order_by" "text", "only_vote_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_votes_with_results"("order_by" "text", "only_vote_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."lovers_bio_tsvector_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."lovers_bio_tsvector_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."lovers_bio_tsvector_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."millis_interval"("start_millis" bigint, "end_millis" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."millis_interval"("start_millis" bigint, "end_millis" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."millis_interval"("start_millis" bigint, "end_millis" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."millis_to_ts"("millis" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."millis_to_ts"("millis" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."millis_to_ts"("millis" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_option_name"("raw" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_option_name"("raw" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_option_name"("raw" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."profile_age"("birth_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."profile_age"("birth_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."profile_age"("birth_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."profiles_sync_age"() TO "anon";
GRANT ALL ON FUNCTION "public"."profiles_sync_age"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."profiles_sync_age"() TO "service_role";



GRANT ALL ON FUNCTION "public"."random_alphanumeric"("length" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."random_alphanumeric"("length" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."random_alphanumeric"("length" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."rebuild_profile_search"("profile_id_param" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."rebuild_profile_search"("profile_id_param" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."rebuild_profile_search"("profile_id_param" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_profile_ages"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_profile_ages"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_profile_ages"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_modified_time_compat_scores"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_modified_time_compat_scores"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_modified_time_compat_scores"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."to_jsonb"("jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."to_jsonb"("jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."to_jsonb"("jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."top_argument"("vote_id_param" bigint, "stance_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."top_argument"("vote_id_param" bigint, "stance_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."top_argument"("vote_id_param" bigint, "stance_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_causes_name_rebuild_search"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_causes_name_rebuild_search"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_causes_name_rebuild_search"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_interests_name_rebuild_search"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_interests_name_rebuild_search"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_interests_name_rebuild_search"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_profile_causes_rebuild_search"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_profile_causes_rebuild_search"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_profile_causes_rebuild_search"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_profile_causes_usage_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_profile_causes_usage_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_profile_causes_usage_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_profile_interests_rebuild_search"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_profile_interests_rebuild_search"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_profile_interests_rebuild_search"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_profile_interests_usage_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_profile_interests_usage_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_profile_interests_usage_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_profile_work_rebuild_search"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_profile_work_rebuild_search"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_profile_work_rebuild_search"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_profile_work_usage_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_profile_work_usage_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_profile_work_usage_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_profiles_rebuild_search"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_profiles_rebuild_search"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_profiles_rebuild_search"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_work_name_rebuild_search"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_work_name_rebuild_search"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_work_name_rebuild_search"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_compatibility_prompt_community_importance_score"("p_question_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."update_compatibility_prompt_community_importance_score"("p_question_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_compatibility_prompt_community_importance_score"("p_question_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_last_modification_time"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_last_modification_time"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_last_modification_time"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."banned_networks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."banned_networks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."banned_networks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."banned_networks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."blog_posts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."blog_posts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."blog_posts_id_seq" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."bookmarked_searches" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."bookmarked_searches" TO "authenticated";
GRANT ALL ON TABLE "public"."bookmarked_searches" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bookmarked_searches_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bookmarked_searches_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bookmarked_searches_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."causes" TO "anon";
GRANT ALL ON TABLE "public"."causes" TO "authenticated";
GRANT ALL ON TABLE "public"."causes" TO "service_role";



GRANT ALL ON TABLE "public"."causes_aliases" TO "anon";
GRANT ALL ON TABLE "public"."causes_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."causes_aliases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."causes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."causes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."causes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."causes_translations" TO "anon";
GRANT ALL ON TABLE "public"."causes_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."causes_translations" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."compatibility_answers" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."compatibility_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."compatibility_answers" TO "service_role";



GRANT ALL ON TABLE "public"."compatibility_prompts" TO "anon";
GRANT ALL ON TABLE "public"."compatibility_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."compatibility_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."compatibility_prompts_pinned" TO "anon";
GRANT ALL ON TABLE "public"."compatibility_prompts_pinned" TO "authenticated";
GRANT ALL ON TABLE "public"."compatibility_prompts_pinned" TO "service_role";



GRANT ALL ON SEQUENCE "public"."compatibility_prompts_pinned_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."compatibility_prompts_pinned_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."compatibility_prompts_pinned_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."compatibility_prompts_translations" TO "anon";
GRANT ALL ON TABLE "public"."compatibility_prompts_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."compatibility_prompts_translations" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."compatibility_scores" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."compatibility_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."compatibility_scores" TO "service_role";



GRANT ALL ON SEQUENCE "public"."compatibility_scores_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."compatibility_scores_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."compatibility_scores_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."connection_interests" TO "anon";
GRANT ALL ON TABLE "public"."connection_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."connection_interests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."connection_interests_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."connection_interests_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."connection_interests_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."contact" TO "anon";
GRANT ALL ON TABLE "public"."contact" TO "authenticated";
GRANT ALL ON TABLE "public"."contact" TO "service_role";



GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."deleted_users" TO "anon";
GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."deleted_users" TO "authenticated";
GRANT ALL ON TABLE "public"."deleted_users" TO "service_role";



GRANT ALL ON TABLE "public"."donations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."donations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."donations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."donations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."email_unsubscribe_tokens" TO "anon";
GRANT ALL ON TABLE "public"."email_unsubscribe_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."email_unsubscribe_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."events_participants" TO "anon";
GRANT ALL ON TABLE "public"."events_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."events_participants" TO "service_role";



GRANT ALL ON TABLE "public"."hidden_profiles" TO "anon";
GRANT ALL ON TABLE "public"."hidden_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."hidden_profiles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."hidden_profiles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."hidden_profiles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."hidden_profiles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."interests" TO "anon";
GRANT ALL ON TABLE "public"."interests" TO "authenticated";
GRANT ALL ON TABLE "public"."interests" TO "service_role";



GRANT ALL ON TABLE "public"."interests_aliases" TO "anon";
GRANT ALL ON TABLE "public"."interests_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."interests_aliases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."interests_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."interests_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."interests_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."interests_translations" TO "anon";
GRANT ALL ON TABLE "public"."interests_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."interests_translations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."love_compatibility_answers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."love_compatibility_answers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."love_compatibility_answers_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."love_questions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."love_questions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."love_questions_id_seq" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."profile_comments" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."profile_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_comments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lover_comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lover_comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lover_comments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notification_template_translations" TO "anon";
GRANT ALL ON TABLE "public"."notification_template_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_template_translations" TO "service_role";



GRANT ALL ON TABLE "public"."notification_templates" TO "anon";
GRANT ALL ON TABLE "public"."notification_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_templates" TO "service_role";



GRANT ALL ON TABLE "public"."outreach_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."outreach_sends" TO "anon";
GRANT ALL ON TABLE "public"."outreach_sends" TO "authenticated";
GRANT ALL ON TABLE "public"."outreach_sends" TO "service_role";



GRANT ALL ON SEQUENCE "public"."outreach_sends_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."outreach_sends_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."outreach_sends_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."private_user_message_channel_members" TO "anon";
GRANT ALL ON TABLE "public"."private_user_message_channel_members" TO "authenticated";
GRANT ALL ON TABLE "public"."private_user_message_channel_members" TO "service_role";



GRANT ALL ON SEQUENCE "public"."private_user_message_channel_members_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."private_user_message_channel_members_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."private_user_message_channel_members_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."private_user_message_channels" TO "anon";
GRANT ALL ON TABLE "public"."private_user_message_channels" TO "authenticated";
GRANT ALL ON TABLE "public"."private_user_message_channels" TO "service_role";



GRANT ALL ON SEQUENCE "public"."private_user_message_channels_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."private_user_message_channels_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."private_user_message_channels_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."private_user_messages" TO "anon";
GRANT ALL ON TABLE "public"."private_user_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."private_user_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."private_user_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."private_user_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."private_user_messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."private_user_seen_message_channels" TO "anon";
GRANT ALL ON TABLE "public"."private_user_seen_message_channels" TO "authenticated";
GRANT ALL ON TABLE "public"."private_user_seen_message_channels" TO "service_role";



GRANT ALL ON SEQUENCE "public"."private_user_seen_message_channels_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."private_user_seen_message_channels_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."private_user_seen_message_channels_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."private_users" TO "anon";
GRANT ALL ON TABLE "public"."private_users" TO "authenticated";
GRANT ALL ON TABLE "public"."private_users" TO "service_role";



GRANT ALL ON TABLE "public"."profile_causes" TO "anon";
GRANT ALL ON TABLE "public"."profile_causes" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_causes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profile_causes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profile_causes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profile_causes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profile_interests" TO "anon";
GRANT ALL ON TABLE "public"."profile_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_interests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profile_interests_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profile_interests_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profile_interests_id_seq" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."profile_likes" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."profile_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_likes" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."profile_ships" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."profile_ships" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_ships" TO "service_role";



GRANT ALL ON TABLE "public"."profile_spotlights" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profile_spotlights_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profile_spotlights_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profile_spotlights_id_seq" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."profile_stars" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."profile_stars" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_stars" TO "service_role";



GRANT ALL ON TABLE "public"."profile_work" TO "anon";
GRANT ALL ON TABLE "public"."profile_work" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_work" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profile_work_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profile_work_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profile_work_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."push_subscriptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."push_subscriptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."push_subscriptions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions_mobile" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions_mobile" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions_mobile" TO "service_role";



GRANT ALL ON SEQUENCE "public"."push_subscriptions_mobile_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."push_subscriptions_mobile_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."push_subscriptions_mobile_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."review_prompts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."review_prompts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."review_prompts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."review_prompts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."search_alert_sends" TO "anon";
GRANT ALL ON TABLE "public"."search_alert_sends" TO "authenticated";
GRANT ALL ON TABLE "public"."search_alert_sends" TO "service_role";



GRANT ALL ON SEQUENCE "public"."search_alert_sends_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."search_alert_sends_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."search_alert_sends_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."share_prompts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."share_prompts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."share_prompts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."share_prompts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."testimonials" TO "service_role";



GRANT ALL ON SEQUENCE "public"."testimonials_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."testimonials_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."testimonials_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."unfinished_signups" TO "anon";
GRANT ALL ON TABLE "public"."unfinished_signups" TO "authenticated";
GRANT ALL ON TABLE "public"."unfinished_signups" TO "service_role";



GRANT ALL ON TABLE "public"."user_events" TO "anon";
GRANT ALL ON TABLE "public"."user_events" TO "authenticated";
GRANT ALL ON TABLE "public"."user_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_events_id_seq" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."user_notifications" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."user_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."user_notifications" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."users" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vote_comment_edits" TO "anon";
GRANT ALL ON TABLE "public"."vote_comment_edits" TO "authenticated";
GRANT ALL ON TABLE "public"."vote_comment_edits" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vote_comment_edits_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vote_comment_edits_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vote_comment_edits_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vote_comments" TO "anon";
GRANT ALL ON TABLE "public"."vote_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."vote_comments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vote_comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vote_comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vote_comments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vote_edits" TO "anon";
GRANT ALL ON TABLE "public"."vote_edits" TO "authenticated";
GRANT ALL ON TABLE "public"."vote_edits" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vote_edits_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vote_edits_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vote_edits_id_seq" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."vote_results" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."vote_results" TO "authenticated";
GRANT ALL ON TABLE "public"."vote_results" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vote_results_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vote_results_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vote_results_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vote_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."vote_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."vote_subscriptions" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."votes" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."votes" TO "authenticated";
GRANT ALL ON TABLE "public"."votes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."votes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."votes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."votes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."work" TO "anon";
GRANT ALL ON TABLE "public"."work" TO "authenticated";
GRANT ALL ON TABLE "public"."work" TO "service_role";



GRANT ALL ON TABLE "public"."work_aliases" TO "anon";
GRANT ALL ON TABLE "public"."work_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."work_aliases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."work_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."work_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."work_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."work_translations" TO "anon";
GRANT ALL ON TABLE "public"."work_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."work_translations" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

revoke delete on table "public"."banned_networks" from "anon";

revoke insert on table "public"."banned_networks" from "anon";

revoke references on table "public"."banned_networks" from "anon";

revoke select on table "public"."banned_networks" from "anon";

revoke trigger on table "public"."banned_networks" from "anon";

revoke truncate on table "public"."banned_networks" from "anon";

revoke update on table "public"."banned_networks" from "anon";

revoke delete on table "public"."banned_networks" from "authenticated";

revoke insert on table "public"."banned_networks" from "authenticated";

revoke references on table "public"."banned_networks" from "authenticated";

revoke select on table "public"."banned_networks" from "authenticated";

revoke trigger on table "public"."banned_networks" from "authenticated";

revoke truncate on table "public"."banned_networks" from "authenticated";

revoke update on table "public"."banned_networks" from "authenticated";

revoke delete on table "public"."blog_posts" from "anon";

revoke insert on table "public"."blog_posts" from "anon";

revoke references on table "public"."blog_posts" from "anon";

revoke select on table "public"."blog_posts" from "anon";

revoke trigger on table "public"."blog_posts" from "anon";

revoke truncate on table "public"."blog_posts" from "anon";

revoke update on table "public"."blog_posts" from "anon";

revoke delete on table "public"."blog_posts" from "authenticated";

revoke insert on table "public"."blog_posts" from "authenticated";

revoke references on table "public"."blog_posts" from "authenticated";

revoke select on table "public"."blog_posts" from "authenticated";

revoke trigger on table "public"."blog_posts" from "authenticated";

revoke truncate on table "public"."blog_posts" from "authenticated";

revoke update on table "public"."blog_posts" from "authenticated";

revoke select on table "public"."bookmarked_searches" from "anon";

revoke select on table "public"."bookmarked_searches" from "authenticated";

revoke select on table "public"."compatibility_answers" from "anon";

revoke select on table "public"."compatibility_answers" from "authenticated";

revoke select on table "public"."compatibility_scores" from "anon";

revoke select on table "public"."compatibility_scores" from "authenticated";

revoke insert on table "public"."deleted_users" from "anon";

revoke insert on table "public"."deleted_users" from "authenticated";

revoke delete on table "public"."donations" from "anon";

revoke insert on table "public"."donations" from "anon";

revoke references on table "public"."donations" from "anon";

revoke select on table "public"."donations" from "anon";

revoke trigger on table "public"."donations" from "anon";

revoke truncate on table "public"."donations" from "anon";

revoke update on table "public"."donations" from "anon";

revoke delete on table "public"."donations" from "authenticated";

revoke insert on table "public"."donations" from "authenticated";

revoke references on table "public"."donations" from "authenticated";

revoke select on table "public"."donations" from "authenticated";

revoke trigger on table "public"."donations" from "authenticated";

revoke truncate on table "public"."donations" from "authenticated";

revoke update on table "public"."donations" from "authenticated";

revoke delete on table "public"."outreach_contacts" from "anon";

revoke insert on table "public"."outreach_contacts" from "anon";

revoke references on table "public"."outreach_contacts" from "anon";

revoke select on table "public"."outreach_contacts" from "anon";

revoke trigger on table "public"."outreach_contacts" from "anon";

revoke truncate on table "public"."outreach_contacts" from "anon";

revoke update on table "public"."outreach_contacts" from "anon";

revoke delete on table "public"."outreach_contacts" from "authenticated";

revoke insert on table "public"."outreach_contacts" from "authenticated";

revoke references on table "public"."outreach_contacts" from "authenticated";

revoke select on table "public"."outreach_contacts" from "authenticated";

revoke trigger on table "public"."outreach_contacts" from "authenticated";

revoke truncate on table "public"."outreach_contacts" from "authenticated";

revoke update on table "public"."outreach_contacts" from "authenticated";

revoke select on table "public"."profile_comments" from "anon";

revoke select on table "public"."profile_comments" from "authenticated";

revoke select on table "public"."profile_likes" from "anon";

revoke select on table "public"."profile_likes" from "authenticated";

revoke select on table "public"."profile_ships" from "anon";

revoke select on table "public"."profile_ships" from "authenticated";

revoke delete on table "public"."profile_spotlights" from "anon";

revoke insert on table "public"."profile_spotlights" from "anon";

revoke references on table "public"."profile_spotlights" from "anon";

revoke select on table "public"."profile_spotlights" from "anon";

revoke trigger on table "public"."profile_spotlights" from "anon";

revoke truncate on table "public"."profile_spotlights" from "anon";

revoke update on table "public"."profile_spotlights" from "anon";

revoke delete on table "public"."profile_spotlights" from "authenticated";

revoke insert on table "public"."profile_spotlights" from "authenticated";

revoke references on table "public"."profile_spotlights" from "authenticated";

revoke select on table "public"."profile_spotlights" from "authenticated";

revoke trigger on table "public"."profile_spotlights" from "authenticated";

revoke truncate on table "public"."profile_spotlights" from "authenticated";

revoke update on table "public"."profile_spotlights" from "authenticated";

revoke select on table "public"."profile_stars" from "anon";

revoke select on table "public"."profile_stars" from "authenticated";

revoke select on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "authenticated";

revoke delete on table "public"."review_prompts" from "anon";

revoke insert on table "public"."review_prompts" from "anon";

revoke references on table "public"."review_prompts" from "anon";

revoke select on table "public"."review_prompts" from "anon";

revoke trigger on table "public"."review_prompts" from "anon";

revoke truncate on table "public"."review_prompts" from "anon";

revoke update on table "public"."review_prompts" from "anon";

revoke delete on table "public"."review_prompts" from "authenticated";

revoke insert on table "public"."review_prompts" from "authenticated";

revoke references on table "public"."review_prompts" from "authenticated";

revoke select on table "public"."review_prompts" from "authenticated";

revoke trigger on table "public"."review_prompts" from "authenticated";

revoke truncate on table "public"."review_prompts" from "authenticated";

revoke update on table "public"."review_prompts" from "authenticated";

revoke delete on table "public"."share_prompts" from "anon";

revoke insert on table "public"."share_prompts" from "anon";

revoke references on table "public"."share_prompts" from "anon";

revoke select on table "public"."share_prompts" from "anon";

revoke trigger on table "public"."share_prompts" from "anon";

revoke truncate on table "public"."share_prompts" from "anon";

revoke update on table "public"."share_prompts" from "anon";

revoke delete on table "public"."share_prompts" from "authenticated";

revoke insert on table "public"."share_prompts" from "authenticated";

revoke references on table "public"."share_prompts" from "authenticated";

revoke select on table "public"."share_prompts" from "authenticated";

revoke trigger on table "public"."share_prompts" from "authenticated";

revoke truncate on table "public"."share_prompts" from "authenticated";

revoke update on table "public"."share_prompts" from "authenticated";

revoke delete on table "public"."testimonials" from "anon";

revoke insert on table "public"."testimonials" from "anon";

revoke references on table "public"."testimonials" from "anon";

revoke select on table "public"."testimonials" from "anon";

revoke trigger on table "public"."testimonials" from "anon";

revoke truncate on table "public"."testimonials" from "anon";

revoke update on table "public"."testimonials" from "anon";

revoke delete on table "public"."testimonials" from "authenticated";

revoke insert on table "public"."testimonials" from "authenticated";

revoke references on table "public"."testimonials" from "authenticated";

revoke select on table "public"."testimonials" from "authenticated";

revoke trigger on table "public"."testimonials" from "authenticated";

revoke truncate on table "public"."testimonials" from "authenticated";

revoke update on table "public"."testimonials" from "authenticated";

revoke select on table "public"."user_activity" from "anon";

revoke select on table "public"."user_activity" from "authenticated";

revoke select on table "public"."user_notifications" from "anon";

revoke select on table "public"."user_notifications" from "authenticated";

revoke select on table "public"."users" from "anon";

revoke select on table "public"."users" from "authenticated";

revoke select on table "public"."vote_results" from "anon";

revoke select on table "public"."vote_results" from "authenticated";

revoke select on table "public"."votes" from "anon";

revoke select on table "public"."votes" from "authenticated";

-- `db pull` also emitted Supabase's own triggers on realtime.subscription and storage.buckets/objects.
-- They were removed: the platform creates them, and they fail on a local stack without Realtime and Storage.
