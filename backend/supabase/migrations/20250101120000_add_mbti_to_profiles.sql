-- Add MBTI column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS mbti TEXT;

-- Create GIN index for array operations
CREATE INDEX IF NOT EXISTS idx_profiles_mbti ON profiles USING btree (mbti);
