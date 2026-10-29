CREATE TABLE IF NOT EXISTS votes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT NOT NULL,
    title TEXT NOT NULL,
    is_anonymous BOOLEAN NOT NULL,
    description JSONB,
    status TEXT
);

-- Foreign Keys
alter table votes
add constraint votes_creator_id_fkey foreign key (creator_id) references users (id);

-- Row Level Security
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- No SELECT policy: RLS is enabled with no read policy AND the anon/authenticated SELECT grant is
-- revoked (migration 20261029_private_votes_and_stars.sql dropped the former "public read" policy).
-- Ballots and anonymous proposal authors are private; the client reads tallies through the security
-- definer get_votes_with_results().

-- Indexes
CREATE INDEX IF NOT EXISTS creator_id_idx ON votes (creator_id);

CREATE INDEX IF NOT EXISTS idx_votes_created_time ON votes (created_time DESC);
