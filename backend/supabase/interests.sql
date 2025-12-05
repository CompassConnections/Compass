CREATE TABLE IF NOT EXISTS interests
(
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    creator_id text REFERENCES users (id) ON DELETE set null,
    name TEXT NOT NULL,
    CONSTRAINT interests_name_unique UNIQUE (name)
);

-- Row Level Security
ALTER TABLE interests
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON interests;
CREATE POLICY "public read" ON interests
    FOR SELECT USING (true);

CREATE UNIQUE INDEX idx_interests_name_ci
    ON interests (name);
