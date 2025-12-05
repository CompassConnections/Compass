CREATE TABLE profile_work
(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id  BIGINT NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    option_id BIGINT NOT NULL REFERENCES work (id) ON DELETE CASCADE
);

-- Row Level Security
ALTER TABLE profile_work
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON profile_work;
CREATE POLICY "public read" ON profile_work
    FOR SELECT USING (true);

ALTER TABLE profile_work
    ADD CONSTRAINT profile_work_option_unique UNIQUE (profile_id, option_id);

CREATE INDEX idx_profile_work_profile
    ON profile_work (profile_id);

CREATE INDEX idx_profile_work_interest
    ON profile_work (option_id);
