-- Add importance count columns to compatibility_prompts
ALTER TABLE compatibility_prompts
    ADD COLUMN IF NOT EXISTS community_importance_score BIGINT DEFAULT 0;
ALTER TABLE compatibility_prompts
    ADD COLUMN IF NOT EXISTS answer_count BIGINT DEFAULT 0;

-- Create function to update importance counts for a question
CREATE OR REPLACE FUNCTION update_compatibility_prompt_community_importance_score(p_question_id BIGINT)
    RETURNS void
    LANGUAGE plpgsql
AS
$$
BEGIN
    UPDATE compatibility_prompts cp
    SET answer_count               = sub.total,
        community_importance_score = sub.important
    FROM (SELECT COUNT(*)                                                      as total,
                 SUM(CASE WHEN importance >= 2 THEN importance - 1 ELSE 0 END) AS important
          FROM compatibility_answers
          WHERE question_id = p_question_id
            AND multiple_choice IS NOT NULL
            AND multiple_choice >= 0) sub
    WHERE cp.id = p_question_id;
END;
$$;

-- Backfill existing data
UPDATE compatibility_prompts cp
SET answer_count               = sub.total,
    community_importance_score = sub.important
FROM (SELECT question_id,
             COUNT(*)                                                      as total,
             SUM(CASE WHEN importance >= 2 THEN importance - 1 ELSE 0 END) AS important
      FROM compatibility_answers
      WHERE multiple_choice IS NOT NULL
        AND multiple_choice >= 0
      GROUP BY question_id) sub
WHERE cp.id = sub.question_id;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_compatibility_prompts_importance_counts
    ON compatibility_prompts (answer_count DESC, community_importance_score DESC);
