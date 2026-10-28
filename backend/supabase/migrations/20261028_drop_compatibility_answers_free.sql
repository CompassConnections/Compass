-- Drop the free-response answers table and the two functions that read it.
--
-- `compatibility_answers_free` was the first cut of compatibility questions: one row per
-- (prompt, member) holding a free_response / multiple_choice / integer answer. It was replaced by
-- `compatibility_answers` (which carries importance, preferred choices and the written explanation)
-- and the free-response UI that wrote to it was unmounted long ago; the table held a single row in
-- prod. Its policies also compared `creator_id` to `firebase_uid()` for writes issued by a browser
-- that only ever holds the anon key, so nothing could have been writing to it in any case.
--
-- `get_fr_questions_with_answer_count` was only ever created on the live databases (it has no
-- definition in the repo); its one caller, `getFRQuestionsWithAnswerCount`, is gone with the UI.

drop function if exists public.get_compatibility_answers_and_profiles(bigint);
drop function if exists public.get_fr_questions_with_answer_count();

drop table if exists public.compatibility_answers_free;

notify pgrst, 'reload schema';
