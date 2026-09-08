CREATE TABLE IF NOT EXISTS interests
(
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    creator_id text REFERENCES users (id) ON DELETE set null,
    name TEXT NOT NULL,
    -- Profiles currently holding this option. Maintained by the triggers in profile_interests.sql, and
    -- read by /search-options to lead with the options people actually use rather than with whatever
    -- happens to sort first alphabetically. See 20260907_canonical_options.sql.
    usage_count INTEGER NOT NULL DEFAULT 0
);

-- Row Level Security
ALTER TABLE interests
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON interests;
CREATE POLICY "public read" ON interests
    FOR SELECT USING (true);

-- Identity is case-insensitive. There used to be a `interests_name_unique UNIQUE (name)` constraint and an
-- index misleadingly named `idx_interests_name_ci` that was in fact `ON interests (name)` — no case folding at
-- all, so "Gaming", "gaming" and "GAMING" were three separate options. Uniqueness on lower(name)
-- implies uniqueness on name, so this single index replaces both.
CREATE UNIQUE INDEX IF NOT EXISTS idx_interests_name_lower
    ON interests (lower(name));

-- Fuzzy matching for the "did you mean" path in /check-option-name.
CREATE INDEX IF NOT EXISTS idx_interests_name_trgm
    ON interests USING GIN (name gin_trgm_ops);

-- The pickers' default view is "top N by popularity", which is this index.
CREATE INDEX IF NOT EXISTS idx_interests_usage_count
    ON interests (usage_count DESC, id);

-- rebuild_profile_search() folds option names into every holder's search_text, and the triggers in
-- profile_interests.sql fire on INSERT and DELETE only — so renaming an option used to leave every holder's
-- search_text quoting the old name. `UPDATE OF name` is load-bearing: without it every usage_count
-- increment would rebuild the search text of every profile holding the option.
CREATE OR REPLACE FUNCTION trg_interests_name_rebuild_search()
    RETURNS trigger AS
$$
BEGIN
    PERFORM rebuild_profile_search(po.profile_id)
    FROM profile_interests po
    WHERE po.option_id = NEW.id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_interests_name_search_upd ON interests;
CREATE TRIGGER trg_interests_name_search_upd
    AFTER UPDATE OF name
    ON interests
    FOR EACH ROW
    WHEN (OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION trg_interests_name_rebuild_search();
