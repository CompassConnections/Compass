-- Create deleted_users table to store information about deleted accounts
CREATE TABLE IF NOT EXISTS deleted_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT ,
    reason_category TEXT,
    reason_details TEXT,
    deleted_time TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deleted_users_username ON deleted_users (username);
CREATE INDEX IF NOT EXISTS idx_deleted_users_deleted_time ON deleted_users (deleted_time);
CREATE INDEX IF NOT EXISTS idx_deleted_users_reason_category ON deleted_users (reason_category);

-- Enable RLS
ALTER TABLE deleted_users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert for everyone (for account deletion)
DROP POLICY IF EXISTS "anyone can insert" ON deleted_users;
CREATE POLICY "anyone can insert" ON deleted_users
FOR INSERT WITH CHECK (true);
