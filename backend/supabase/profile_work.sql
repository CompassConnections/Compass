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

-- Trigger to update /get-profiles search
CREATE OR REPLACE FUNCTION trg_profile_work_rebuild_search()
    RETURNS trigger AS
$$
BEGIN
    PERFORM rebuild_profile_search(
            COALESCE(NEW.profile_id, OLD.profile_id)
            );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profile_work_search_ins
    AFTER INSERT
    ON profile_work
    FOR EACH ROW
EXECUTE FUNCTION trg_profile_work_rebuild_search();

CREATE TRIGGER trg_profile_work_search_del
    AFTER DELETE
    ON profile_work
    FOR EACH ROW
EXECUTE FUNCTION trg_profile_work_rebuild_search();

-- Keeps work.usage_count in step. Counting holders on demand would mean a correlated subquery per row
-- on every picker fetch; the pickers' whole default view is an ORDER BY on this column.
CREATE OR REPLACE FUNCTION trg_profile_work_usage_count()
    RETURNS trigger AS
$$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE work SET usage_count = usage_count + 1 WHERE id = NEW.option_id;
    ELSE
        -- greatest(...) so a miscount can never park the column at a negative number that the
        -- ORDER BY would then sort to the bottom forever. When the option row itself is being
        -- deleted, this UPDATE simply matches nothing.
        UPDATE work SET usage_count = greatest(usage_count - 1, 0) WHERE id = OLD.option_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profile_work_usage_ins ON profile_work;
CREATE TRIGGER trg_profile_work_usage_ins
    AFTER INSERT
    ON profile_work
    FOR EACH ROW
EXECUTE FUNCTION trg_profile_work_usage_count();

DROP TRIGGER IF EXISTS trg_profile_work_usage_del ON profile_work;
CREATE TRIGGER trg_profile_work_usage_del
    AFTER DELETE
    ON profile_work
    FOR EACH ROW
EXECUTE FUNCTION trg_profile_work_usage_count();
