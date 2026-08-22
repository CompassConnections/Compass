import {JSONContent} from '@tiptap/core'
import clsx from 'clsx'
import {
  AdminBlogPost,
  BLOG_POST_STATUS_LABELS,
  BlogPostStatus,
  formatBlogDate,
  getBlogPostDraftError,
  MAX_BLOG_EXCERPT_LENGTH,
  MAX_BLOG_NOTIFICATION_LENGTH,
  MAX_BLOG_TITLE_LENGTH,
  slugifyBlogTitle,
} from 'common/blog/blog'
import {IS_LOCAL} from 'common/hosting/constants'
import {groupBy} from 'lodash'
import {useState} from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {NoSEO} from 'web/components/NoSEO'
import {PageBase} from 'web/components/page-base'
import {TextEditor, useTextEditor} from 'web/components/widgets/editor'
import {ExpandingInput} from 'web/components/widgets/expanding-input'
import {Input} from 'web/components/widgets/input'
import {useAdmin} from 'web/hooks/use-admin'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {api} from 'web/lib/api'

/**
 * The blog desk. Write a post, edit it, publish it, announce it, take it down.
 *
 * Admins only — see `throwErrorIfNotAdmin`. Publishing under the Compass name is an editorial act,
 * not a moderation one, so the mod role does not reach here (same split as `/admin/spotlights`).
 *
 * Not translated, like every other page under `/admin`: only admins ever see it.
 *
 * The page is ordered by the workflow rather than by recency: the composer first, then drafts (work
 * owed), then what is live, then what has been taken down.
 */

const STATUS_ORDER: BlogPostStatus[] = ['draft', 'published', 'archived']

const GROUP_NOTE: Record<BlogPostStatus, string> = {
  draft: 'Written but unreachable — /blog/<slug> 404s for everyone. Publishing makes it public.',
  published: 'Live on /blog. Editing is fine; the URL and the publication date are fixed.',
  archived: 'Was live, then pulled. Publishing puts it back under the same URL and the same date.',
}

export default function AdminBlog() {
  const isAdmin = useAdmin()
  const {data, refresh} = useAPIGetter('get-blog-posts-admin', {})

  if (!(isAdmin || IS_LOCAL)) return <p>Not authorized</p>

  const posts = data?.posts ?? []
  const byStatus = groupBy(posts, 'status')

  return (
    <PageBase className="col-span-10 p-2 sm:pt-0">
      <NoSEO />
      <Col className="text-ink-900 mx-4 my-4 gap-8">
        <Col className="gap-1">
          <Row className="items-baseline gap-3">
            <div className="text-primary-700 text-2xl">Blog</div>
            <div className="text-ink-500 text-sm">
              {posts.length} post{posts.length === 1 ? '' : 's'}
            </div>
            <a
              className="text-ink-500 text-xs underline"
              href="/blog"
              target="_blank"
              rel="noreferrer"
            >
              view /blog
            </a>
            <button className="text-ink-500 text-xs underline" onClick={refresh}>
              refresh
            </button>
          </Row>
          <div className="text-ink-500 max-w-3xl text-sm">
            Two things here cannot be taken back, so both are one-way in the UI as well as in the
            API: the <strong>slug</strong> freezes the moment a post is first published, because it
            is in every link anyone has shared by then; and the <strong>announcement</strong> is
            sent to every member exactly once, ever.
          </div>
        </Col>

        <NewPostForm onCreated={refresh} />

        {STATUS_ORDER.map((status) => {
          const rows = byStatus[status] ?? []
          if (!rows.length) return null
          return (
            <Col key={status} className="gap-3">
              <div>
                <div className="text-ink-900 text-lg font-semibold">
                  {BLOG_POST_STATUS_LABELS[status]}{' '}
                  <span className="text-ink-500 text-sm font-normal">({rows.length})</span>
                </div>
                <div className="text-ink-500 text-sm">{GROUP_NOTE[status]}</div>
              </div>
              {rows.map((p) => (
                <PostRow key={p.id} post={p} onChanged={refresh} />
              ))}
            </Col>
          )
        })}
      </Col>
    </PageBase>
  )
}

/**
 * Compose a new post.
 *
 * Creates as a draft and nothing else — publishing is a deliberate second action taken on the row
 * below, once there is something rendered to look at.
 *
 * The slug box is prefilled from the title but stays editable, and once it has been touched the
 * title stops overwriting it. Prefilling and then silently re-deriving is the behaviour that
 * produces a URL nobody chose.
 */
function NewPostForm({onCreated}: {onCreated: () => void}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [busy, setBusy] = useState(false)

  // Autosaved under its own key, so closing the tab halfway through writing something does not lose
  // it. Cleared explicitly on a successful create — see `clearContent(true)` below.
  const editor = useTextEditor({
    key: 'blog-new-post',
    placeholder: 'Write the post…',
    className: BLOG_EDITOR_SPACING,
  })

  const error = getBlogPostDraftError({slug, title, excerpt})

  const create = async () => {
    setBusy(true)
    try {
      const {post} = await api('create-blog-post', {
        slug: slug.trim(),
        title: title.trim(),
        excerpt: excerpt.trim() || null,
        content: (editor?.getJSON() ?? {}) as JSONContent,
        coverImageUrl: coverImageUrl.trim() || null,
      })
      toast.success(`Draft created: ${post.title}`)
      // `true` also clears the autosave; without it the next new post opens with this one in it.
      editor?.commands.clearContent(true)
      setTitle('')
      setSlug('')
      setSlugTouched(false)
      setExcerpt('')
      setCoverImageUrl('')
      setOpen(false)
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create that post')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <div>
        <Button color="indigo" size="sm" onClick={() => setOpen(true)}>
          Write a post
        </Button>
      </div>
    )
  }

  return (
    <Col className="border-canvas-200 gap-3 rounded-lg border p-3">
      <div className="text-ink-900 font-semibold">New post</div>

      <Input
        className="w-full"
        placeholder="Title"
        maxLength={MAX_BLOG_TITLE_LENGTH}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          if (!slugTouched) setSlug(slugifyBlogTitle(e.target.value))
        }}
      />

      <Col className="gap-1">
        <Input
          className="w-full font-mono text-sm"
          placeholder="url-slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value)
          }}
        />
        <div className="text-ink-500 text-xs">
          compassmeet.com/blog/<span className="font-mono">{slug || '…'}</span> — fixed for good
          once this post is published.
        </div>
      </Col>

      <ExpandingInput
        className="w-full"
        placeholder={`The line that makes someone open it (optional, max ${MAX_BLOG_EXCERPT_LENGTH}). Shown on the /blog card and used as the search-result description.`}
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        rows={2}
      />

      <Input
        className="w-full"
        placeholder="Cover image URL (optional) — also the preview image when the post is shared"
        value={coverImageUrl}
        onChange={(e) => setCoverImageUrl(e.target.value)}
      />

      <div className="border-canvas-200 rounded-lg border">
        <TextEditor editor={editor} toolbar="full" />
      </div>

      <Row className="items-center gap-3">
        <Button color="indigo" size="xs" disabled={!!error || busy} onClick={create}>
          Create draft
        </Button>
        <Button color="gray-outline" size="xs" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        {error && <span className="text-ink-500 text-xs">{error.replace(/_/g, ' ')}</span>}
      </Row>
    </Col>
  )
}

/**
 * `proseClass` zeroes paragraph margins at the default size, which is right for comments and chat
 * bubbles and wrong for an essay. Same override the bio editor uses, and `!` for the same reason: it
 * has to beat `prose-p:my-0` on the same element.
 */
const BLOG_EDITOR_SPACING = 'prose-p:!my-3'

/** One existing post: edit it, publish it, announce it, take it down. */
function PostRow({post: p, onChanged}: {post: AdminBlogPost; onChanged: () => void}) {
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState(p.title)
  const [slug, setSlug] = useState(p.slug)
  const [excerpt, setExcerpt] = useState(p.excerpt ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(p.coverImageUrl ?? '')
  const [contentDirty, setContentDirty] = useState(false)
  const [notificationText, setNotificationText] = useState('')
  const [busy, setBusy] = useState(false)

  // Keyed by post id at the call site below, so opening a different row builds a new editor around
  // that post's body rather than reusing this one's. No autosave key: the saved copy of record is
  // the row itself, and a stale local draft silently winning over what is in the database is a much
  // worse failure here than losing a few unsaved keystrokes.
  const editor = useTextEditor({
    defaultValue: p.content,
    className: BLOG_EDITOR_SPACING,
    onChange: () => setContentDirty(true),
  })

  // The slug is the one field that stops being editable, and it stops the moment the post first goes
  // public — at which point it is already in the notification everyone received.
  const slugLocked = p.publishedTime !== null

  const fieldsDirty =
    title !== p.title ||
    slug !== p.slug ||
    excerpt !== (p.excerpt ?? '') ||
    coverImageUrl !== (p.coverImageUrl ?? '') ||
    contentDirty

  const error = getBlogPostDraftError({slug, title, excerpt})

  const patch = async (props: Parameters<typeof api<'update-blog-post'>>[1], done?: string) => {
    setBusy(true)
    try {
      const {notifiedCount} = await api('update-blog-post', props)
      if (notifiedCount) toast.success(`Notified ${notifiedCount} members`)
      else if (done) toast.success(done)
      setContentDirty(false)
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That did not work')
    } finally {
      setBusy(false)
    }
  }

  const save = () =>
    patch(
      {
        id: p.id,
        title: title.trim(),
        // Omitted entirely once locked, rather than sent unchanged: the API rejects a changed slug on
        // a published post, and sending a field the server will only ever compare against itself is
        // how a harmless rename turns into a confusing error later.
        ...(slugLocked ? {} : {slug: slug.trim()}),
        excerpt: excerpt.trim() || null,
        coverImageUrl: coverImageUrl.trim() || null,
        ...(contentDirty ? {content: (editor?.getJSON() ?? {}) as JSONContent} : {}),
      },
      'Saved',
    )

  const publish = () =>
    patch(
      {
        id: p.id,
        status: 'published',
        // Only sent when something was typed. The API treats its presence as the request to
        // broadcast, so an empty box means "publish quietly" rather than "send an empty
        // notification" — which is the right default for re-publishing something taken down.
        ...(notificationText.trim() ? {notificationText: notificationText.trim()} : {}),
      },
      'Published',
    )

  return (
    <div
      className={clsx(
        'border-canvas-200 rounded-lg border p-3',
        p.status === 'archived' && 'opacity-60',
      )}
    >
      <Row className="items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{p.title}</div>
          <div className="text-ink-500 truncate text-sm">
            <span className="font-mono">/blog/{p.slug}</span>
            {p.publishedTime ? ` · ${formatBlogDate(p.publishedTime)}` : ' · not published'}
            {` · ${p.readingMinutes} min`}
            {p.author ? ` · ${p.author.name}` : ''}
          </div>
          <div className="text-ink-400 mt-0.5 text-xs">
            {p.notifiedTime
              ? `Everyone was notified on ${formatBlogDate(p.notifiedTime)}`
              : 'Nobody has been notified yet'}
          </div>
        </div>
        <Row className="flex-shrink-0 gap-2">
          {p.status === 'published' && (
            <a className="text-primary-600 self-center text-xs underline" href={`/blog/${p.slug}`}>
              open
            </a>
          )}
          {p.status === 'published' ? (
            <Button
              color="gray-outline"
              size="xs"
              disabled={busy}
              onClick={() => patch({id: p.id, status: 'archived'}, 'Taken down')}
            >
              Take down
            </Button>
          ) : null}
          <Button color="gray-outline" size="xs" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Close' : 'Edit'}
          </Button>
        </Row>
      </Row>

      {expanded && (
        <Col className="mt-3 gap-3">
          <Input
            className="w-full"
            placeholder="Title"
            maxLength={MAX_BLOG_TITLE_LENGTH}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Col className="gap-1">
            <Input
              className="w-full font-mono text-sm"
              placeholder="url-slug"
              value={slug}
              disabled={slugLocked}
              onChange={(e) => setSlug(e.target.value)}
            />
            <div className="text-ink-500 text-xs">
              {slugLocked
                ? 'Fixed — this post has been published, so other people already have this link.'
                : 'Editable until the first publish.'}
            </div>
          </Col>

          <ExpandingInput
            className="w-full"
            placeholder={`Excerpt (optional, max ${MAX_BLOG_EXCERPT_LENGTH})`}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
          />

          <Input
            className="w-full"
            placeholder="Cover image URL (optional)"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
          />

          <div className="border-canvas-200 rounded-lg border">
            <TextEditor editor={editor} toolbar="full" />
          </div>

          <Row className="items-center gap-3">
            <Button
              color="indigo"
              size="xs"
              disabled={!!error || !fieldsDirty || busy}
              onClick={save}
            >
              Save
            </Button>
            {error && <span className="text-ink-500 text-xs">{error.replace(/_/g, ' ')}</span>}
          </Row>

          {p.status !== 'published' && (
            <Col className="border-canvas-200 gap-2 rounded-lg border border-dashed p-3">
              <div className="text-ink-900 text-sm font-semibold">
                {p.status === 'draft' ? 'Publish' : 'Put back up'}
              </div>
              {p.notifiedTime ? (
                <div className="text-ink-500 text-sm">
                  Everyone was already notified about this post, so publishing it again is silent.
                </div>
              ) : (
                <>
                  <div className="text-ink-500 text-sm">
                    Everyone gets one in-app notification titled{' '}
                    <span className="text-ink-900">“{p.title}”</span>, linking to /blog/{p.slug}.
                    Write the message below — leave it empty to publish without notifying anyone.
                  </div>
                  <ExpandingInput
                    className="w-full"
                    placeholder="What the notification says under the title. Say why this is worth reading today, not what the title already says."
                    value={notificationText}
                    onChange={(e) => setNotificationText(e.target.value)}
                    maxLength={MAX_BLOG_NOTIFICATION_LENGTH}
                    rows={3}
                  />
                  <div className="text-ink-400 text-xs">
                    {notificationText.trim().length}/{MAX_BLOG_NOTIFICATION_LENGTH} · sent once, to
                    everyone, and it cannot be unsent.
                  </div>
                </>
              )}
              <Row className="items-center gap-3">
                <Button color="green" size="xs" disabled={busy || fieldsDirty} onClick={publish}>
                  {notificationText.trim() ? 'Publish and notify everyone' : 'Publish quietly'}
                </Button>
                {fieldsDirty && (
                  <span className="text-ink-500 text-xs">Save your edits first.</span>
                )}
              </Row>
            </Col>
          )}
        </Col>
      )}
    </div>
  )
}
