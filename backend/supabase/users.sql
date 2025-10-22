CREATE TABLE IF NOT EXISTS users (
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    data JSONB NOT NULL,
    id TEXT DEFAULT random_alphanumeric(12) NOT NULL,
    name TEXT NOT NULL,
    name_username_vector tsvector GENERATED ALWAYS AS (
        to_tsvector(
            'english'::regconfig,
            (name || ' '::text) || username
        )
    ) STORED,
    username TEXT NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id)
    );

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON users;
CREATE POLICY "public read" ON users
FOR SELECT
                    USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS user_username_idx ON public.users USING btree (username);

CREATE INDEX IF NOT EXISTS users_created_time ON public.users USING btree (created_time DESC);

CREATE INDEX IF NOT EXISTS users_name_idx ON public.users USING btree (name);

-- Remove these if you trust PRIMARY KEY auto-index:
-- DROP INDEX IF EXISTS users_pkey;
-- CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);
