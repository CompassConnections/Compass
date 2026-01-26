CREATE TABLE IF NOT EXISTS interests_translations
(
    option_id BIGINT NOT NULL REFERENCES interests (id) ON DELETE CASCADE,
    locale    TEXT   NOT NULL, -- 'en', 'fr', 'de', etc.
    name      TEXT   NOT NULL,
    PRIMARY KEY (option_id, locale)
);

-- Row Level Security
ALTER TABLE interests_translations
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON interests_translations;
CREATE POLICY "public read" ON interests_translations
    FOR SELECT USING (true);

DROP INDEX IF EXISTS idx_interests_translations_option_locale;
CREATE INDEX idx_interests_translations_option_locale
    ON interests_translations (option_id, locale);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP INDEX IF EXISTS idx_interests_translations_name_trgm;
CREATE INDEX idx_interests_translations_name_trgm
    ON interests_translations
        USING GIN (name gin_trgm_ops);

