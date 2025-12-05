CREATE TABLE IF NOT EXISTS causes
(
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    creator_id text REFERENCES users (id) ON DELETE set null,
    name TEXT NOT NULL,
    CONSTRAINT causes_name_unique UNIQUE (name)
);

-- Row Level Security
ALTER TABLE causes
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON causes;
CREATE POLICY "public read" ON causes
    FOR SELECT USING (true);

CREATE UNIQUE INDEX idx_causes_name_ci
    ON causes (name);
