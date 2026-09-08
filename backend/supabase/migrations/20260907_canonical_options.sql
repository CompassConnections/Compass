-- Canonical, de-duplicated option taxonomies (`interests`, `causes`, `work`).
--
-- These three tables are user-creatable, and until now the *only* thing standing between them and
-- unbounded duplication was `ON CONFLICT (name)` — byte-exact string equality. The index that looked
-- like it protected us did not:
--
--     CREATE UNIQUE INDEX idx_interests_name_ci ON interests (name);
--
-- named `_ci` but never case-folded, so "Gaming", "gaming" and "GAMING" were three separate options
-- that no search could reconcile. This migration gives the tables a real identity (`lower(name)`), a
-- canonical spelling, a place to record the names that lost a merge (`*_aliases`) so a dead name can
-- never be typed back into existence, and a popularity counter so the pickers can lead with the
-- options people actually use instead of whatever sorts first alphabetically.
--
-- Ordering matters here and is deliberate:
--   1. the name-change trigger is installed *before* any renaming, so normalising a name rebuilds the
--      `search_text` of every profile holding it for free (see the note on that trigger below);
--   2. collisions are folded *before* the unique index is created, or creating it would fail;
--   3. `usage_count` is backfilled *after* the fold, so the counts describe the surviving rows.
--
-- Table names are interpolated with `%1$s` rather than `%1$I` throughout: they come from a hard-coded
-- literal array, and `%I` would quote them, turning `%1$I_aliases` into the invalid `"interests"_aliases`.

--------------------------------------------------------------------------------------------------
-- 1. Canonical spelling
--------------------------------------------------------------------------------------------------

-- Mirrors `normalizeOptionName` in `common/src/profiles/option-name.ts`. Both exist because the
-- backend has to normalise on every write and this migration has to normalise a table it cannot
-- round-trip through TypeScript; they must be kept in step.
--
-- The rule is sentence case, applied only to a name typed in all lower case: uppercase the first
-- character, touch nothing else. Deliberately NOT
-- title case — the existing corpus is sentence case ("Video games", "Climate science", "Rock
-- climbing"), so title-casing new entries would make every new option clash with every old one. And
-- deliberately not lowercasing the remaining words either: that would destroy "Bach", "Yosemite",
-- "iOS" and "AI". Divergence like "Rock Climbing" vs "Rock climbing" is handled by case-insensitive
-- *identity* below rather than by guessing, so the first writer's spelling simply wins.
--
-- Trailing punctuation is stripped from a closed set (`.,;:!?`) rather than `[[:punct:]]`, which
-- would turn "C++" into "C".
CREATE OR REPLACE FUNCTION normalize_option_name(raw TEXT) RETURNS TEXT AS
$$
DECLARE
    s TEXT;
BEGIN
    -- Non-breaking spaces arrive via paste and are not matched by `\s`, so they are folded to an
    -- ordinary space first rather than being smuggled into the character class.
    s := replace(coalesce(raw, ''), E'\u00A0', ' ');
    s := btrim(regexp_replace(s, '\s+', ' ', 'g'));
    s := btrim(regexp_replace(s, '[.,;:!?]+$', ''));
    IF s = '' THEN
        RETURN '';
    END IF;
    -- Only when the name carries no capital of its own: uppercasing the first character
    -- unconditionally turns "iOS" into "IOS", and a capital anywhere is taken as evidence that the
    -- writer meant the casing they typed.
    IF s ~ '[[:upper:]]' THEN
        RETURN s;
    END IF;
    RETURN upper(left(s, 1)) || substr(s, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

--------------------------------------------------------------------------------------------------
-- 2. Alias tables — where merged-away names go
--------------------------------------------------------------------------------------------------

-- One per option table, mirroring the `*_translations` layout, so each gets a real foreign key and
-- `ON DELETE CASCADE` instead of a polymorphic `table_key` column that no constraint can check.
--
-- This is the piece that makes a merge *stick*. The 2026-08-07 merge script ends with the note that
-- "nothing stops someone typing 'Gaming' back into existence"; with an alias row, typing the dead
-- name now resolves to the surviving option instead of creating a new one.
--
-- `lower(alias)` is unique across the whole table (not just per option) because resolution looks an
-- alias up on its own: two options claiming the same alias would make that lookup ambiguous.
DO
$$
    DECLARE
        t TEXT;
    BEGIN
        FOREACH t IN ARRAY ARRAY ['interests', 'causes', 'work']
            LOOP
                EXECUTE format($fmt$
                    CREATE TABLE IF NOT EXISTS %1$s_aliases
                    (
                        option_id    BIGINT      NOT NULL REFERENCES %1$s (id) ON DELETE CASCADE,
                        alias        TEXT        NOT NULL,
                        created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
                        PRIMARY KEY (option_id, alias)
                    );

                    ALTER TABLE %1$s_aliases ENABLE ROW LEVEL SECURITY;

                    DROP POLICY IF EXISTS "public read" ON %1$s_aliases;
                    CREATE POLICY "public read" ON %1$s_aliases FOR SELECT USING (true);

                    CREATE UNIQUE INDEX IF NOT EXISTS idx_%1$s_aliases_lower
                        ON %1$s_aliases (lower(alias));
                $fmt$, t);
            END LOOP;
    END
$$;

--------------------------------------------------------------------------------------------------
-- 3. Popularity counter
--------------------------------------------------------------------------------------------------

DO
$$
    DECLARE
        t TEXT;
    BEGIN
        FOREACH t IN ARRAY ARRAY ['interests', 'causes', 'work']
            LOOP
                EXECUTE format(
                        'ALTER TABLE %1$s ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0',
                        t);
            END LOOP;
    END
$$;

--------------------------------------------------------------------------------------------------
-- 4. Rebuild `search_text` when an option is *renamed*
--------------------------------------------------------------------------------------------------

-- `rebuild_profile_search` folds option names into each profile's `search_text`, and the existing
-- triggers on `profile_*` fire on INSERT and DELETE only. So renaming an option silently left every
-- holder's `search_text` quoting the old name — the exact failure the 2026-08-07 merge script had to
-- work around by insert-then-delete rather than repointing rows in place.
--
-- `UPDATE OF name` is load-bearing: without it, every `usage_count` increment below would rebuild
-- the search text of every profile holding that option.
DO
$$
    DECLARE
        t TEXT;
    BEGIN
        FOREACH t IN ARRAY ARRAY ['interests', 'causes', 'work']
            LOOP
                EXECUTE format($fmt$
                    CREATE OR REPLACE FUNCTION trg_%1$s_name_rebuild_search() RETURNS trigger AS
                    $body$
                    BEGIN
                        PERFORM rebuild_profile_search(po.profile_id)
                        FROM profile_%1$s po
                        WHERE po.option_id = NEW.id;
                        RETURN NULL;
                    END;
                    $body$ LANGUAGE plpgsql;

                    DROP TRIGGER IF EXISTS trg_%1$s_name_search_upd ON %1$s;
                    CREATE TRIGGER trg_%1$s_name_search_upd
                        AFTER UPDATE OF name ON %1$s
                        FOR EACH ROW
                        WHEN (OLD.name IS DISTINCT FROM NEW.name)
                    EXECUTE FUNCTION trg_%1$s_name_rebuild_search();
                $fmt$, t);
            END LOOP;
    END
$$;

--------------------------------------------------------------------------------------------------
-- 5. Fold case/spelling collisions, then normalise the survivors
--------------------------------------------------------------------------------------------------

-- Within each group of names that normalise to the same key, the row held by the most profiles wins
-- (ties broken by lowest id, i.e. the one created first). Losers hand their holders over, leave an
-- alias behind, and are deleted.
--
-- Holders are moved with INSERT ... ON CONFLICT DO NOTHING followed by the cascading DELETE, rather
-- than `UPDATE profile_x SET option_id`, for the same reason the merge script gives: there is no
-- UPDATE trigger on `profile_*`, so repointing in place would move everyone's tick without ever
-- rebuilding their `search_text`.
DO
$$
    DECLARE
        t TEXT;
    BEGIN
        FOREACH t IN ARRAY ARRAY ['interests', 'causes', 'work']
            LOOP
                EXECUTE format($fmt$
                    CREATE TEMP TABLE folded_%1$s ON COMMIT DROP AS
                    WITH counted AS (SELECT o.id,
                                            o.name,
                                            lower(normalize_option_name(o.name)) AS key,
                                            (SELECT count(*)
                                             FROM profile_%1$s po
                                             WHERE po.option_id = o.id)          AS uses
                                     FROM %1$s o
                                     WHERE normalize_option_name(o.name) <> ''),
                         ranked AS (SELECT id,
                                           name,
                                           key,
                                           row_number() OVER (PARTITION BY key ORDER BY uses DESC, id ASC) AS rn
                                    FROM counted)
                    SELECT winner.id   AS winner_id,
                           loser.id    AS loser_id,
                           loser.name  AS loser_name
                    FROM ranked loser
                             JOIN ranked winner ON winner.key = loser.key AND winner.rn = 1
                    WHERE loser.rn > 1;

                    INSERT INTO profile_%1$s (profile_id, option_id)
                    SELECT po.profile_id, f.winner_id
                    FROM profile_%1$s po
                             JOIN folded_%1$s f ON f.loser_id = po.option_id
                    ON CONFLICT (profile_id, option_id) DO NOTHING;

                    -- The loser's original spelling becomes an alias of the winner, so re-typing it
                    -- resolves instead of re-creating. Skipped when it differs from the winner only
                    -- by the normalisation itself — lower(name) already covers that case.
                    INSERT INTO %1$s_aliases (option_id, alias)
                    SELECT f.winner_id, f.loser_name
                    FROM folded_%1$s f
                             JOIN %1$s w ON w.id = f.winner_id
                    WHERE lower(f.loser_name) <> lower(normalize_option_name(w.name))
                    ON CONFLICT DO NOTHING;

                    DELETE FROM %1$s WHERE id IN (SELECT loser_id FROM folded_%1$s);

                    -- Fires the rename trigger installed above, so holders' search_text follows.
                    UPDATE %1$s
                    SET name = normalize_option_name(name)
                    WHERE name IS DISTINCT FROM normalize_option_name(name)
                      AND normalize_option_name(name) <> '';
                $fmt$, t);
            END LOOP;
    END
$$;

--------------------------------------------------------------------------------------------------
-- 6. Real identity: unique on lower(name)
--------------------------------------------------------------------------------------------------

-- `*_name_unique` and `idx_*_name_ci` both enforced exact-name uniqueness, which `lower(name)`
-- uniqueness strictly implies — keeping either would mean two unique indexes maintained on every
-- write for one constraint. The writers that used to say `ON CONFLICT (name)`
-- (`backend/api/src/update-options.ts`, `tests/e2e/utils/seed-showcase.ts`) now say
-- `ON CONFLICT (lower(name))` and target this index instead.
DO
$$
    DECLARE
        t TEXT;
    BEGIN
        FOREACH t IN ARRAY ARRAY ['interests', 'causes', 'work']
            LOOP
                EXECUTE format($fmt$
                    ALTER TABLE %1$s DROP CONSTRAINT IF EXISTS %1$s_name_unique;
                    DROP INDEX IF EXISTS idx_%1$s_name_ci;

                    CREATE UNIQUE INDEX IF NOT EXISTS idx_%1$s_name_lower ON %1$s (lower(name));

                    -- Fuzzy matching for the "did you mean" path. Only the *_translations tables had
                    -- a trigram index; the base names people actually search had none.
                    CREATE INDEX IF NOT EXISTS idx_%1$s_name_trgm ON %1$s USING GIN (name gin_trgm_ops);

                    -- The pickers' default view is "top N by popularity", which is this index.
                    CREATE INDEX IF NOT EXISTS idx_%1$s_usage_count ON %1$s (usage_count DESC, id);
                $fmt$, t);
            END LOOP;
    END
$$;

--------------------------------------------------------------------------------------------------
-- 7. Backfill and maintain `usage_count`
--------------------------------------------------------------------------------------------------

DO
$$
    DECLARE
        t TEXT;
    BEGIN
        FOREACH t IN ARRAY ARRAY ['interests', 'causes', 'work']
            LOOP
                EXECUTE format($fmt$
                    UPDATE %1$s o
                    SET usage_count = (SELECT count(*) FROM profile_%1$s po WHERE po.option_id = o.id);

                    CREATE OR REPLACE FUNCTION trg_profile_%1$s_usage_count() RETURNS trigger AS
                    $body$
                    BEGIN
                        IF TG_OP = 'INSERT' THEN
                            UPDATE %1$s SET usage_count = usage_count + 1 WHERE id = NEW.option_id;
                        ELSE
                            -- greatest(...) so a miscount can never park the column at a negative
                            -- number that the ORDER BY would then sort to the bottom forever. When
                            -- the option row itself is being deleted this UPDATE matches nothing.
                            UPDATE %1$s SET usage_count = greatest(usage_count - 1, 0) WHERE id = OLD.option_id;
                        END IF;
                        RETURN NULL;
                    END;
                    $body$ LANGUAGE plpgsql;

                    DROP TRIGGER IF EXISTS trg_profile_%1$s_usage_ins ON profile_%1$s;
                    CREATE TRIGGER trg_profile_%1$s_usage_ins
                        AFTER INSERT ON profile_%1$s
                        FOR EACH ROW
                    EXECUTE FUNCTION trg_profile_%1$s_usage_count();

                    DROP TRIGGER IF EXISTS trg_profile_%1$s_usage_del ON profile_%1$s;
                    CREATE TRIGGER trg_profile_%1$s_usage_del
                        AFTER DELETE ON profile_%1$s
                        FOR EACH ROW
                    EXECUTE FUNCTION trg_profile_%1$s_usage_count();
                $fmt$, t);
            END LOOP;
    END
$$;
