CREATE TABLE IF NOT EXISTS compatibility_answers_free (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT NOT NULL,
    free_response TEXT,
    integer INTEGER,
    multiple_choice INTEGER,
    question_id BIGINT NOT NULL
    );

ALTER TABLE compatibility_answers_free
    ADD CONSTRAINT compatibility_answers_free_creator_id_fkey
        FOREIGN KEY (creator_id)
            REFERENCES users(id)
            ON DELETE CASCADE;


-- Row Level Security
ALTER TABLE compatibility_answers_free ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON compatibility_answers_free;
CREATE POLICY "public read" ON compatibility_answers_free FOR SELECT USING (true);

DROP POLICY IF EXISTS "self delete" ON compatibility_answers_free;
CREATE POLICY "self delete" ON compatibility_answers_free FOR DELETE USING (creator_id = firebase_uid());

DROP POLICY IF EXISTS "self insert" ON compatibility_answers_free;
CREATE POLICY "self insert" ON compatibility_answers_free FOR INSERT WITH CHECK (creator_id = firebase_uid());

DROP POLICY IF EXISTS "self update" ON compatibility_answers_free;
CREATE POLICY "self update" ON compatibility_answers_free FOR UPDATE USING (creator_id = firebase_uid());

-- Indexes
DROP INDEX IF EXISTS compatibility_answers_free_creator_id_created_time_idx;
CREATE INDEX IF NOT EXISTS compatibility_answers_free_creator_id_created_time_idx
    ON public.compatibility_answers_free USING btree (creator_id, created_time DESC);

DROP INDEX IF EXISTS compatibility_answers_free_question_creator_unique;
CREATE UNIQUE INDEX IF NOT EXISTS compatibility_answers_free_question_creator_unique
    ON public.compatibility_answers_free USING btree (question_id, creator_id);

DROP INDEX IF EXISTS compatibility_answers_free_question_id_idx;
CREATE INDEX IF NOT EXISTS compatibility_answers_free_question_id_idx
    ON public.compatibility_answers_free USING btree (question_id);
