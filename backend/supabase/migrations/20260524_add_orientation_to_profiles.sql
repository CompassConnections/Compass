-- Add orientation and gender/orientation details fields to profiles table
-- Created: 2026-05-24

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS orientation TEXT[],
    ADD COLUMN IF NOT EXISTS orientation_details TEXT,
    ADD COLUMN IF NOT EXISTS gender_details TEXT;

-- Create GIN index for array field
CREATE INDEX IF NOT EXISTS profiles_orientation_gin ON profiles USING GIN (orientation);
