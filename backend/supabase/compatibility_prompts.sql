CREATE TABLE IF NOT EXISTS compatibility_prompts (
    answer_type TEXT DEFAULT 'free_response' NOT NULL,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT,
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    importance_score NUMERIC DEFAULT 0 NOT NULL,
    multiple_choice_options JSONB,
    question TEXT NOT NULL
);

ALTER TABLE compatibility_prompts
    ADD CONSTRAINT compatibility_prompts_creator_id_fkey
        FOREIGN KEY (creator_id)
            REFERENCES users(id)
            ON DELETE SET NULL;


-- Row Level Security
ALTER TABLE compatibility_prompts ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON compatibility_prompts;
CREATE POLICY "public read" ON compatibility_prompts
FOR ALL USING (true);

-- Indexes
-- The primary key automatically creates a unique index on (id),
-- so the explicit index on id is redundant and removed.
