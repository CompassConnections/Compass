CREATE TABLE profile_interests
(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id  BIGINT NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    option_id BIGINT NOT NULL REFERENCES interests (id) ON DELETE CASCADE
);

-- Row Level Security
ALTER TABLE profile_interests
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON profile_interests;
CREATE POLICY "public read" ON profile_interests
    FOR SELECT USING (true);

ALTER TABLE profile_interests
    ADD CONSTRAINT profile_interests_option_unique UNIQUE (profile_id, option_id);

CREATE INDEX idx_profile_interests_profile
    ON profile_interests (profile_id);

CREATE INDEX idx_profile_interests_interest
    ON profile_interests (option_id);
