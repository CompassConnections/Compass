import clsx from 'clsx'
import {IS_LOCAL} from 'common/hosting/constants'
import {
  AdminSpotlight,
  formatSpotlightLocation,
  getSpotlightDraftError,
  MAX_SPOTLIGHT_QUOTE_LENGTH,
  MAX_SPOTLIGHT_TAGS,
  MIN_SPOTLIGHT_QUOTE_LENGTH,
  SPOTLIGHT_STATUS_LABELS,
  SpotlightCandidate,
  SpotlightStatus,
} from 'common/profiles/spotlights'
import {groupBy} from 'lodash'
import {useState} from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {NoSEO} from 'web/components/NoSEO'
import {PageBase} from 'web/components/page-base'
import {Content} from 'web/components/widgets/editor'
import {ExpandingInput} from 'web/components/widgets/expanding-input'
import {Input} from 'web/components/widgets/input'
import {useAdmin} from 'web/hooks/use-admin'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {api} from 'web/lib/api'

/**
 * The editorial desk for home-page member spotlights.
 *
 * Admins only, not mods — see `throwErrorIfNotAdmin`. Putting a real member's face and words on the
 * logged-out front page is a publishing decision, not a moderation one.
 *
 * The page is two halves and the order is the workflow: consenting members who have no card yet
 * (write one), then every card that exists (publish, re-order, re-capture, take down).
 */

const STATUS_ORDER: SpotlightStatus[] = ['draft', 'live', 'retired']

const GROUP_NOTE: Record<SpotlightStatus, string> = {
  draft: 'Written but not shown. Publishing puts it straight on the home page.',
  live: 'On the home page right now. Highest rank sits first in the rail.',
  retired: 'Was live, then pulled. Publishing puts it back as it was.',
}

export default function AdminSpotlights() {
  const isAdmin = useAdmin()
  const {data, refresh} = useAPIGetter('get-spotlights-admin', {})

  if (!(isAdmin || IS_LOCAL)) return <p>Not authorized</p>

  const spotlights = data?.spotlights ?? []
  const candidates = data?.candidates ?? []
  const byStatus = groupBy(spotlights, 'status')

  return (
    <PageBase className="col-span-10 p-2 sm:pt-0">
      <NoSEO />
      <Col className="text-ink-900 mx-4 my-4 gap-8">
        <Col className="gap-1">
          <Row className="items-baseline gap-3">
            <div className="text-primary-700 text-2xl">Member spotlights</div>
            <div className="text-ink-500 text-sm">
              {spotlights.length} card{spotlights.length === 1 ? '' : 's'} · {candidates.length}{' '}
              waiting
            </div>
            <button className="text-ink-500 text-xs underline" onClick={refresh}>
              refresh
            </button>
          </Row>
          <div className="text-ink-500 max-w-3xl text-sm">
            Everything here is a <em>snapshot</em>. The card keeps the name, age, city, photo and
            headline as they were when you captured them, so a member cannot edit the home page by
            editing their profile. Use “re-capture” when they ask for an update.
          </div>
        </Col>

        <Col className="gap-3">
          <div className="text-ink-900 text-lg font-semibold">Consented, no card yet</div>
          {candidates.length === 0 ? (
            <div className="text-ink-500 text-sm">
              Nobody new. Members opt in from Settings → Data &amp; Privacy.
            </div>
          ) : (
            candidates.map((c) => <CandidateRow key={c.userId} candidate={c} onCreated={refresh} />)
          )}
        </Col>

        {STATUS_ORDER.map((status) => {
          const rows = byStatus[status] ?? []
          if (!rows.length) return null
          return (
            <Col key={status} className="gap-3">
              <div>
                <div className="text-ink-900 text-lg font-semibold">
                  {SPOTLIGHT_STATUS_LABELS[status]}{' '}
                  <span className="text-ink-500 text-sm font-normal">({rows.length})</span>
                </div>
                <div className="text-ink-500 text-sm">{GROUP_NOTE[status]}</div>
              </div>
              {rows.map((s) => (
                <SpotlightRow key={s.id} spotlight={s} onChanged={refresh} />
              ))}
            </Col>
          )
        })}
      </Col>
    </PageBase>
  )
}

/** Split "a, b, c" into chips, dropping blanks so a trailing comma is not a tag. */
const parseTags = (raw: string) =>
  raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, MAX_SPOTLIGHT_TAGS)

/**
 * One consenting member, with their bio ready to cut down.
 *
 * The bio is shown in full rather than pre-truncated into the quote box: picking the good sentence is
 * the entire job this page exists for, and prefilling the first 200 characters would quietly make
 * "the opening of the bio" the house style.
 */
function CandidateRow({
  candidate: c,
  onCreated,
}: {
  candidate: SpotlightCandidate
  onCreated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [quote, setQuote] = useState('')
  const [quoteContext, setQuoteContext] = useState('')
  const [tags, setTags] = useState('')
  const [busy, setBusy] = useState(false)

  const error = getSpotlightDraftError({quote, quoteContext, tags: parseTags(tags)})

  const create = async () => {
    setBusy(true)
    try {
      await api('create-spotlight', {
        userId: c.userId,
        quote: quote.trim(),
        quoteContext: quoteContext.trim() || null,
        tags: parseTags(tags),
      })
      toast.success(`Draft created for ${c.name}`)
      setOpen(false)
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create that spotlight')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border-canvas-200 rounded-lg border p-3">
      <Row className="items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">
            {c.name}
            {c.age ? `, ${c.age}` : ''}{' '}
            <a
              className="text-primary-600 text-sm font-normal underline"
              href={`/${c.username}`}
              target="_blank"
              rel="noreferrer"
            >
              @{c.username}
            </a>
          </div>
          <div className="text-ink-500 truncate text-sm">
            {formatSpotlightLocation(c) ?? 'No location'}
            {c.headline ? ` · ${c.headline}` : ''}
          </div>
          {/* Only the yes is worth a chip. Nobody should have to read the absence of a badge as a
              prohibition, but the presence of one is what tells a video shoot which profiles it may
              actually use — and that consent cannot be read off the profile page. */}
          {c.socialConsent && (
            <div className="text-primary-600 mt-1 text-xs font-medium">
              Social media OK — may be filmed for Instagram/TikTok
            </div>
          )}
        </div>
        <Button color="gray-outline" size="xs" onClick={() => setOpen(!open)}>
          {open ? 'Cancel' : 'Write a card'}
        </Button>
      </Row>

      {open && (
        <Col className="mt-3 gap-2">
          {c.bio ? (
            // Rendered as the member wrote it — headings, lists, emphasis and all. The quote gets
            // copied out of here by hand, and paragraph breaks are most of what makes a passage
            // findable at a glance.
            <div className="bg-canvas-100 text-ink-700 max-h-96 overflow-y-auto rounded p-3">
              <Content content={c.bio} size="sm" />
            </div>
          ) : (
            <div className="text-ink-500 text-sm">
              No bio text — there is nothing to quote, so this member is probably not a candidate
              yet.
            </div>
          )}
          <ExpandingInput
            className="w-full"
            placeholder={`The passage to quote (${MIN_SPOTLIGHT_QUOTE_LENGTH}–${MAX_SPOTLIGHT_QUOTE_LENGTH} chars) — copy it from the bio above and cut it down`}
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            rows={4}
          />
          <Row className="gap-2">
            <Input
              className="flex-1"
              placeholder="Context, e.g. “on leaving academia” (optional)"
              value={quoteContext}
              onChange={(e) => setQuoteContext(e.target.value)}
            />
            <Input
              className="flex-1"
              placeholder={`Tags, comma-separated (max ${MAX_SPOTLIGHT_TAGS})`}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </Row>
          <Row className="items-center gap-3">
            <Button color="indigo" size="xs" disabled={!!error || busy} onClick={create}>
              Create draft
            </Button>
            <span className="text-ink-500 text-xs">
              {quote.trim().length}/{MAX_SPOTLIGHT_QUOTE_LENGTH}
              {error ? ` · ${error.replace(/_/g, ' ')}` : ''}
            </span>
          </Row>
        </Col>
      )}
    </div>
  )
}

/** One existing card: publish, re-order, edit the editorial fields, re-capture, take down. */
function SpotlightRow({
  spotlight: s,
  onChanged,
}: {
  spotlight: AdminSpotlight
  onChanged: () => void
}) {
  const [quote, setQuote] = useState(s.quote)
  const [quoteContext, setQuoteContext] = useState(s.quoteContext ?? '')
  const [tags, setTags] = useState(s.tags.join(', '))
  const [busy, setBusy] = useState(false)

  const dirty =
    quote !== s.quote || quoteContext !== (s.quoteContext ?? '') || tags !== s.tags.join(', ')

  const patch = async (props: Parameters<typeof api<'update-spotlight'>>[1]) => {
    setBusy(true)
    try {
      await api('update-spotlight', props)
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That did not work')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={clsx(
        'border-canvas-200 rounded-lg border p-3',
        // Consent withdrawn while the card is live is the one state that needs to shout: the public
        // endpoint has already stopped serving it, so the rail is silently short until someone retires it.
        !s.consents && 'border-red-500/50 bg-red-500/[0.04]',
      )}
    >
      <Row className="items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">
            {s.name}
            {s.age ? `, ${s.age}` : ''}{' '}
            {s.username && (
              <a
                className="text-primary-600 text-sm font-normal underline"
                href={`/${s.username}`}
                target="_blank"
                rel="noreferrer"
              >
                @{s.username}
              </a>
            )}
          </div>
          <div className="text-ink-500 truncate text-sm">
            {formatSpotlightLocation(s) ?? 'No location'} · captured{' '}
            {new Date(s.capturedTime).toLocaleDateString()}
            {!s.consents && ' · CONSENT WITHDRAWN — hidden publicly, retire it'}
          </div>
        </div>
        <Row className="items-center gap-2">
          <Input
            className="w-20"
            type="number"
            placeholder="rank"
            defaultValue={s.featuredRank ?? ''}
            disabled={busy}
            onBlur={(e) => {
              const raw = e.target.value.trim()
              const next = raw === '' ? null : Number(raw)
              if (next !== s.featuredRank) patch({id: s.id, featuredRank: next})
            }}
          />
          {s.status !== 'live' && (
            <Button
              color="green"
              size="xs"
              disabled={busy || !s.consents}
              onClick={() => patch({id: s.id, status: 'live'})}
            >
              Publish
            </Button>
          )}
          {s.status === 'live' && (
            <Button
              color="red-outline"
              size="xs"
              disabled={busy}
              onClick={() => patch({id: s.id, status: 'retired'})}
            >
              Take down
            </Button>
          )}
          <Button
            color="gray-outline"
            size="xs"
            disabled={busy}
            onClick={() => patch({id: s.id, refreshSnapshot: true})}
          >
            Re-capture
          </Button>
        </Row>
      </Row>

      <Col className="mt-3 gap-2">
        <ExpandingInput
          className="w-full"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          rows={3}
        />
        <Row className="gap-2">
          <Input
            className="flex-1"
            placeholder="Context (optional)"
            value={quoteContext}
            onChange={(e) => setQuoteContext(e.target.value)}
          />
          <Input
            className="flex-1"
            placeholder="Tags, comma-separated"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <Button
            color="indigo"
            size="xs"
            disabled={
              busy ||
              !dirty ||
              !!getSpotlightDraftError({quote, quoteContext, tags: parseTags(tags)})
            }
            onClick={() =>
              patch({
                id: s.id,
                quote: quote.trim(),
                quoteContext: quoteContext.trim() || null,
                tags: parseTags(tags),
              })
            }
          >
            Save
          </Button>
        </Row>
      </Col>
    </div>
  )
}
