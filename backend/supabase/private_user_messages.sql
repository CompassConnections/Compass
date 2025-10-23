CREATE TABLE IF NOT EXISTS private_user_messages (
    channel_id BIGINT NOT NULL,
    content JSONB,
    ciphertext text,       -- base64
    iv text,               -- base64
    tag text,              -- base64 (GCM auth tag)
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id TEXT,
    visibility TEXT DEFAULT 'private'::TEXT NOT NULL,
    CONSTRAINT private_user_messages_channel_id_fkey
    FOREIGN KEY (channel_id)
    REFERENCES private_user_message_channels (id)
    ON UPDATE CASCADE ON DELETE CASCADE
    );

ALTER TABLE private_user_messages
    ADD CONSTRAINT private_user_messages_user_id_fkey
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE SET NULL;


-- Row Level Security
ALTER TABLE private_user_messages ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS private_user_messages_channel_id_idx
    ON public.private_user_messages USING btree (channel_id, created_time DESC);
