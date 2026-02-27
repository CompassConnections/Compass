-- Add keywords column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
