-- Precomputed compatibility scores between pairs of users
CREATE TABLE IF NOT EXISTS compatibility_scores (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    modified_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id_1 TEXT NOT NULL, --- lowest-id user
    user_id_2 TEXT NOT NULL, --- highest-id user
    -- geometric mean score in range [0,1]
    score DOUBLE PRECISION
);

-- Ensure canonical ordering and uniqueness of pairs
CREATE UNIQUE INDEX IF NOT EXISTS compatibility_scores_user_pair_unique
    ON public.compatibility_scores (user_id_1, user_id_2);

-- Foreign keys
ALTER TABLE compatibility_scores
    ADD CONSTRAINT compatibility_scores_user_id_1_fkey
        FOREIGN KEY (user_id_1)
            REFERENCES users(id)
            ON DELETE CASCADE;

ALTER TABLE compatibility_scores
    ADD CONSTRAINT compatibility_scores_user_id_2_fkey
        FOREIGN KEY (user_id_2)
            REFERENCES users(id)
            ON DELETE CASCADE;

-- Row Level Security
ALTER TABLE compatibility_scores ENABLE ROW LEVEL SECURITY;

-- Public read policy (scores are not sensitive by themselves)
DROP POLICY IF EXISTS "public read" ON compatibility_scores;
CREATE POLICY "public read" ON compatibility_scores
    FOR SELECT USING (true);

-- Update modified_time on any row update
CREATE OR REPLACE FUNCTION set_modified_time_compat_scores()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_time = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_modified_time_compat_scores_trigger ON compatibility_scores;
CREATE TRIGGER set_modified_time_compat_scores_trigger
BEFORE UPDATE ON compatibility_scores
FOR EACH ROW EXECUTE FUNCTION set_modified_time_compat_scores();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS compatibility_scores_score_desc_idx
    ON public.compatibility_scores (score DESC);
CREATE INDEX IF NOT EXISTS compatibility_scores_user1_idx
    ON public.compatibility_scores (user_id_1);
CREATE INDEX IF NOT EXISTS compatibility_scores_user2_idx
    ON public.compatibility_scores (user_id_2);
