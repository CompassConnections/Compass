import clsx from 'clsx'
import {discordLink, FINANCIALS, githubRepo} from 'common/constants'
import {partition} from 'lodash'
import Link from 'next/link'
import {ComponentType, ReactNode, SVGProps, useEffect, useRef} from 'react'
import {FaDiscord, FaGithub} from 'react-icons/fa'
import {ProfileSpotlights} from 'web/components/home/profile-spotlights'
import {SearchDemo} from 'web/components/home/search-demo'
import {SignUpButton} from 'web/components/nav/sidebar'
import {MemberGrowth} from 'web/components/widgets/charts'
import {DistRow} from 'web/components/widgets/stat-distribution'
import {Section, surface, surfaceHover} from 'web/components/widgets/surface'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {CORE_AGE_BUCKETS, groupShareOf, Share, shareOf} from 'web/lib/marketing-stats'

// ─── Types ────────────────────────────────────────────────────────────────────

type IconType = ComponentType<SVGProps<SVGSVGElement>>

/**
 * Keyboard focus ring for every link and button on this page. The browser default outline is the
 * fallback otherwise — inconsistent across browsers and nearly invisible on the cream canvas. The
 * offset colour matches the page so the ring reads as a separate outline, not a thicker border.
 */
const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-100'
/**
 * A full-width band of colour for the closing sections, in place of a card. Sections are told apart by
 * a change of background with hard edges and no gap between them, rather than by frames, radii and
 * shadows on a shared page colour. The band bleeds past the page's side padding; its content keeps the
 * same `max-w-6xl` column as everything above it.
 */
function Band({className, children}: {className?: string; children: ReactNode}) {
  return (
    // The bleed cancels three nested paddings: this page's `px-4`, the page shell's `px-3 sm:px-6`
    // around it and `main`'s `xl:px-2` — 28px, then 40px from `sm`, then 48px from `xl`.
    <section
      className={clsx(
        'self-stretch py-16 sm:py-20',
        '-mx-7 px-7 sm:-mx-10 sm:px-10 xl:-mx-12 xl:px-12',
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  )
}

/**
 * The hero's two buttons, built as a pair: same height, padding, radius and weight, one filled and one
 * outlined. `rounded-lg` is the button radius on this page — tighter than the cards' `rounded-2xl` and
 * up, so a control never reads as a small card. The primary carries a border in its own colour so the
 * two come out the same height.
 */
const heroPrimary =
  'items-center justify-center px-6 py-3 rounded-lg border border-cta bg-cta text-white font-semibold text-body hover:bg-cta-hover hover:border-cta-hover transition-colors duration-150'
/**
 * A 1px `ink-800` outline (about 10:1 on the canvas) rather than the old 2px `canvas-200` one, which
 * was about 1.1:1 and read as a disabled button. Hover tints the fill instead of changing colour, so it
 * does not compete with the amber headline above it.
 */
const heroSecondary =
  'inline-flex items-center justify-center px-6 py-3 rounded-lg border border-ink-800 bg-transparent text-ink-900 font-semibold text-body hover:bg-ink-900/5 transition-colors duration-150'

/** Same ring on the always-dark open-source strip, where the offset has to match the espresso. */
const focusRingDark =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-950'

interface FeatureCardProps {
  icon: IconType
  title: string
  text: string
}

interface SocialAvatarProps {
  letter: string
  gradient: string
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// function EyebrowBadge({children}: {children: React.ReactNode}) {
//   return (
//     <div className="inline-flex items-center gap-2 bg-canvas-200 text-primary-700 ring-1 ring-primary-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-8 animate-fade-up">
//       {/*<span className="w-2 h-2 rounded-full bg-[#6B8F71] inline-block" />*/}
//       {children}
//     </div>
//   )
// }

// Unused since the three feature tiles became the `ClaimBlock`s below, and kept for the same reason their
// copy is kept commented in `LoggedOutHome`: bringing a short-card row back is then an edit rather than a
// rewrite. /about still renders its own copy of this shape.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FeatureCard({icon: Icon, title, text}: FeatureCardProps) {
  return (
    <div className={clsx(surface, surfaceHover, 'h-full p-6 sm:p-7')}>
      <div className="w-11 h-11 rounded-xl bg-primary-100 ring-1 ring-primary-200 flex items-center justify-center mb-5">
        <Icon className="w-5 h-5 text-primary-700" strokeWidth={1.8} />
      </div>
      <h3 className="font-bold text-title text-ink-900 mb-2.5">{title}</h3>
      <p className="text-body text-ink-800">{text}</p>
    </div>
  )
}

// Kept for the commented-out avatar row in SocialProof below: the gradient initials were fabricated
// social proof sitting next to the word "real", so they are disabled rather than deleted.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SocialAvatar({letter, gradient}: SocialAvatarProps) {
  return (
    <div
      className="w-8 h-8 rounded-full border-2 border-canvas-50 -ml-2 first:ml-0 flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{background: gradient}}
    >
      {letter}
    </div>
  )
}

/**
 * The line under the hero CTAs.
 *
 * It used to read "Joined by X real people worldwide" — a *size* claim, in the one place on the site
 * where a visitor is reflexively comparing Compass to apps with millions of users, which is the comparison
 * it loses. It now reports activity instead: conversations and messages answer the question actually being
 * asked this early ("is anyone here, does anyone reply?") without stating how small the pool is. The
 * membership figure appears exactly once on this page, much further down, attached to what to do about it.
 *
 * The conversations figure has since been swapped back for the member count, as a plain number alongside
 * messages sent rather than the old "real people worldwide" pitch.
 *
 * Live, and renders nothing at all when the stats call comes back empty — same rule as `StatBand`.
 */
function SocialProof() {
  const t = useT()
  const {data} = useAPIGetter('stats', {})

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const avatars: SocialAvatarProps[] = [
    {letter: 'S', gradient: 'linear-gradient(135deg, #C17F3E, #8B5E3C)'},
    {letter: 'R', gradient: 'linear-gradient(135deg, #6B8F71, #4A7055)'},
    {letter: 'T', gradient: 'linear-gradient(135deg, #8B5E3C, #6B3E22)'},
    {letter: 'L', gradient: 'linear-gradient(135deg, #C17F3E, #D4955A)'},
  ]

  if (!data?.profiles || !data?.messages) return null

  return (
    <div className="flex items-center gap-3 text-ink-800 text-caption">
      {/*<div className="flex">*/}
      {/*  {avatars.map((av) => (*/}
      {/*    <SocialAvatar key={av.letter} {...av} />*/}
      {/*  ))}*/}
      {/*</div>*/}
      {/* One sentence rather than two counts joined by a middle dot. The placeholders are split out
          of the translated string rather than interpolated, so each locale can put the numbers where
          its grammar wants them and they still render bold. */}
      <span>
        {t('home.proof.line', '{members} members have sent {messages} messages.')
          .split(/(\{members\}|\{messages\})/)
          .map((part, i) =>
            part === '{members}' ? (
              <strong key={i} className="text-ink-900">
                {data.profiles.toLocaleString()}
              </strong>
            ) : part === '{messages}' ? (
              <strong key={i} className="text-ink-900">
                {data.messages.toLocaleString()}
              </strong>
            ) : (
              part
            ),
          )}
      </span>
    </div>
  )
}

/**
 * The evidence for the Who's here paragraph: one bar per claim it makes — age, education, religion, diet
 * and what people are looking for — so every adjective in the prose has a number beside it. Each bar is a
 * single share (the matching members over those who answered), not a ranked distribution.
 *
 * Was a compact "looking for" bar chart, the one distribution the prose only gestured at.
 *
 * Draws with `DistRow`, the exact bar /stats uses for every distribution — one bar vocabulary everywhere
 * rather than a second one invented for this card. It departs from `DistRow`'s usual call in one way: width
 * here is the raw percentage (`widthPct = pct`), not normalised to the leading item, and `rank` is left at
 * its default of 0 so there's no opacity fade. With only three rows and no item near 100%, a direct
 * percentage bar is the more literal read and there is no ranking-legibility problem to solve.
 *
 * `pref_relation_styles` is multi-select, so percentages are each value's own count against the shared base
 * of distinct respondents — they will not sum to 100%, which is expected, not a bug. See
 * `web/lib/marketing-stats.ts`.
 */
function CommunityFacts({facts}: {facts: {label: string; share: Share}[]}) {
  // const t = useT()

  if (!facts.length) return null

  return (
    // Frame copied from `MemberGrowth` rather than specced independently — same width, radius, padding
    // and border. That card sits one block above this one in the same column, close enough that any
    // difference between the two reads as a misaligned edge rather than as a distinction. `MemberGrowth`
    // is the one that can't move (/about draws it too), so this is the side that matches.
    <div className="mt-8 rounded-2xl bg-canvas-50 p-5 sm:p-7 lg:mt-0 lg:w-96 lg:flex-shrink-0">
      {/* Each row has its own denominator (members who answered that question), so the caption says
          so rather than implying one population behind every bar. */}
      {/*<p className="mb-4 text-caption font-semibold text-ink-700">*/}
      {/*  {t('home.who.chart.title.v2', 'Of members who answered')}*/}
      {/*</p>*/}
      <div className="flex flex-col gap-3">
        {facts.map((f) => (
          <DistRow
            key={f.label}
            label={f.label}
            pct={Math.max(1, f.share.pct)}
            widthPct={Math.max(1, f.share.pct)}
            labelClassName="w-36 sm:w-40"
          />
        ))}
      </div>
    </div>
  )
}

/**
 * "Who's here" — the section the page was most missing.
 *
 * Every other block on this page describes a *mechanism*; this one describes the *population*, which is the
 * sharpest thing Compass has to say and was said nowhere. It is deliberately composition rather than
 * headcount: a club reads the same at 726 members as at 7,000, whereas a total only shrinks in the reader's
 * estimation the more places it appears.
 *
 * Percentages come only from single-select fields — see `web/lib/marketing-stats.ts` for why summing
 * multi-select counts against their base would overstate. The multi-select claims here name their leading
 * answers instead, which is true whatever the overlap. `pref_relation_styles` gets its own chart rather than
 * a third prose clause — see `LookingForChart` — which also gives the card something to fill the width a
 * short paragraph leaves empty on wide screens.
 */
function WhosHere() {
  const t = useT()
  const {data} = useAPIGetter('stats', {})

  const age = shareOf(data, 'age', CORE_AGE_BUCKETS)
  const degree = shareOf(data, 'education_level', ['bachelors', 'masters', 'doctorate'])
  // const manRatio = data?.genderRatio?.male
  // const looking = topOf(data, 'pref_relation_styles', 3)
  const graduate = shareOf(data, 'education_level', ['masters', 'doctorate'])
  const secular = groupShareOf(data, 'secular')
  const plantBased = groupShareOf(data, 'plantBased')
  const seekingRelationship = groupShareOf(data, 'seekingRelationship')

  // One row per claim in the paragraph, in the order the paragraph makes them. A row whose figure is
  // missing (too few answers to publish) is dropped rather than shown empty.
  const facts = [
    {label: t('home.who.fact.age', 'Aged 25–45'), share: age},
    {label: t('home.who.fact.graduate', 'Master’s or higher'), share: graduate},
    {label: t('home.who.fact.secular', 'Atheist or agnostic'), share: secular},
    {label: t('home.who.fact.plant', 'Vegan or vegetarian'), share: plantBased},
    {label: t('home.who.fact.relationship', 'Seeking a relationship'), share: seekingRelationship},
  ].filter((f): f is {label: string; share: Share} => !!f.share)

  // Nothing to say without the two figures the paragraph is built around; a version of this section with
  // holes in it would read worse than no section.
  if (!age || !degree) return null

  return (
    // The neutral `surface`, not the page itself. This block and `StageBlock` above it are the same
    // shape — prose left, one stat card right — and the run used to read tinted card / bare page / dark
    // slab, three container weights with no progression between them, which made this one look
    // unstyled rather than deliberately quieter. `surface` keeps the gradient reserved for `StageBlock`
    // (the page's one gradient) while still giving this a frame, so the sequence steps tinted → plain →
    // dark. Padding is `StageBlock`'s to the pixel: two instances of one pattern set 8px apart read as
    // a ragged edge, not as rhythm.
    // Now a band on the plain page colour, between the tinted `StageBlock` band and the dark strip.
    <Band>
      <div className="lg:flex lg:items-start lg:justify-between lg:gap-12">
        <div className="min-w-0">
          <h2 className="font-heading text-ink-900 text-headline tracking-tight mt-0 mb-5 text-balance">
            {t('home.who.title', 'Our transparent community.')}
          </h2>
          <p className="text-body text-ink-800 max-w-2xl">
            {/* "No generic adjectives." was one of six one-line mic-drops across the two pages. The
                sentence that follows is the demonstration; announcing it first was the tell. */}
            {t(
              'home.who.intro.v2',
              'Our members tend to be between 25 and 45, highly educated, secular, and more plant-based than average. Most are looking for friends or a long-term partner.',
            )}
          </p>
          <Link
            href="/stats"
            className={clsx(
              'mt-6 inline-flex w-fit items-center rounded-sm text-body font-semibold text-primary-700 transition-colors hover:text-primary-800',
              focusRing,
            )}
          >
            {t('home.who.link', 'See the full breakdown')}
          </Link>
        </div>
        <CommunityFacts facts={facts} />
      </div>
    </Band>
  )
}

/**
 * The visual beside "A profile here takes twenty minutes to write, not two." — the field list the prose
 * already names, as chips instead of a sentence a reader has to parse to see the shape of what a profile
 * holds. Static: this is the product's schema, not a number that can drift, so there's nothing to fetch.
 */
function FieldChips() {
  const t = useT()

  const fields = [
    // t('home.profile.chip.bio', 'Bio'),
    // t('home.profile.chip.prompts', 'Prompts'),
    t('home.profile.chip.age', 'Age'),
    t('home.profile.chip.location', 'Location'),
    t('home.profile.chip.causes', 'Causes'),
    t('home.profile.chip.interests', 'Interests'),
    t('home.profile.chip.politics', 'Politics'),
    t('home.profile.chip.religion', 'Religion'),
    t('home.profile.chip.diet', 'Diet'),
    // t('home.profile.chip.languages', 'Languages'),
    // t('home.profile.chip.education', 'Education'),
    t('home.profile.chip.personality', 'Personality'),
    // t('home.profile.chip.looking', 'Looking for'),
  ]

  return (
    <div className="mt-8 rounded-xl bg-canvas-50 ring-1 ring-canvas-200 p-5 sm:p-6 lg:mt-0 lg:w-96 lg:flex-shrink-0">
      <div className="flex flex-wrap gap-2">
        {fields.map((f) => (
          <span
            key={f}
            className="rounded-full border border-canvas-300 bg-canvas-0 px-3 py-1 text-caption text-ink-700"
          >
            {f}
          </span>
        ))}
      </div>
      {/*<p className="mt-4 text-caption text-ink-700">*/}
      {/*  {t('home.profile.chips.caption', 'Every field is optional.')}*/}
      {/*</p>*/}
    </div>
  )
}

/**
 * The visual beside "One algorithm. You set the weights, and you can read the source." — a worked example
 * of the three inputs the prose describes, in the same pill vocabulary the real compatibility-question UI
 * uses (`web/components/answers/compatibility-questions-display.tsx`: an amber pill for the user's own
 * answer, neutral outline pills for what they'd accept, amber again for importance). Reusing that exact
 * styling rather than inventing a new one means this mock reads as "what the product actually looks like,"
 * not as decoration. The 92% is a worked example, not a live figure — nobody's real score, so nothing here
 * needs to be fetched or can go stale.
 */
function ScoreDiagram() {
  const t = useT()

  return (
    <div className="mt-8 rounded-xl bg-canvas-50 ring-1 ring-canvas-200 p-5 sm:p-6 lg:mt-0 lg:w-96 lg:flex-shrink-0">
      <div className="flex flex-col gap-3">
        {/* Your answer and what you'd accept side by side: they are the two halves of one comparison,
            and the wider card has the room. */}
        {/* `auto` / `1fr` rather than two equal halves: "Your answer" holds one pill, so it takes only
            its own width and "You'd accept" gets the rest — enough to keep both pills on one line on a
            phone. */}
        <div className="grid grid-cols-[auto_1fr] gap-6">
          <div>
            <div className="mb-1 text-caption text-ink-700">
              {t('home.score.mock.you', 'Your answer')}
            </div>
            <span className="inline-flex w-fit rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-caption text-primary-700">
              {t('home.score.mock.you_value', 'Vegetarian')}
            </span>
          </div>
          <div>
            <div className="mb-1 text-caption text-ink-700">
              {t('home.score.mock.accept', "You'd accept")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full border border-canvas-300 bg-canvas-0 px-3 py-1 text-caption text-ink-700">
                {t('home.score.mock.accept1', 'Vegetarian')}
              </span>
              <span className="rounded-full border border-canvas-300 bg-canvas-0 px-3 py-1 text-caption text-ink-700">
                {t('home.score.mock.accept2', 'Vegan')}
              </span>
            </div>
          </div>
        </div>
        {/* Label and value on one row: a single value under its own label read as a second
            heading rather than as a setting. */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-caption text-ink-700">
            {t('home.score.mock.weight', 'How much it matters')}
          </div>
          <span className="inline-flex w-fit rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-caption text-primary-700">
            {t('home.score.mock.weight_value', 'Very important')}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-canvas-200 pt-4">
        {/* Sentence case: "Match" labels the number beside it, so unlike the eyebrows it stays. */}
        <span className="text-caption font-semibold text-ink-700">
          {t('home.score.mock.result', 'Match')}
        </span>
        <span className="text-lead font-bold text-primary-700">92%</span>
      </div>
    </div>
  )
}

/**
 * The visual beside "The shortest message you can send is 200 characters." — the composer's two states,
 * rather than a description of them: a three-word opener stuck under a greyed-out Send button, and a real
 * one that clears the gate. Dramatizing the actual UI behavior is more convincing than the sentence above
 * it, which is describing exactly this. Both messages and the counts are illustrative copy, not a real
 * conversation — nothing here is a claim about who sent what.
 */
function MessageComposerMock() {
  const t = useT()

  return (
    <div className="mt-8 rounded-xl bg-canvas-50 ring-1 ring-canvas-200 p-5 sm:p-6 lg:mt-0 lg:w-96 lg:flex-shrink-0">
      <div className="rounded-lg border border-canvas-300 bg-canvas-0 p-3">
        <p className="text-caption italic text-ink-600">{t('home.message.mock.hey', '“Hey”')}</p>
      </div>
      <div className="mt-2 flex items-center justify-between text-caption">
        <span className="text-ink-700">{t('home.message.mock.hey_count', '3 / 200')}</span>
        <span className="rounded-full bg-canvas-200 px-3 py-1 font-semibold text-ink-400">
          {t('home.message.mock.send', 'Send')}
        </span>
      </div>
      {/*<div className="mt-4 rounded-lg border border-primary-200 bg-primary-50 p-3">*/}
      {/*  <p className="text-caption text-ink-700">*/}
      {/*    {t(*/}
      {/*      'home.message.mock.real',*/}
      {/*      '“I saw you also read about stoicism — what got you into it?”',*/}
      {/*    )}*/}
      {/*  </p>*/}
      {/*</div>*/}
      {/*<div className="mt-2 flex items-center justify-between text-caption">*/}
      {/*  <span className="font-semibold text-primary-700">*/}
      {/*    {t('home.message.mock.real_count', '214 / 200')}*/}
      {/*  </span>*/}
      {/*  <span className="rounded-full bg-cta px-3 py-1 font-semibold text-white">*/}
      {/*    {t('home.message.mock.send', 'Send')}*/}
      {/*  </span>*/}
      {/*</div>*/}
    </div>
  )
}

/**
 * One of the three claims between "Who's here" and the closing strip.
 *
 * Full width rather than a third of a card row: these replaced three feature tiles that said the same thing
 * three times ("not a corporate swipe app"), and what went in their place is specific enough to need a
 * sentence rather than a fragment. The icon chip and surface are the ones /about already uses, so the two
 * pages keep reading as one product.
 */
function ClaimBlock({
  title,
  children,
  link,
  visual,
}: {
  title: string
  children: ReactNode
  link?: {href: string; label: string; external?: boolean}
  // Optional right-hand column, same purpose as `ProseBlock`'s `visual` on /about: text capped at
  // `max-w-2xl` inside a full-bleed card otherwise leaves a wide empty strip on desktop.
  visual?: ReactNode
}) {
  return (
    // Vertical spacing only: the horizontal padding was for the card these used to be, and without the
    // card it just inset the text from the column the bands below align to.
    <div className={clsx('py-6 sm:py-8')}>
      <div className={clsx(visual && 'lg:flex lg:items-start lg:justify-between lg:gap-10')}>
        <div className="min-w-0">
          <h3 className="font-heading font-bold text-ink-900 text-title tracking-tight mt-0 mb-3 max-w-3xl text-balance">
            {title}
          </h3>
          <p className="text-body text-ink-800 max-w-2xl">{children}</p>
          {link && (
            <Link
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className={clsx(
                'mt-5 inline-flex w-fit items-center rounded-sm text-body font-semibold text-primary-700 transition-colors hover:text-primary-800',
                focusRing,
              )}
            >
              {link.label}
            </Link>
          )}
        </div>
        {visual}
      </div>
    </div>
  )
}

/**
 * "Where it stands" — the honest-stage block, and the only place on this page that states the membership.
 *
 * The logged-in app has told members "Compass is in its early growth phase" for a while
 * (`profiles-home.tsx`); until now the logged-out page implied a finished product, and the gap between what
 * a visitor expects and what they find in their own town is the cheapest churn to prevent. Saying it before
 * the signup is the whole point — after it, it is an excuse rather than honesty.
 *
 * The number arrives fused to what the reader should do about it. An earlier draft also named the largest
 * national group and the country count; both were cut as candour spent on nothing.
 */
function StageBlock() {
  const t = useT()
  const {data} = useAPIGetter('stats', {})

  if (!data?.profiles || !data?.conversations) return null

  return (
    // A flat amber-tinted band rather than a gradient card with a ring and shadow: the colour change
    // alone marks the section, which also retires the page's one decorative gradient.
    <Band
      // Dark mode can't use `primary-50`: the ramp inverts, so there it is the darkest, most saturated
      // step (#2B1508), and the band read as a rust-brown slab. A 6% amber wash over the page does in
      // dark what `primary-50` does in light: a slightly lighter, slightly warmer surface.
      className="bg-primary-50 dark:bg-primary-500/[0.06]"
    >
      <div className="lg:flex lg:items-start lg:justify-between lg:gap-12">
        <div className="min-w-0">
          <h2 className="font-heading text-ink-900 text-headline tracking-tight mt-0 mb-4 max-w-3xl text-balance">
            {t('home.stage.title', 'Compass is early.')}
          </h2>
          <p className="text-body text-ink-800 max-w-2xl">
            {t(
              'home.stage.text.v2',
              "{conversations} conversations emerged already, but that's not enough to guarantee somebody for you. Save a search and we’ll email you when someone who fits joins. And if you know someone who belongs here, bring them!",
              {
                members: data.profiles.toLocaleString(),
                conversations: data.conversations.toLocaleString(),
              },
            )}
          </p>
        </div>
        {/* The growth curve proves "growing every month" instead of just asserting it — same component
            /about uses under "Help Compass grow", so the two pages draw the claim identically rather than
            one showing a chart and the other a sentence. */}
        {/* `lg:w-96`, the width of every other right-hand card on the page, so they share one edge. */}
        <div className="mt-8 lg:mt-0 lg:w-96 lg:flex-shrink-0">
          <MemberGrowth />
        </div>
      </div>
    </Band>
  )
}

/**
 * The manifesto line, promoted to the page's one statement block.
 *
 * It was a 16px italic paragraph in a card the same weight as the three feature tiles above it, which
 * is an odd way to treat the sentence that states what the project is *for*. It is now the only body
 * copy on the page set at display size, on the only tinted surface — the same role "One Mission" plays
 * on /about, and deliberately the same treatment so the two pages read as one product.
 *
 * Unused since the manifesto line moved to /about: it is a claim a first-time visitor cannot check, and it
 * occupied the slot where they most need a concrete reason. `StageBlock` took the slot and borrowed this
 * treatment. Kept because this is the right shape for any future line that earns display size here.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function QuoteBlock({children}: {children: React.ReactNode}) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl px-8 py-10 sm:px-14 sm:py-14',
        'bg-gradient-to-br from-primary-100 via-canvas-50 to-canvas-50',
        'dark:from-primary-900/25 dark:via-canvas-50 dark:to-canvas-50',
        'ring-1 ring-primary-200',
        'shadow-[0_1px_2px_rgb(44_36_22/0.04),0_16px_40px_-24px_rgb(44_36_22/0.35)]',
        'dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]',
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="currentColor"
        className="absolute -top-2 left-4 w-20 h-20 text-primary-500/15 select-none"
      >
        <path d="M9.5 5C6.46 5 4 7.46 4 10.5c0 2.9 2.24 5.27 5.08 5.48-.34 1.2-1.2 2.3-2.58 3.02a.6.6 0 0 0 .3 1.13c3.9-.5 6.7-3.78 6.7-8.13V10.5C13.5 7.46 11.04 5 9.5 5Zm9 0C15.46 5 13 7.46 13 10.5c0 2.9 2.24 5.27 5.08 5.48-.34 1.2-1.2 2.3-2.58 3.02a.6.6 0 0 0 .3 1.13c3.9-.5 6.7-3.78 6.7-8.13V10.5C22.5 7.46 20.04 5 18.5 5Z" />
      </svg>
      <p className="relative z-10 font-heading text-ink-900 text-headline tracking-tight max-w-3xl text-balance">
        {children}
      </p>
    </div>
  )
}

function OpenSourceStrip({
  title,
  description,
  badges,
}: {
  title: string
  description: string
  badges: {label: string; url: string; primary?: boolean; icon?: ReactNode}[]
}) {
  // The CTA is pulled out of the badge list rather than rendered inline with it. In one equal-width
  // grid, "Join Now" was a third rectangle the same size as GitHub and Discord — the page's closing
  // action, styled as a peer of two links to somewhere else. Splitting it onto its own row lets it take
  // the full width of the column, so weight and position both say it is the thing to do here.
  const [[primary], secondary] = partition(badges, (b) => b.primary)

  const badgeClass = clsx(
    'inline-flex items-center justify-center gap-2 px-5 rounded-lg text-body font-semibold border transition-colors duration-200 ease-out',
    focusRingDark,
  )

  return (
    // `bg-canvas-950` in both themes rather than the old `dark:bg-canvas-300`. Inverting it made the
    // closing block a *pale* slab on a dark page — the one element meant to read as the page's ending
    // instead read as a hole punched in it. Espresso-on-cream and near-black-on-dark both land as the
    // same gesture. Matches the closing strip on /about.
    // The espresso now comes from the `Band` it sits in, so the strip itself is just its content.
    <div className="relative w-full">
      {/* `lg:flex` rather than the old `flex ... flex-wrap`: at this card's actual width, four badges in
          one row plus the text block no longer fit side by side, so they wrapped onto their own line and
          left the whole right two-thirds of the strip empty above them. A fixed 2×2 button grid takes a
          third of the width instead of needing to fit in whatever's left of a single row, so it sits
          beside the text reliably rather than gambling on wrap. */}
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[480px]">
          <h3 className="font-heading text-white text-title font-bold tracking-tight mb-3 text-balance">
            {title}
          </h3>
          <p className="text-white/70 text-body">{description}</p>
        </div>
        <div className="flex flex-col gap-3 lg:w-72 lg:flex-shrink-0">
          {/* The secondary links share one row: they are the same kind of thing (go read the code, go
              talk to us) and belong grouped, which also leaves the row below entirely to the CTA. */}
          <div className="grid grid-cols-2 gap-3">
            {secondary.map((b) => (
              <Link
                href={b.url}
                key={b.label}
                className={clsx(
                  badgeClass,
                  'py-2.5',
                  'bg-white/[0.06] text-white/70 border-white/10 hover:bg-white/[0.12] hover:text-white',
                )}
              >
                {b.icon}
                {b.label}
              </Link>
            ))}
          </div>
          {primary && (
            <Link
              href={primary.url}
              className={clsx(
                badgeClass,
                // Taller than the row above it, not just wider — width alone on a full-bleed row can
                // read as "stretched to fit" rather than as emphasis.
                'w-full py-3',
                'bg-cta text-white border-cta hover:bg-cta-hover',
              )}
            >
              {primary.icon}
              {primary.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Typewriter hook ──────────────────────────────────────────────────────────

function useTypewriter(words: string[]) {
  const elRef = useRef<HTMLSpanElement>(null)
  // The caller builds a fresh array every render; keying on its contents stops each re-render from
  // restarting the animation mid-word.
  const key = words.join('\u0000')

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    // Reduced motion: show the first word and stop. An endless type-and-delete loop is exactly the
    // movement the setting asks to remove, and nothing on the page lets a visitor pause it.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = words[0]
      return
    }

    let wordIndex = 0
    let charIndex = 0
    let deleting = false
    let timeoutId: ReturnType<typeof setTimeout>

    function tick() {
      const word = words[wordIndex]

      if (!el) return

      if (!deleting) {
        el.textContent = word.substring(0, charIndex + 1)
        charIndex++
        if (charIndex === word.length) {
          deleting = true
          timeoutId = setTimeout(tick, 1800)
          return
        }
      } else {
        el.textContent = word.substring(0, charIndex - 1)
        charIndex--
        if (charIndex === 0) {
          deleting = false
          wordIndex = (wordIndex + 1) % words.length
        }
      }

      timeoutId = setTimeout(tick, deleting ? 60 : 120)
    }

    timeoutId = setTimeout(tick, 600)
    return () => clearTimeout(timeoutId)
  }, [key])

  return elRef
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LoggedOutHome() {
  const user = useUser()
  const t = useT()

  const typewriterWords = [
    t('home.typewriter.search', 'Search.'),
    t('home.typewriter.connect', 'Connect.'),
    // t('home.typewriter.belong', 'Belong.'),
  ]

  const typewriterRef = useTypewriter(typewriterWords)

  // The three feature tiles that used to sit here — "Radically Transparent", "Built for Depth", "Community
  // Owned" — all resolved to the same claim, *not a corporate swipe app*, so the page's best real estate
  // spent three slots on one negative. They are replaced by the `ClaimBlock`s below, each of which says
  // something a reader could not have guessed: what a profile holds, how the score works, what it takes to
  // send a first message. The old copy is kept here rather than deleted; it is still the shortest statement
  // of the positioning and may want a home elsewhere.
  //
  // const features: FeatureCardProps[] = [
  //   {
  //     icon: EyeIcon,
  //     title: t('home.feature1.title', 'Radically Transparent'),
  //     text: t(
  //       'home.feature1.text',
  //       'No algorithms. Every profile fully searchable. You decide who to discover — not a black box.',
  //     ),
  //   },
  //   {
  //     icon: AdjustmentsHorizontalIcon,
  //     title: t('home.feature2.title', 'Built for Depth'),
  //     text: t(
  //       'home.feature2.text',
  //       'Filter by values, interests, goals, and keywords — from "meditation" to "sustainable living." Surface connections that truly matter.',
  //     ),
  //   },
  //   {
  //     icon: UsersIcon,
  //     title: t('home.feature3.title', 'Community Owned'),
  //     text: t(
  //       'home.feature3.text',
  //       'Free forever. No ads, no subscriptions. Built by the people who use it, for the benefit of everyone.',
  //     ),
  //   },
  // ]

  const openSourceBadges = [
    {
      label: t('home.strip.github', 'GitHub'),
      url: githubRepo,
      icon: <FaGithub className="w-4 h-4" />,
    },
    {
      label: t('home.strip.discord', 'Discord'),
      url: discordLink,
      icon: <FaDiscord className="w-4 h-4" />,
    },
    // {label: t('home.strip.books', 'See the books'), url: '/financials'},
    {label: t('home.strip.join', 'Join us'), url: '/register', primary: true},
  ]

  return (
    <>
      {/* Mobile sign-up CTA.
          The fixed positioning now lives on a wrapper rather than on the button itself. Previously the
          button carried `w-full left-0 right-0 px-4`, so it spanned edge to edge and the `px-4` became
          padding *inside* it instead of a gutter — a full-bleed slab with its corners cut off by the
          viewport. The wrapper owns the gutter, the button keeps its radius.
          The gradient backdrop fades page content out behind the bar as it scrolls under; it is
          `pointer-events-none` so the transparent upper half does not swallow taps, with the button
          itself opting back in. */}
      {user === null && (
        <div className="lg:hidden follows-bottom-nav fixed left-0 right-0 bottom-[calc(55px+env(safe-area-inset-bottom))] z-20 px-4 pb-3 pt-8 pointer-events-none bg-gradient-to-t from-canvas-100 via-canvas-100/90 to-transparent">
          <SignUpButton className="pointer-events-auto" size="xl" />
        </div>
      )}

      {/* A size container so the spotlight rail can bleed to its edges (`cqw` in profile-spotlights). */}
      <div className="flex flex-col items-center w-full px-4 [container-type:inline-size]">
        {/* ── Hero ──
            Two columns from lg up: copy left, phone clip right. Stacked and centred below that, which
            is also the mobile shape. The clip is a portrait phone recording, so stacking it under a
            centred hero on a wide screen left ~535px dead on either side and pushed the features
            section off the fold; side by side, its height is an asset instead of a cost. */}
        <section className="relative w-full max-w-3xl lg:max-w-6xl pt-16 pb-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-10 lg:gap-14 items-center">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* A new key, not a reword of `home.eyebrow`: the third claim used to be "No matching
                algorithms", which is false — `common/src/profiles/compatibility-score.ts` is exactly that,
                and the "The only algorithm" block below now says so. Reusing the old key would have left
                the French and German files asserting the falsehood, since they resolve ahead of this
                fallback. */}
            {/* Two items, not three. The old third claim ("No swiping") repeats the <h1> directly
                below it, and three chips of which the last is a negation was the same cadence as every
                other list on the page. */}
            {/*<EyebrowBadge>{t('home.eyebrow.v3', 'Free forever · Open source')}</EyebrowBadge>*/}

            <h1 className="animate-fade-up text-display tracking-tight mb-2">
              {t('home.title', "Don't Swipe.")}
              {/* The typed line below is hidden from assistive tech, which would otherwise read
                  whatever fragment was on screen ("Sea", "Conn"). The full headline is spoken here. */}
              <span className="sr-only"> {typewriterWords.join(' ')}</span>
            </h1>

            {/* Typewriter line */}
            <div
              aria-hidden
              // font-heading: this is the second line of the same headline as the <h1> above, but it is a
              // <div>, so the global h1–h6 rule does not reach it — without this the two lines render in
              // different faces.

              // primary-600, not -500: at 69px this counts as large text, which needs 3:1, and the
              // brand base measured 2.70:1 on the light canvas. One step down clears it at 3.71:1,
              // and because the ramp inverts, the dark theme gets a *brighter* amber here (6.8:1)
              // rather than a dimmer one.
              className="animate-fade-up font-heading font-semibold text-display tracking-tight text-primary-700 mb-9 flex items-center justify-center lg:justify-start min-h-[1.1em]"
              style={{animationDelay: '80ms'}}
            >
              <span ref={typewriterRef} />
              {/* No cursor under reduced motion: the word is static there, and a caret that neither
                  blinks nor types just reads as a stray bar. */}
              <span className="animate-pulse ml-0.5 font-light motion-reduce:hidden">|</span>
            </div>

            <p
              className="animate-fade-up text-lead text-ink-800 max-w-xl mb-10"
              style={{animationDelay: '160ms'}}
            >
              {/* One key rather than the two the old copy was split across, and a comma where the em
                  dash was: the dash-apposition was the page's default punctuation and it started here. */}
              {t(
                'home.subtitle.v3',
                'Read and search profiles by values, interests, and demographics.',
              )}
            </p>

            {/* CTAs */}
            <div
              className="animate-fade-up flex gap-3 flex-wrap justify-center lg:justify-start items-center mb-10"
              style={{animationDelay: '240ms'}}
            >
              {user === null && (
                <Link
                  href={'/register'}
                  className={clsx(heroPrimary, 'hidden sm:inline-flex', focusRing)}
                >
                  {t('home.cta.primary', 'Join us')}
                </Link>
              )}
              {/* Logged in, "Join us" has nothing to do, which left the outline button as the hero's
                  only action. The filled slot goes to the thing a member came here to do instead. */}
              {user && (
                <Link href="/" className={clsx(heroPrimary, 'inline-flex', focusRing)}>
                  {t('home.cta.browse', 'Browse people')}
                </Link>
              )}
              {/* Was a hardcoded `text-[#8B5E3C]`, which is a light-mode value: on the dark theme it
                  rendered dark-brown-on-dark and all but disappeared (2.7:1). `ink-900` rather than a
                  `primary-*` step because the ink ramp inverts reliably between themes, and it matches
                  the outline buttons on /about. The accent stays on the border and the hover. */}
              <Link href={'/about'} className={clsx(heroSecondary, focusRing)}>
                {t('home.cta.secondary', 'Learn how it works')}
              </Link>
            </div>

            {/* Social proof */}
            <div className="animate-fade-up" style={{animationDelay: '320ms'}}>
              <SocialProof />
            </div>
          </div>

          {/* Proof of the hero's claim: the headline says "Don't Swipe. Search." and this is what
              searching actually looks like. */}
          <SearchDemo />
        </section>

        {/* Every section below the hero shares the hero's container instead of stepping through
            max-w-3xl / 4xl / 2xl / 3xl as it used to. Those four different widths gave the page a
            ragged left and right edge all the way down; the measure is now capped on the text inside
            each block rather than on the blocks themselves. The gradient divider that used to sit here
            is gone with it — `Section`'s rhythm separates them without a drawn rule. */}
        <div className="w-full max-w-6xl">
          {/* ── Who's here ──
              The distributions, then the people. `WhosHere` answers "what kind of place is this?" with
              percentages, which is the honest and unfalsifiable version; `ProfileSpotlights` answers the
              same question with three or four actual members, which is the version a stranger feels.
              Neither works alone — a rail of nice-looking members with no denominators is every
              marketing page ever written, and a page of denominators with nobody in it is a census. */}
          {/* `Section` drops its top padding on a first child, which left this heading sitting right
              under the hero's social-proof line. It gets that space back explicitly. */}
          <Section className="first:pt-12 sm:first:pt-20">
            <ProfileSpotlights />
          </Section>

          {/* ── The three claims ──
              Stacked full-width rather than a three-column card row. Each of these is a specific fact a
              visitor could not have guessed, which takes a sentence; the tiles they replaced took a
              fragment each because all three were saying the same general thing. */}
          <Section>
            <h2 className="text-center text-headline text-ink-900 tracking-tight mb-12 text-balance">
              {/* Not "Three things…": counted-promise headings ("Three things", "Four steps", "One
                  Mission", "in three numbers") were the same shape four times across the two pages.
                  /about keeps the one where the count is load-bearing; this one drops it. */}
              {t('home.features.title.v4', 'What to know before you sign up.')}
            </h2>
            <div className="grid gap-4 sm:gap-5">
              <ClaimBlock
                title={t('home.profile.title', 'A profile takes twenty minutes to write.')}
                visual={<FieldChips />}
              >
                {/* Three sentences of deliberately unequal length (long / short / long) instead of
                      three of the same ~25 words, and the "Not a photo and a one-liner." opener is gone
                      — the title above it already makes that contrast. */}
                {t(
                  'home.profile.text.v2',
                  'A headline and bio in your own words, answers to prompts, the causes you care about and what kind of connection you’re after. More than twenty filters run across them.',
                )}
              </ClaimBlock>
              <ClaimBlock
                title={t(
                  'home.score.title',
                  'Compatibility scores come from your answers to prompts.',
                )}
                link={{
                  href: `${githubRepo}/blob/main/common/src/profiles/compatibility-score.ts`,
                  label: t('home.score.link', 'Read the implementation →'),
                  external: true,
                }}
                visual={<ScoreDiagram />}
              >
                {/* Three stacked negatives cut to two, and the em dash split into its own sentence.
                      "There is no paying." stays: it is the one closer on the page that earns the
                      full stop before it. */}
                {t(
                  'home.score.text.v2',
                  'For each compatibility question, you give three things: your answer, the answers you’d accept from someone else, and how much it matters to you. The score compares that with the other person.',
                )}
              </ClaimBlock>
              <ClaimBlock
                title={t(
                  'home.message.title',
                  'The shortest message you can send is 200 characters.',
                )}
                visual={<MessageComposerMock />}
              >
                {t(
                  'home.message.text.v2',
                  'To open a conversation you have to say something about the person you’re writing to, and the composer won’t send until you do. You also need a verified email before your first message.',
                )}
              </ClaimBlock>
            </div>
          </Section>
        </div>

        {/* ── Where it stands ──
              This replaced the Linux / Wikipedia / Firefox quote, which has moved to /about under "Why we
              exist". It is a vision claim a stranger cannot verify, and it sat where a first-time visitor
              most needs one small concrete reason; about is the reference page and the right place for it.
              `QuoteBlock` is kept — it is the treatment that block wants if it ever returns. */}
        <StageBlock />
        <WhosHere />

        {/* ── Open source strip ── */}
        {/* The page ends on this band: `-mb-4` cancels the page shell's bottom padding, and on mobile
            the extra bottom padding replaces the old cream spacer that kept the content clear of the
            sticky sign-up bar, so that clearance is dark too. */}
        <Band className="bg-canvas-950 -mb-4 pb-28 sm:pb-32 lg:pb-20">
          <OpenSourceStrip
            title={t('home.strip.title', 'Open Source & Free Forever')}
            // A new key, and the numbers come from `FINANCIALS` so this line and the about page can
            // never quote different figures. "Built transparently by the community" was a claim;
            // the deficit is the same claim with the receipt attached, and it is one click from
            // /financials.
            // Four stacked negatives opened this; two of them (ads, subscriptions) are already
            // claimed twice elsewhere on the page, so they go and the receipt stays.
            description={t(
              'home.strip.description.v3',
              'There is no venture capital and nobody on payroll.',
              {spent: FINANCIALS.spent, donated: FINANCIALS.donated},
            )}
            badges={openSourceBadges}
          />
        </Band>

        {/*<div className="w-full max-w-6xl pt-12">*/}
        {/*  /!* ── Press ──*/}
        {/*      One line, and the only outbound link on the page that isn't an action: five real items sit in*/}
        {/*      web/pages/press.tsx, including a radio interview, and neither marketing page linked to any of*/}
        {/*      them. Named outlets rather than logos — logos would need permission and would outweigh what*/}
        {/*      is, honestly, local coverage of an early project. *!/*/}
        {/*  <p className="pb-4 text-center text-body text-ink-700">*/}
        {/*    {t('home.press.text', 'Covered by RCF, La DH, L’Avenir and Matélé')}{' '}*/}
        {/*    <Link*/}
        {/*      href="/press"*/}
        {/*      className={clsx(*/}
        {/*        'rounded-sm font-semibold text-primary-700 transition-colors hover:text-primary-800',*/}
        {/*        focusRing,*/}
        {/*      )}*/}
        {/*    >*/}
        {/*      {t('home.press.link', 'Read the coverage')}*/}
        {/*    </Link>*/}
        {/*  </p>*/}
        {/*</div>*/}
      </div>

      {/* Mobile bottom spacing — now the strip band's extra bottom padding, so it is dark rather than
          a cream strip under the page's last section. */}
    </>
  )
}
