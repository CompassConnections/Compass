CREATE TABLE IF NOT EXISTS prompt_answers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT NOT NULL,
    free_response TEXT,
    integer INTEGER,
    multiple_choice INTEGER,
    question_id BIGINT NOT NULL
    );

-- Row Level Security
ALTER TABLE prompt_answers ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON prompt_answers;
CREATE POLICY "public read" ON prompt_answers FOR SELECT USING (true);

DROP POLICY IF EXISTS "self delete" ON prompt_answers;
CREATE POLICY "self delete" ON prompt_answers FOR DELETE USING (creator_id = firebase_uid());

DROP POLICY IF EXISTS "self insert" ON prompt_answers;
CREATE POLICY "self insert" ON prompt_answers FOR INSERT WITH CHECK (creator_id = firebase_uid());

DROP POLICY IF EXISTS "self update" ON prompt_answers;
CREATE POLICY "self update" ON prompt_answers FOR UPDATE USING (creator_id = firebase_uid());

-- Indexes
DROP INDEX IF EXISTS prompt_answers_creator_id_created_time_idx;
CREATE INDEX IF NOT EXISTS prompt_answers_creator_id_created_time_idx
    ON public.prompt_answers USING btree (creator_id, created_time DESC);

DROP INDEX IF EXISTS prompt_answers_question_creator_unique;
CREATE UNIQUE INDEX IF NOT EXISTS prompt_answers_question_creator_unique
    ON public.prompt_answers USING btree (question_id, creator_id);

DROP INDEX IF EXISTS prompt_answers_question_id_idx;
CREATE INDEX IF NOT EXISTS prompt_answers_question_id_idx
    ON public.prompt_answers USING btree (question_id);
