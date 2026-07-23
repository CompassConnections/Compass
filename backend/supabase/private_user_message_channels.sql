CREATE TABLE IF NOT EXISTS private_user_message_channels
(
    created_time      TIMESTAMPTZ DEFAULT now()           NOT NULL,
    id                BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    last_updated_time TIMESTAMPTZ DEFAULT now()           NOT NULL,
    title             TEXT,
    CONSTRAINT private_user_message_channels_pkey PRIMARY KEY (id)
);

-- Row Level Security
ALTER TABLE private_user_message_channels
    ENABLE ROW LEVEL SECURITY;

-- Indexes
-- Removed redundant primary key index creation because PRIMARY KEY already creates a unique index on id
