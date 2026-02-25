-- Create notification template translations table
CREATE TABLE IF NOT EXISTS notification_template_translations
(
    template_id  TEXT                      NOT NULL REFERENCES notification_templates (id) ON DELETE CASCADE,
    locale       TEXT                      NOT NULL,
    title        TEXT,
    source_text  TEXT                      NOT NULL,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (template_id, locale)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS notification_template_translations_template_id_idx
    ON notification_template_translations (template_id);

CREATE INDEX IF NOT EXISTS notification_template_translations_locale_idx
    ON notification_template_translations (locale);

-- Row Level Security
ALTER TABLE notification_template_translations
    ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read notification template translations
DROP POLICY IF EXISTS "public read" ON notification_template_translations;
CREATE POLICY "public read" ON notification_template_translations
    FOR SELECT USING (true);