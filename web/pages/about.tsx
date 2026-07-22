import {
  BellIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  FlagIcon,
  GiftIcon,
  GlobeAltIcon,
  HeartIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {discordLink, formLink, githubRepo} from 'common/constants'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {ComponentType, ReactNode, SVGProps} from 'react'
import {StatBand} from 'web/components/about/platform-stats'
import {RepoActivity} from 'web/components/about/repo-activity'
import {AlertDemo} from 'web/components/about/search-alert-demo'
import {SectionLabel} from 'web/components/about/section'
import {VoteEvidence} from 'web/components/about/vote-evidence'
import {CopyLinkOrShareButton, ShareProfileOnXButton} from 'web/components/buttons/copy-link-button'
import {GeneralButton} from 'web/components/buttons/general-button'
import {Row} from 'web/components/layout/row'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {MemberGrowth} from 'web/components/widgets/charts'
import {Reveal} from 'web/components/widgets/reveal'
import {eyebrow, Section, surface, surfaceHover} from 'web/components/widgets/surface'
import {useT} from 'web/lib/locale'

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

function FeatureCard({icon, title, text}: FeatureCardProps) {
  return (
    <div className={clsx(surface, surfaceHover, 'h-full p-6 sm:p-7')}>
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
    <div
      className={clsx(
        surface,
        surfaceHover,
        'col-span-1 md:col-span-2 p-6 sm:p-7',
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
function NotifySpotlight({title, text, note}: {title: string; text: string; note: string}) {
  return (
    <div className={clsx(surface, 'relative overflow-hidden p-6 sm:p-10')}>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-primary-500/[0.07] blur-3xl"
      />
      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 md:gap-14 items-center">
        <div className="min-w-0">
          <IconChip icon={BellIcon} large />
          <h3 className="font-heading font-bold text-ink-900 text-[clamp(26px,3vw,38px)] leading-[1.15] tracking-tight mt-6 mb-4 text-balance">
            {title}
          </h3>
          <p className="text-base sm:text-lg text-ink-600 leading-relaxed max-w-lg">{text}</p>
          <p className="text-sm text-ink-600 leading-relaxed max-w-lg mt-4">{note}</p>
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
      <p className="font-heading text-ink-900 text-[clamp(22px,3vw,36px)] leading-[1.25] tracking-tight max-w-3xl text-balance">
        {text}
      </p>
    </div>
  )
}

// ─── Help Card ────────────────────────────────────────────────────────────────

function HelpCard({icon, title, text, buttonLabel, buttonUrl, buttonPrimary, id}: HelpCardProps) {
  return (
    <div
      className={clsx(surface, surfaceHover, 'h-full flex flex-col p-6 sm:p-7')}
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
      {/* `mt-auto` on the button rather than `flex-1` on the paragraph, and the parent is now actually
          `flex flex-col`. It was not, so the old `flex-1` did nothing and the four buttons in this grid
          sat wherever their card's text happened to end — measured 20-23px out of line with each other. */}
      <div className="mt-auto -ml-3 -mb-3">
        <GeneralButton
          url={buttonUrl}
          content={buttonLabel}
          color={
            buttonPrimary
              ? 'bg-cta hover:bg-cta-hover text-white border-cta shadow-[0_3px_12px_rgba(193,127,62,0.3)]'
              : 'bg-canvas-100 hover:border-primary-600 hover:text-primary-600 border-canvas-300 text-ink-900'
          }
        />
      </div>
    </div>
  )
}

// ─── Share Strip ──────────────────────────────────────────────────────────────

/**
 * The closing ask, and the page's visual climax.
 *
 * It is the only dark block, which is what makes it land — so it is also the reason the "One Mission"
 * statement above is tinted-light rather than dark. Two dark full-width panels on one page would read as
 * a repeating band and neither would be the ending.
 */
function ShareStrip({title, text}: {title: string; text: string}) {
  const t = useT()
  return (
    <div className="relative overflow-hidden bg-canvas-950 rounded-3xl px-7 py-10 sm:px-12 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-20 w-[440px] h-[440px] rounded-full bg-primary-500/20 blur-3xl"
      />
      <div className="relative flex items-center justify-between gap-8 flex-wrap">
        <div className="max-w-[520px]">
          <div className="flex items-center gap-2.5 mb-3">
            <MegaphoneIcon className="w-5 h-5 text-primary-500 flex-shrink-0" strokeWidth={1.8} />
            <span className={clsx(eyebrow, 'text-primary-500')}>
              {t('about.final.label', 'Spread the word')}
            </span>
          </div>
          <h3 className="font-heading text-white text-[clamp(22px,2.4vw,32px)] font-bold leading-tight tracking-tight mb-3 text-balance">
            {title}
          </h3>
          {/* Was `text-primary-500` — amber body copy on espresso. The accent belongs on the eyebrow
              and the icon; the sentence itself reads better in plain warm white. */}
          <p className="text-white/70 text-base leading-relaxed">{text}</p>
        </div>
        <Row className="flex gap-2 flex-wrap">
          {/*//     */}
          {/*//     ${*/}
          {/*//       primary*/}
          {/*//         ? 'bg-primary-500 text-white border-primary-500 hover:bg-primary-600'*/}
          {/*//         : 'bg-white/[0.06] text-canvas-200 border-white/10 hover:bg-white/[0.12] hover:text-canvas-50'*/}
          {/*//     }*/}
          <ShareProfileOnXButton
            className={clsx(
              'px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ease-out',
              'bg-white/[0.06] !text-white/70 border-white/10 hover:bg-white/[0.12] hover:text-white',
            )}
          />
          <CopyLinkOrShareButton
            url={DEPLOYED_WEB_URL}
            children={t('about.copy_link', ' Copy Link')}
            className={clsx(
              'px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ease-out',
              'bg-cta text-white hover:text-white border-cta hover:bg-cta-hover',
              'shadow-[0_6px_20px_-6px_rgba(193,127,62,0.6)]',
            )}
          />
        </Row>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function About() {
  const t = useT()

  // The two cards that support the spotlight claim above them. "Get Notified About Searches" used to be
  // the middle of these three; it is now the spotlight block, so what is left is the pair that sets it
  // up (you can search for anything) and the one that follows from it (what we match on).
  const searchFeatures: FeatureCardProps[] = [
    {
      icon: MagnifyingGlassIcon,
      title: t('about.block.keyword.title', 'Keyword Search the Database'),
      text: t(
        'about.block.keyword.text',
        '"Meditation", "Hiking", "Neuroscience", "Nietzsche". Access any profile and get niche.',
      ),
    },
    {
      icon: SparklesIcon,
      title: t('about.block.personality.title', 'Personality-Centered'),
      text: t('about.block.personality.text', 'Values and interests first, photos are secondary.'),
    },
    {
      icon: GiftIcon,
      title: t('about.block.free.title', 'Completely Free'),
      text: t('about.block.free.text', 'Subscription-free. Paywall-free. Ad-free.'),
    },
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
      text: t(
        'about.suggestions.text',
        'Give suggestions or let us know you want to help through this form. Every idea matters.',
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
      text: t(
        'about.donate.text',
        'Support our not-for-profit infrastructure. Every contribution keeps the lights on.',
      ),
      buttonLabel: t('about.donate.button', 'Donation Options →'),
      buttonUrl: '/support',
    },
  ]

  return (
    <PageBase trackPageView={'about'}>
      <SEO
        title={t('about.seo.title', 'About')}
        description={t('about.seo.description', 'About Compass')}
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
          <h1 className="text-[clamp(34px,5vw,56px)] text-ink-900 tracking-tight leading-[1.08] mb-5 max-w-3xl text-balance">
            {t('about.title', 'Why Choose Compass?')}
          </h1>
          <p className="text-lg sm:text-xl text-ink-700 max-w-xl leading-relaxed">
            {t(
              'about.subtitle',
              'To find your people with ease — based on who they are, not how they look.',
            )}
          </p>
        </div>

        {/* Opens the page with something that is not a card — the run of identical bordered tiles
            below is what made this page read as flat. Renders nothing if the stats call comes back
            empty, in which case the header simply meets the feature grid as it did before. */}
        <StatBand />

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
              note={t(
                'about.alert.caption',
                'The email is the real one, sent to people with saved searches. Daily at most, and only when somebody new actually matches.',
              )}
            />
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-5">
            {searchFeatures.map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <FeatureCard icon={f.icon} title={f.title} text={f.text} />
              </Reveal>
            ))}
          </div>
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
              Mission" has been promoted, and a one-item grid is just an indirection. */}
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
          <Reveal>
            <VoteEvidence />
          </Reveal>
        </Section>

        {/* Owns its own heading, because it renders nothing when GitHub is unreachable and a label with
            nothing under it is worse than no section. */}
        <RepoActivity />

        {/* ── Help ── */}
        <Section>
          <SectionLabel>{t('about.help.label', 'Help Compass grow')}</SectionLabel>

          {/* Sits inside the Help section rather than getting a heading of its own: it renders nothing
              when the query comes back empty, and a section label with nothing under it is worse than
              no section. It also reads as the setup for the cards below — this is what you would be
              helping grow. The country spread that used to sit beside it now lives on /stats: it is a
              distribution readout for someone who came to read numbers, and this page already makes its
              one claim about reach in the stat band up top. */}
          <div className="mb-5">
            <MemberGrowth />
          </div>

          {/* ── Share strip ── */}
          <Reveal>
            <ShareStrip
              title={t('about.final.title', 'Tell Your Friends and Family')}
              text={t(
                'about.final.text',
                'The best way to grow Compass is word of mouth. Thank you for supporting our mission.',
              )}
            />
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-5">
            {helpCards.map((card, i) => (
              <Reveal key={card.id} delay={(i % 2) * 70}>
                <HelpCard {...card} />
              </Reveal>
            ))}
          </div>
        </Section>
      </div>
    </PageBase>
  )
}
