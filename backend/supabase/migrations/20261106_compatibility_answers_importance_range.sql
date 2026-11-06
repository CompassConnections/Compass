-- Bound `importance` to the values the app offers: 0-3 on the importance scale, -1 for a skipped prompt.
--
-- The column had no range, so one answer could carry any integer. The per-prompt community score sums
-- `importance - 1`, which meant a single extreme answer set community_importance_percent, and with it
-- the default order of /compatibility, for everyone.

alter table compatibility_answers
    add constraint compatibility_answers_importance_range check (importance between -1 and 3);
