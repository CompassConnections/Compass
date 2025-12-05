CREATE TABLE profile_causes
(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id  BIGINT NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    option_id BIGINT NOT NULL REFERENCES causes (id) ON DELETE CASCADE
);

-- Row Level Security
ALTER TABLE profile_causes
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON profile_causes;
CREATE POLICY "public read" ON profile_causes
    FOR SELECT USING (true);

ALTER TABLE profile_causes
    ADD CONSTRAINT profile_causes_option_unique UNIQUE (profile_id, option_id);

CREATE INDEX idx_profile_causes_profile
    ON profile_causes (profile_id);

CREATE INDEX idx_profile_causes_interest
    ON profile_causes (option_id);
