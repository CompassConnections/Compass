import {
  ArrowDownTrayIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  EnvelopeIcon,
  MicrophoneIcon,
  NewspaperIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {githubRepo, supportEmail} from 'common/constants'
import Link from 'next/link'
import {ComponentType, ReactNode, SVGProps, useMemo, useState} from 'react'
import {SectionLabel} from 'web/components/about/section'
import {PageBase} from 'web/components/page-base'
import {OutletId, OutletLogo, OUTLETS, PressLogos} from 'web/components/press/press-logos'
import {SEO} from 'web/components/SEO'
import {Reveal} from 'web/components/widgets/reveal'
import {eyebrow, Section, surface, surfaceHover} from 'web/components/widgets/surface'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useLocale, useT} from 'web/lib/locale'
import {copyToClipboard} from 'web/lib/util/copy'

type IconType = ComponentType<SVGProps<SVGSVGElement>>

/**
 * What kind of coverage an item is.
 *
 * Not decoration: a reader scanning this page wants to know whether a link costs them thirty seconds or
 * half an hour, and "RCF" alone does not say "this is a radio interview". It also picks the verb on the
 * call to action — "Listen", "Watch", "Read" — which was previously a bare underlined title for all five.
 */
type Medium = 'article' | 'radio' | 'video'

type PressItem = {
  id: number
  title: string
  outlet: OutletId
  medium: Medium
  date: string
  url: string
  summary?: string
  language: 'en' | 'fr' | 'de'
}

const pressItems: PressItem[] = [
  {
    id: 5,
    title: 'Compass, une application de rencontre belge',
    outlet: 'rcf',
    medium: 'radio',
    date: '2026-02-09',
    url: 'https://www.rcf.fr/culture/le-temps-dun-cafe?episode=657722',
    summary:
      'Radio interview with Martin; he explains his background, his philosophy of learning through practice, and the creation of a meeting app designed differently. The discussion covers the pitfalls of traditional apps (addiction, swiping, data exploitation), the emphasis on interests and values over physical appearance, and the goal of fostering deeper friendships, professional connections, or romantic relationships. Martin also details the choice of an open-source, free, and transparent model, its international development, and the audience-related challenges to make the tool genuinely useful for users.',
    language: 'fr',
  },
  {
    id: 4,
    title:
      'Un Havelangeois lance Compass, une appli de rencontre qui mise avant tout sur la personnalité : "Les recherches se font via des mots-clés spécifiques"',
    outlet: 'dh',
    medium: 'article',
    date: '2026-01-21',
    url: 'https://www.dhnet.be/regions/namur/2026/01/21/un-havelangeois-lance-compass-une-appli-de-rencontre-qui-mise-avant-tout-sur-la-personnalite-les-recherches-se-font-via-des-mots-cles-specifiques-6ZBEE4GNVZHHZBWH5PFXNLD4WI/',
    summary:
      'Belgian and local article about the beginnings of Compass. Developed in just eight weeks and offered for free, Compass stands out from mainstream apps by eliminating hidden algorithms and swiping mechanisms, favoring instead a keyword-based search focused on values, interests, and personality, with photos being secondary. As an open-source project, Compass embraces a non-profit, community-driven approach. Four months after launch, it counts just over 400 users, with ambitions to reach a critical local mass.',
    language: 'fr',
  },
  {
    id: 3,
    title:
      'Un Havelangeois lance Compass, une appli de rencontre qui mise avant tout sur la personnalité : "Les recherches se font via des mots-clés spécifiques"',
    outlet: 'lavenir',
    medium: 'article',
    date: '2026-01-21',
    url: 'https://www.lavenir.net/regions/namur/2026/01/21/un-havelangeois-lance-compass-une-appli-de-rencontre-qui-mise-avant-tout-sur-la-personnalite-les-recherches-se-font-via-des-mots-cles-specifiques-LPAHVUX5VFAOFGZ4X3UJDXZD2Q/',
    language: 'fr',
  },
  {
    id: 2,
    title: 'Martin Braquet, un jeune ingénieur havelangeois, sort son appli de rencontre éthique.',
    outlet: 'matele',
    medium: 'video',
    date: '2026-01-17',
    url: 'https://www.facebook.com/reel/757129776892904',
    summary:
      'Short video (Facebook Reel) showcasing Compass in a fun and dynamic way. Martin Braquet, a young engineer from Havelange, introduces his ethical dating app. This is a different approach. Compass is non-profit, designed to create connections. The platform is open, collaborative, with no opaque algorithms. And without the pressure of profile photos.',
    language: 'fr',
  },
  {
    id: 1,
    title: 'Une application qui réinvente les rencontres en ligne développée par un Havelangeois',
    outlet: 'matele',
    medium: 'video',
    date: '2026-01-15',
    url: 'https://www.matele.be/une-application-qui-reinvente-les-rencontres-en-ligne-developpee-par-un-havelangeois',
    summary:
      'Belgian and local video report describing Compass as an open-source platform that sits between a dating app and a social network, breaking with conventional approaches by eliminating hidden algorithms and the emphasis on photos. Created by engineer Martin Braquet from Havelange, it allows users to search profiles based on values and interests for friendly, professional, or romantic relationships. Designed as a sort of "library" of profiles with filtering capabilities, Compass aims to recreate social connections. Free, ad-free, and already with over 400 users.',
    language: 'fr',
  },
]

// ─── Item chrome ──────────────────────────────────────────────────────────────

const MEDIUM_ICON: Record<Medium, IconType> = {
  article: NewspaperIcon,
  radio: MicrophoneIcon,
  video: PlayCircleIcon,
}

function useMediumLabels() {
  const t = useT()

  const label: Record<Medium, string> = {
    article: t('press.medium.article', 'Article'),
    radio: t('press.medium.radio', 'Radio'),
    video: t('press.medium.video', 'Video'),
  }
  // The verb has to match the medium or the page promises the wrong thing: "Read the coverage" on a
  // fifty-minute radio episode is a small lie about what the click costs.
  const action: Record<Medium, string> = {
    article: t('press.action.article', 'Read the article'),
    radio: t('press.action.radio', 'Listen to the interview'),
    video: t('press.action.video', 'Watch the report'),
  }

  return {label, action}
}

/**
 * The date, formatted in the reader's own locale.
 *
 * The previous version printed the raw ISO string, with the locale-formatted line commented out beside
 * it. It is pinned to UTC here, which is the thing that makes it safe: these are plain calendar dates
 * with no time, so without a fixed zone a reader west of Greenwich gets yesterday, and the server and
 * the client can disagree about which day it is at all.
 */
function PressDate({date, locale}: {date: string; locale: Intl.LocalesArgument}) {
  const formatted = useMemo(() => {
    try {
      return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      })
    } catch {
      return date
    }
  }, [date, locale])

  return (
    <time dateTime={date} className="text-sm text-ink-500 tabular-nums">
      {formatted}
    </time>
  )
}

/** Medium + language, as one quiet run of metadata rather than two competing pills. */
function ItemMeta({item, className}: {item: PressItem; className?: string}) {
  const t = useT()
  const {label} = useMediumLabels()
  const {locale} = useLocale()
  const Icon = MEDIUM_ICON[item.medium]

  return (
    <div className={clsx('flex flex-wrap items-center gap-x-3 gap-y-2', className)}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.8px] text-primary-700 ring-1 ring-primary-200">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        {label[item.medium]}
      </span>
      <span className="text-sm text-ink-400" aria-hidden>
        ·
      </span>
      <PressDate date={item.date} locale={locale} />
      <span className="text-sm text-ink-400" aria-hidden>
        ·
      </span>
      <span className="text-sm text-ink-500">
        {t(`languages.${item.language}`, item.language.toUpperCase())}
      </span>
    </div>
  )
}

/**
 * The editorial summary.
 *
 * Still labelled as ours — these are not the outlets' own standfirsts and the page should not let anyone
 * think they are — but the label is now an eyebrow above the text rather than a bolded run-in, so the
 * summary reads as prose instead of as a field with a caption glued to its front.
 */
function Summary({item, clamp}: {item: PressItem; clamp?: boolean}) {
  const t = useT()
  if (!item.summary) return null

  return (
    <div className="mt-4">
      <p className={clsx(eyebrow, 'mb-2 text-ink-700')}>
        {t('press.summary', 'Summary (Compass editorial)')}
      </p>
      <p
        className={clsx(
          'text-[15px] leading-relaxed text-ink-600',
          // The rows below the lead item are a scan, not a read: three lines is enough to tell whether
          // the piece is worth opening, and un-clamped these summaries run to a full paragraph each and
          // the list stops being scannable at all.
          clamp && 'line-clamp-3',
        )}
      >
        {t(`press.summary.${item.id}`, item.summary)}
      </p>
    </div>
  )
}

/** The call to action at the base of a card. Not a real link — the whole card is the link. */
function ItemCTA({medium, className}: {medium: Medium; className?: string}) {
  const {action} = useMediumLabels()

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 transition-colors group-hover:text-primary-800',
        className,
      )}
    >
      {action[medium]}
      <ArrowUpRightIcon
        className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        strokeWidth={2}
      />
    </span>
  )
}

/**
 * The lead item, given the room a lead deserves.
 *
 * The five items used to be five identical bordered boxes under an "FR" heading, so the most recent piece
 * — a full radio interview — arrived with exactly the weight of a syndicated duplicate three rows below
 * it. Here the newest one gets the display-size headline, the untruncated summary and the logo at full
 * size; everything after it is a row.
 */
function FeaturedItem({item}: {item: PressItem}) {
  const t = useT()

  return (
    <Link
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(surface, surfaceHover, 'group relative block overflow-hidden p-6 sm:p-10')}
    >
      {/* The one gradient on this page, and the reason the lead reads as a lead at a glance rather than
          after reading its headline. Same treatment as the about page's spotlight block. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-primary-500/[0.08] blur-3xl"
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
          <OutletLogo outlet={item.outlet} />
          {/* `min-w` so the metadata drops onto its own line rather than being squeezed into the ~150px
              left beside a 128px logo tile on a phone. */}
          <div className="min-w-[220px] flex-1">
            <p className={clsx(eyebrow, 'mb-2 text-primary-700')}>
              {t('press.latest', 'Latest coverage')}
            </p>
            <ItemMeta item={item} />
          </div>
        </div>
        <h2 className="mt-6 mb-0 font-heading text-[clamp(22px,2.6vw,32px)] font-bold leading-[1.2] tracking-tight text-ink-900 text-balance transition-colors group-hover:text-primary-800">
          {item.title}
        </h2>
        <div className="max-w-3xl">
          <Summary item={item} />
        </div>
        <ItemCTA medium={item.medium} className="mt-6" />
      </div>
    </Link>
  )
}

/**
 * Everything after the lead: logo rail, then the piece.
 *
 * The logo is the left rail rather than a byline in the text because it is what the eye actually uses to
 * navigate this list — four outlets, five items, and two of those items are the same syndicated article
 * carried by two different papers. The mark distinguishes them instantly; the identical headlines do not.
 */
function PressRow({item}: {item: PressItem}) {
  const {name} = OUTLETS[item.outlet]

  return (
    <Link
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        surface,
        surfaceHover,
        'group flex flex-col gap-5 p-5 sm:flex-row sm:gap-7 sm:p-6',
      )}
    >
      <div className="flex items-center gap-4 sm:block">
        <OutletLogo outlet={item.outlet} size="sm" />
        {/* The outlet's name in text as well as in the mark: the logos are images, and a name that only
            exists inside a PNG is a name a screen reader user gets once, as alt text, with no emphasis. */}
        <span className="text-sm font-semibold text-ink-700 sm:mt-2 sm:block sm:text-center">
          {name}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <ItemMeta item={item} className="mb-3" />
        <h3 className="mt-0 mb-0 font-heading text-lg font-bold leading-snug tracking-tight text-ink-900 sm:text-xl transition-colors group-hover:text-primary-800">
          {item.title}
        </h3>
        <Summary item={item} clamp />
        <ItemCTA medium={item.medium} className="mt-4" />
      </div>
    </Link>
  )
}

// ─── Header band ──────────────────────────────────────────────────────────────

/**
 * The logo strip under the page header, with the coverage counted underneath it.
 *
 * A rule-bounded band rather than a card, for the same reason the about page's `StatBand` is one: this
 * page is otherwise a column of cards, and opening it with a sixth one gives the eye nothing to catch on.
 *
 * The three numbers are derived from `pressItems`, never typed in, so adding a sixth item can't leave the
 * page claiming five.
 */
function CoverageBand({items}: {items: PressItem[]}) {
  const t = useT()
  const {locale} = useLocale()

  const outlets = new Set(items.map((i) => i.outlet)).size
  const since = useMemo(() => {
    const earliest = items.map((i) => i.date).sort()[0]
    if (!earliest) return null
    try {
      return new Date(`${earliest}T00:00:00Z`).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
    } catch {
      return earliest
    }
  }, [items, locale])

  return (
    <div className="border-y border-canvas-200 py-8">
      <PressLogos />
      <p className="mt-6 text-sm text-ink-500">
        {t('press.band.caption', '{stories} stories · {outlets} outlets · since {since}', {
          stories: items.length,
          outlets,
          since,
        })}
      </p>
    </div>
  )
}

// ─── Media kit ────────────────────────────────────────────────────────────────

/**
 * The paragraph a journalist can paste without having to write one themselves — with the button that
 * puts it on their clipboard.
 *
 * Every claim in it is one this site already makes and can back up (free, open source, donation-funded,
 * member-governed, started in Belgium by Martin), which is the only reason it can be handed out
 * pre-written. Deliberately no member count: a boilerplate is copied once and quoted for months, and a
 * headcount is the one figure here that would be wrong by the time it ran.
 */
function Boilerplate() {
  const t = useT()
  const [copied, setCopied] = useState(false)

  const text = t(
    'press.boilerplate.text',
    'Compass (compassmeet.com) is a free, open-source directory for finding people who share your values, interests and intentions — friends, partners or collaborators. Instead of swiping through an algorithmic feed, members read and search every profile: by values, interests, politics, or a single keyword. There are no ads, no subscriptions and no venture capital. Compass is built by volunteers, funded by donations, and governed by its members under a public constitution. It was started in Belgium by engineer Martin Braquet.',
  )

  const onCopy = () => {
    copyToClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={clsx(surface, 'p-6 sm:p-8')}>
      <div className="lg:flex lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0">
          <p className={clsx(eyebrow, 'mb-3 text-primary-700')}>
            {t('press.boilerplate.eyebrow', 'Boilerplate')}
          </p>
          <h3 className="mt-0 mb-4 max-w-2xl font-heading text-[clamp(20px,2.4vw,28px)] font-bold leading-[1.2] tracking-tight text-ink-900 text-balance">
            {t('press.boilerplate.title', 'Use this, word for word.')}
          </h3>
          {/* `max-w-xl`, not `2xl`: a slightly narrower measure both reads better and makes the copy
              column roughly as tall as the facts panel beside it, which otherwise leaves a block of dead
              space under the button on desktop. */}
          <p className="max-w-xl text-base leading-relaxed text-ink-600">{text}</p>
          <button
            type="button"
            onClick={onCopy}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-canvas-200 bg-transparent px-5 py-2.5 text-sm font-semibold text-ink-900 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary-500 hover:text-primary-500"
          >
            {copied ? (
              <CheckIcon className="h-[1.05rem] w-[1.05rem]" strokeWidth={2.5} aria-hidden />
            ) : (
              <ClipboardDocumentIcon
                className="h-[1.05rem] w-[1.05rem]"
                strokeWidth={2}
                aria-hidden
              />
            )}
            {copied
              ? t('press.boilerplate.copied', 'Copied!')
              : t('press.boilerplate.copy', 'Copy boilerplate')}
          </button>
        </div>
        <FastFacts />
      </div>
    </div>
  )
}

/**
 * The facts a journalist checks before filing, in the order they get asked for.
 *
 * The member count is queried rather than written down — same rule as `StatBand` and `MemberGrowth` — and
 * its row simply doesn't render if the call comes back empty, because a press page quoting a stale or
 * zeroed figure is worse than one that doesn't quote it at all. Everything else here is policy or fact,
 * not measurement, so it is static.
 */
function FastFacts() {
  const t = useT()
  const {data} = useAPIGetter('stats', {})

  // No "what is it" row: the boilerplate immediately to the left is that answer at full length, and
  // repeating it in four words beside itself is the sort of duplication that makes a panel look padded.
  const facts: {label: string; value: ReactNode}[] = [
    {label: t('press.facts.founder', 'Founder'), value: 'Martin Braquet'},
    {label: t('press.facts.based', 'Based'), value: t('press.facts.based_value', 'Belgium')},
    {
      label: t('press.facts.price', 'Price'),
      value: t('press.facts.price_value', 'Free — no ads, no subscriptions'),
    },
    {
      label: t('press.facts.platforms', 'Platforms'),
      value: t('press.facts.platforms_value', 'Web, Android, iPhone'),
    },
    {
      label: t('press.facts.languages', 'Interface'),
      value: t('press.facts.languages_value', 'English, French, German'),
    },
    {
      label: t('press.facts.source', 'Source'),
      value: (
        <Link
          href={githubRepo}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary-700 transition-colors hover:text-primary-800"
        >
          GitHub
        </Link>
      ),
    },
  ]

  // Leads the panel when it's there: it's the first thing anyone writing about a young platform asks.
  if (data?.profiles) {
    facts.unshift({
      label: t('press.facts.members', 'Members'),
      value: (
        <span className="tabular-nums">
          {data.profiles.toLocaleString('en-US')}{' '}
          <span className="text-ink-500">{t('press.facts.members_live', '(live)')}</span>
        </span>
      ),
    })
  }

  return (
    <div className="mt-8 rounded-xl bg-canvas-100 p-5 ring-1 ring-canvas-200 sm:p-6 lg:mt-0 lg:w-80 lg:flex-shrink-0">
      <p className={clsx(eyebrow, 'mb-1 text-ink-700')}>{t('press.facts.title', 'Fast facts')}</p>
      <dl className="m-0 divide-y divide-canvas-200">
        {facts.map((f) => (
          <div key={f.label} className="flex items-baseline gap-4 py-2.5">
            <dt className="w-24 flex-shrink-0 text-[13px] font-semibold text-ink-500">{f.label}</dt>
            <dd className="m-0 min-w-0 flex-1 text-[13px] leading-snug text-ink-900">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** One of the two action cards under the boilerplate: assets to download, a person to email. */
function KitCard({
  icon: Icon,
  title,
  text,
  buttonLabel,
  buttonUrl,
  primary,
}: {
  icon: IconType
  title: string
  text: string
  buttonLabel: string
  buttonUrl: string
  primary?: boolean
}) {
  return (
    <div className={clsx(surface, surfaceHover, 'flex h-full flex-col p-6 sm:p-7')}>
      <div className="mb-5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 ring-1 ring-primary-200">
        <Icon className="h-5 w-5 text-primary-600" strokeWidth={1.8} />
      </div>
      <h3 className="mt-0 mb-2.5 font-bold text-ink-900">{title}</h3>
      <p className="mb-6 text-sm leading-relaxed text-ink-600">{text}</p>
      {/* Same hierarchy as the about page: one filled CTA per group, everything else outlined, so the
          two cards don't shout at each other. */}
      <Link
        href={buttonUrl}
        target={buttonUrl.startsWith('http') ? '_blank' : undefined}
        rel={buttonUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
        className={clsx(
          'mt-auto inline-flex w-fit items-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5',
          primary
            ? 'bg-cta text-white shadow-[0_6px_20px_-6px_rgba(193,127,62,0.6)] hover:bg-cta-hover'
            : 'border-2 border-canvas-200 text-ink-900 hover:border-primary-500 hover:text-primary-500',
        )}
      >
        {buttonLabel}
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PressPage() {
  const t = useT()

  // Newest first, and sorted rather than assumed: the array is maintained by hand and the ordering is
  // load-bearing now that the first item is styled as the lead.
  const items = useMemo(() => [...pressItems].sort((a, b) => b.date.localeCompare(a.date)), [])
  const [featured, ...rest] = items

  return (
    <PageBase trackPageView={'press'}>
      <SEO
        title={t('press.seo.title', 'Press - Compass')}
        description={t(
          'press.seo.description',
          'Latest press coverage and media mentions of Compass',
        )}
        url={'/press'}
      />

      {/* `max-w-6xl` and left-aligned, matching `/about`: a centred `max-w-4xl` column left roughly half
          the screen empty at desktop widths, and this page now has a logo strip and a two-column media
          kit that both want the room. */}
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-8">
        {/* ── Page header ── */}
        <div className="mb-10">
          <p className={clsx(eyebrow, 'mb-4 text-primary-700')}>
            {t('press.eyebrow', 'Press & media')}
          </p>
          <h1 className="mb-5 max-w-3xl text-[clamp(34px,5vw,56px)] leading-[1.08] tracking-tight text-ink-900 text-balance">
            {t('press.headline', 'Compass in the press.')}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-ink-700 sm:text-xl">
            {t('press.subtitle', 'Latest news and media coverage about Compass')}
          </p>
        </div>

        {items.length > 0 && <CoverageBand items={items} />}

        {/* ── Coverage ──
            The language grouping is gone. It put every item under an "FR" heading — one group, every
            time — which cost a heading's worth of vertical space to tell the reader nothing. Each item
            now carries its own language in its metadata line, which is where it does work: next to the
            medium, where a reader is deciding whether to click. */}
        {items.length > 0 && (
          <Section>
            <SectionLabel>{t('press.coverage.label', 'Coverage')}</SectionLabel>

            <Reveal>
              <FeaturedItem item={featured} />
            </Reveal>

            <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5">
              {rest.map((item, i) => (
                <Reveal key={item.id} delay={i * 70}>
                  <PressRow item={item} />
                </Reveal>
              ))}
            </div>
          </Section>
        )}

        {items.length === 0 && (
          <div className={clsx(surface, 'mt-10 p-8 text-center')}>
            <p className="m-0 text-ink-600">
              {t(
                'press.no_articles',
                'No press articles available at the moment. Please check back later.',
              )}
            </p>
          </div>
        )}

        {/* ── Media kit ──
            Moved below the coverage. It used to open the page, which meant a reader who arrived from an
            article — the overwhelming majority here — met a logo download before a single story. The
            people who want a media kit are a small, motivated minority and will scroll for it. */}
        <Section>
          <SectionLabel>{t('press.media_kit', 'Media Kit')}</SectionLabel>

          <Reveal>
            <Boilerplate />
          </Reveal>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:grid-cols-2 sm:gap-5">
            <Reveal>
              <KitCard
                icon={ArrowDownTrayIcon}
                title={t('press.brand_assets', 'Brand Assets')}
                text={t(
                  'press.brand_assets_description',
                  'Download our logo and brand guidelines.',
                )}
                buttonLabel={t('press.download_assets', 'Download Assets')}
                buttonUrl="https://github.com/CompassConnections/assets/archive/refs/heads/main.zip"
                primary
              />
            </Reveal>
            <Reveal delay={70}>
              <KitCard
                icon={EnvelopeIcon}
                title={t('press.contact', 'Press Contact')}
                text={t(
                  'press.contact_description',
                  'For press inquiries, please contact our team.',
                )}
                buttonLabel={t('press.contact_us', 'Contact Us')}
                buttonUrl={`mailto:${supportEmail}`}
              />
            </Reveal>
          </div>
        </Section>
      </div>
    </PageBase>
  )
}
