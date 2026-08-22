import {ArrowRightIcon} from '@heroicons/react/24/outline'
import {SparklesIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {ENV_CONFIG} from 'common/envs/constants'
import Link from 'next/link'
import {ReactNode, useEffect, useState} from 'react'
import {buttonClass} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {Input} from 'web/components/widgets/input'
import {QRCode} from 'web/components/widgets/qr-code'
import {Reveal} from 'web/components/widgets/reveal'
import {ShareCTAButton} from 'web/components/widgets/share-cta-button'
import {eyebrow} from 'web/components/widgets/surface'
import {UserAvatarAndBadge} from 'web/components/widgets/user-link'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

/**
 * What one member has brought, and the tools to bring more.
 *
 * **The result comes first, the tool second.** This page used to open with the link box and put the
 * count of people below it, which is the wrong way round for the one thing it is trying to cause: a
 * member sharing again. Nobody scrolls a page they think they have finished, and the reason to share
 * again is the evidence that the last share worked. So the page opens with the number, and the link is
 * what you reach for once you have seen it.
 *
 * **No cards.** The whole page used to be two `bg-canvas-50` panels, which flattens everything inside
 * them to one importance — the QR code read exactly as loudly as the headline. Sections are separated
 * by rhythm and hairlines instead, the way `/about` and `/home` do it, so the eye can tell what
 * matters. The shared `eyebrow` token is imported rather than re-specified for the same reason those
 * pages share it: three slightly different small-caps labels look like a mistake, not a distinction.
 */
export default function ReferralsPage() {
  const user = useUser()
  const t = useT()

  const defaultUrl = user
    ? `https://${ENV_CONFIG.domain}/?referrer=${user.username}`
    : `https://${ENV_CONFIG.domain}/`

  // Editable: the share sheet and the QR code follow whatever is in the field, so a user can tweak the
  // link (a different landing path, an extra param) and still share exactly what they see.
  const [url, setUrl] = useState(defaultUrl)

  // `user` arrives after first paint, so the field starts on the logged-out URL and has to catch up.
  useEffect(() => setUrl(defaultUrl), [defaultUrl])

  const title = t('referrals.title', `Invite someone to join Compass!`)

  return (
    <PageBase trackPageView={'referrals'} className="col-span-10">
      <SEO title="Compass" description={title} />

      <Col className="w-full px-4 pb-20 sm:px-6">
        {user && <ConstellationHero />}

        <Section label={t('referrals.invite.label', 'Bring someone')} first={!user} title={title}>
          <p className="text-ink-600 mt-3 max-w-xl text-base leading-relaxed">
            {t(
              'referrals.invite.body',
              'Anyone who opens this link is credited to you for good — whether they join today or in a year.',
            )}
          </p>

          <div className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="min-w-0 flex-1"
              aria-label={t('referrals.link_label', 'Your referral link')}
            />
            {/* Same share control and copy as the /about closing block — only the URL differs, carrying
                this user's ?referrer= tag so the share is credited to them. */}
            <ShareCTAButton
              url={url}
              shareTitle={t('about.share.title', 'Compass — Find your people')}
              shareText={t(
                'about.share.text',
                "Hi! Reaching out about something I care about: Compass, a free directory for finding your people — fully searchable by values, interests, and demographics. No ads, no swiping, no dubious algorithm.\n\nIt gets better with every person who joins. Even if a friend isn't who you're looking for, they bring their world with them — their circles, the thoughtful people you'd never have met otherwise. So whether you join or simply pass it along, you're widening the circle for both of us.",
              )}
              label={t('about.share.button_cta', 'Share Compass')}
              copiedLabel={t('about.share.copied', 'Link copied!')}
              // `self-start`: the row stacks on mobile, and a flex column stretches its children
              // to full width by default — which turned the share button into a full-bleed bar wider
              // than the heading above it. It should be the size of its own label.
              className="shrink-0 self-start sm:self-center"
            />
          </div>

          {/* The QR is for handing your phone to someone standing in front of you. Kept modest and
              captioned: at the 200px it used to be, it outweighed everything else on the page — but it
              still has to be comfortably scannable from across a table. */}
          <Row className="mt-7 items-center gap-4">
            <QRCode url={url} width={144} height={144} className="rounded-lg" />
            <span className="text-ink-500 max-w-[14rem] text-sm">
              {t(
                'referrals.qr_caption',
                'Or let someone scan this, if they’re standing next to you.',
              )}
            </span>
          </Row>
        </Section>

        {user && <InvitedList />}
      </Col>
    </PageBase>
  )
}

/** Eyebrow, heading and the hairline that separates one block from the last. */
function Section(props: {label: string; title?: string; first?: boolean; children: ReactNode}) {
  const {label, title, first, children} = props
  return (
    <section className={clsx(first ? 'pt-8' : 'mt-14 border-t border-canvas-200/70 pt-14')}>
      <Reveal>
        <p className={clsx(eyebrow, 'text-primary-700')}>{label}</p>
        {title && (
          <h2 className="font-heading text-ink-900 mt-3 max-w-3xl text-[clamp(22px,3vw,32px)] leading-[1.15] tracking-tight text-balance">
            {title}
          </h2>
        )}
        {children}
      </Reveal>
    </section>
  )
}

/**
 * The number, and the door to the picture of it.
 *
 * Leads on the total rather than on the people this member invited personally, because the total is
 * the part they have no other way of knowing: they can name the people they invited, and cannot
 * possibly name the sixty who came after them.
 */
function ConstellationHero() {
  const t = useT()
  const {data} = useAPIGetter('get-referral-tree', {})

  // Reserve nothing while it loads. A skeleton here would push the invite link down the page and then
  // yank it back up, which is worse than the block simply arriving.
  if (!data) return null

  const {stats} = data
  const empty = stats.total === 0

  return (
    <section className="relative pt-8">
      {/* The same warm bloom the constellation has at its centre, so arriving on that page feels like
          walking into this one rather than somewhere else. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-0 h-80 w-[42rem] max-w-full bg-[radial-gradient(closest-side,rgb(var(--color-primary-500)/0.22),transparent)]"
      />

      <div className="relative">
        <p className={clsx(eyebrow, 'text-primary-700')}>
          {t('referrals.hero.label', 'Your constellation')}
        </p>

        <h1 className="font-heading text-ink-900 mt-3 max-w-3xl text-[clamp(30px,5.2vw,52px)] leading-[1.06] tracking-tight text-balance">
          {empty ? (
            t('referrals.hero.empty', 'Your constellation starts with one person')
          ) : (
            <>
              <span className="text-primary-600 tabular-nums">{stats.total}</span>{' '}
              {t('referrals.hero.title', 'people are here because of you')}
            </>
          )}
        </h1>

        {empty ? (
          <p className="text-ink-600 mt-4 max-w-xl text-base leading-relaxed">
            {t(
              'referrals.none_yet_note',
              "Even one person changes your own odds more than anything we could build — they bring their circles with them, and that's where the people you'd never otherwise meet are.",
            )}
          </p>
        ) : (
          <dl className="mt-7 grid max-w-lg grid-cols-3">
            <Stat value={stats.direct} label={t('referrals.stat.direct', 'you invited')} />
            <Stat value={stats.indirect} label={t('referrals.stat.indirect', 'they brought')} />
            <Stat value={stats.maxDepth} label={t('referrals.stat.generations', 'generations')} />
          </dl>
        )}

        <Link
          href="/constellation"
          className={clsx(buttonClass('xl', 'cta'), 'group mt-8 w-fit gap-2')}
        >
          <SparklesIcon className="h-5 w-5" />
          {t('referrals.cta.button', 'See your constellation')}
          <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  )
}

/**
 * One figure. Ruled off from its neighbour rather than boxed, so three of them read as one row.
 *
 * A fixed three-column grid rather than a wrapping flex row: wrapped items would carry their divider
 * to the start of the next line, where it separates nothing.
 */
function Stat({value, label}: {value: number; label: string}) {
  return (
    <div className="border-canvas-200 flex flex-col gap-0.5 px-4 first:pl-0 [&+&]:border-l sm:flex-row sm:items-baseline sm:gap-2">
      <dt className="sr-only">{label}</dt>
      <dd className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
        <span className="font-heading text-ink-900 text-2xl leading-none tabular-nums sm:text-3xl">
          {value}
        </span>
        <span className="text-ink-500 text-sm leading-tight">{label}</span>
      </dd>
    </div>
  )
}

/**
 * The people this member invited personally, newest first.
 *
 * Depth 1 only. Everyone further out is real and counted in the number above, but they are not names
 * this member can place — those belong to the picture, not to a list. Two columns rather than one:
 * forty names in a single file is a scroll, and in two it is a block you can take in.
 */
function InvitedList() {
  const t = useT()
  const {data} = useAPIGetter('get-referral-tree', {})

  const direct = (data?.nodes ?? [])
    .filter((n) => n.depth === 1)
    .sort((a, b) => (a.joinedTime < b.joinedTime ? 1 : -1))

  if (!direct.length) return null

  return (
    <Section label={t('referrals.invited.label', 'The people you invited')}>
      <div className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {direct.map((m) => (
          <Row key={m.username} className="min-w-0 items-center gap-2">
            <UserAvatarAndBadge user={{...m, avatarUrl: m.avatarUrl ?? undefined}} />
            <span className="text-ink-400 ml-auto shrink-0 text-xs tabular-nums">
              {new Date(m.joinedTime).toLocaleDateString()}
            </span>
          </Row>
        ))}
      </div>
    </Section>
  )
}
