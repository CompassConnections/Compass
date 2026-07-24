import {
  BellIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  CodeBracketIcon,
  EnvelopeIcon,
  FlagIcon,
  GiftIcon,
  HeartIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  ShareIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import {GlobeAltIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {discordLink, formLink, githubRepo} from 'common/constants'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import Link from 'next/link'
import {ComponentType, ReactNode, SVGProps, useState} from 'react'
import {StatBand} from 'web/components/about/platform-stats'
import {RepoActivity} from 'web/components/about/repo-activity'
import {AlertDemo} from 'web/components/about/search-alert-demo'
import {SectionLabel} from 'web/components/about/section'
import {VoteEvidence} from 'web/components/about/vote-evidence'
import {GeneralButton} from 'web/components/buttons/general-button'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {MemberGrowth} from 'web/components/widgets/charts'
import {Reveal} from 'web/components/widgets/reveal'
import {eyebrow, Section, surface, surfaceHover} from 'web/components/widgets/surface'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {copyToClipboard} from 'web/lib/util/copy'
import {nativeShare} from 'web/lib/util/share'

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

// function FeatureCardWide({icon, title, text}: FeatureCardProps) {
//   return (
//     <div
//       className={clsx(
//         surface,
//         surfaceHover,
//         'col-span-1 md:col-span-2 p-6 sm:p-7',
//         'flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6',
//       )}
//     >
//       <IconChip icon={icon} />
//       <div className="min-w-0">
//         <h3 className="font-bold text-ink-900 mb-2">{title}</h3>
//         {/* Capped: the card is full-width, so without this the line runs to ~800px at desktop, well
//             past a readable measure. The wider page container buys layout room, not longer lines. */}
//         <p className="text-sm text-ink-600 leading-relaxed max-w-3xl">{text}</p>
//       </div>
//     </div>
//   )
// }

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
        'Filter the whole community down to the exact person — values, interests, location.',
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
          <h3 className="font-heading font-bold text-ink-900 text-[clamp(26px,3vw,38px)] leading-[1.15] tracking-tight mt-6 mb-4 text-balance">
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
      <p className="font-heading text-ink-900 text-[clamp(22px,3vw,36px)] leading-[1.25] tracking-tight max-w-3xl text-balance">
        {text}
      </p>
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
    <div
      className={clsx(
        surface,
        surfaceHover,
        'p-6 sm:p-8',
        'flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7',
      )}
    >
      <IconChip icon={icon} large />
      <div className="min-w-0 flex-1">
        <h3 id={id} className="font-bold text-lg text-ink-900 mb-1.5">
          {title}
        </h3>
        <p className="text-sm text-ink-600 leading-relaxed max-w-xl">{text}</p>
      </div>
      <div className="shrink-0 -mb-3 -ml-3 sm:m-0">
        <GeneralButton
          url={buttonUrl}
          content={buttonLabel}
          color={'bg-transparent text-cta border-cta hover:bg-cta hover:text-white'}
        />
      </div>
    </div>
  )
}

function HelpCard({icon, title, text, buttonLabel, buttonUrl, id}: HelpCardProps) {
  return (
    <div
      className={clsx(surface, surfaceHover, 'flex h-full flex-col p-5 sm:p-6')}
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
          deliberately lighter than the featured card's filled CTA. `mt-auto` pins it to the card's base
          so the three links line up regardless of copy length. */}
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
 * interest, so a desktop with no button would undercut it. Phones get the native share sheet (they can
 * pick WhatsApp, Messages, ...); everywhere else — and any browser without the Web Share API — it copies
 * the link and confirms. The sheet is probed at click time, so there is no SSR/first-paint branch to get
 * wrong and the button always renders.
 *
 * `nativeShare` is what makes the Android app work: its WebView has no `navigator.share`, so a bare Web
 * Share API check would silently degrade the app to copy-the-link.
 *
 * When the sharer is signed in the link carries their `?referrer=` tag, the same attribution the
 * /referrals page and users.ts already speak — so the shares this block is arguing for actually get
 * credited to them, which is the whole self-interest case. Logged-out visitors (the page is public)
 * have no username, so they share the bare URL.
 */
function ShareCTA() {
  const t = useT()
  const user = useUser()
  const [copied, setCopied] = useState(false)

  const shareUrl = user?.username
    ? `${DEPLOYED_WEB_URL}/?referrer=${user.username}`
    : DEPLOYED_WEB_URL

  const onClick = async () => {
    // The user dismissing the share sheet also reports false; re-copying the link is a harmless outcome.
    const shared = await nativeShare({
      title: t('about.share.title', 'Compass — Find your people'),
      // Two paragraphs, and long for a share sheet, deliberately: this is the referral message a person
      // sends their friends, so it carries the same three beats as the ShareStrip below — what Compass
      // is, how it works, and why bringing someone is in the sharer's own interest, not a favour. The
      // closing line is mutual on purpose: the receiver reads it, but the sender has to feel it too.
      text: t(
        'about.share.text',
        "Hi! Reaching out about something I care about: Compass, a free directory for finding your people — fully searchable by values, interests, and demographics. No ads, no swiping, no dubious algorithm.\n\nIt gets better with every person who joins. Even if a friend isn't who you're looking for, they bring their world with them — their circles, the thoughtful people you'd never have met otherwise. So whether you join or simply pass it along, you're widening the circle for both of us.",
      ),
      url: shareUrl,
    })
    if (shared) return

    copyToClipboard(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold',
        'transition-all duration-200 ease-out',
        'bg-cta text-white border-cta hover:bg-cta-hover',
        'shadow-[0_6px_20px_-6px_rgba(193,127,62,0.6)]',
      )}
    >
      {copied ? (
        <CheckIcon className="h-[1.05rem] w-[1.05rem]" strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <ShareIcon className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} aria-hidden="true" />
      )}
      {copied
        ? t('about.share.copied', 'Link copied!')
        : t('about.share.button_cta', 'Share Compass')}
    </button>
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
    <div className="relative overflow-hidden bg-canvas-950 rounded-3xl px-7 py-10 sm:px-12 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-20 w-[440px] h-[440px] rounded-full bg-primary-500/20 blur-3xl"
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
            <h3 className="font-heading text-white text-[clamp(24px,2.6vw,34px)] font-bold leading-tight tracking-tight mb-4 text-balance">
              {t(
                'about.share.headline',
                'Compass gets better for you with every person you bring.',
              )}
            </h3>
            {/* The reframe, condensed from the share-compass email: the friend you tell need not be who
                you're looking for — they bring their world, and that is the reader's own upside. */}
            <p className="text-white/70 text-base leading-relaxed max-w-xl">
              {t(
                'about.share.reframe',
                "Even if a friend isn't who you're looking for, they bring their world with them — their friends, their circles, the thoughtful people you'd never have met otherwise. Sharing isn't just a favor to them. It's an investment in your own future connections.",
              )}
            </p>
          </div>

          {/* An inset panel rather than a bare list: a few short rows floating in a tall column read as
              empty space. The panel gives the right side visual mass, stretches to the copy's height
              (items-stretch on the grid), and centres the benefits within it. */}
          <ul className="flex flex-col justify-center gap-6 rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-8 lg:h-full">
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
      text: t('about.block.free.text', 'Subscription-free. Paywall-free. Ad-free.'),
    },
    {
      icon: GlobeAltIcon,
      title: t('about.block.vision.title', 'Digital Public Good'),
      text: t(
        'about.block.vision.text',
        'Built by the people who use it, for the benefit of everyone.',
      ),
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
          {/*<Reveal className="mt-4 sm:mt-5">*/}
          {/*  <FeatureCardWide*/}
          {/*    icon={GlobeAltIcon}*/}
          {/*    title={t('about.block.vision.title', 'Vision')}*/}
          {/*    text={t(*/}
          {/*      'about.block.vision.text',*/}
          {/*      'Compass is to human connection what Linux, Wikipedia, and Firefox are to software and knowledge: a public good built by the people who use it, for the benefit of everyone.',*/}
          {/*    )}*/}
          {/*  />*/}
          {/*</Reveal>*/}
        </Section>

        {/* ── How a decision gets made ── */}
        <Section>
          <SectionLabel>{t('about.vote.label', 'How a decision gets made')}</SectionLabel>

          <Reveal>
            <VoteEvidence />
          </Reveal>
          <Reveal>
            <RepoActivity className="mt-4 sm:mt-5" />
          </Reveal>
        </Section>

        {/* ── Help ── */}
        <Section>
          <SectionLabel>{t('about.help.label', 'Help Compass grow')}</SectionLabel>

          {/* Growth line first, share block second: the momentum is what motivates the ask. Show that
              Compass is growing, then invite the reader to add to it — the same order as the
              share-compass email, which opens with the member count before asking. The share block then
              closes the section on the action rather than on a passive chart. */}
          <MemberGrowth />

          {/* ── Share strip ── */}
          <div className="mt-5">
            <Reveal>
              <ShareStrip />
            </Reveal>
          </div>

          {/* One primary ask leads, then the three lighter ones. "Give Suggestions or Contribute" is
              the contribution we most want, so it is the full-width featured card with the filled CTA;
              the rest sit below as a quieter row of three with text-link actions. */}
          <Reveal className="mt-5">
            <FeaturedHelpCard {...helpCards[0]} />
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-5">
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
