CREATE TABLE IF NOT EXISTS vote_results (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id TEXT NOT NULL,
    vote_id BIGINT NOT NULL,
    choice smallint NOT NULL CHECK (choice IN (-1, 0, 1)),
    priority smallint NOT NULL CHECK (priority IN (0, 1, 2, 3)),
    UNIQUE (user_id, vote_id)  -- ensures one vote per user
);

-- Foreign Keys
alter table vote_results
add constraint vote_results_user_id_fkey foreign key (user_id) references users (id);

alter table vote_results
add constraint vote_results_vote_id_fkey foreign key (vote_id) references votes (id);

-- Row Level Security
ALTER TABLE vote_results ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON vote_results;
CREATE POLICY "public read" ON vote_results
FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS user_id_idx ON vote_results (user_id);

CREATE INDEX IF NOT EXISTS vote_id_idx ON vote_results (vote_id);

CREATE INDEX IF NOT EXISTS idx_vote_results_vote_choice ON vote_results (vote_id, choice);

CREATE INDEX IF NOT EXISTS idx_vote_results_vote_choice_priority ON vote_results (vote_id, choice, priority);

CREATE INDEX IF NOT EXISTS idx_votes_created_time ON votes (created_time DESC);


drop function if exists get_votes_with_results;
create or replace function get_votes_with_results(order_by text default 'recent')
    returns table (
      id BIGINT,
      title text,
      description jsonb,
      created_time timestamptz,
      creator_id TEXT,
      is_anonymous boolean,
      votes_for int,
      votes_against int,
      votes_abstain int,
      priority int
    )
as $$
with results as (
  SELECT
      v.id,
      v.title,
      v.description,
      v.created_time,
      v.creator_id,
      v.is_anonymous,
      COALESCE(SUM(CASE WHEN r.choice = 1 THEN 1 ELSE 0 END), 0) AS votes_for,
      COALESCE(SUM(CASE WHEN r.choice = -1 THEN 1 ELSE 0 END), 0) AS votes_against,
      COALESCE(SUM(CASE WHEN r.choice = 0 THEN 1 ELSE 0 END), 0) AS votes_abstain,
      COALESCE(SUM(r.priority), 0)::float / GREATEST(COALESCE(SUM(CASE WHEN r.choice = 1 THEN 1 ELSE 0 END), 1), 1) * 100 / 3 AS priority
  FROM votes v
           LEFT JOIN vote_results r ON v.id = r.vote_id
  GROUP BY v.id
)
SELECT
  id,
  title,
  description,
  created_time,
  creator_id,
  is_anonymous,
  votes_for,
  votes_against,
  votes_abstain,
  priority
FROM results
ORDER BY
  CASE WHEN order_by = 'recent' THEN created_time END DESC,
  CASE WHEN order_by = 'mostVoted' THEN (votes_for + votes_against + votes_abstain) END DESC,
  CASE WHEN order_by = 'mostVoted' THEN created_time END DESC,
  CASE WHEN order_by = 'priority' THEN priority END DESC,
  CASE WHEN order_by = 'priority' THEN created_time END DESC;
$$ language sql stable;


