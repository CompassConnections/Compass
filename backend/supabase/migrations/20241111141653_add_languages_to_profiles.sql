-- Add languages column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS languages TEXT[] null;

-- Create GIN index for array operations
CREATE INDEX IF NOT EXISTS idx_profiles_languages ON profiles USING GIN (languages);
