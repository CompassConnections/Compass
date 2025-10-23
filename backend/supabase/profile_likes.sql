CREATE TABLE IF NOT EXISTS profile_likes (
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT NOT NULL,
    like_id TEXT DEFAULT random_alphanumeric(12) NOT NULL,
    target_id TEXT NOT NULL,
    CONSTRAINT profile_likes_pkey PRIMARY KEY (creator_id, like_id)
);

ALTER TABLE profile_likes
    ADD CONSTRAINT profile_likes_creator_id_fkey
        FOREIGN KEY (creator_id)
            REFERENCES users(id)
            ON DELETE CASCADE;

-- Row Level Security
ALTER TABLE profile_likes ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public read" ON profile_likes;
CREATE POLICY "public read" ON profile_likes
    FOR SELECT USING (true);

-- Indexes
-- The primary key already creates a unique index on (creator_id, like_id)
-- so we do not recreate that. Additional indexes:

CREATE INDEX IF NOT EXISTS user_likes_target_id_raw
    ON public.profile_likes (target_id);
