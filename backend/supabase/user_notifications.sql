CREATE TABLE IF NOT EXISTS user_notifications (
    notification_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    data JSONB NOT NULL,
    CONSTRAINT user_notifications_pkey PRIMARY KEY (notification_id, user_id)
);


ALTER TABLE user_notifications
    ADD CONSTRAINT user_notifications_user_id_fkey
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE;

-- Row Level Security
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON user_notifications;
CREATE POLICY "public read" ON user_notifications
    FOR SELECT USING (true);

-- Indexes
-- The primary key already creates a unique index on (notification_id, user_id)

CREATE INDEX IF NOT EXISTS user_notifications_user_id_created_time
    ON public.user_notifications (
        user_id,
        ((data ->> 'createdTime')::BIGINT) DESC
    );
