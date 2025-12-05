CREATE TABLE IF NOT EXISTS work
(
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    creator_id text REFERENCES users (id) ON DELETE set null,
    name TEXT NOT NULL,
    CONSTRAINT work_name_unique UNIQUE (name)
);

-- Row Level Security
ALTER TABLE work
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON work;
CREATE POLICY "public read" ON work
    FOR SELECT USING (true);

CREATE UNIQUE INDEX idx_work_name_ci
    ON work (name);
