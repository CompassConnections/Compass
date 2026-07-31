-- Add exercise frequency to profiles
-- Created: 2026-07-31
--
-- Scalar single-select (see EXERCISE_CHOICES in common/src/choices.ts): 'rarely' | 'sometimes' | 'often'.
-- NULL means "not answered" — there is deliberately no "prefer not to say" choice.

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS exercise TEXT;

CREATE INDEX IF NOT EXISTS profiles_exercise_idx ON profiles (exercise);
