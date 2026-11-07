-- Prod still carries names from before the love_* / lover_* tables were renamed, which a database built from
-- the old migration files never had. Rename them to match the tables, and drop what nothing uses any more.
-- No code refers to any of these names.

-- Primary keys (renaming the constraint renames its index)
alter table compatibility_answers rename constraint love_compatibility_answers_pkey to compatibility_answers_pkey;
alter table compatibility_prompts rename constraint love_questions_pkey to compatibility_prompts_pkey;
alter table profile_comments rename constraint lover_comments_pkey to profile_comments_pkey;
alter table profile_likes rename constraint love_likes_pkey to profile_likes_pkey;
alter table profile_ships rename constraint love_ships_pkey to profile_ships_pkey;
alter table profile_stars rename constraint love_stars_pkey to profile_stars_pkey;

-- Indexes
alter index love_compatibility_answers_creator_id_created_time_idx rename to compatibility_answers_creator_id_created_time_idx;
alter index love_compatibility_answers_question_creator_unique rename to compatibility_answers_question_creator_unique;
alter index love_compatibility_answers_question_id_idx rename to compatibility_answers_question_id_idx;
alter index lover_comments_user_id_idx rename to profile_comments_user_id_idx;
alter index love_ships_target1_id rename to profile_ships_target1_id;
alter index love_ships_target2_id rename to profile_ships_target2_id;
alter index love_stars_target_id_idx rename to profile_stars_target_id_idx;

-- Identity sequences
alter sequence love_compatibility_answers_id_seq rename to compatibility_answers_id_seq;
alter sequence love_questions_id_seq rename to compatibility_prompts_id_seq;
alter sequence lover_comments_id_seq rename to profile_comments_id_seq;

-- A trigger function no trigger calls
drop function if exists lovers_bio_tsvector_update();

-- `using (true)` read policies left over from before anon and authenticated lost SELECT on these tables
-- (cap_profiles_users_reads). Without the grant they allow nothing; reads go through the capped RPCs.
drop policy if exists "public read" on profiles;
drop policy if exists "public read" on users;
