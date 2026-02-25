ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS allow_direct_messaging    BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS allow_interest_indicating BOOLEAN DEFAULT TRUE;

CREATE TABLE connection_interests
(
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id         TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    target_user_id  TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    connection_type TEXT        NOT NULL CHECK (connection_type IN ('relationship', 'friendship', 'collaboration')),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (user_id != target_user_id),

    UNIQUE (user_id, target_user_id, connection_type)
);

-- Row Level Security for connection_interests
ALTER TABLE connection_interests
    ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_ci_user_target_type
    ON connection_interests (user_id, target_user_id, connection_type);

CREATE INDEX idx_ci_target_user_type
    ON connection_interests (target_user_id, user_id, connection_type);
