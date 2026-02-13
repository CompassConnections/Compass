ALTER TABLE profiles
    ADD COLUMN big5_openness          SMALLINT,
    ADD COLUMN big5_conscientiousness SMALLINT,
    ADD COLUMN big5_extraversion      SMALLINT,
    ADD COLUMN big5_agreeableness     SMALLINT,
    ADD COLUMN big5_neuroticism       SMALLINT;


ALTER TABLE profiles
    ADD CONSTRAINT big5_range_check
        CHECK (
            big5_openness BETWEEN 0 AND 100 AND
            big5_conscientiousness BETWEEN 0 AND 100 AND
            big5_extraversion BETWEEN 0 AND 100 AND
            big5_agreeableness BETWEEN 0 AND 100 AND
            big5_neuroticism BETWEEN 0 AND 100
            );

CREATE INDEX profiles_big5_open_idx ON profiles (big5_openness);
CREATE INDEX profiles_big5_cons_idx ON profiles (big5_conscientiousness);
CREATE INDEX profiles_big5_extra_idx ON profiles (big5_extraversion);
CREATE INDEX profiles_big5_agree_idx ON profiles (big5_agreeableness);
CREATE INDEX profiles_big5_neur_idx ON profiles (big5_neuroticism);
