CREATE TABLE IF NOT EXISTS profile_comments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content JSONB NOT NULL,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    hidden BOOLEAN DEFAULT false NOT NULL,
    on_user_id TEXT NOT NULL,
    reply_to_comment_id BIGINT,
    user_avatar_url TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_username TEXT NOT NULL
);

ALTER TABLE profile_comments
    ADD CONSTRAINT profile_comments_user_id_fkey
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE;

ALTER TABLE profile_comments
    ADD CONSTRAINT profile_comments_on_user_id_fkey
        FOREIGN KEY (on_user_id)
            REFERENCES users(id)
            ON DELETE CASCADE;

-- Row Level Security
ALTER TABLE profile_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON profile_comments;
CREATE POLICY "public read" ON profile_comments
    FOR SELECT USING (true);

-- Policies
DROP POLICY IF EXISTS "public read" ON profile_comments;
CREATE POLICY "public read" ON profile_comments FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS profile_comments_user_id_idx
    ON public.profile_comments USING btree (on_user_id);
