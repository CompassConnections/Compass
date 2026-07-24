-- Add accessibility notes to profiles table
-- Created: 2026-07-24
--
-- Deliberately free text rather than a checkbox taxonomy of conditions: a taxonomy exists mainly to be
-- filtered on, and filtering people out by disability is exactly what this field must not enable. Free
-- text keeps framing and depth of disclosure with the member. It is keyword-searchable (see `textFields`
-- in backend/api/src/get-profiles.ts) but has no filter of its own.

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS accessibility_notes TEXT;
