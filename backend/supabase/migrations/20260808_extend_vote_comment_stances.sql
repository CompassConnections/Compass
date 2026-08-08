-- Two stances the original three didn't cover:
--   'both'   — an argument that cuts both ways, which previously had to masquerade as one-sided
--   'answer' — a reply that answers a question, distinct from taking a side on the proposal
ALTER TABLE vote_comments
    DROP CONSTRAINT IF EXISTS vote_comments_stance_check;

ALTER TABLE vote_comments
    ADD CONSTRAINT vote_comments_stance_check
        CHECK (stance IN ('for', 'against', 'both', 'question', 'answer'));
