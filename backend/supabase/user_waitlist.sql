CREATE TABLE IF NOT EXISTS user_waitlist (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    email TEXT NOT NULL
);

-- Row Level Security
ALTER TABLE user_waitlist ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "anon insert" ON user_waitlist;
CREATE POLICY "anon insert" ON user_waitlist
    FOR INSERT WITH CHECK (true);

-- Indexes
-- Primary key automatically creates a unique index on id, so no additional index is needed.
