-- Add neurotype (neurodivergence identity) fields to profiles table
-- Created: 2026-07-24

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS neurotype         TEXT[],
    ADD COLUMN IF NOT EXISTS neurotype_details TEXT;

-- Create GIN index for array field
CREATE INDEX IF NOT EXISTS profiles_neurotype_gin ON profiles USING GIN (neurotype);
