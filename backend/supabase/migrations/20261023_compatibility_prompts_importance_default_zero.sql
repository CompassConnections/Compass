-- Member-created prompts must be non-core. `importance_score` is the serving order: non-zero marks a
-- prompt as core and ranks it in the guided first run; 0 is everything outside that set. The column
-- default had been left at the pre-flip polarity, so prompts created through the app came in as core.
-- The API now sets 0 explicitly as well; this makes the schema agree with it.
ALTER TABLE compatibility_prompts
    ALTER COLUMN importance_score SET DEFAULT 0;

