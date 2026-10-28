

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