CREATE TABLE IF NOT EXISTS private_user_seen_message_channels (
    channel_id BIGINT NOT NULL,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    user_id TEXT NOT NULL,
    CONSTRAINT private_user_seen_message_channels_pkey PRIMARY KEY (id)
    );

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'channel_id_fkey'
          AND conrelid = 'private_user_seen_message_channels'::regclass
    ) THEN
ALTER TABLE private_user_seen_message_channels
    ADD CONSTRAINT channel_id_fkey
        FOREIGN KEY (channel_id)
            REFERENCES private_user_message_channels (id)
            ON UPDATE CASCADE ON DELETE CASCADE;
END IF;
END$$;


-- Row Level Security
ALTER TABLE private_user_seen_message_channels ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "private member insert" ON private_user_seen_message_channels;

CREATE POLICY "private member insert" ON private_user_seen_message_channels
FOR INSERT
WITH CHECK (
    (firebase_uid() IS NOT NULL)
    AND can_access_private_messages(channel_id, firebase_uid())
);

DROP POLICY IF EXISTS "private member read" ON private_user_seen_message_channels;

CREATE POLICY "private member read" ON private_user_seen_message_channels
FOR SELECT
    USING (
    (firebase_uid() IS NOT NULL)
    AND can_access_private_messages(channel_id, firebase_uid())
    );

-- Indexes
CREATE INDEX IF NOT EXISTS user_seen_private_messages_created_time_desc_idx
    ON public.private_user_seen_message_channels
    USING btree (user_id, channel_id, created_time DESC);
