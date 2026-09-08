-- Names that used to be their own `interests` option and were merged away.
--
-- This is what makes a merge stick. Before it, folding "Gaming" into "Video games" only held until
-- the next person typed "Gaming" again — the 2026-08-07 merge script says so in its own closing
-- note. Resolution (`resolveOptionName` in backend/api/src/options/resolve-option.ts) checks exact
-- name, then lower(name), then this table, and only then creates a new option.
--
-- Mirrors the `interests_translations` layout rather than one polymorphic table keyed by table name, so
-- the foreign key and its ON DELETE CASCADE are real.
CREATE TABLE IF NOT EXISTS interests_aliases
(
    option_id    BIGINT      NOT NULL REFERENCES interests (id) ON DELETE CASCADE,
    alias        TEXT        NOT NULL,
    created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (option_id, alias)
);

-- Row Level Security
ALTER TABLE interests_aliases
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON interests_aliases;
CREATE POLICY "public read" ON interests_aliases
    FOR SELECT USING (true);

-- Unique across the whole table, not per option: an alias is looked up on its own, so two options
-- claiming the same alias would make that lookup ambiguous.
CREATE UNIQUE INDEX IF NOT EXISTS idx_interests_aliases_lower
    ON interests_aliases (lower(alias));
