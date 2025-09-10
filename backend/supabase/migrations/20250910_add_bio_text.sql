ALTER TABLE lovers ADD COLUMN bio_text tsvector;

CREATE OR REPLACE FUNCTION lovers_bio_tsvector_update()
RETURNS trigger AS $$
BEGIN
  new.bio_text := to_tsvector(
    'english',
    (
      SELECT string_agg(trim(both '"' from x::text), ' ')
      FROM jsonb_path_query(new.bio, '$.**.text'::jsonpath) AS x
    )
  );
RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lovers_bio_tsvector_trigger
    BEFORE INSERT OR UPDATE OF bio ON lovers
    FOR EACH ROW EXECUTE FUNCTION lovers_bio_tsvector_update();


create index on lovers using gin(bio_text);
