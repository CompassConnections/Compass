

create
or replace function public.get_compatibility_questions_with_answer_count () returns setof record language plpgsql as $function$
BEGIN
RETURN QUERY
SELECT
    love_questions.*,
    COUNT(compatibility_answers.question_id) as answer_count
FROM
    love_questions
        LEFT JOIN
    compatibility_answers ON love_questions.id = compatibility_answers.question_id
WHERE love_questions.answer_type='compatibility_multiple_choice'
GROUP BY
    love_questions.id
ORDER BY
    answer_count DESC;
END;
$function$;

create
or replace function public.get_love_question_answers_and_profiles (p_question_id bigint) returns setof record language plpgsql as $function$
BEGIN
RETURN QUERY
SELECT
    prompt_answers.question_id,
    prompt_answers.created_time,
    prompt_answers.free_response,
    prompt_answers.multiple_choice,
    prompt_answers.integer,
    profiles.age,
    profiles.gender,
    profiles.city,
    users.data
FROM
    profiles
        JOIN
    prompt_answers ON profiles.user_id = prompt_answers.creator_id
        join
    users on profiles.user_id = users.id
WHERE
    prompt_answers.question_id = p_question_id
order by prompt_answers.created_time desc;
END;
$function$;