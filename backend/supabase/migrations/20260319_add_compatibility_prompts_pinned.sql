CREATE TABLE IF NOT EXISTS compatibility_prompts_pinned
(
    id           BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    created_time TIMESTAMPTZ                         NOT NULL DEFAULT now(),
    user_id      TEXT                                NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    question_id  BIGINT                              NOT NULL REFERENCES compatibility_prompts (id) ON DELETE CASCADE,
    PRIMARY KEY (id),
    UNIQUE (user_id, question_id)
);

ALTER TABLE compatibility_prompts_pinned
    ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_cpp_user_created_time
    ON compatibility_prompts_pinned (user_id, created_time DESC);

CREATE INDEX IF NOT EXISTS idx_cpp_user_question
    ON compatibility_prompts_pinned (user_id, question_id);

