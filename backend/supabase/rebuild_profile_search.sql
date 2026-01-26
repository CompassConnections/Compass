CREATE OR REPLACE FUNCTION rebuild_profile_search(profile_id_param BIGINT)
    RETURNS void AS
$$
DECLARE
    bio_part       TEXT;
    interests_part TEXT;
    causes_part    TEXT;
    work_part      TEXT;
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

    UPDATE profiles
    SET bio_text    = bio_part,
        search_text = concat_ws(' ', bio_part, interests_part, causes_part, work_part),
        search_tsv  = to_tsvector('english', concat_ws(' ', bio_part, interests_part, causes_part, work_part))
    WHERE id = profile_id_param;
END;
$$ LANGUAGE plpgsql;
