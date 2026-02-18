-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates
(
    id                     TEXT PRIMARY KEY NOT NULL,
    source_type            TEXT             NOT NULL,
    title                  TEXT,
    source_text            TEXT             NOT NULL,
    source_slug            TEXT,
    source_user_avatar_url TEXT,
    source_update_type     TEXT,
    created_time           BIGINT           NOT NULL,
    data                   JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS notification_templates_source_type_idx
    ON notification_templates (source_type);

-- Row Level Security
ALTER TABLE notification_templates
    ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read notification templates
DROP POLICY IF EXISTS "public read" ON notification_templates;
CREATE POLICY "public read" ON notification_templates
    FOR SELECT USING (true);

-- Update user_notifications table structure
-- Add template_id column and modify data column to only store user-specific data

-- Add template_id column if it doesn't exist
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1
                       FROM information_schema.columns
                       WHERE table_name = 'user_notifications'
                         AND column_name = 'template_id') THEN
            ALTER TABLE user_notifications
                ADD COLUMN template_id TEXT REFERENCES notification_templates (id) ON DELETE CASCADE;
        END IF;
    END
$$;

-- Create index on template_id for faster lookups
CREATE INDEX IF NOT EXISTS user_notifications_template_id_idx
    ON user_notifications (template_id);
