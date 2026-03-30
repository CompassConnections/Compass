-- Add substance-related fields to profiles table
-- Created: 2026-03-30

-- Add columns for psychedelics/plant medicine
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS psychedelics TEXT,
    ADD COLUMN IF NOT EXISTS psychedelics_intention TEXT[],
    ADD COLUMN IF NOT EXISTS psychedelics_pref TEXT[];

-- Add columns for cannabis
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS cannabis TEXT,
    ADD COLUMN IF NOT EXISTS cannabis_intention TEXT[],
    ADD COLUMN IF NOT EXISTS cannabis_pref TEXT[];

-- Create indexes for substance fields
CREATE INDEX IF NOT EXISTS profiles_psychedelics_idx ON profiles (psychedelics);
CREATE INDEX IF NOT EXISTS profiles_cannabis_idx ON profiles (cannabis);

-- Create GIN indexes for array fields
CREATE INDEX IF NOT EXISTS profiles_psychedelics_intention_gin ON profiles USING GIN (psychedelics_intention);
CREATE INDEX IF NOT EXISTS profiles_cannabis_intention_gin ON profiles USING GIN (cannabis_intention);
CREATE INDEX IF NOT EXISTS profiles_psychedelics_pref_gin ON profiles USING GIN (psychedelics_pref);
CREATE INDEX IF NOT EXISTS profiles_cannabis_pref_gin ON profiles USING GIN (cannabis_pref);
