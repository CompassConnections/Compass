CREATE TABLE user_activity
(
    user_id          TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    last_online_time TIMESTAMPTZ NOT NULL
);

-- Row Level Security
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- No SELECT policy: RLS is enabled with no read policy AND the anon/authenticated SELECT grant is
-- revoked, so the client cannot read this table directly (migration 20260731_lock_activity_stars_compat.sql
-- dropped the former "public read" policy). The client reads one row via get_user_activity(uid); the
-- active-member count moved to the cached /stats aggregate.

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_last_online_time
    ON user_activity (last_online_time DESC);
