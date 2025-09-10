create extension if not exists pg_trgm;

CREATE INDEX lovers_bio_trgm_idx
    ON lovers USING gin ((bio::text) gin_trgm_ops);
