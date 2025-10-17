CREATE TABLE IF NOT EXISTS votes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description JSONB
);

-- Foreign Keys
alter table votes
add constraint votes_creator_id_fkey foreign key (creator_id) references users (id);

-- Row Level Security
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON votes;
CREATE POLICY "public read" ON votes
FOR ALL USING (true);

-- Indexes
DROP INDEX IF EXISTS creator_id_idx;
CREATE INDEX creator_id_idx ON votes (creator_id);

DROP INDEX IF EXISTS idx_votes_created_time;
CREATE INDEX idx_votes_created_time ON votes (created_time DESC);
