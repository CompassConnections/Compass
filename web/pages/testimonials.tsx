import {ChatBubbleBottomCenterTextIcon, HeartIcon, StarIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {ModTestimonial, PublicTestimonial} from 'common/testimonials/testimonials'
import {typedAPICall} from 'common/util/api'
import {keyBy} from 'lodash'
import {useMemo, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {TestimonialCard} from 'web/components/testimonials/testimonial-card'
import {
  TestimonialModControls,
  TestimonialPatch,
} from 'web/components/testimonials/testimonial-mod-controls'
import {WriteTestimonialButton} from 'web/components/testimonials/write-testimonial-modal'
import {Reveal} from 'web/components/widgets/reveal'
import {eyebrow, surface} from 'web/components/widgets/surface'
import {useAdminOrMod} from 'web/hooks/use-admin'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {isNativeMobile} from 'web/lib/util/webview'

type Filter = 'all' | 'found_someone'

type Props = {
  /** Approved testimonials as of the last build; absent in the Android export. */
  initialTestimonials?: PublicTestimonial[]
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

/**
 * One dark band, the same device the stats page opens with, so the two proof pages read as a pair.
 * The numbers underneath the headline are the part that is not a claim: a count, an average and how
 * many of these were written by someone on their way out because it worked.
 */
function Hero({
  count,
  averageRating,
  foundSomeoneCount,
}: {
  count: number
  averageRating: number | null
  foundSomeoneCount: number
}) {
  const t = useT()

  const stats = [
    {
      value: count > 0 ? count.toLocaleString() : null,
      label: t('testimonials.hero.stat_stories', 'Stories'),
      icon: ChatBubbleBottomCenterTextIcon,
    },
    {
      value: averageRating === null ? null : averageRating.toFixed(1),
      label: t('testimonials.hero.stat_rating', 'Average rating'),
      icon: StarIcon,
    },
    {
      value: foundSomeoneCount > 0 ? foundSomeoneCount.toLocaleString() : null,
      label: t('testimonials.hero.stat_found', 'Found someone here'),
      icon: HeartIcon,
    },
  ].filter((s) => s.value !== null)

  return (
    <div className="relative overflow-hidden rounded-3xl bg-canvas-950 px-6 py-12 sm:px-12 sm:py-16">
      <div
        aria-hidden
        className="bg-primary-500/20 pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="bg-primary-500/10 pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full blur-3xl"
      />

      <div className="relative max-w-2xl">
        <p className={clsx(eyebrow, 'text-primary-400 mb-4')}>
          {t('testimonials.hero.eyebrow', 'In their own words')}
        </p>
        <h1 className="text-[clamp(32px,5vw,52px)] font-bold leading-[1.08] tracking-tight text-white">
          {t('testimonials.hero.title', 'What happens when people actually meet')}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
          {t(
            'testimonials.hero.subtitle',
            'Unedited, written by members. The ones marked with a heart were written by people deleting their account because they found who they were looking for.',
          )}
        </p>

        <Row className="mt-8 flex-wrap items-center gap-3">
          <WriteTestimonialButton />
          <a
            href="#wall"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            {t('testimonials.hero.read', 'Read the stories')}
          </a>
        </Row>
      </div>

      {stats.length > 0 && (
        <div className="relative mt-10 flex flex-wrap gap-x-12 gap-y-6 border-t border-white/10 pt-8">
          {stats.map((s) => (
            <div key={s.label}>
              <Row className="items-center gap-1.5">
                <s.icon className="text-primary-400/70 h-4 w-4" aria-hidden />
                <span className="text-primary-400 text-3xl font-black leading-none tracking-tight tabular-nums">
                  {s.value}
                </span>
              </Row>
              <div className="mt-1.5 text-xs font-medium uppercase tracking-wide text-white/50">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── States ───────────────────────────────────────────────────────────────────

function WallSkeleton() {
  return (
    <div className="columns-1 gap-5 sm:columns-2 lg:columns-3" aria-hidden>
      {[220, 320, 180, 260, 200, 300].map((h, i) => (
        <div
          key={i}
          className={clsx(surface, 'mb-5 animate-pulse break-inside-avoid p-6')}
          style={{height: h}}
        >
          <div className="h-3 w-24 rounded bg-canvas-200" />
          <div className="mt-5 space-y-2.5">
            <div className="h-3 w-full rounded bg-canvas-100" />
            <div className="h-3 w-11/12 rounded bg-canvas-100" />
            <div className="h-3 w-4/5 rounded bg-canvas-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyWall() {
  const t = useT()
  return (
    <Col className={clsx(surface, 'items-center gap-4 px-6 py-16 text-center')}>
      <ChatBubbleBottomCenterTextIcon className="text-primary-500/40 h-12 w-12" aria-hidden />
      <div className="text-ink-900 text-xl font-semibold">
        {t('testimonials.empty.title', 'No stories on the wall yet')}
      </div>
      <p className="text-ink-500 max-w-md text-sm leading-relaxed">
        {t(
          'testimonials.empty.body',
          'Someone has to go first. If Compass has been worth your time, a few sentences from you are worth more than anything we could write about ourselves.',
        )}
      </p>
      <WriteTestimonialButton
        size="md"
        label={t('testimonials.empty.cta', 'Write the first one')}
      />
    </Col>
  )
}

// ─── Filter ───────────────────────────────────────────────────────────────────

function FilterTabs({
  value,
  onChange,
  counts,
}: {
  value: Filter
  onChange: (f: Filter) => void
  counts: Record<Filter, number>
}) {
  const t = useT()
  const tabs: {key: Filter; label: string}[] = [
    {key: 'all', label: t('testimonials.filter.all', 'All stories')},
    {key: 'found_someone', label: t('testimonials.filter.found', 'Found someone here')},
  ]

  return (
    <Row className="bg-canvas-100 w-fit gap-1 rounded-xl p-1" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={value === tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx(
            'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
            value === tab.key
              ? 'bg-canvas-0 text-ink-900 shadow-sm'
              : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {tab.label}
          <span className="text-ink-400 ml-1.5 text-xs tabular-nums">{counts[tab.key]}</span>
        </button>
      ))}
    </Row>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Fetched at build and refreshed on the client.
 *
 * The wall used to be fetched only after hydration, which meant the served HTML was a hero and six
 * grey skeleton boxes — a page whose entire value is member-written prose, invisible to the first
 * crawl and to anything that does not run JavaScript. Building it in puts the text in the first byte.
 *
 * The client fetch below is deliberately kept: a testimonial approved after the last deploy would
 * otherwise not appear until the next one. So the prop is the seed and `useAPIGetter` is the
 * refresh — whichever is fresher wins, and there is no skeleton flash in between.
 *
 * `revalidate` regenerates the static copy in the background at most once a minute, which matches
 * the `cache: 'public, max-age=60'` already on the `get-testimonials` endpoint. The
 * `isNativeMobile()` early return is the `output: 'export'` guard the news page uses: the Android
 * build has no server to revalidate against, and there the client fetch is the only path anyway.
 */
export async function getStaticProps() {
  if (isNativeMobile()) return {props: {}}

  try {
    const {testimonials} = await typedAPICall('get-testimonials', {}, null)
    return {props: {initialTestimonials: testimonials}, revalidate: 60}
  } catch (e) {
    // Never fail the build over the wall. An API that is down at deploy time would otherwise take
    // the whole site with it, to save one page a round trip.
    console.error('Failed to prefetch testimonials', e)
    return {props: {}, revalidate: 60}
  }
}

export default function TestimonialsPage({initialTestimonials}: Props) {
  const t = useT()
  const isMod = useAdminOrMod()

  const {data: publicData} = useAPIGetter('get-testimonials', {})
  // Passing `undefined` props keeps `useAPIGetter` from firing at all, so a signed-out visitor never
  // requests the moderator endpoint and never sees a 403 in their console.
  const {data: modData, refresh: refreshMod} = useAPIGetter(
    'get-testimonials-mod',
    isMod ? {} : undefined,
  )

  // Written-through so an approve moves the card immediately instead of after a refetch — and the
  // public endpoint is CDN-cached for a minute, so waiting is not a real option here.
  const [edits, setEdits] = useState<Record<number, TestimonialPatch>>({})
  const [busyId, setBusyId] = useState<number | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  const modRows: ModTestimonial[] = useMemo(
    () => (modData?.testimonials ?? []).map((row) => ({...row, ...edits[row.id]})),
    [modData, edits],
  )
  const modById = useMemo(() => keyBy(modRows, 'id'), [modRows])

  // A moderator reads the wall out of the moderation payload so their own takedown disappears at once.
  // Everyone else reads the cached public one.
  const approved: PublicTestimonial[] = modData
    ? modRows.filter((row) => row.status === 'approved')
    : (publicData?.testimonials ?? initialTestimonials ?? [])

  const pending = modRows.filter((row) => row.status === 'pending')

  // The build-time copy counts as loaded: showing skeletons over content we already have would be a
  // regression from the very thing this page was changed to fix.
  const loading = !publicData && !modData && !initialTestimonials

  const foundSomeone = approved.filter((row) => row.source === 'deletion_survey')
  const shown = filter === 'found_someone' ? foundSomeone : approved

  const rated = approved.filter((row) => row.rating !== null)
  const averageRating = rated.length
    ? rated.reduce((sum, row) => sum + (row.rating ?? 0), 0) / rated.length
    : null

  const moderate = async (id: number, patch: TestimonialPatch) => {
    setBusyId(id)
    setEdits((prev) => ({...prev, [id]: {...prev[id], ...patch}}))
    try {
      await api('update-testimonial-status', {id, ...patch})
      await refreshMod()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PageBase trackPageView={'testimonials'} className="col-span-10 p-2 sm:pt-0">
      <SEO
        title={t('testimonials.seo.title', 'Testimonials')}
        description={t(
          'testimonials.seo.description',
          'What Compass members say, in their own words — including people who left because they found who they were looking for.',
        )}
        url="/testimonials"
      />
      <Col className="mx-auto w-full max-w-6xl gap-10 px-4 py-6 sm:px-6 sm:py-10">
        <Hero
          count={approved.length}
          averageRating={averageRating}
          foundSomeoneCount={foundSomeone.length}
        />

        {isMod && pending.length > 0 && (
          <ModerationStrip pending={pending} busyId={busyId} onUpdate={moderate} />
        )}

        <Col id="wall" className="scroll-mt-8 gap-6">
          {loading ? (
            <WallSkeleton />
          ) : approved.length === 0 ? (
            <EmptyWall />
          ) : (
            <>
              {foundSomeone.length > 0 && (
                <FilterTabs
                  value={filter}
                  onChange={setFilter}
                  counts={{all: approved.length, found_someone: foundSomeone.length}}
                />
              )}

              <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
                {shown.map((testimonial, i) => (
                  <Reveal
                    key={testimonial.id}
                    // Stagger only the first screenful; past that everything is revealed on scroll
                    // anyway and a growing delay just makes late cards feel broken.
                    delay={Math.min(i, 5) * 60}
                    className="mb-5 break-inside-avoid"
                  >
                    <TestimonialCard testimonial={testimonial}>
                      {modById[testimonial.id] && (
                        <TestimonialModControls
                          testimonial={modById[testimonial.id]}
                          onUpdate={moderate}
                          busy={busyId === testimonial.id}
                        />
                      )}
                    </TestimonialCard>
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </Col>

        {approved.length > 0 && <ClosingCta />}
      </Col>
    </PageBase>
  )
}

// ─── Moderation strip ─────────────────────────────────────────────────────────

/**
 * Pending testimonials, at the top of the page, for moderators only.
 *
 * Deliberately on the public page rather than only in `/admin`: reviewing one is a ten-second judgment
 * that should happen where the moderator already is, and a queue that lives somewhere else is a queue
 * that grows.
 */
function ModerationStrip({
  pending,
  busyId,
  onUpdate,
}: {
  pending: ModTestimonial[]
  busyId: number | null
  onUpdate: (id: number, patch: TestimonialPatch) => void
}) {
  const t = useT()

  return (
    <Col className="gap-4 rounded-2xl border border-dashed border-amber-400/60 bg-amber-50/60 p-5 dark:bg-amber-900/10">
      <Row className="items-baseline gap-2">
        <div className="text-ink-900 font-semibold">
          {t('testimonials.mod.queue_title', 'Waiting for review')}
        </div>
        <div className="text-ink-500 text-sm tabular-nums">{pending.length}</div>
        <div className="text-ink-400 text-xs">
          {t('testimonials.mod.queue_note', 'Only moderators can see this.')}
        </div>
      </Row>

      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {pending.map((testimonial) => (
          <div key={testimonial.id} className="mb-5 break-inside-avoid">
            <TestimonialCard testimonial={testimonial}>
              <TestimonialModControls
                testimonial={testimonial}
                onUpdate={onUpdate}
                busy={busyId === testimonial.id}
                showFeature={false}
              />
            </TestimonialCard>
          </div>
        ))}
      </div>
    </Col>
  )
}

// ─── Closing CTA ──────────────────────────────────────────────────────────────

function ClosingCta() {
  const t = useT()
  return (
    <Col
      className={clsx(
        surface,
        'from-primary-50 items-center gap-4 bg-gradient-to-br to-canvas-50 px-6 py-12 text-center dark:from-primary-900/20',
      )}
    >
      <p className={clsx(eyebrow, 'text-primary-700')}>
        {t('testimonials.cta.eyebrow', 'Your turn')}
      </p>
      <div className="text-ink-900 max-w-lg text-2xl font-semibold leading-tight">
        {t('testimonials.cta.title', 'Has Compass been worth your time?')}
      </div>
      <p className="text-ink-500 max-w-md text-sm leading-relaxed">
        {t(
          'testimonials.cta.body',
          'A few honest sentences from you will do more for the next person deciding whether to join than anything we could say ourselves.',
        )}
      </p>
      <WriteTestimonialButton className="mt-2" />
    </Col>
  )
}
