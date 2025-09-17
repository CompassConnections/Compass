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

-- Row Level Security
ALTER TABLE profile_comments ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON profile_comments;
CREATE POLICY "public read" ON profile_comments FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS profile_comments_user_id_idx
    ON public.profile_comments USING btree (on_user_id);
