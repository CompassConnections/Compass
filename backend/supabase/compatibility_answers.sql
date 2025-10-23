CREATE TABLE IF NOT EXISTS compatibility_answers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT NOT NULL,
    explanation TEXT,
    importance INTEGER NOT NULL,
    multiple_choice INTEGER NOT NULL,
    pref_choices INTEGER[] NOT NULL,
    question_id BIGINT NOT NULL
);

ALTER TABLE compatibility_answers
    ADD CONSTRAINT compatibility_answers_creator_id_fkey
        FOREIGN KEY (creator_id)
            REFERENCES users(id)
            ON DELETE CASCADE;


-- Row Level Security
ALTER TABLE compatibility_answers ENABLE ROW LEVEL SECURITY;

ALTER TABLE compatibility_answers
    ADD CONSTRAINT unique_question_creator
        UNIQUE (question_id, creator_id);


-- Policies
DROP POLICY IF EXISTS "public read" ON compatibility_answers;
CREATE POLICY "public read" ON compatibility_answers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "self delete" ON compatibility_answers;
CREATE POLICY "self delete" ON compatibility_answers
    FOR DELETE USING (creator_id = firebase_uid());

DROP POLICY IF EXISTS "self insert" ON compatibility_answers;
CREATE POLICY "self insert" ON compatibility_answers
    FOR INSERT WITH CHECK (creator_id = firebase_uid());

DROP POLICY IF EXISTS "self update" ON compatibility_answers;
CREATE POLICY "self update" ON compatibility_answers
    FOR UPDATE USING (creator_id = firebase_uid());

-- Indexes
CREATE INDEX IF NOT EXISTS compatibility_answers_creator_id_created_time_idx
    ON public.compatibility_answers (creator_id, created_time DESC);

CREATE UNIQUE INDEX IF NOT EXISTS compatibility_answers_question_creator_unique
    ON public.compatibility_answers (question_id, creator_id);

CREATE INDEX IF NOT EXISTS compatibility_answers_question_id_idx
    ON public.compatibility_answers (question_id);
