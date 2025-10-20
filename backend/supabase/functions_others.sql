

create
or replace function public.get_compatibility_prompts_with_answer_count () returns setof record language plpgsql as $function$
BEGIN
RETURN QUERY
SELECT
    compatibility_prompts.*,
    COUNT(compatibility_answers.question_id) as answer_count
FROM
    compatibility_prompts
        LEFT JOIN
    compatibility_answers ON compatibility_prompts.id = compatibility_answers.question_id
WHERE compatibility_prompts.answer_type='compatibility_multiple_choice'
GROUP BY
    compatibility_prompts.id
ORDER BY
    answer_count DESC;
END;
$function$;

create
or replace function public.get_compatibility_answers_and_profiles (p_question_id bigint) returns setof record language plpgsql as $function$
BEGIN
RETURN QUERY
SELECT
    compatibility_answers_free.question_id,
    compatibility_answers_free.created_time,
    compatibility_answers_free.free_response,
    compatibility_answers_free.multiple_choice,
    compatibility_answers_free.integer,
    profiles.age,
    profiles.gender,
    profiles.city,
    users.data
FROM
    profiles
        JOIN
    compatibility_answers_free ON profiles.user_id = compatibility_answers_free.creator_id
        join
    users on profiles.user_id = users.id
WHERE
    compatibility_answers_free.question_id = p_question_id
order by compatibility_answers_free.created_time desc;
END;
$function$;