CREATE TABLE IF NOT EXISTS love_likes (
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT NOT NULL,
    like_id TEXT DEFAULT random_alphanumeric(12) NOT NULL,
    target_id TEXT NOT NULL,
    CONSTRAINT love_likes_pkey PRIMARY KEY (creator_id, like_id)
);

-- Row Level Security
ALTER TABLE love_likes ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON love_likes;
CREATE POLICY "public read" ON love_likes
    FOR SELECT USING (true);

-- Indexes
-- The primary key already creates a unique index on (creator_id, like_id)
-- so we do not recreate that. Additional indexes:

CREATE INDEX IF NOT EXISTS user_likes_target_id_raw
    ON public.love_likes (target_id);
