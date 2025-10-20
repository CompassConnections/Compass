CREATE TABLE IF NOT EXISTS compatibility_prompts (
    answer_type TEXT DEFAULT 'free_response' NOT NULL,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT NOT NULL,
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    importance_score NUMERIC DEFAULT 0 NOT NULL,
    multiple_choice_options JSONB,
    question TEXT NOT NULL
);

-- Row Level Security
ALTER TABLE compatibility_prompts ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON compatibility_prompts;
CREATE POLICY "public read" ON compatibility_prompts
FOR ALL USING (true);

-- Indexes
-- The primary key automatically creates a unique index on (id),
-- so the explicit index on id is redundant and removed.
