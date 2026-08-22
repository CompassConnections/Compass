-- Migration: add_blog_posts
-- Created: 2026-08-22
--
-- The Compass blog: long-form posts written by an admin in the rich-text editor, listed at /blog and
-- read at /blog/<slug>.
--
-- Unlike `testimonials` (a member writes, we moderate) and `profile_spotlights` (we write about a
-- member, with their consent), a blog post has no member in it at all. It is first-party editorial
-- copy, so there is no consent gate and no snapshot rule — the two mechanisms those tables exist to
-- enforce. What it has instead, and they do not, is a *URL* that other people link to and a
-- *broadcast* that reaches every member exactly once. Both are one-way doors, and both are why the
-- columns below look the way they do.

CREATE TABLE IF NOT EXISTS blog_posts
(
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- The public identity of the post, and the part that cannot be taken back once it is out: the
    -- slug is in the notification every member received, in whatever they shared, and in whatever a
    -- crawler indexed. Editing it is allowed — a typo in a slug on day one should be fixable — but
    -- see `update-blog-post`, which refuses once the post has been published.
    --
    -- Lowercase, dashes and digits only, enforced here as well as in the API: this ends up in a path
    -- segment, and a slug with a slash or a space in it is a broken route rather than a bad one.
    slug            TEXT        NOT NULL UNIQUE
        CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' AND char_length(slug) BETWEEN 3 AND 120),

    title           TEXT        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),

    -- One or two sentences shown on the /blog card and used as the meta description. Separate from
    -- the body rather than sliced off the front of it, because the opening line of an essay is
    -- almost never the sentence that makes somebody click it.
    excerpt         TEXT CHECK (excerpt IS NULL OR char_length(excerpt) <= 400),

    -- The TipTap document, same storage as `profiles.bio` — the admin page composes it with the same
    -- editor the rest of the site uses, so images, links, headings and embeds all work with no new
    -- rendering path.
    content         JSONB       NOT NULL DEFAULT '{}'::JSONB,

    -- The flattened body, mirroring the `profiles.bio` / `profiles.bio_text` pair. Written by the
    -- API, never by hand. It is what a reading-time estimate and any future full-text search read;
    -- neither should have to know how to walk a ProseMirror tree.
    content_text    TEXT        NOT NULL DEFAULT '',

    -- Card image and OG image. A URL rather than an upload: the editor already uploads images to
    -- Firebase, so the cover is picked the same way as any image in the body.
    cover_image_url TEXT,

    -- 'draft' is written but unreachable — /blog/<slug> 404s for everyone but an admin previewing it.
    -- 'published' is public. 'archived' was published and was pulled; distinct from deleting the row
    -- so that a takedown is reversible, and so the slug stays claimed rather than being handed to a
    -- different post later. There is deliberately no delete, same reasoning as `profile_spotlights`.
    status          TEXT        NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'archived')),

    -- Who wrote it. Nulled rather than cascaded if the account goes: a post outliving its author's
    -- account should lose its byline, not its text. The byline itself is read live from `users` (see
    -- `helpers/blog.ts`) rather than snapshotted — a spotlight freezes its subject's details because
    -- the subject must not be able to edit the front page, but a blog author editing their own name
    -- and having the byline follow is simply correct.
    author_id       TEXT        REFERENCES users (id) ON DELETE SET NULL,

    -- When it first went public, as opposed to when the row was created. This is the date on the
    -- card and in the feed, so it is set once on the first publish and then left alone: re-editing a
    -- year-old post must not move it back to the top of /blog.
    published_time  TIMESTAMPTZ,

    -- When the "new post" broadcast went out, and the interlock that stops it going out twice. The
    -- notification reaches every member, so a second one is not a small mistake — see
    -- `update-blog-post`, which refuses to send when this is already set.
    notified_time   TIMESTAMPTZ,

    created_time    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_time    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE blog_posts IS
    'Long-form editorial posts shown at /blog. Written by admins in the rich-text editor; published '
        'and broadcast from /admin/blog.';

-- The public list is always `status = 'published'` ordered newest-first by publication date. The
-- partial index keeps drafts and archived posts out of the index entirely, since no public read ever
-- wants them.
CREATE INDEX IF NOT EXISTS idx_blog_posts_published
    ON blog_posts (published_time DESC)
    WHERE status = 'published';

-- `slug` is already uniquely indexed by the UNIQUE constraint above, which serves the /blog/<slug>
-- read. No second index needed.

-- RLS on with no policies, i.e. a flat deny for anon and authenticated. Same reasoning as
-- `testimonials` and `profile_spotlights`: every read goes through the API on the service-role
-- connection, so an unpublished draft is never one PostgREST query away from being read — and a
-- draft blog post is exactly the kind of thing that gets written days before it is meant to be seen.
ALTER TABLE blog_posts
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON blog_posts FROM anon, authenticated;
