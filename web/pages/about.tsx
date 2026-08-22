import {
  ArrowsUpDownIcon,
  BanknotesIcon,
  BellIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  FlagIcon,
  GiftIcon,
  HeartIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  PencilSquareIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import {GlobeAltIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {
  ANDROID_APP_URL,
  discordLink,
  FINANCIALS,
  formLink,
  githubRepo,
  OG_DESCRIPTION,
} from 'common/constants'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {DemographicField} from 'common/stats'
import Image from 'next/image'
import Link from 'next/link'
import {ComponentType, ReactNode, SVGProps} from 'react'
import {FaAndroid, FaApple} from 'react-icons/fa'
import {StatBand} from 'web/components/about/platform-stats'
import {RepoActivity} from 'web/components/about/repo-activity'
import {AlertDemo} from 'web/components/about/search-alert-demo'
import {SectionLabel} from 'web/components/about/section'
import {VoteEvidence} from 'web/components/about/vote-evidence'
import {PageBase} from 'web/components/page-base'
import {PressLogos} from 'web/components/press/press-logos'
import {SEO} from 'web/components/SEO'
import {
  TestimonialsTeaser,
  useHasTestimonials,
} from 'web/components/testimonials/testimonials-teaser'
import {Reveal} from 'web/components/widgets/reveal'
import {ShareCTAButton} from 'web/components/widgets/share-cta-button'
import {DistRow, labelFor} from 'web/components/widgets/stat-distribution'
import {eyebrow, Section, surface} from 'web/components/widgets/surface'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {CORE_AGE_BUCKETS, shareOf, topOf} from 'web/lib/marketing-stats'

// ─── Types ────────────────────────────────────────────────────────────────────

type IconType = ComponentType<SVGProps<SVGSVGElement>>

interface FeatureCardProps {
  icon: IconType
  title: string
  text: ReactNode
}

interface HelpCardProps {
  icon: IconType
  title: string
  text: ReactNode
  buttonLabel: string
  buttonUrl: string
  buttonPrimary?: boolean
  id?: string
}

// ─── Icon chip ────────────────────────────────────────────────────────────────

/**
 * Shared so the hero blocks and the ordinary cards can differ in *size* while staying the same object.
 * Ten identically-sized chips down the page was a large part of why nothing read as more important than
 * anything else.
 */
function IconChip({icon: Icon, large}: {icon: IconType; large?: boolean}) {
  return (
    <div
      className={clsx(
        'rounded-xl bg-primary-100 ring-1 ring-primary-200 flex items-center justify-center flex-shrink-0',
        large ? 'w-14 h-14' : 'w-11 h-11',
      )}
    >
      <Icon className={clsx('text-primary-600', large ? 'w-7 h-7' : 'w-5 h-5')} strokeWidth={1.8} />
    </div>
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

/**
 * Three of these sit in a row under `NotifySpotlight`, and boxed they were the most literal "lego
 * blocks" on the page: three identical bordered rectangles, same size, same weight, saying three things
 * of quite different importance. They are supporting notes to the spotlight above them, not peers of
 * it, so they lose the frame and keep only a hairline rule on top — enough to say "three of these",
 * nothing like enough to compete with the block they follow.
 */
function FeatureCard({icon, title, text}: FeatureCardProps) {
  return (
    <div className="h-full border-t border-canvas-200 pt-6">
      <div className="mb-5">
        <IconChip icon={icon} />
      </div>
      <h3 className="font-bold text-ink-900 mb-2.5">{title}</h3>
      <p className="text-sm text-ink-600 leading-relaxed">{text}</p>
    </div>
  )
}

// ─── Full-width Feature Card ──────────────────────────────────────────────────

function FeatureCardWide({icon, title, text}: FeatureCardProps) {
  return (
    // Sits directly under `MissionStatement`, the one gradient block on the page. A bordered card
    // immediately below a tinted one is two frames in a row saying different things; a plain row lets
    // the statement keep the weight and reads as a footnote to it, which is what it is.
    <div
      className={clsx(
        'col-span-1 md:col-span-2',
        'flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6',
      )}
    >
      <IconChip icon={icon} />
      <div className="min-w-0">
        <h3 className="font-bold text-ink-900 mb-2">{title}</h3>
        {/* Capped: the card is full-width, so without this the line runs to ~800px at desktop, well
            past a readable measure. The wider page container buys layout room, not longer lines. */}
        <p className="text-sm text-ink-600 leading-relaxed max-w-3xl">{text}</p>
      </div>
    </div>
  )
}

// ─── Spotlight: "Get Notified About Searches" ─────────────────────────────────

/**
 * The lead block of the page.
 *
 * This is the most distinctive claim Compass makes and the one with an actual recording behind it, so it
 * gets the room: the claim at display size on the left, the clip that proves it at full height on the
 * right. Previously it was one of three identical tiles stacked beside the phone, which meant the single
 * strongest thing on the page was styled exactly like "Completely Free".
 *
 * The warm radial behind the phone is the only gradient on a content block. It exists to stop the device
 * from floating in dead space at wide viewports — at 1900px the old fixed-width column left roughly half
 * the screen empty beside it.
 */
/**
 * One rung of the three-step flow in `NotifySpotlight`. The steps are the fix for the block's dead
 * space *and* the honest caption for the clip: the video loops through search → save → email, but a
 * glancing reader only ever catches one frame of it, so on its own the phone under-sells the "keyword
 * search" half of the promise. Spelling the arc out beside the device means the two capabilities
 * (find the exact person; be told when they arrive) both land whether or not the loop is watched.
 */
function FlowStep({
  icon: Icon,
  title,
  text,
  last,
}: {
  icon: IconType
  title: string
  text: string
  last?: boolean
}) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {/* The connector runs from just under this rung's marker to the next one, so it stops at the
          last step rather than trailing into empty space. */}
      {!last && (
        <span aria-hidden className="absolute left-5 top-11 -bottom-0 w-px bg-canvas-200" />
      )}
      <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 ring-1 ring-primary-200">
        <Icon className="h-5 w-5 text-primary-600" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 pt-1">
        <div className="font-semibold text-ink-900 leading-snug">{title}</div>
        <div className="text-sm text-ink-600 leading-relaxed mt-1">{text}</div>
      </div>
    </li>
  )
}

function NotifySpotlight({title, text}: {title: string; text: string}) {
  const t = useT()

  const steps = [
    {
      icon: MagnifyingGlassIcon,
      title: t('about.block.notify.step1.title', 'Search by keyword'),
      text: t(
        'about.block.notify.step1.text',
        'Filter the whole community down to your people, by values, interests, and location.',
      ),
    },
    {
      icon: BookmarkIcon,
      title: t('about.block.notify.step2.title', 'Save the search'),
      text: t(
        'about.block.notify.step2.text',
        'Nobody matches yet? Save it in one tap instead of checking back.',
      ),
    },
    {
      icon: EnvelopeIcon,
      title: t('about.block.notify.step3.title', 'Get the email'),
      text: t(
        'about.block.notify.step3.text',
        'We email you the day someone who fits actually joins.',
      ),
    },
  ]

  return (
    <div className={clsx(surface, 'relative overflow-hidden p-6 sm:p-10')}>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-primary-500/[0.07] blur-3xl"
      />
      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 md:gap-14 items-center">
        {/* The three steps are what close the gap: short copy centred against a ~580px device is what
            left the panel two-thirds empty. They give the column real height, so the row is balanced
            by content rather than padded by air. */}
        <div className="min-w-0">
          <IconChip icon={BellIcon} large />
          <h3 className="font-heading font-bold text-ink-900 text-[24px] leading-[1.15] tracking-tight mt-6 mb-4 text-balance">
            {title}
          </h3>
          <p className="text-base sm:text-lg text-ink-600 leading-relaxed max-w-lg">{text}</p>
          <ol className="mt-8 max-w-md">
            {steps.map((s, i) => (
              <FlowStep
                key={s.title}
                icon={s.icon}
                title={s.title}
                text={s.text}
                last={i === steps.length - 1}
              />
            ))}
          </ol>
        </div>
        {/* The device is 2.16x as tall as it is wide, so at any width that keeps its UI legible it is
            far taller than the text beside it — centring it just produced ~200px of dead panel above
            and below the copy. Instead it bottom-bleeds past the panel edge (clipped by the panel's
            own `overflow-hidden`), which is both the conventional device-showcase treatment and the
            one that makes the height mismatch disappear. Only from `md` up: stacked on mobile the
            phone is the whole point of its own row and must not be cropped. */}
        <AlertDemo width="min(270px, 68vw)" className="md:self-end md:-mb-24" />
      </div>
    </div>
  )
}

// ─── Statement: "One Mission" ─────────────────────────────────────────────────

/**
 * The page's thesis, given the weight of a thesis.
 *
 * It is the only block set on a tinted surface and the only body copy on the page at display size — both
 * deliberately unique, because the point of promoting it is that a reader who skims the whole page
 * should still land on this. Repeating this treatment anywhere else would cost it exactly the emphasis
 * it was promoted to have.
 */
function MissionStatement({title, text}: {title: string; text: string}) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl p-8 sm:p-12',
        'bg-gradient-to-br from-primary-100 via-canvas-50 to-canvas-50',
        'dark:from-primary-900/25 dark:via-canvas-50 dark:to-canvas-50',
        'ring-1 ring-primary-200',
        'shadow-[0_1px_2px_rgb(44_36_22/0.04),0_16px_40px_-24px_rgb(44_36_22/0.35)]',
        'dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]',
      )}
    >
      <IconChip icon={FlagIcon} large />
      <h3 className={clsx(eyebrow, 'text-primary-700 mt-6 mb-3')}>{title}</h3>
      <p className="font-heading text-ink-900 text-[clamp(24px,3vw,36px)] leading-[1.25] tracking-tight max-w-3xl text-balance">
        {text}
      </p>
    </div>
  )
}

// ─── Prose blocks ─────────────────────────────────────────────────────────────

/**
 * The shape every new text-only section on this page uses: eyebrow label, heading, body, optional links.
 *
 * The page had no vocabulary for prose — everything was a card with a fragment in it, which is why it
 * could show a ballot without explaining the machinery behind it, or state "detailed profiles" without ever
 * listing a field. Several of the things a reader most wants here (what's public, who runs it, what it
 * costs) are three sentences, not a fragment, and this is where they live.
 */
function ProseBlock({
  icon,
  label,
  title,
  children,
  links,
  visual,
  flip,
}: {
  icon: IconType
  label: string
  title: string
  children: ReactNode
  links?: {href: string; label: string; external?: boolean}[]
  // Optional second column for a block that has something to show, not just say — e.g. the costs
  // block's funding bar. Without it, text capped at `max-w-2xl` leaves a wide empty strip on desktop;
  // `visual` is where that space goes to work instead of sitting blank.
  visual?: ReactNode
  // Puts the visual on the left instead. Used to alternate down a run of these: three in a row with
  // the artwork always on the right is the shape that reads as a template rather than as a page.
  flip?: boolean
}) {
  return (
    // No card. A `ProseBlock` is a heading and three paragraphs — the section label and the rhythm
    // around it already say where it starts and stops, so the border was drawing a box around the fact
    // that text exists. It also produced the page's worst shape: a frame containing a frame, since the
    // `visual` these blocks carry (the toggle mock, the costs bar, the platform glyphs) is itself a
    // card. Now exactly one thing in the block is framed, and it is the thing worth framing.
    <div
      className={clsx(
        visual && 'lg:flex lg:items-start lg:justify-between lg:gap-12',
        flip && 'lg:flex-row-reverse',
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <IconChip icon={icon} />
          <p className={clsx(eyebrow, 'text-primary-700')}>{label}</p>
        </div>
        <h3 className="font-heading font-bold text-ink-900 text-[24px] leading-[1.2] tracking-tight mt-0 mb-4 max-w-2xl text-balance">
          {title}
        </h3>
        <div className="text-base text-ink-600 leading-relaxed max-w-2xl [&>p+p]:mt-4">
          {children}
        </div>
        {links && (
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                target={l.external ? '_blank' : undefined}
                rel={l.external ? 'noopener noreferrer' : undefined}
                className="inline-flex w-fit items-center text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
      {visual}
    </div>
  )
}

/**
 * The visual beside "Four steps, and you control all four." — the one concrete number already stated in
 * each step's own text (20 minutes, 20+ filters, one tap, 200 characters), pulled out as a 2×2 grid rather
 * than left buried in the paragraphs. Static: these are product facts, not measurements, so nothing here is
 * fetched or can go stale. Deliberately not a screenshot or mockup — `NotifySpotlight` right below already
 * carries the visual weight for step 3, and reusing a phone clip or composer mock here would just repeat a
 * visual the page (or /) already shows.
 *
 * Currently disabled (see the commented-out call in `HowItWorks`) — kept rather than deleted in case the
 * empty column next to the step list wants filling again later.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function StepStats() {
  const t = useT()

  const stats = [
    {value: '20', label: t('about.how.stat.write', 'min to write a profile')},
    {value: '20+', label: t('about.how.stat.search', 'filters to search with')},
    {value: '1', label: t('about.how.stat.save', 'tap to save a search')},
    {value: '200', label: t('about.how.stat.message', 'char minimum to message')},
  ]

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 lg:mt-0 lg:w-72 lg:flex-shrink-0">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border border-canvas-300 bg-canvas-0 p-3">
          <div className="text-2xl font-bold text-primary-600">{s.value}</div>
          <div className="mt-1 text-xs leading-snug text-ink-500">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

/**
 * "How it works" — the loop, in four steps.
 *
 * The page used to open on the stat band and go straight into saved-search alerts, which is step three of
 * four: a reader who has never used Compass was being sold the clever part before the basic one. Step 3 is
 * deliberately one line, because `NotifySpotlight` immediately below it is that step at full length with
 * the recording attached.
 */
function HowItWorks() {
  const t = useT()

  const steps = [
    {
      icon: PencilSquareIcon,
      title: t('about.how.step1.title', 'Write a profile'),
      text: t(
        'about.how.step1.text.v2',
        'Twenty minutes: a bio in your own words, prompt answers, the causes you care about, your politics, religion, diet, languages, and what you’re looking for. Every field is optional.',
      ),
    },
    {
      icon: MagnifyingGlassIcon,
      title: t('about.how.step2.title', 'Search everyone'),
      // Was "No feed, no queue, no daily allowance of people." — the same three-negatives-in-a-row
      // shape the page used five other times. Stated positively it also says something the negative
      // version only implied: you can look at everyone, in any order, as often as you like.
      text: t(
        'about.how.step2.text.v2',
        'You can look at everyone, whenever you want, in whatever order you like. More than twenty filters, plus free-text search that reads the prose in people’s bios.',
      ),
    },
    {
      icon: BookmarkIcon,
      title: t('about.how.step3.title', 'Save the search'),
      text: t(
        'about.how.step3.text.v2',
        'Nobody fits today? Save it, and we email you the day someone who does joins. The block below shows you how that works.',
      ),
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: t('about.how.step4.title', 'Write something real'),
      text: t(
        'about.how.step4.text',
        'A first message is 200 characters minimum and needs a verified email address. No "hey": the composer will not send until you’ve said something about the person you’re writing to.',
      ),
    },
  ]

  return (
    // Unboxed: the numbered rungs and their connector line are already a strong enough figure to hold
    // together without a border drawn around them, and four steps in a card read as a form to fill in.
    <div>
      <div className="lg:flex lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0">
          <h3 className="font-heading font-bold text-ink-900 text-[24px] leading-[1.2] tracking-tight mt-0 mb-7 text-balance">
            {/* Not "Four steps, and you control all four." — see the note on home's section heading:
                the counted-promise headline was this page's default shape too. */}
            {t('about.how.title.v2', 'What using Compass looks like.')}
          </h3>
          <ol className="max-w-2xl">
            {steps.map((s, i) => (
              <FlowStep
                key={s.title}
                icon={s.icon}
                title={s.title}
                text={s.text}
                last={i === steps.length - 1}
              />
            ))}
          </ol>
        </div>
        {/*<StepStats />*/}
      </div>
    </div>
  )
}

/**
 * "Who's here" — the membership, with its denominators.
 *
 * The long version of the home page's three-line qualifier. Home has to persuade a stranger in seconds and
 * cannot spend a clause on "of the 394 who answered"; someone reading this page is deciding whether to
 * publish a page about themselves, and the bases are the reason to believe the rest.
 *
 * No total here — `StatBand` states it once at the top of the page, and that is this page's whole allowance
 * for it. Everything below is composition, which persuades and does not shrink.
 *
 * Percentages only for single-select fields; multi-select rows report each answer's own count. See
 * `web/lib/marketing-stats.ts` — summing overlapping selections against a distinct-answerer base would
 * overstate by an unknowable amount, and this page has just promised the reader it will not do that.
 */
function WhosHere() {
  const t = useT()
  const {data} = useAPIGetter('stats', {})

  const age = shareOf(data, 'age', CORE_AGE_BUCKETS)
  const gender = shareOf(data, 'gender', ['male'])
  const degree = shareOf(data, 'education_level', ['bachelors', 'masters', 'doctorate'])
  const rows: {label: string; base: number; barLabel: string; pct: number}[] = []

  if (age) {
    rows.push({
      label: t('about.who.row.age', 'Age'),
      base: age.base,
      barLabel: t('about.who.bar.age', '25–44'),
      pct: age.pct,
    })
  }
  if (gender) {
    rows.push({
      label: t('about.who.row.gender', 'Gender'),
      base: gender.base,
      barLabel: t('about.who.bar.gender', 'Men'),
      pct: gender.pct,
    })
  }
  if (degree) {
    rows.push({
      label: t('about.who.row.education', 'Education'),
      base: degree.base,
      barLabel: t('about.who.bar.education', 'Bachelor’s+'),
      pct: degree.pct,
    })
  }

  // Religion and looking-for are multi-select, so only the single leading answer is shown — one line per
  // field, matching age/gender/education, rather than the full ranked list. The complete breakdown for
  // every field (including the ones cut here) is one click away at /stats; see `web/lib/marketing-stats.ts`
  // for why a multi-select percentage is of respondents and can't be summed with the others.
  const leading: [DemographicField, string][] = [
    ['religion', t('about.who.row.religion', 'Religion')],
    ['pref_relation_styles', t('about.who.row.looking', 'Looking for')],
  ]
  for (const [field, label] of leading) {
    const top = topOf(data, field, 1)?.[0]
    if (!top) continue
    rows.push({
      label,
      base: top.base,
      barLabel: labelFor(field, top.value),
      pct: Math.max(1, Math.round((top.count / top.base) * 100)),
    })
  }

  if (rows.length < 3) return null

  return (
    // Unboxed and split in two. The claim and its evidence were stacked inside one card, so the whole
    // section was a single tall rectangle of text-then-bars; side by side they read as an assertion and
    // its receipt, and the section stops having the same silhouette as the step list above it. The
    // divided rows are their own structure and never needed a border around them.
    <div className="lg:flex lg:items-start lg:gap-14">
      <div className="min-w-0 lg:w-[22rem] lg:flex-shrink-0">
        <h3 className="font-heading font-bold text-ink-900 text-[24px] leading-[1.2] tracking-tight mt-0 mb-4 text-balance">
          {t('about.who.title', 'Our members.')}
        </h3>
        <p className="text-base text-ink-600 leading-relaxed">
          {t(
            'about.who.intro.v4',
            'Members skew single, highly educated, secular, and more plant-based than average. They are spread across more than fifty countries, with no single hub.',
          )}
        </p>
        <Link
          href="/stats"
          className="mt-5 inline-flex w-fit items-center text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
        >
          {t('about.who.link', 'Every distribution out here →')}
        </Link>
      </div>
      <dl className="mt-8 min-w-0 flex-1 divide-y divide-canvas-200 lg:mt-0">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-6 py-3.5 first:pt-0">
            <dt className="w-24 flex-shrink-0 font-semibold text-ink-900 sm:w-32">
              {r.label}{' '}
              {/*<span className="font-normal text-ink-500">({r.base.toLocaleString()})</span>*/}
            </dt>
            <dd className="m-0 flex-1 min-w-0">
              <DistRow label={r.barLabel} pct={r.pct} widthPct={r.pct} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * The funding bar beside "What it costs" — one stacked bar showing how the total spent breaks down between
 * what members donated and what the founder covered, instead of leaving a reader to do that subtraction
 * from three numbers in a paragraph.
 *
 * Donated and founder-covered are two shares of one measure (dollars spent), not two independent series, so
 * this stays single-hue rather than reaching for a second color: the accent at full strength is "covered by
 * the community", the same accent faded is "covered by the founder" — the exact opacity convention `DistRow`
 * already uses to relate values within one field. A small flex gap between the two segments keeps them from
 * reading as one continuous bar. Values come from `FINANCIALS`, the same constant the surrounding prose and
 * the home-page strip read from, so the bar can never disagree with the sentence beside it.
 */
function CostsChart() {
  const t = useT()
  const {spent, donated, deficit} = FINANCIALS
  const donatedPct = Math.round((donated / spent) * 100)
  const deficitPct = 100 - donatedPct

  return (
    <div className="mt-8 rounded-xl bg-canvas-100 ring-1 ring-canvas-200 p-5 sm:p-6 lg:mt-0 lg:w-72 lg:flex-shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        {t('about.costs.chart.title', 'Since launch')}
      </p>
      <p className="mb-4 text-2xl font-bold text-ink-900">${spent}</p>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-canvas-200">
        <div className="h-full rounded-full bg-primary-500" style={{width: `${donatedPct}%`}} />
        <div className="h-full rounded-full bg-primary-500/30" style={{width: `${deficitPct}%`}} />
      </div>
      <div className="mt-4 flex flex-col gap-2 text-[13px]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
          <span className="text-ink-700">{t('about.costs.chart.donated', 'Donated')}</span>
          <span className="ml-auto tabular-nums text-ink-500">
            ${donated} · {donatedPct}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary-500/30" />
          <span className="text-ink-700">{t('about.costs.chart.deficit', 'Founder-covered')}</span>
          <span className="ml-auto tabular-nums text-ink-500">
            ${deficit} · {deficitPct}%
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * The visual beside "Your profile is a web page... and it's a switch." — the two states the prose
 * describes, stacked as they'd actually appear, rather than left as an adjective ("public", "members-only")
 * a reader has to picture. Static: this is a UI mechanism, not a number, so nothing here is fetched.
 */
function VisibilityToggleMock() {
  const t = useT()

  return (
    <div className="mt-8 rounded-xl bg-canvas-100 ring-1 ring-canvas-200 p-5 sm:p-6 lg:mt-0 lg:w-72 lg:flex-shrink-0">
      <div className="flex items-center gap-3 rounded-lg border border-canvas-300 bg-canvas-0 p-3">
        <GlobeAltIcon className="h-4 w-4 flex-shrink-0 text-primary-600" />
        <div className="min-w-0">
          <div className="whitespace-nowrap text-[13px] font-semibold text-ink-900">
            {t('about.public.mock.public', 'Public')}
          </div>
          <div className="text-xs text-ink-500">
            {t('about.public.mock.public_sub', 'Anyone can find it')}
          </div>
        </div>
      </div>
      <div className="my-2 flex justify-center">
        <ArrowsUpDownIcon className="h-4 w-4 text-ink-400" strokeWidth={1.8} />
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-canvas-300 bg-canvas-0 p-3">
        <EyeSlashIcon className="h-4 w-4 flex-shrink-0 text-ink-500" />
        <div className="min-w-0">
          <div className="whitespace-nowrap text-[13px] font-semibold text-ink-900">
            {t('about.public.mock.members', 'Members-only')}
          </div>
          <div className="text-xs text-ink-500">
            {t('about.public.mock.members_sub', 'Hidden, unindexed')}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-500">
        {t('about.public.mock.caption', 'One tap switches between them, any time.')}
      </p>
    </div>
  )
}

/**
 * The Press section's logo strip now lives in `components/press/press-logos.tsx` — `/press` needs the same
 * four marks, both as this strip and beside each individual article, and two copies of the per-logo height
 * tuning would drift. See that file for why the logos keep their native color.
 */

/**
 * The visual beside "Browser, Android, and a home-screen app on iPhone." — the three platforms named as
 * rows instead of left as a sentence to parse. Static: this is where the product runs, not a number, so
 * nothing here is fetched.
 */
function PlatformGlyphs() {
  const t = useT()

  const platforms = [
    {
      icon: GlobeAltIcon,
      name: t('about.platforms.mock.browser', 'Browser'),
      sub: t('about.platforms.mock.browser_sub', 'Any device'),
    },
    {
      icon: FaAndroid,
      name: t('about.platforms.mock.android', 'Android'),
      sub: t('about.platforms.mock.android_sub', 'Google Play'),
    },
    {
      icon: FaApple,
      name: t('about.platforms.mock.iphone', 'iPhone'),
      sub: t('about.platforms.mock.iphone_sub', 'Add to Home Screen'),
    },
  ]

  return (
    <div className="mt-8 flex flex-col gap-2 rounded-xl bg-canvas-100 p-5 sm:p-6 lg:mt-0 lg:w-72 lg:flex-shrink-0">
      {platforms.map((p) => (
        <div
          key={p.name}
          className="flex items-center gap-3 rounded-lg border border-canvas-300 bg-canvas-0 p-3"
        >
          <p.icon className="h-4 w-4 flex-shrink-0 text-primary-600" />
          <div className="min-w-0">
            <div className="whitespace-nowrap text-[13px] font-semibold text-ink-900">{p.name}</div>
            <div className="text-xs text-ink-500">{p.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * The visual beside "Somebody has to start these things." — Martin's own photo, fetched live from his
 * public profile rather than a static asset, so it can't drift if he changes it. This is the one member
 * photo either marketing page shows: the "no real photos without consent" rule (see the "Deliberately out
 * of scope" section of `docs/marketing-copy.md`) is about the membership generally, and obviously doesn't
 * apply to the founder writing about himself in his own section. Renders nothing if the profile or its
 * photo comes back empty rather than a broken image or an initials placeholder — same rule as `StatBand`.
 */
function FounderPhoto() {
  const {data} = useAPIGetter('get-user-and-profile', {username: 'Martin'})
  const photoUrl = data?.profile?.pinned_url

  if (!photoUrl) return null

  return (
    <div className="relative mt-8 h-60 w-60 flex-shrink-0 overflow-hidden rounded-2xl ring-1 ring-canvas-200 lg:mt-0">
      <Image src={photoUrl} alt="Martin Braquet" fill sizes="240px" className="object-cover" />
    </div>
  )
}

// ─── Help Cards ───────────────────────────────────────────────────────────────

/**
 * The lead of the "other ways to help" group. Contributing suggestions/help is the one we most want of
 * the four, so it is the full-width horizontal card with a large icon and a *button* rather than a bare
 * text link — but only an outline button, never a filled one. The filled amber CTA is spoken for by
 * "Share Compass" one block up, which must stay the loudest thing here; a second filled CTA next to it
 * out-shouts it. So the hierarchy is deliberately: filled Share › outlined Suggest › the three links.
 */
function FeaturedHelpCard({icon, title, text, buttonLabel, buttonUrl, id}: HelpCardProps) {
  return (
    // Unframed like the three below it. It keeps its rank through the large icon chip and the outlined
    // button — the only bordered control in the group — rather than through a container, which is what
    // it was competing with the slab above on.
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
      <IconChip icon={icon} large />
      <div className="min-w-0 flex-1">
        <h3 id={id} className="font-bold text-lg text-ink-900 mb-1.5">
          {title}
        </h3>
        <p className="text-sm text-ink-600 leading-relaxed max-w-xl">{text}</p>
      </div>
      {/* Same outline treatment as the home hero's "Learn how it works" secondary CTA, so the one
          outlined button on each marketing page reads as the same control: ink label on a neutral
          border, with the accent held back for hover. Written out rather than routed through
          `GeneralButton`, whose wrapper adds padding this card's flex row doesn't want. */}
      <Link
        href={buttonUrl}
        target={buttonUrl.startsWith('http') ? '_blank' : undefined}
        rel={buttonUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="inline-flex w-fit shrink-0 px-7 py-3.5 rounded-xl bg-transparent text-ink-900 font-semibold text-[15px] border-2 border-canvas-200 hover:border-primary-500 hover:text-primary-500 hover:-translate-y-0.5 transition-all duration-200 ease-out"
      >
        {buttonLabel}
      </Link>
    </div>
  )
}

function HelpCard({icon, title, text, buttonLabel, buttonUrl, id}: HelpCardProps) {
  return (
    // Unframed, with a hairline rule on top — the same treatment the three `FeatureCard`s use, so the
    // page's two "row of three supporting items" moments look like one idea rather than two. The box
    // was also what created the dead space: `h-full` forced all three to the tallest card's height and
    // `mt-auto` pushed the link to the bottom, so a card with two lines of copy carried ~90px of
    // nothing. Without a frame there is no height to fill, so the rule stays and the hole goes.
    <div
      className="flex h-full flex-col border-t border-canvas-200 pt-6"
      // NOTE: Abandoned the left accent bar due to a known Firefox rendering bug.
      // Firefox fails to correctly apply overflow-hidden on rounded containers with borders,
      // causing the absolute/flex-item to bleed past the corner radius.
      // Removed for cross-browser consistency.
    >
      <div className="mb-4">
        <IconChip icon={icon} />
      </div>
      <h3 id={id} className="font-bold text-ink-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-ink-600 leading-relaxed mb-5">{text}</p>
      {/* A text link, not a boxed button: these three are the secondary asks, so their action is
          deliberately lighter than the featured card's filled CTA. `mt-auto` pins it to the base so the
          three links line up regardless of copy length. */}
      <Link
        href={buttonUrl}
        target={buttonUrl.startsWith('http') ? '_blank' : undefined}
        rel={buttonUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="mt-auto inline-flex w-fit items-center text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
      >
        {buttonLabel}
      </Link>
    </div>
  )
}

// ─── Share Strip ──────────────────────────────────────────────────────────────

/**
 * One network-effect benefit in the closing share block. Kept terse — the argument is carried by the
 * headline and the reframe beside it; these three just make "better for you" concrete (more people who
 * fit, better events, still free). Styled for the dark panel: faint tile, amber glyph, warm-white text.
 */
function ShareBenefit({icon: Icon, title, text}: {icon: IconType; title: string; text: string}) {
  return (
    <li className="flex items-start gap-3.5">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
        <Icon className="h-[18px] w-[18px] text-primary-500" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <div className="text-[15px] font-semibold leading-snug text-white">{title}</div>
        <div className="mt-0.5 text-sm leading-snug text-white/55">{text}</div>
      </div>
    </li>
  )
}

/**
 * The share control on the closing block.
 *
 * Universal, not mobile-only: the block's whole argument is that sharing is easy and in the reader's
 * interest, so a desktop with no button would undercut it. Uses the shared `ShareCTAButton` (mobile share
 * sheet, desktop copy-and-confirm fallback).
 *
 * When the sharer is signed in the link carries their `?referrer=` tag, the same attribution the
 * /referrals page and users.ts already speak — so the shares this block is arguing for actually get
 * credited to them, which is the whole self-interest case. Logged-out visitors (the page is public)
 * have no username, so they share the bare URL.
 */
function ShareCTA() {
  const t = useT()
  const user = useUser()

  const shareUrl = user?.username
    ? `${DEPLOYED_WEB_URL}/?referrer=${user.username}`
    : DEPLOYED_WEB_URL

  // A fragment, not a wrapper. The closing block already lays this row out — `flex-wrap items-center
  // gap-x-5` — so returning the two controls as siblings puts the link beside the button on a wide
  // screen and wraps it underneath on a narrow one, which a nested column of its own could not do
  // without restating the parent's rules.
  return (
    <>
      <ShareCTAButton
        url={shareUrl}
        shareTitle={t('about.share.title', 'Compass — Find your people')}
        // Two paragraphs, and long for a share sheet, deliberately: this is the referral message a person
        // sends their friends, so it carries the same three beats as the ShareStrip below — what Compass
        // is, how it works, and why bringing someone is in the sharer's own interest, not a favour. The
        // closing line is mutual on purpose: the receiver reads it, but the sender has to feel it too.
        shareText={t(
          'about.share.text',
          "Hi! Reaching out about something I care about: Compass, a free directory for finding your people — fully searchable by values, interests, and demographics. No ads, no swiping, no dubious algorithm.\n\nIt gets better with every person who joins. Even if a friend isn't who you're looking for, they bring their world with them — their circles, the thoughtful people you'd never have met otherwise. So whether you join or simply pass it along, you're widening the circle for both of us.",
        )}
        label={t('about.share.button_cta', 'Share Compass')}
        copiedLabel={t('about.share.copied', 'Link copied!')}
      />

      {/* The return path. Everything above argues that sharing is in the reader's own interest; for a
          member who has already done it, the proof of that argument is a page they may not know
          exists. Signed-in only — there is nothing to show someone with no constellation yet. */}
      {user && (
        <Link
          href="/constellation"
          className="text-primary-500 hover:text-primary-400 text-sm underline underline-offset-4"
        >
          {t('about.share.see_yours', 'See who you’ve already brought')}
        </Link>
      )}
    </>
  )
}

/**
 * The closing ask, and the page's visual climax.
 *
 * It is the only dark block, which is what makes it land — so it is also the reason the "One Mission"
 * statement above is tinted-light rather than dark. Two dark full-width panels on one page would read as
 * a repeating band and neither would be the ending.
 *
 * The ask is framed as self-interest rather than charity (it used to close with "thank you for
 * supporting our mission", which asks for a favour). Same argument as the share-compass email: growth is
 * a network effect the sharer benefits from, and even a friend who is not who you're looking for brings
 * their world with them. The headline states the payoff, the paragraph reframes the obvious objection, the benefits
 * make the payoff concrete, and the full-width bar at the base carries the one action.
 */
function ShareStrip() {
  const t = useT()

  const benefits = [
    {
      icon: UserGroupIcon,
      title: t('about.share.benefit.people.title', 'More kindred spirits'),
      text: t(
        'about.share.benefit.people.text',
        'A bigger pool of people who actually share your values.',
      ),
    },
    // {
    //   icon: CalendarDaysIcon,
    //   title: t('about.share.benefit.events.title', 'Richer events'),
    //   text: t(
    //     'about.share.benefit.events.text',
    //     'More people nearby means better meetups and gatherings.',
    //   ),
    // },
    // Dropped: "Better odds of a match". "Match" is swipe-app vocabulary, and Compass positions itself
    // against exactly that — it was the one benefit here that sounded like the thing we aren't.
    // {
    //   icon: HeartIcon,
    //   title: t('about.share.benefit.match.title', 'Better odds of a match'),
    //   text: t(
    //     'about.share.benefit.match.text',
    //     "Every person who joins raises the chance the one you're looking for is already here.",
    //   ),
    // },
    {
      icon: GiftIcon,
      title: t('about.share.benefit.free.title', 'Free, forever'),
      text: t(
        'about.share.benefit.free.text',
        'More contributors keep Compass ad-free and paywall-free.',
      ),
    },
  ]

  return (
    // Was `bg-canvas-950` in both themes. That works in light — espresso 44 36 22 on a 237 232 224
    // page is the strongest contrast on the page — and fails completely in dark, where canvas-950 is
    // 15 13 10 against a 26 22 18 background: the section's one hero element sat eleven values *darker*
    // than the page and had no visible edge at all. A dark theme separates a surface by lifting it
    // toward the light, so in dark this becomes canvas-50, the same elevated token every card here
    // uses. The primary ring and the amber radial are what then rank it above those cards — it stays
    // the loudest block in the section without needing a value the dark ramp doesn't have. White text
    // keeps full contrast either way: canvas-50 is 35 31 26.
    <div
      className={clsx(
        'relative overflow-hidden rounded-3xl px-7 py-10 sm:px-12 sm:py-14',
        'bg-canvas-950 dark:bg-canvas-50',
        // Full-strength accent ring rather than /50. At canvas-50 this slab sits at exactly the value
        // every card on the page uses, so luminance can no longer say "this is the closing block" —
        // the accent has to. Raising the ring costs nothing in brightness and is what separates it
        // from an ordinary card, which a half-opacity edge did not.
        'dark:ring-1 dark:ring-primary-200',
      )}
    >
      {/* Second radial, bottom-left. One glow in a single corner reads as a stray highlight at this
          block's width; a pair on opposing corners reads as the surface being lit, which is the whole
          job now that the background value is doing none of the work. Both are stronger in dark than
          the /20 they carried when the slab was near-black and any warmth on it showed. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-20 w-[440px] h-[440px] rounded-full bg-primary-500/20 dark:bg-primary-500/[0.30] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-28 hidden h-[380px] w-[380px] rounded-full bg-primary-500/[0.14] blur-3xl dark:block"
      />
      <div className="relative">
        <div className="flex items-center gap-2.5 mb-5">
          <MegaphoneIcon className="w-5 h-5 text-primary-500 flex-shrink-0" strokeWidth={1.8} />
          <span className={clsx(eyebrow, 'text-primary-500')}>
            {t('about.final.label', 'Spread the word')}
          </span>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-14">
          <div>
            <h3 className="font-heading text-white text-[24px] font-bold leading-tight tracking-tight mb-4 text-balance">
              {t(
                'about.share.headline',
                'Compass gets better for you with every person you bring.',
              )}
            </h3>
            {/* The reframe, condensed from the share-compass email: the friend you tell need not be who
                you're looking for — they bring their world, and that is the reader's own upside. */}
            <p className="text-white/70 text-base leading-relaxed max-w-xl">
              {/* The old close was "Sharing isn't just a favor to them. It's an investment in your own
                  future connections." — the not-X-but-Y reframe, the single most over-used move in
                  machine-written marketing copy. The claim survives; the construction doesn't. */}
              {t(
                'about.share.reframe.v2',
                "Even if a friend isn't who you're looking for, they bring their world with them: their friends, their circles, the thoughtful people you'd never have met otherwise.",
              )}
            </p>
          </div>

          {/* The inset panel is gone — a framed list inside a framed slab was the same box-in-a-box the
              rest of the page just shed, and the panel was solving "these rows look thin" with a
              container instead of with type. A rule down the left edge separates the column at a
              fraction of the weight, and the extra room goes to the rows themselves. */}
          <ul className="flex flex-col justify-center gap-7 lg:h-full lg:border-l lg:border-white/10 lg:pl-14 dark:lg:border-canvas-200">
            {benefits.map((b) => (
              <ShareBenefit key={b.title} icon={b.icon} title={b.title} text={b.text} />
            ))}
          </ul>
        </div>

        {/* The share action sits at the base of the block, under a hairline rule and spanning the full
            width, so it reads as the block's climax rather than a mid-column element. */}
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-6">
          <ShareCTA />
          {/*<span className="text-white/45 text-sm max-w-xs leading-snug">*/}
          {/*  {t(*/}
          {/*    'about.share.kicker',*/}
          {/*    "One share, one person — that's how a community like this is built.",*/}
          {/*  )}*/}
          {/*</span>*/}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function About() {
  const t = useT()
  const hasTestimonials = useHasTestimonials()

  // The two cards that support the spotlight claim above them. "Get Notified About Searches" used to be
  // the middle of these three; it is now the spotlight block, so what is left is the pair that sets it
  // up (you can search for anything) and the one that follows from it (what we match on).
  const searchFeatures: FeatureCardProps[] = [
    // {
    //   icon: MagnifyingGlassIcon,
    //   title: t('about.block.keyword.title', 'Keyword Search the Database'),
    //   text: t(
    //     'about.block.keyword.text',
    //     '"Meditation", "Hiking", "Neuroscience", "Nietzsche". Access any profile and get niche.',
    //   ),
    // },
    {
      icon: SparklesIcon,
      title: t('about.block.personality.title', 'Personality-Centered'),
      text: t('about.block.personality.text', 'Values and interests first, photos are secondary.'),
    },
    {
      icon: GiftIcon,
      title: t('about.block.free.title', 'Completely Free'),
      // Three parallel "-free" fragments was the tightest instance of the page's triple-negative tic.
      text: t(
        'about.block.free.text.v2',
        'No subscription and no ads. There is no paid tier to upgrade to.',
      ),
    },
    // {
    //   icon: GlobeAltIcon,
    //   // Its own keys. This card was borrowing `about.block.vision.*`, whose fr/de values are the longer
    //   // Linux / Wikipedia / Firefox sentence — so French and German readers saw that sentence on a card
    //   // whose English reads "Built by the people who use it". The vision line now has that key back, in
    //   // the mission section where it belongs, and this card says only what it says.
    //   title: t('about.block.public_good.title', 'Digital Public Good'),
    //   text: t(
    //     'about.block.public_good.text',
    //     'Built by the people who use it, for the benefit of everyone.',
    //   ),
    // },
  ]

  // The "Democratic" card used to sit here. Its claim now opens the "How a decision gets made"
  // section below, next to the vote that proves it — a card asserting the same thing one screen
  // above its own evidence was reading as a duplicate. Same translation keys, moved verbatim, so
  // the fr/de strings carry over. See docs/marketing-visuals.md (A1).
  //
  // "One Mission" has likewise been promoted out of this grid into the statement block below, leaving
  // "Vision" to support it rather than to sit alongside it as an equal.

  const helpCards: HelpCardProps[] = [
    {
      icon: LightBulbIcon,
      id: 'give-suggestions-or-contribute',
      title: t('about.suggestions.title', 'Give Suggestions or Contribute'),
      // "Every idea matters." dropped: a reassurance cliché, and the sixth one-line closer on the page.
      text: t(
        'about.suggestions.text.v2',
        'Give suggestions or let us know you want to help through this form.',
      ),
      buttonLabel: t('about.suggestions.button', 'Suggest Here →'),
      buttonUrl: formLink,
      // buttonPrimary: true,
    },
    {
      icon: CodeBracketIcon,
      id: 'share',
      title: t('about.dev.title', 'Develop the App'),
      text: t(
        'about.dev.text',
        'The full source code and instructions are available on GitHub. PRs welcome.',
      ),
      buttonLabel: t('about.dev.button', 'View Code →'),
      buttonUrl: githubRepo,
    },
    {
      icon: ChatBubbleLeftRightIcon,
      id: 'join-chats',
      title: t('about.join.title', 'Join the Community'),
      text: t(
        'about.join.text',
        "Let's shape the platform together. Share ideas, give feedback, meet other builders.",
      ),
      buttonLabel: t('about.join.button', 'Join the Discord →'),
      buttonUrl: discordLink,
    },
    {
      icon: HeartIcon,
      id: 'donate',
      title: t('about.donate.title', 'Donate'),
      // "Every contribution keeps the lights on" is a charity cliché that the "What it costs" block above
      // makes redundant and slightly evasive. Same ask, with the receipt.
      text: t(
        'about.donate.text.v2',
        '${spent} spent, ${donated} donated, no salaries. Every expense is published before we ask again.',
        {spent: FINANCIALS.spent, donated: FINANCIALS.donated},
      ),
      buttonLabel: t('about.donate.button', 'Donation Options →'),
      buttonUrl: '/support',
    },
  ]

  return (
    <PageBase trackPageView={'about'}>
      <SEO
        title={t('about.seo.title', 'About')}
        description={t('about.seo.description', OG_DESCRIPTION)}
        url="/about"
      />

      {/* `max-w-6xl` rather than `max-w-4xl`: at 1900px the old column filled about half the available
          area and left the rest empty beige. Prose inside is still capped at a reading measure, so the
          wider container buys layout room without producing 1100px-long lines. */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-24">
        {/* ── Page header ── */}
        <div className="mb-12">
          <p className={clsx(eyebrow, 'text-primary-700 mb-4')}>
            {t('about.eyebrow', 'About Compass')}
          </p>
          {/* "Why choose" is a shopping-comparison frame on a page whose job is evidence, and it argued
              Compass was better before saying what it is — which is precisely the reader arriving cold
              from a press article. New keys rather than reworded ones, since fr/de resolve ahead of these
              fallbacks. */}
          <h1 className="text-[clamp(34px,5vw,56px)] text-ink-900 tracking-tight leading-[1.08] mb-5 max-w-3xl text-balance">
            {t('about.title.v2', 'What Compass is, and how it works.')}
          </h1>
          <p className="text-lg sm:text-xl text-ink-700 max-w-2xl leading-relaxed">
            {/* The second sentence was three parallel past participles ("Built by…, funded by…,
                governed by…"), which is the most recognisable machine-written cadence there is. Same
                three facts, as ordinary clauses with real subjects. */}
            {t(
              'about.subtitle.v3',
              'A free, public directory of people looking for depth: friends, partners, or collaborators. Volunteers build it, donations pay for it, and its members decide where it goes.',
            )}
          </p>
        </div>

        {/* Opens the page with something that is not a card — the run of identical bordered tiles
            below is what made this page read as flat. Renders nothing if the stats call comes back
            empty, in which case the header simply meets the feature grid as it did before. */}
        <StatBand />

        {/* ── How it works ──
            Ahead of the feature blocks, because the block below it is step three of the loop and the page
            never described steps one, two and four at all. */}
        <Section>
          <SectionLabel>{t('about.how.label', 'How it works')}</SectionLabel>
          <Reveal>
            <HowItWorks />
          </Reveal>
        </Section>

        {/* ── Features ── */}
        <Section>
          <SectionLabel>{t('about.features.label', 'What makes us different')}</SectionLabel>

          {/* The claim and the recording that proves it are now the same block (A4). They used to be a
              full screen apart, which is the one arrangement that stops the clip from doing any work;
              then they shared a row as equals, which still styled the strongest claim on the page as one
              tile of three. The clip and posters are not in the repo; web/scripts/fetch-media.mjs pulls
              them from R2 at build time, so a deploy without them fails loudly rather than shipping an
              empty frame. */}
          <Reveal>
            <NotifySpotlight
              title={t('about.block.notify.title', 'Get Notified About Searches')}
              text={t(
                'about.block.notify.text',
                "No need to constantly check the app! We'll contact you when new users fit your searches.",
              )}
            />
          </Reveal>

          {/* Wider gutters and a much bigger gap above, now that the tiles have no borders: with the
              frames gone it is the space that has to do the separating, and card-era gaps (16-20px)
              would have let the three columns run together. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10 mt-14">
            {searchFeatures.map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <FeatureCard icon={f.icon} title={f.title} text={f.text} />
              </Reveal>
            ))}
          </div>
        </Section>

        {/* ── Who's here ── */}
        <Section>
          <SectionLabel>{t('about.who.label', 'Who’s here')}</SectionLabel>
          <Reveal>
            <WhosHere />
          </Reveal>
        </Section>

        {/* ── What members say ── */}
        {/* The whole section is gated, heading and spacing included, so it cannot appear as an empty
            promise on a page that is otherwise all claims. */}
        {hasTestimonials && (
          <Section>
            <SectionLabel>{t('about.testimonials.label', 'What members say')}</SectionLabel>
            <Reveal>
              <TestimonialsTeaser />
            </Reveal>
          </Section>
        )}

        {/* ── What's public ── */}
        <Section>
          <SectionLabel>{t('about.public.label', 'What’s public')}</SectionLabel>
          <Reveal>
            <ProseBlock
              icon={EyeIcon}
              label={t('about.public.eyebrow', 'Your profile')}
              // "That's the point — and it's a switch." was a two-clause reversal ending on a
              // one-word reveal. The heading now just says the thing; `VisibilityToggleMock` beside
              // it is the switch, so the sentence does not have to perform it.
              title={t(
                'about.public.title.v2',
                'Your profile is a web page, and you can turn it off.',
              )}
              visual={<VisibilityToggleMock />}
            >
              <p>
                {t(
                  'about.public.p1',
                  'Compass is a directory, so by default your profile is a public page that anyone can read and search engines can index. More visibility means your people can find you.',
                )}
              </p>
              <p>
                {t(
                  'about.public.p2.v2',
                  'If that isn’t what you want, one tap makes your profile members-only. Logged-out visitors see nothing, and we tell search engines not to index it. You can switch back whenever you like.',
                )}
              </p>
              {/*<p>*/}
              {/*  {t(*/}
              {/*    'about.public.p3',*/}
              {/*    'The rest is yours too: hide profiles you’d rather not see, block someone outright, report them to moderators, download everything we hold about you, or delete your account and its data for good. Messages are encrypted at rest. Nothing you write is sold — there is nobody to sell it to.',*/}
              {/*  )}*/}
              {/*</p>*/}
            </ProseBlock>
          </Reveal>
        </Section>

        {/* ── Mission ── */}
        <Section>
          <SectionLabel>{t('about.mission.label', 'Why we exist')}</SectionLabel>
          <Reveal>
            <MissionStatement
              title={t('about.block.mission.title', 'One Mission')}
              text={t(
                'about.block.mission.text',
                'Our only mission is to create more genuine human connections, and every decision must serve that goal.',
              )}
            />
          </Reveal>
          {/* Standalone rather than a grid cell: it is the only card in this section now that "One
              Mission" has been promoted, and a one-item grid is just an indirection.
              Restored from the home page, where it was the closing quote. It is a claim a first-time
              visitor cannot verify, sitting where they most needed a concrete reason; next to a mission
              statement on the reference page it reads as positioning instead of as self-congratulation.
              The `about.block.vision.*` keys already carry this exact sentence in fr and de — which is why
              the "Digital Public Good" card above had to be given keys of its own, since it was borrowing
              these and therefore rendering the Linux line to every French and German reader. */}
          <Reveal className="mt-4 sm:mt-5">
            <FeatureCardWide
              icon={GlobeAltIcon}
              title={t('about.block.vision.title', 'Vision')}
              text={t(
                'about.block.vision.text',
                'Compass is to human connection what Linux, Wikipedia, and Firefox are to software and knowledge: a public good built by the people who use it, for the benefit of everyone.',
              )}
            />
          </Reveal>
        </Section>

        {/* ── How a decision gets made ── */}
        <Section>
          <SectionLabel>{t('about.vote.label', 'How a decision gets made')}</SectionLabel>

          {/* The section used to be a ballot with no explanation of the machinery behind it. */}
          {/*<p className="mb-5 max-w-3xl text-base leading-relaxed text-ink-600">*/}
          {/*  {t(*/}
          {/*    'about.vote.intro',*/}
          {/*    'Compass runs on a written constitution. Members who contribute — five hours of work, or $20 a year — can become voting members; new administrators need a unanimous vote of the current ones. Proposals are public, ballots are public, and the outcome binds the project. The vote below is a real one.',*/}
          {/*  )}*/}
          {/*</p>*/}

          <Reveal>
            <VoteEvidence />
          </Reveal>

          {/* The turnout tension, named rather than managed. Twelve voters is a small number and hiding it
              would cost more than it saves on the one page that has just promised the reader every claim
              is checkable. */}
          {/*<p className="mt-4 max-w-3xl text-base leading-relaxed text-ink-600">*/}
          {/*  {t(*/}
          {/*    'about.vote.kicker',*/}
          {/*    'Twelve voters is a small turnout. We would rather show you the real one than a bigger number that isn’t real.',*/}
          {/*  )}*/}
          {/*  <span className="mt-2 flex flex-wrap gap-x-5 gap-y-2">*/}
          {/*    {[*/}
          {/*      {href: '/constitution', label: t('about.vote.constitution', 'The constitution →')},*/}
          {/*      {href: '/vote', label: t('about.vote.votes', 'Open votes →')},*/}
          {/*      {href: '/members', label: t('about.vote.members', 'Voting members →')},*/}
          {/*    ].map((l) => (*/}
          {/*      <Link*/}
          {/*        key={l.href}*/}
          {/*        href={l.href}*/}
          {/*        className="text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"*/}
          {/*      >*/}
          {/*        {l.label}*/}
          {/*      </Link>*/}
          {/*    ))}*/}
          {/*  </span>*/}
          {/*</p>*/}

          <Reveal>
            {/* Same card-era gap as everywhere else on this page: 16-20px only separated these two
                while each had a border and its own padding. Unframed they ran together as one block. */}
            <RepoActivity className="mt-16 sm:mt-20" />
          </Reveal>
        </Section>

        {/* ── Who's behind it, what it costs, where it runs ── */}
        <Section>
          <SectionLabel>{t('about.who_runs.label', 'Who runs it')}</SectionLabel>

          {/* Card-era gaps were 16-20px, which only worked because each block had a border and 32px of
              its own padding holding it apart from the next. With the frames gone the gap *is* the
              separation, so it grows to roughly what the padding and border used to add up to. */}
          <div className="grid gap-16 sm:gap-20">
            <Reveal>
              <ProseBlock
                icon={UserGroupIcon}
                label={t('about.founder.eyebrow', 'Who’s behind it')}
                title={t('about.founder.title', 'Somebody has to start these things.')}
                links={[{href: '/Martin', label: t('about.founder.link', 'Martin’s profile →')}]}
                visual={<FounderPhoto />}
              >
                <p>
                  {t(
                    'about.founder.p1',
                    "I'm Martin Braquet, an engineer and researcher from Belgium. I started Compass after years of living across Europe, the US, and India and finding that the connections that mattered most to me were the hardest to manifest in real life. I still steward and actively improve the project, but the constitution puts direction in the members’ hands.",
                  )}
                </p>
                {/*<p>{t('about.founder.p2', 'Everyone who has built Compass is a volunteer.')}</p>*/}
              </ProseBlock>
            </Reveal>

            <Reveal delay={70}>
              <ProseBlock
                icon={BanknotesIcon}
                label={t('about.costs.eyebrow', 'What it costs')}
                title={t('about.costs.title', 'Our entire budget.')}
                links={[
                  {href: '/financials', label: t('about.costs.books', 'See the books →')},
                  {href: '/support', label: t('about.costs.donate', 'Donate →')},
                ]}
                visual={<CostsChart />}
                // Middle of three: the artwork swaps to the left so the run alternates rather than
                // repeating one silhouette three times.
                flip
              >
                {/* Figures come from `FINANCIALS` so this block, the home strip and /financials cannot
                    quote three different numbers for the one claim the page is staking itself on. */}
                <p>
                  {t(
                    'about.costs.p1.v2',
                    'Our expenses only come from hosting, infrastructure, and domains. We cover them with donations or the founder’s pocket. Nobody draws a salary and every line of it is published.',
                    {
                      spent: FINANCIALS.spent,
                      donated: FINANCIALS.donated,
                      deficit: FINANCIALS.deficit,
                    },
                  )}
                </p>
              </ProseBlock>
            </Reveal>

            <Reveal delay={140}>
              <ProseBlock
                icon={DevicePhoneMobileIcon}
                label={t('about.platforms.eyebrow', 'Where it runs')}
                title={t('about.platforms.title', 'Browser, Android, and iPhone.')}
                links={[
                  {
                    href: ANDROID_APP_URL,
                    label: t('about.platforms.android', 'Android app →'),
                    external: true,
                  },
                ]}
                visual={<PlatformGlyphs />}
              >
                <p>
                  {t(
                    'about.platforms.p1',
                    'The web app works in any browser. There’s an Android app on Google Play. On iPhone, add Compass to your home screen from Safari and it behaves like an app. The interface is in English, French and German, and there is a public API.',
                  )}
                </p>
              </ProseBlock>
            </Reveal>
          </div>
        </Section>

        {/* ── Press ──
            Its own section rather than folded into "Where it runs": that block is about platforms, this
            one is proof a stranger can check outside the site entirely. Unlike home's one-line mention,
            this is the "full" version the outlets themselves get named with — real logos, fetched from
            each outlet's own official site (dhnet.be, lavenir.net, matele.be, rcf.be), not a third-party
            logo aggregator or a Wikipedia fair-use scan. */}
        <Section>
          <SectionLabel>{t('about.press.label', 'Press')}</SectionLabel>
          {/* Unboxed — `PressLogos` renders four framed logo tiles, so the card around them was a
              fifth frame containing four others. */}
          <div>
            <p className="mb-6 max-w-2xl text-base leading-relaxed text-ink-600">
              {t(
                'about.press.text',
                'Compass has been covered by RCF, La DH, L’Avenir and Matélé.',
              )}
            </p>
            <PressLogos />
            <Link
              href="/press"
              className="mt-6 inline-flex w-fit items-center text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
            >
              {t('about.press.link', 'Read the coverage →')}
            </Link>
          </div>
        </Section>

        {/* ── Help ── */}
        <Section>
          <SectionLabel>{t('about.help.label', 'Help Compass grow')}</SectionLabel>

          {/* Growth line first, share block second: the momentum is what motivates the ask. Show that
              Compass is growing, then invite the reader to add to it — the same order as the
              share-compass email, which opens with the member count before asking. The share block then
              closes the section on the action rather than on a passive chart. */}
          {/*<MemberGrowth />*/}

          {/* ── Share strip ── */}
          <div className="mt-5">
            <Reveal>
              <ShareStrip />
            </Reveal>
          </div>

          {/* One primary ask leads, then the three lighter ones. "Give Suggestions or Contribute" is
              the contribution we most want, so it is the full-width featured card with the filled CTA;
              the rest sit below as a quieter row of three with text-link actions. */}
          {/* Card-era gaps throughout this run (16-20px) only held because each item had a border and
              its own padding. With the frames gone the space does the separating: a big step down from
              the slab to the featured ask, and wider gutters between the three below it. */}
          <Reveal className="mt-16 sm:mt-20">
            <FeaturedHelpCard {...helpCards[0]} />
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-10 gap-y-10 mt-14">
            {helpCards.slice(1).map((card, i) => (
              <Reveal key={card.id} delay={i * 70}>
                <HelpCard {...card} />
              </Reveal>
            ))}
          </div>
        </Section>
      </div>
    </PageBase>
  )
}
