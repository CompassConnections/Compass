CREATE TABLE IF NOT EXISTS causes_translations
(
    option_id BIGINT NOT NULL REFERENCES causes (id) ON DELETE CASCADE,
    locale    TEXT   NOT NULL, -- 'en', 'fr', 'de', etc.
    name      TEXT   NOT NULL,
    PRIMARY KEY (option_id, locale)
);

-- Row Level Security
ALTER TABLE causes_translations
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON causes_translations;
CREATE POLICY "public read" ON causes_translations
    FOR SELECT USING (true);

CREATE INDEX idx_causes_translations_option_locale
    ON causes_translations (option_id, locale);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_causes_translations_name_trgm
    ON causes_translations
        USING GIN (name gin_trgm_ops);

