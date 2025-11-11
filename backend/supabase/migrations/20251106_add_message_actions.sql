-- Add columns to support message actions
ALTER TABLE private_user_messages 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Create a function to update edited_at timestamp
-- CREATE OR REPLACE FUNCTION update_edited_at()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF NEW.content <> OLD.content THEN
--         NEW.is_edited := TRUE;
--         NEW.edited_at := NOW();
--     END IF;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- -- Create a trigger to update edited_at when content changes
-- DROP TRIGGER IF EXISTS update_private_message_edited_at ON private_user_messages;
-- CREATE TRIGGER update_private_message_edited_at
-- BEFORE UPDATE ON private_user_messages
-- FOR EACH ROW
-- WHEN (OLD.content IS DISTINCT FROM NEW.content)
-- EXECUTE FUNCTION update_edited_at();

-- Update RLS policies to allow message owners to update their messages
-- DROP POLICY IF EXISTS "private message update" ON private_user_messages;
-- CREATE POLICY "private message update" ON private_user_messages
-- FOR UPDATE USING (
--     user_id = firebase_uid()
--     AND created_time > NOW() - INTERVAL '1 day' -- Only allow editing for 24 hours
--     AND deleted = FALSE
-- );

-- Add policy for soft delete
-- DROP POLICY IF EXISTS "private message delete" ON private_user_messages;
-- CREATE POLICY "private message delete" ON private_user_messages
-- FOR UPDATE USING (
--     user_id = firebase_uid()
-- );

-- Add policy for reactions
-- DROP POLICY IF EXISTS "private message react" ON private_user_messages;
-- CREATE POLICY "private message react" ON private_user_messages
-- FOR UPDATE USING (
--     EXISTS (
--         SELECT 1
--         FROM private_user_message_channels ch
--         JOIN private_user_message_channel_members m ON ch.id = m.channel_id
--         WHERE m.user_id = firebase_uid()
--         AND ch.id = private_user_messages.channel_id
--     )
-- );
