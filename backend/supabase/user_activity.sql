CREATE TABLE user_activity
(
    user_id          TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    last_online_time TIMESTAMPTZ NOT NULL,
    last_seen_ip     INET,
    last_seen_device TEXT
);

-- Row Level Security
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_last_online_time
    ON user_activity (last_online_time DESC);
