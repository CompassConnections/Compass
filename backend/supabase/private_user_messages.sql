CREATE TABLE IF NOT EXISTS private_user_messages (
    channel_id BIGINT NOT NULL,
    content JSONB NOT NULL,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    old_id BIGINT,
    user_id TEXT NOT NULL,
    visibility TEXT DEFAULT 'private'::TEXT NOT NULL,
    CONSTRAINT private_user_messages_channel_id_fkey
    FOREIGN KEY (channel_id)
    REFERENCES private_user_message_channels (id)
    ON UPDATE CASCADE ON DELETE CASCADE
    );

-- Row Level Security
ALTER TABLE private_user_messages ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS private_user_messages_channel_id_idx
    ON public.private_user_messages USING btree (channel_id, created_time DESC);
