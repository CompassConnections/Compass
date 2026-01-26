CREATE TABLE IF NOT EXISTS work_translations
(
    option_id BIGINT NOT NULL REFERENCES work (id) ON DELETE CASCADE,
    locale    TEXT   NOT NULL, -- 'en', 'fr', 'de', etc.
    name      TEXT   NOT NULL,
    PRIMARY KEY (option_id, locale)
);

-- Row Level Security
ALTER TABLE work_translations
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON work_translations;
CREATE POLICY "public read" ON work_translations
    FOR SELECT USING (true);

CREATE INDEX idx_work_translations_option_locale
    ON work_translations (option_id, locale);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_work_translations_name_trgm
    ON work_translations
        USING GIN (name gin_trgm_ops);

