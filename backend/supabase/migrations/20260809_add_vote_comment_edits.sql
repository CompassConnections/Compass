-- Editing an argument, with the previous versions kept.
--
-- Plain editing would be enough anywhere else, but not here: an argument on a proposal notifies
-- everyone who already voted and is meant to change their vote. Without a record, someone can post
-- "this breaks X", collect the vote changes, then quietly rewrite it into something nobody agreed
-- with — and the people who moved because of it have no way to see that. Keeping the old versions
-- costs one small table and makes editing safe to allow freely instead of locking it behind a
-- five-minute window.
ALTER TABLE vote_comments
    ADD COLUMN IF NOT EXISTS edited_time TIMESTAMPTZ;

-- One row per edit, holding the content *before* that edit. The live text always stays on
-- vote_comments, so reading a thread never touches this table.
CREATE TABLE IF NOT EXISTS vote_comment_edits (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    comment_id   BIGINT  NOT NULL,
    content      JSONB   NOT NULL,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE vote_comment_edits
    DROP CONSTRAINT IF EXISTS vote_comment_edits_comment_id_fkey;
ALTER TABLE vote_comment_edits
    ADD CONSTRAINT vote_comment_edits_comment_id_fkey
        FOREIGN KEY (comment_id) REFERENCES vote_comments (id) ON DELETE CASCADE;

ALTER TABLE vote_comment_edits ENABLE ROW LEVEL SECURITY;

-- Public read, like the comments themselves. A private edit history would defeat the point: the
-- record only helps if the people who read the argument can check it.
DROP POLICY IF EXISTS "public read" ON vote_comment_edits;
CREATE POLICY "public read" ON vote_comment_edits
    FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS vote_comment_edits_comment_id_idx
    ON public.vote_comment_edits USING btree (comment_id, created_time);
