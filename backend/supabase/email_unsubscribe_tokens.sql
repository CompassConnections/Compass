CREATE TABLE IF NOT EXISTS email_unsubscribe_tokens
(
    token             TEXT                      NOT NULL,
    user_id           TEXT                      NOT NULL,
    notification_type TEXT, -- NULL means unsubscribe from all
    created_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
    used_at           TIMESTAMPTZ,

    CONSTRAINT email_unsubscribe_tokens_pkey PRIMARY KEY (token)
);

ALTER TABLE email_unsubscribe_tokens
    ADD CONSTRAINT email_unsubscribe_tokens_user_id_fkey
        FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE CASCADE;

-- Row Level Security
ALTER TABLE email_unsubscribe_tokens
    ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS email_unsubscribe_tokens_user_id_idx
    ON public.email_unsubscribe_tokens USING btree (user_id);

CREATE INDEX IF NOT EXISTS email_unsubscribe_tokens_created_at_idx
    ON public.email_unsubscribe_tokens USING btree (created_at);
