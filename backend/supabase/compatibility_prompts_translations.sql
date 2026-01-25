CREATE TABLE IF NOT EXISTS compatibility_prompts_translations
(
    question_id             BIGINT                    NOT NULL,
    locale                  TEXT                      NOT NULL,
    multiple_choice_options JSONB,
    question                TEXT                      NOT NULL,
    updated_at              TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (question_id, locale),
    CONSTRAINT fk_question
        FOREIGN KEY (question_id)
            REFERENCES compatibility_prompts (id)
            ON DELETE CASCADE
);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_compatibility_prompts_translations_updated_at
    BEFORE UPDATE
    ON compatibility_prompts_translations
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE compatibility_prompts_translations
    ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "public read"
    ON compatibility_prompts_translations
    FOR SELECT
    USING (true);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_compatibility_prompts_translations_locale ON compatibility_prompts_translations (locale);
CREATE INDEX IF NOT EXISTS idx_compatibility_prompts_translations_question_id ON compatibility_prompts_translations (question_id);
CREATE INDEX IF NOT EXISTS idx_cpt_locale ON compatibility_prompts_translations (question_id, locale);
