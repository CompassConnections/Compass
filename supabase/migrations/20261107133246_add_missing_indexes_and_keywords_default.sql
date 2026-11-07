-- Pieces of earlier migrations that never reached prod.

-- Full-text search over profiles (the search_tsv column and its trigger are already there).
create index if not exists profiles_search_tsv_idx
    on profiles using gin (search_tsv);

-- From 20261031_compatibility_scores_prompt, whose column changes applied but whose index did not.
create index if not exists compatibility_scores_score_low_desc_idx
    on compatibility_scores (score_low desc, score desc);

-- From 20260225_add_keywords_to_profiles. Only affects new rows; existing nulls stay null.
alter table profiles
    alter column keywords set default '{}';
