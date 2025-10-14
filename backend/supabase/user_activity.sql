CREATE TABLE user_activity
(
    user_id          TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    last_online_time TIMESTAMPTZ NOT NULL
);

-- Row Level Security
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON user_activity;
CREATE POLICY "public read" ON user_activity
    FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_last_online_time
    ON user_activity (last_online_time DESC);
