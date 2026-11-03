import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {discordLink, githubIssues, supportEmail} from 'common/constants'
import Link from 'next/link'
import {ComponentType, SVGProps, useEffect, useRef, useState} from 'react'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {MarkdownBody} from 'web/components/widgets/markdown-body'
import {eyebrow, IconChip, surface, surfaceHover} from 'web/components/widgets/surface'
import {useT} from 'web/lib/locale'

type Topic = {
  id: string
  title: string
  items: {q: string; a: string}[]
}

/**
 * The help center.
 *
 * It is a router more than a document: most people land here with one concrete problem, so the page
 * opens with the three places that answer most of them (FAQ, safety guide, a person), then the
 * account-and-settings answers no other page holds, then how to report a bug well, then every way to
 * reach us. The topic answers stay open rather than collapsed, for the reason `DocPage` gives —
 * find-in-page is how people search a help page, and an accordion breaks it.
 *
 * Answers are markdown strings run through `t()`, so a translation can carry its own links. Menu paths
 * ("Settings → General → Account") must match the labels in `components/settings/general-settings.tsx`
 * — if a card is renamed there, rename it here.
 */
export default function HelpPage() {
  const t = useT()
  const topics = useTopics()

  return (
    <PageBase trackPageView={'help'} className={'col-span-8'}>
      <SEO
        title={t('help.seo.title', 'Help center')}
        description={t(
          'help.seo.description',
          'Get help with your Compass account, profile, messages, privacy and safety, or contact the team.',
        )}
        url={`/help`}
      />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-24">
        {/* ── Header ── */}
        <div className="mb-10">
          <p className={clsx(eyebrow, 'text-primary-700 mb-4')}>
            {t('help.eyebrow', 'Help center')}
          </p>
          <h1 className="text-[clamp(34px,5vw,56px)] text-ink-900 tracking-tight leading-[1.08] mb-5 max-w-3xl text-balance">
            {t('help.title', 'How can we help?')}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-ink-700">
            {t(
              'help.intro',
              'Find answers about your account, your profile and your privacy, learn how to stay safe, or write to the people who run Compass.',
            )}
          </p>
        </div>

        <PrimaryPaths />
        <UrgentNote />

        <TopicsBody topics={topics} />

        <ReportProblem />
        <StillNeedHelp />
      </div>
    </PageBase>
  )
}

/** The three destinations that resolve most visits, before any of the detail below. */
function PrimaryPaths() {
  const t = useT()
  const paths: {
    href: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
    title: string
    text: string
  }[] = [
    {
      href: '/faq',
      icon: BookOpenIcon,
      title: t('help.paths.faq.title', 'Frequently asked questions'),
      text: t(
        'help.paths.faq.text',
        'How Compass works, the compatibility score, how it is funded and governed.',
      ),
    },
    {
      href: '/safety',
      icon: ShieldCheckIcon,
      title: t('help.paths.safety.title', 'Safety guide'),
      text: t(
        'help.paths.safety.text',
        'Spotting scams and fake profiles, checking someone is who they say, meeting in person.',
      ),
    },
    {
      href: '/contact',
      icon: EnvelopeIcon,
      title: t('help.paths.contact.title', 'Contact the team'),
      text: t(
        'help.paths.contact.text',
        'A person reads every message: questions, problems, feedback and ideas.',
      ),
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {paths.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          className={clsx(
            surface,
            surfaceHover,
            'group flex flex-col gap-4 p-6 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          )}
        >
          <IconChip icon={p.icon} />
          <div>
            <p className="mb-1.5 font-semibold text-ink-900 group-hover:text-primary-800">
              {p.title}
            </p>
            <p className="text-sm leading-relaxed text-ink-600">{p.text}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

/**
 * Emergency numbers before anything else a worried reader might scroll past. Mirrors the line at the
 * end of `/safety#if-something-has-gone-wrong`.
 */
function UrgentNote() {
  const t = useT()
  return (
    <div className="mt-6 flex gap-3 rounded-lg border-l-2 border-primary-500 bg-canvas-50 px-4 py-3.5 text-sm leading-relaxed text-ink-800">
      <ExclamationTriangleIcon
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-700"
        strokeWidth={1.8}
        aria-hidden
      />
      <MarkdownBody className="!text-sm !text-ink-800">
        {t(
          'help.urgent',
          '**If you are in immediate danger, call your local emergency number** (112 in the EU and UK, 911 in the US and Canada). If someone has asked you for money or is threatening you, read [what to do next](/safety#if-something-has-gone-wrong) and report their account.',
        )}
      </MarkdownBody>
    </div>
  )
}

function useTopics(): Topic[] {
  const t = useT()
  return [
    {
      id: 'getting-started',
      title: t('help.topics.start.title', 'Getting started'),
      items: [
        {
          q: t('help.topics.start.signup.q', 'How do I create an account?'),
          a: t(
            'help.topics.start.signup.a',
            '[Register](/register) with Google, with Apple on iPhone, or with an email and password. Compass is free: there is no paid tier and nothing to unlock.',
          ),
        },
        {
          q: t('help.topics.start.profile.q', 'What makes a good profile?'),
          a: t(
            'help.topics.start.profile.a',
            'Write about what you care about and what you are looking for, in your own words, and answer a few compatibility questions: they are what your [compatibility score](/compatibility-score) with other members is built from. The [bio tips](/tips-bio) walk through it.',
          ),
        },
        {
          q: t('help.topics.start.app.q', 'Is there a mobile app?'),
          a: t(
            'help.topics.start.app.a',
            'Yes, on Android and iPhone. The app adds push notifications for new messages and keeps you signed in. [Get the app](/download).',
          ),
        },
      ],
    },
    {
      id: 'account',
      title: t('help.topics.account.title', 'Signing in & your account'),
      items: [
        {
          q: t('help.topics.account.signin.q', "I can't sign in"),
          a: t(
            'help.topics.account.signin.a',
            'Use the same method you registered with: Google, Apple, or email. The [sign-in page](/signin) marks the one you used last on this device. If you use email, choose **Forgot password?** to receive a reset link, and check your spam folder if it does not arrive within a few minutes.',
          ),
        },
        {
          q: t('help.topics.account.email.q', 'How do I change or verify my email address?'),
          a: t(
            'help.topics.account.email.a',
            'Go to [Settings](/settings) → **General** → **Account**. From there you can change your email, resend the verification email, and send yourself a password reset link.',
          ),
        },
        {
          q: t('help.topics.account.language.q', 'How do I change the language or theme?'),
          a: t(
            'help.topics.account.language.a',
            'Under [Settings](/settings) → **General** → **Appearance & language** you can choose the language, light or dark theme, font, and metric or imperial units.',
          ),
        },
      ],
    },
    {
      id: 'profile',
      title: t('help.topics.profile.title', 'Profile & visibility'),
      items: [
        {
          q: t('help.topics.profile.visibility.q', 'Who can see my profile?'),
          a: t(
            'help.topics.profile.visibility.a',
            'You choose. In your profile editor, under **Who can see this**, pick **Compass members only** (visible only to signed-in members) or **Everyone on the web**. You can change it at any time.',
          ),
        },
        {
          q: t('help.topics.profile.update.q', 'My changes are not showing'),
          a: t(
            'help.topics.profile.update.a',
            'Refresh the page after saving. If a change still does not appear after a minute, [tell us](/contact) what you changed and on which device.',
          ),
        },
        {
          q: t('help.topics.profile.hidden.q', 'How do I see profiles I have hidden?'),
          a: t(
            'help.topics.profile.hidden.a',
            '[Settings](/settings) → **General** → **People** → **Hidden profiles** lists everyone you have hidden, and lets you show them again.',
          ),
        },
      ],
    },
    {
      id: 'messages',
      title: t('help.topics.messages.title', 'Messages & notifications'),
      items: [
        {
          q: t('help.topics.messages.notify.q', 'How do I choose what I am notified about?'),
          a: t(
            'help.topics.messages.notify.a',
            'Open [Settings](/settings) → **Notifications**. For each event (a new message, an endorsement, a mention, a saved-search alert) choose whether it reaches you by email, in the app, or as a push notification on your phone. You can also opt out of everything at once.',
          ),
        },
        {
          q: t('help.topics.messages.missing.q', 'I am not receiving emails'),
          a: t(
            'help.topics.messages.missing.a',
            'Check your spam or promotions folder, and mark Compass as a safe sender. Then confirm in [Settings](/settings) that your email address is verified and that the notifications you want are switched on.',
          ),
        },
      ],
    },
    {
      id: 'privacy',
      title: t('help.topics.privacy.title', 'Privacy & your data'),
      items: [
        {
          q: t('help.topics.privacy.export.q', 'Can I download my data?'),
          a: t(
            'help.topics.privacy.export.a',
            'Yes. [Settings](/settings) → **General** → **Data & Privacy** → **Download all my data** gives you a copy of everything Compass holds about you.',
          ),
        },
        {
          q: t('help.topics.privacy.policy.q', 'What does Compass do with my data?'),
          a: t(
            'help.topics.privacy.policy.a',
            'Compass shows no ads and does not sell data. The [privacy policy](/privacy) explains what is collected, why, and for how long; the [terms of service](/terms) cover the rules of the platform.',
          ),
        },
      ],
    },
    {
      id: 'safety',
      title: t('help.topics.safety.title', 'Safety & reporting'),
      items: [
        {
          q: t('help.topics.safety.report.q', 'How do I report or block someone?'),
          a: t(
            'help.topics.safety.report.a',
            'Open their profile and use the **⋯** menu at the top, or the menu in the conversation header, then choose **Report** or **Block**. Reports are private: the other person is never told. Blocking ends the conversation and hides you from each other. [More on reporting](/safety#reporting-and-blocking).',
          ),
        },
        {
          q: t('help.topics.safety.money.q', 'Someone asked me for money'),
          a: t(
            'help.topics.safety.money.a',
            'Do not send it, in any form: transfer, crypto, gift cards or "investments". Report the account, then follow the [safety guide](/safety#if-something-has-gone-wrong) on what to do next, especially if money has already moved.',
          ),
        },
      ],
    },
    {
      id: 'delete',
      title: t('help.topics.delete.title', 'Closing your account'),
      items: [
        {
          q: t('help.topics.delete.how.q', 'How do I delete my account?'),
          a: t(
            'help.topics.delete.how.a',
            'Go to [Settings](/settings) → **General** → **Danger Zone** → **Delete account**. You will be asked why before anything is removed. If you can no longer sign in, [request deletion by email](/delete-account) instead.',
          ),
        },
      ],
    },
  ]
}

/** The topic answers, with a sticky rail on wide screens — the same layout as `DocPage`. */
function TopicsBody({topics}: {topics: Topic[]}) {
  const t = useT()
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const [active, setActive] = useState<string | undefined>(topics[0]?.id)

  // Position-based scroll-spy, for the reason spelled out in `doc-page.tsx`.
  useEffect(() => {
    const update = () => {
      const line = 140
      let current: string | undefined
      for (const [id, el] of Object.entries(sectionRefs.current)) {
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      setActive(current ?? topics[0]?.id)
    }
    update()
    window.addEventListener('scroll', update, {passive: true})
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [topics])

  return (
    <div className="mt-16 grid gap-10 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-14">
      <nav aria-label={t('help.nav.label', 'Help topics')} className="hidden lg:block">
        <div className="sticky top-24">
          <p className={clsx(eyebrow, 'text-ink-700 mb-4')}>{t('help.nav.title', 'Topics')}</p>
          {/* `list-none pl-0 mt-0` — globals.css puts a disc and a 1.25rem indent on every `ul`. */}
          <ul className="mt-0 list-none space-y-1 pl-0">
            {topics.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={clsx(
                    'block border-l-2 py-1.5 pl-3 text-sm leading-snug transition-colors',
                    s.id === active
                      ? 'border-primary-500 font-semibold text-primary-800'
                      : 'border-canvas-200 text-ink-600 hover:border-ink-400 hover:text-ink-900',
                  )}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="min-w-0 max-w-2xl">
        {topics.map((topic, i) => (
          <section
            key={topic.id}
            id={topic.id}
            ref={(el) => {
              sectionRefs.current[topic.id] = el
            }}
            className={clsx('scroll-mt-24', i > 0 && 'mt-12')}
          >
            <div className="mb-5 flex items-center gap-3">
              {/* Same eyebrow-as-h2 treatment as `DocPage`; see the note there on `text-ink-900`. */}
              <h2 className={clsx(eyebrow, 'm-0 shrink-0 font-figtree text-ink-900')}>
                {topic.title}
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-canvas-200 to-transparent" />
            </div>
            <div className="divide-y divide-canvas-200">
              {topic.items.map((item) => (
                <div key={item.q} className="py-4 first:pt-0 last:pb-0">
                  <h3 className="mb-1.5 mt-0 font-figtree text-base font-semibold text-ink-900">
                    {item.q}
                  </h3>
                  <MarkdownBody className="!text-ink-800">{item.a}</MarkdownBody>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

/** What a useful bug report contains — the single thing that most shortens the back-and-forth. */
function ReportProblem() {
  const t = useT()
  const steps = [
    t('help.report.what', 'What you were trying to do, and the page you were on'),
    t('help.report.expected', 'What you expected to happen, and what happened instead'),
    t('help.report.device', 'Your device and browser, or the app version on mobile'),
    t('help.report.screenshot', 'A screenshot or screen recording, if you can'),
  ]

  return (
    <section
      id="report-a-problem"
      className={clsx(surface, 'mt-16 scroll-mt-24 grid gap-8 p-7 sm:p-9 md:grid-cols-2')}
    >
      <div>
        <h2 className="font-heading mt-0 mb-3 text-[clamp(22px,2.4vw,28px)] font-bold leading-tight tracking-tight text-ink-900">
          {t('help.report.title', 'Something not working?')}
        </h2>
        <MarkdownBody className="!text-ink-800">
          {t(
            'help.report.text',
            'Send a short report through the [contact form](/contact). If you have a GitHub account, you can also [open an issue]({url}): Compass is open source, and public issues help other members who hit the same problem.',
            {url: githubIssues},
          )}
        </MarkdownBody>
      </div>
      <div>
        <p className="mb-3 mt-0 text-sm font-semibold text-ink-900">
          {t('help.report.include', 'A good report includes:')}
        </p>
        <ul className="mt-0 list-none space-y-2.5 pl-0">
          {steps.map((s) => (
            <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-ink-800">
              <span
                aria-hidden
                className="mt-[0.6em] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500"
              />
              {s}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/**
 * The closing block, in the dark treatment `/faq` and `/about` end on. Lists every channel, then the
 * specialised ones, so a security researcher or journalist does not land in the general inbox.
 */
function StillNeedHelp() {
  const t = useT()
  const mailto = `mailto:${supportEmail}`

  return (
    <div className="relative mt-14 overflow-hidden rounded-3xl bg-canvas-950 px-7 py-10 sm:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 h-[360px] w-[360px] rounded-full bg-primary-500/20 blur-3xl"
      />
      <div className="relative">
        <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div className="max-w-lg">
            <h2 className="font-heading mt-0 mb-3 text-[clamp(22px,2.4vw,30px)] font-bold leading-tight tracking-tight text-white text-balance">
              {t('help.contact.title', 'Still need help?')}
            </h2>
            <p className="text-base leading-relaxed text-white/75">
              {t(
                'help.contact.text',
                'Compass is a small platform, and we take every member seriously and cherish them. A person on the team reads every message, and we usually reply within 12 hours.',
              )}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-cta bg-cta px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {t('help.contact.form', 'Contact us')}
            </Link>
            <a
              href={discordLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChatBubbleLeftRightIcon className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} />
              {t('help.contact.discord', 'Ask on Discord')}
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 text-sm leading-relaxed text-white/75 sm:grid-cols-3">
          <p className="m-0">
            <span className="block font-semibold text-white">
              {t('help.contact.email_label', 'Email')}
            </span>
            <a
              href={mailto}
              className="text-white/75 underline underline-offset-2 hover:text-white"
            >
              {supportEmail}
            </a>
          </p>
          <p className="m-0">
            <span className="block font-semibold text-white">
              {t('help.contact.security_label', 'Security vulnerabilities')}
            </span>
            <Link
              href="/security"
              className="text-white/75 underline underline-offset-2 hover:text-white"
            >
              {t('help.contact.security_link', 'Responsible disclosure')}
            </Link>
          </p>
          <p className="m-0">
            <span className="block font-semibold text-white">
              {t('help.contact.press_label', 'Press & partnerships')}
            </span>
            <Link
              href="/press"
              className="text-white/75 underline underline-offset-2 hover:text-white"
            >
              {t('help.contact.press_link', 'Press page')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
