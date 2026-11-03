import {
  ArrowDownTrayIcon,
  BellSlashIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  EyeSlashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {supportEmail} from 'common/constants'
import Link from 'next/link'
import {ComponentType, SVGProps} from 'react'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {MarkdownBody} from 'web/components/widgets/markdown-body'
import {eyebrow, IconChip, surface} from 'web/components/widgets/surface'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

/**
 * How to delete a Compass account.
 *
 * This URL is the one the app stores list as the "delete your account" page, so it has to work for
 * someone who is not signed in — hence the email route. But that route is the slow one (a person has
 * to process it by hand), so the page leads with the in-app path and keeps the email request for people
 * who genuinely cannot sign in any more.
 *
 * The "what is removed" list mirrors `backend/api/src/delete-me.ts`: the `users` row is deleted (and
 * cascades), photos are removed from storage, and the Firebase login is deleted. Messages are *not*
 * deleted — `private_user_messages.user_id` is `on delete set null` — so they stay in the other
 * person's conversation without your name on them. Update both together.
 */
export default function DeleteAccountPage() {
  const t = useT()

  return (
    <PageBase trackPageView={'delete-account'} className="col-span-8">
      <SEO
        title={t('delete.seo.title', 'Delete your account')}
        description={t(
          'delete.seo.description',
          'How to delete your Compass account and what happens to your data.',
        )}
        url={'/delete-account'}
      />
      <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-12 pb-24">
        {/* ── Header ── */}
        <div className="mb-10">
          <p className={clsx(eyebrow, 'text-primary-700 mb-4')}>{t('delete.eyebrow', 'Account')}</p>
          <h1 className="text-[clamp(34px,5vw,56px)] text-ink-900 tracking-tight leading-[1.08] mb-5 max-w-3xl text-balance">
            {t('delete.title', 'Delete your account')}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-ink-700">
            {t(
              'delete.intro',
              'You can delete your account yourself at any time, from the website or the app. It takes a minute, and it is permanent.',
            )}
          </p>
        </div>

        <SignedInPath />
        <EmailPath />
        <BeforeYouGo />
        <WhatHappens />

        <p className="mt-14 max-w-2xl text-[15px] leading-relaxed text-ink-800">
          {t('delete.help.prefix', 'Questions about your account or your data? Write to ')}
          <a
            href={`mailto:${supportEmail}`}
            className="font-medium text-primary-700 underline decoration-primary-500/35 underline-offset-2 hover:decoration-primary-500"
          >
            {supportEmail}
          </a>
          {t('delete.help.suffix', ' or use the ')}
          <Link
            href="/contact"
            className="font-medium text-primary-700 underline decoration-primary-500/35 underline-offset-2 hover:decoration-primary-500"
          >
            {t('delete.help.contact', 'contact form')}
          </Link>
          {t('delete.help.end', '.')}
        </p>
      </div>
    </PageBase>
  )
}

/** The recommended route: done by the member, immediately, from Settings on the web or in the app. */
function SignedInPath() {
  const t = useT()
  const user = useUser()
  const signedIn = !!user

  const steps = [
    t('delete.app.step1', 'Open Compass on the website or in the app, and sign in.'),
    t('delete.app.step2', 'Go to **Settings** → **General**.'),
    t('delete.app.step3', 'Scroll to **Danger Zone** and choose **Delete account**.'),
    t(
      'delete.app.step4',
      'Tell us briefly why you are leaving, then confirm. Your account is deleted straight away.',
    ),
  ]

  return (
    <section className={clsx(surface, 'p-7 sm:p-9')}>
      <div className="mb-6 flex items-start gap-4">
        <IconChip icon={UserCircleIcon} />
        <div>
          <h2 className="font-heading mt-0 mb-1.5 text-[clamp(20px,2.2vw,26px)] font-bold leading-tight tracking-tight text-ink-900">
            {t('delete.app.title', 'If you can sign in, delete it in the app')}
          </h2>
          <p className="m-0 text-[15px] leading-relaxed text-ink-700">
            {t(
              'delete.app.text',
              'This is the fastest way, and the only one that takes effect immediately.',
            )}
          </p>
        </div>
      </div>

      {/* Genuinely sequential, so a numbered list is the right shape here. */}
      <ol className="mt-0 list-none space-y-3 pl-0">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3.5">
            <span
              aria-hidden
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-800 ring-1 ring-primary-200"
            >
              {i + 1}
            </span>
            <MarkdownBody className="!text-ink-800 pt-px">{s}</MarkdownBody>
          </li>
        ))}
      </ol>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link
          href={signedIn ? '/settings#settings-danger' : '/signin'}
          className="inline-flex items-center gap-2 rounded-xl border border-cta bg-cta px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          {signedIn
            ? t('delete.app.open_settings', 'Open Settings')
            : t('delete.app.sign_in', 'Sign in')}
        </Link>
        {signedIn && user?.username && (
          <span className="text-sm text-ink-700">
            {t('delete.app.signed_in_as', 'Signed in as @{username}', {username: user.username})}
          </span>
        )}
      </div>
    </section>
  )
}

/** The fallback for people locked out of their account. Processed by hand, so it is slower. */
function EmailPath() {
  const t = useT()
  const subject = 'Account deletion request'
  const body = [
    'Please delete my Compass account and its data.',
    '',
    'Email address on the account: ',
    'Username (if you remember it): ',
  ].join('\n')
  const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  return (
    <section className="mt-6 rounded-2xl border border-canvas-200 p-7 sm:p-9">
      <div className="mb-5 flex items-start gap-4">
        <IconChip icon={EnvelopeIcon} />
        <div>
          <h2 className="font-heading mt-0 mb-1.5 text-[clamp(20px,2.2vw,26px)] font-bold leading-tight tracking-tight text-ink-900">
            {t('delete.email.title', 'If you can no longer sign in, ask us by email')}
          </h2>
          <MarkdownBody className="!text-ink-700">
            {t(
              'delete.email.text',
              'Lost access to your email or your sign-in method? First try **Forgot password?** on the [sign-in page](/signin). If that does not work, email us from the address on your account, and include your username if you remember it.',
            )}
          </MarkdownBody>
        </div>
      </div>
      <ul className="mt-0 list-none space-y-2.5 pl-0">
        {[
          t(
            'delete.email.verify',
            'We may ask you to confirm the request, to make sure it comes from the account owner.',
          ),
          t(
            'delete.email.timing',
            'We process requests as soon as we can, and always within 30 days, as data protection law requires.',
          ),
          t(
            'delete.email.confirm',
            'We reply to confirm once your account and data have been deleted.',
          ),
        ].map((s) => (
          <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-ink-800">
            <span
              aria-hidden
              className="mt-[0.6em] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500"
            />
            {s}
          </li>
        ))}
      </ul>
      <a
        href={mailto}
        className="mt-7 inline-flex items-center gap-2 rounded-xl border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-canvas-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <EnvelopeIcon className="h-4 w-4" strokeWidth={2} aria-hidden />
        {t('delete.email.button', 'Email a deletion request')}
      </a>
    </section>
  )
}

/**
 * The alternatives and the last chance to export. Deletion cannot be undone, so these come before the
 * consequences rather than after them.
 */
function BeforeYouGo() {
  const t = useT()
  const items: {icon: ComponentType<SVGProps<SVGSVGElement>>; title: string; text: string}[] = [
    {
      icon: ArrowDownTrayIcon,
      title: t('delete.before.export.title', 'Keep a copy of your data'),
      text: t(
        'delete.before.export.text',
        'Download everything Compass holds about you from [Settings](/settings) → **General** → **Data & Privacy**. Once the account is deleted, we cannot recover it.',
      ),
    },
    {
      icon: BellSlashIcon,
      title: t('delete.before.notifications.title', 'Just want fewer emails?'),
      text: t(
        'delete.before.notifications.text',
        'You can turn off some or all notifications in [Settings](/settings) → **Notifications** and keep your account.',
      ),
    },
    {
      icon: EyeSlashIcon,
      title: t('delete.before.visibility.title', 'Want more privacy?'),
      text: t(
        'delete.before.visibility.text',
        'In your profile editor, set **Who can see this** to **Compass members only**, so your profile is hidden from the open web.',
      ),
    },
  ]

  return (
    <section className="mt-14">
      <div className="mb-5 flex items-center gap-3">
        <h2 className={clsx(eyebrow, 'm-0 shrink-0 font-figtree text-ink-900')}>
          {t('delete.before.title', 'Before you delete')}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-canvas-200 to-transparent" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.title}>
            <item.icon className="mb-3 h-5 w-5 text-primary-700" strokeWidth={1.8} aria-hidden />
            <h3 className="mb-1.5 mt-0 font-figtree text-base font-semibold text-ink-900">
              {item.title}
            </h3>
            <MarkdownBody className="!text-ink-800">{item.text}</MarkdownBody>
          </div>
        ))}
      </div>
    </section>
  )
}

function WhatHappens() {
  const t = useT()
  const removed = [
    t(
      'delete.removed.profile',
      'Your profile, photos, answers to compatibility questions and settings',
    ),
    t('delete.removed.login', 'Your login, so you can no longer sign in with that account'),
    t('delete.removed.lists', 'Your saved searches, hidden profiles and notification settings'),
    t('delete.removed.username', 'Your username, which becomes available to others'),
  ]
  const kept = [
    t(
      'delete.kept.messages',
      'Messages you sent stay in the other person’s conversation, no longer linked to your profile',
    ),
    t(
      'delete.kept.reports',
      'Reports involving your account, without your identity, so we can keep the community safe',
    ),
    t('delete.kept.legal', 'Anything we are required to keep by law, for example to prevent fraud'),
  ]

  return (
    <section className="mt-14">
      <div className="mb-5 flex items-center gap-3">
        <h2 className={clsx(eyebrow, 'm-0 shrink-0 font-figtree text-ink-900')}>
          {t('delete.what_happens.title', 'What happens to your data')}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-canvas-200 to-transparent" />
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <List
          title={t('delete.removed.title', 'Permanently deleted')}
          items={removed}
          icon={CheckCircleIcon}
        />
        <div>
          <List title={t('delete.kept.title', 'What remains')} items={kept} />
          <MarkdownBody className="mt-4 !text-sm !text-ink-700">
            {t(
              'delete.kept.note',
              'We keep this only as long as necessary. The [privacy policy](/privacy) has the details.',
            )}
          </MarkdownBody>
        </div>
      </div>
    </section>
  )
}

function List({
  title,
  items,
  icon: Icon,
}: {
  title: string
  items: string[]
  icon?: ComponentType<SVGProps<SVGSVGElement>>
}) {
  return (
    <div>
      <h3 className="mb-3 mt-0 font-figtree text-base font-semibold text-ink-900">{title}</h3>
      <ul className="mt-0 list-none space-y-2.5 pl-0">
        {items.map((s) => (
          <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-ink-800">
            {Icon ? (
              <Icon
                className="mt-[0.2em] h-[1.1rem] w-[1.1rem] flex-shrink-0 text-primary-700"
                strokeWidth={1.8}
                aria-hidden
              />
            ) : (
              <span
                aria-hidden
                className="mt-[0.6em] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ink-400"
              />
            )}
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}
