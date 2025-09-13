CREATE TABLE IF NOT EXISTS bookmarked_searches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    creator_id TEXT NOT NULL,
    search_filters JSONB,
    last_notified_at TIMESTAMPTZ DEFAULT NULL,
    search_name TEXT DEFAULT NULL
);

-- Row Level Security
ALTER TABLE bookmarked_searches ENABLE ROW LEVEL SECURITY;


-- Policies
DROP POLICY IF EXISTS "public read" ON bookmarked_searches;
CREATE POLICY "public read" ON bookmarked_searches
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "self delete" ON bookmarked_searches;
CREATE POLICY "self delete" ON bookmarked_searches
    FOR DELETE USING (creator_id = firebase_uid());

DROP POLICY IF EXISTS "self insert" ON bookmarked_searches;
CREATE POLICY "self insert" ON bookmarked_searches
    FOR INSERT WITH CHECK (creator_id = firebase_uid());

DROP POLICY IF EXISTS "self update" ON bookmarked_searches;
CREATE POLICY "self update" ON bookmarked_searches
    FOR UPDATE USING (creator_id = firebase_uid());

-- Indexes
CREATE INDEX IF NOT EXISTS bookmarked_searches_creator_id_created_time_idx
    ON public.bookmarked_searches (creator_id, created_time DESC);

CREATE INDEX IF NOT EXISTS bookmarked_searches_creator_id_idx
    ON public.bookmarked_searches (creator_id);

CREATE INDEX IF NOT EXISTS bookmarked_searches_search_name_idx
    ON public.bookmarked_searches (search_name);
