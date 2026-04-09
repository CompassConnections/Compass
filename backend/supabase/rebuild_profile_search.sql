CREATE OR REPLACE FUNCTION rebuild_profile_search(profile_id_param BIGINT)
    RETURNS void AS
$$
DECLARE
    bio_part       TEXT;
    interests_part TEXT;
    causes_part    TEXT;
    work_part      TEXT;
    headline_part  TEXT;
    occupation_part TEXT;
    occupation_title_part TEXT;
    company_part   TEXT;
    university_part TEXT;
    city_part      TEXT;
    country_part   TEXT;
    born_in_location_part TEXT;
    raised_in_city_part TEXT;
    raised_in_country_part TEXT;
    political_details_part TEXT;
    religious_beliefs_part TEXT;
    keywords_part  TEXT;
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
    SELECT headline INTO headline_part FROM profiles WHERE id = profile_id_param;
    SELECT occupation INTO occupation_part FROM profiles WHERE id = profile_id_param;
    SELECT occupation_title INTO occupation_title_part FROM profiles WHERE id = profile_id_param;
    SELECT company INTO company_part FROM profiles WHERE id = profile_id_param;
    SELECT university INTO university_part FROM profiles WHERE id = profile_id_param;
    SELECT city INTO city_part FROM profiles WHERE id = profile_id_param;
    SELECT country INTO country_part FROM profiles WHERE id = profile_id_param;
    SELECT born_in_location INTO born_in_location_part FROM profiles WHERE id = profile_id_param;
    SELECT raised_in_city INTO raised_in_city_part FROM profiles WHERE id = profile_id_param;
    SELECT raised_in_country INTO raised_in_country_part FROM profiles WHERE id = profile_id_param;
    SELECT political_details INTO political_details_part FROM profiles WHERE id = profile_id_param;
    SELECT religious_beliefs INTO religious_beliefs_part FROM profiles WHERE id = profile_id_param;
    
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
                                                      headline_part, occupation_part, occupation_title_part, company_part,
                                                      university_part, city_part, country_part, born_in_location_part,
                                                      raised_in_city_part, raised_in_country_part, political_details_part,
                                                      religious_beliefs_part, keywords_part))
    WHERE id = profile_id_param;
END;
$$ LANGUAGE plpgsql;
