

create
or replace function public.get_compatibility_questions_with_answer_count () returns setof record language plpgsql as $function$
BEGIN
RETURN QUERY
SELECT
    love_questions.*,
    COUNT(love_compatibility_answers.question_id) as answer_count
FROM
    love_questions
        LEFT JOIN
    love_compatibility_answers ON love_questions.id = love_compatibility_answers.question_id
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
    love_answers.question_id,
    love_answers.created_time,
    love_answers.free_response,
    love_answers.multiple_choice,
    love_answers.integer,
    profiles.age,
    profiles.gender,
    profiles.city,
    users.data
FROM
    profiles
        JOIN
    love_answers ON profiles.user_id = love_answers.creator_id
        join
    users on profiles.user_id = users.id
WHERE
    love_answers.question_id = p_question_id
order by love_answers.created_time desc;
END;
$function$;