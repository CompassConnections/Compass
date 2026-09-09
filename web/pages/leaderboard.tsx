import {ArrowRightIcon} from '@heroicons/react/24/outline'
import {TrophyIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {ReferralLeaderboardEntry} from 'common/referrals'
import Link from 'next/link'
import {ReactNode} from 'react'
import {buttonClass} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {Avatar} from 'web/components/widgets/avatar'
import {LoadingIndicator} from 'web/components/widgets/loading-indicator'
import {Reveal} from 'web/components/widgets/reveal'
import {eyebrow} from 'web/components/widgets/surface'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

/**
 * Who has brought the most people to Compass.
 *
 * **Direct referrals, not constellations.** `/constellation` already shows the recursive picture, and
 * it is the right shape for *your own* sky because extent is the interesting thing there. It is the
 * wrong shape for a ranking: a recursive total is mostly a function of when you joined and what the
 * people you invited did afterwards, so a board built on it would rank seniority and call it effort.
 * The number here is the one a member can actually move this week.
 *
 * **The reader's own row is never off the page.** A board you cannot find yourself on is a page you
 * read once. So the caller's row is fetched regardless of rank and either highlighted in place or
 * pinned to the bottom of the list, and the empty case — nobody invited yet — gets the invite CTA
 * rather than a blank slot, because for that reader the board is an advert, not a scoreboard.
 *
 * **Podium, then list.** The top three get avatars at size and a bar of their own; everyone below is a
 * row. Splitting them is not decoration: fifty identical rows have no shape, and the three positions
 * anyone is actually competing for should be legible before you scroll.
 */
export default function LeaderboardPage() {
  const t = useT()
  const user = useUser()

  const {data} = useAPIGetter('get-referral-leaderboard', {})

  // `undefined` while auth is still resolving, `null` once it has resolved to nobody. The difference
  // matters here: rendering the signed-out copy during the undefined window would flash "you are not
  // on the board" at a member who is on it, so anything that depends on who is reading waits.
  const signedOut = user === null
  const authResolved = user !== undefined

  const title = t('leaderboard.title', 'Who has brought the most people')

  const podium = data?.entries.slice(0, 3) ?? []
  const rest = data?.entries.slice(3) ?? []

  // Every bar is measured against the leader, so the first bar is always full and the rest are honest
  // fractions of it. Guarded because a board whose leader has brought zero people cannot exist — you
  // are only on it at all if you brought someone — but a division by zero would take the page with it.
  const topCount = data?.entries[0]?.direct ?? 0

  // In the list, or only in `you`? Decides between highlighting a row that is already there and
  // pinning a second one below the fold — never both, which would read as two different people.
  const youInList = !!data?.you && data.entries.some((e) => e.userId === data.you?.userId)

  return (
    <PageBase trackPageView={'referral leaderboard'} className="col-span-10">
      <SEO
        title={t('leaderboard.seo_title', 'Referral leaderboard')}
        description={t(
          'leaderboard.seo',
          'The members who have personally invited the most people to Compass.',
        )}
      />

      <Col className="mx-auto w-full max-w-4xl px-4 pb-24 sm:px-6">
        <header className="relative pt-8">
          {/* The same warm bloom `/referrals` opens with, so arriving here reads as the next room and
              not a different building. Inside the header rather than beside it, because it is the
              only positioned ancestor on the page — as a sibling of `Col` it would anchor to the
              viewport and drift with the scroll. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-0 h-80 w-[42rem] max-w-full bg-[radial-gradient(closest-side,rgb(var(--color-primary-500)/0.22),transparent)]"
          />

          <p className={clsx(eyebrow, 'text-primary-700')}>
            {t('leaderboard.label', 'Referral leaderboard')}
          </p>
          <h1 className="font-heading text-ink-900 mt-3 max-w-3xl text-[clamp(30px,5.2vw,52px)] leading-[1.06] tracking-tight text-balance">
            {title}
          </h1>
          {/*<p className="text-ink-600 mt-4 max-w-xl text-base leading-relaxed">*/}
          {/*  {t('leaderboard.subtitle', 'Counted on the people each member invited themselves.')}*/}
          {/*</p>*/}

          {!!data?.totalReferrers && (
            <p className="text-ink-500 mt-3 text-sm">
              {t(
                'leaderboard.total_referrers',
                '{count} members have brought at least one person.',
                {
                  count: data.totalReferrers.toLocaleString(),
                },
              )}
            </p>
          )}
        </header>

        {!data ? (
          <div className="flex justify-center py-24">
            <LoadingIndicator />
          </div>
        ) : !data.entries.length ? (
          authResolved && <EmptyBoard signedOut={signedOut} />
        ) : (
          <>
            <Podium entries={podium} youId={user?.id} />

            {!!rest.length && (
              <ol className="border-canvas-200/70 mt-10 list-none border-t pl-0">
                {rest.map((entry) => (
                  <BoardRow
                    key={entry.userId}
                    entry={entry}
                    topCount={topCount}
                    isYou={entry.userId === user?.id}
                  />
                ))}
              </ol>
            )}

            {/* Out of the top fifty, but still on the board somewhere. Pinned rather than left
                unreachable: the gap between the last listed rank and this one is the whole message. */}
            {data.you && !youInList && (
              <div className="mt-8">
                <p className={clsx(eyebrow, 'text-ink-700')}>
                  {t('leaderboard.your_place', 'Your place')}
                </p>
                <ol className="border-canvas-200/70 mt-2 list-none border-t pl-0">
                  <BoardRow entry={data.you} topCount={topCount} isYou />
                </ol>
              </div>
            )}

            {/* No `you` row means one of two quite different things — a member who has invited
                nobody, or a visitor who is not signed in — and the same sentence cannot serve both. */}
            {!data.you && authResolved && <EmptyBoard signedOut={signedOut} />}
          </>
        )}

        {authResolved && (
          <div className="border-canvas-200/70 mt-14 flex flex-wrap items-center gap-4 border-t pt-10">
            {/* A signed-out reader has no invite link to get — sending them to `/referrals` would
                hand them the logged-out share URL, which credits nobody. Signing up is the step that
                actually puts them on this board. */}
            <Link
              href={signedOut ? '/signup' : '/referrals'}
              className={clsx(buttonClass('xl', 'cta'), 'group gap-2')}
            >
              {signedOut
                ? t('leaderboard.cta_join', 'Join Compass')
                : t('leaderboard.cta', 'Get your invite link')}
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1" />
            </Link>
            {!signedOut && (
              <Link
                href="/constellation"
                className="text-ink-500 hover:text-ink-800 text-sm underline underline-offset-4"
              >
                {t('leaderboard.constellation_link', 'See your own constellation')}
              </Link>
            )}
          </div>
        )}
      </Col>
    </PageBase>
  )
}

/**
 * Per-rank accent, for the three positions that get one.
 *
 * Gold, silver and bronze read as a podium in every culture that has ever televised one, which is
 * worth more here than palette purity — but they are pulled towards the site's warm ramp (amber
 * rather than yellow, stone rather than blue-grey) so the block still belongs to this page. Beyond
 * third there is no accent at all: a fourth colour would imply a fourth tier that does not exist.
 */
const RANK_ACCENT: Record<number, {ring: string; badge: string; bar: string; glow: string}> = {
  1: {
    ring: 'ring-amber-400/70',
    badge: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950',
    bar: 'bg-gradient-to-r from-amber-400 to-amber-500',
    glow: 'shadow-[0_0_38px_-4px_rgb(251_191_36/0.55)]',
  },
  2: {
    ring: 'ring-stone-300/80',
    badge: 'bg-gradient-to-br from-stone-200 to-stone-400 text-stone-900',
    bar: 'bg-gradient-to-r from-stone-300 to-stone-400',
    glow: 'shadow-[0_0_32px_-6px_rgb(168_162_158/0.40)]',
  },
  3: {
    ring: 'ring-orange-400/60',
    badge: 'bg-gradient-to-br from-orange-300 to-orange-600 text-orange-950',
    bar: 'bg-gradient-to-r from-orange-400 to-orange-600',
    glow: 'shadow-[0_0_32px_-6px_rgb(234_88_12/0.40)]',
  },
}

/**
 * The top three, tallest in the middle.
 *
 * Source order is 1, 2, 3 — which is the right reading order on a phone, where the three stack — and
 * CSS `order` moves the leader to the centre only once there is a row to centre them in. Doing it the
 * other way round (silver first in the DOM) would hand a screen reader the board out of rank order to
 * satisfy a layout that does not exist at that width.
 */
function Podium({entries, youId}: {entries: ReferralLeaderboardEntry[]; youId?: string}) {
  const orders = ['sm:order-2', 'sm:order-1', 'sm:order-3']
  const lifts = ['sm:-mt-6', 'sm:mt-4', 'sm:mt-8']

  return (
    <ol className="mt-10 flex list-none flex-col gap-4 pl-0 sm:flex-row sm:items-end sm:gap-5">
      {entries.map((entry, i) => (
        <li key={entry.userId} className={clsx('min-w-0 flex-1', orders[i], lifts[i])}>
          <Reveal delay={i * 60}>
            <PodiumCard entry={entry} place={i + 1} isYou={entry.userId === youId} />
          </Reveal>
        </li>
      ))}
    </ol>
  )
}

function PodiumCard(props: {entry: ReferralLeaderboardEntry; place: number; isYou: boolean}) {
  const {entry, place, isYou} = props
  const t = useT()
  const accent = RANK_ACCENT[place]
  const first = place === 1

  return (
    <Link
      href={`/${entry.username}`}
      className={clsx(
        // No `overflow-hidden`: the halo is now the avatar's own shadow, and the card would clip its
        // top third against the padding above the avatar. There is nothing else here to contain.
        'relative flex flex-col items-center gap-3 rounded-2xl px-4 text-center',
        'bg-canvas-50 ring-1 transition-transform duration-200 ease-out hover:-translate-y-1',
        accent.ring,
        first ? 'py-7' : 'py-6',
        isYou && 'ring-2',
      )}
    >
      {/* The halo is a shadow cast by the avatar, not a blob placed behind it.
          It used to be a fixed 160px radial-gradient div positioned over the card, which is wrong at
          both sizes it has to serve: against a 96px avatar it read as a lit square with the corners
          showing, and against a 48px one it was a smear the avatar sat off-centre inside. A shadow on
          a `rounded-full` wrapper is by construction concentric with the circle it belongs to and
          scales with it, so #1 and #3 get the same halo at their own sizes. */}
      <div className={clsx('relative inline-block rounded-full', accent.glow)}>
        <Avatar
          username={entry.username}
          avatarUrl={entry.avatarUrl}
          size={first ? 'xl' : 'lg'}
          noLink
          className={clsx('ring-2 ring-offset-2 ring-offset-canvas-50', accent.ring)}
        />
        <span
          className={clsx(
            'absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold shadow-sm tabular-nums',
            accent.badge,
          )}
        >
          {first ? <TrophyIcon className="h-4 w-4" /> : place}
        </span>
      </div>

      <div className="relative min-w-0 w-full">
        <p className="text-ink-900 truncate font-medium">{entry.name}</p>
        <p className="text-ink-500 truncate text-xs">@{entry.username}</p>
      </div>

      <div className="relative">
        <span
          className={clsx(
            'font-heading text-ink-900 tabular-nums leading-none',
            first ? 'text-4xl' : 'text-3xl',
          )}
        >
          {entry.direct.toLocaleString()}
        </span>
        <span className="text-ink-500 mt-1 block text-xs">
          {t('leaderboard.invited', 'invited')}
        </span>
        {/* The date of the most recent of them, which is the one thing the count cannot say: whether
            this is someone still bringing people or a standing record from two years ago. Podium
            only — on a fifty-row list it would be a column of dates nobody reads. */}
        <span className="text-ink-400 mt-1 block text-[11px]">
          {t('leaderboard.latest', 'latest {date}', {
            date: new Date(entry.latestReferralTime).toLocaleDateString(undefined, {
              month: 'short',
              year: 'numeric',
            }),
          })}
        </span>
      </div>

      {isYou && (
        <span className="bg-primary-100 text-primary-800 relative rounded-full px-2 py-0.5 text-[11px] font-semibold">
          {t('leaderboard.you', 'You')}
        </span>
      )}
    </Link>
  )
}

/**
 * One row below the podium: rank, person, a bar for the shape of it, and the count.
 *
 * The bar is the only thing here that is not already in the number beside it, and that is the point —
 * a column of integers tells you the order but not the distance, and on a referral board the distance
 * between first and twentieth is most of the story.
 */
function BoardRow(props: {entry: ReferralLeaderboardEntry; topCount: number; isYou: boolean}) {
  const {entry, topCount, isYou} = props
  const t = useT()
  const pct = topCount > 0 ? Math.max(4, Math.round((entry.direct / topCount) * 100)) : 0

  return (
    <li
      className={clsx(
        'border-canvas-200/70 border-b transition-colors',
        isYou ? 'bg-primary-50/70' : 'hover:bg-canvas-50',
      )}
    >
      <Link
        href={`/${entry.username}`}
        className="flex items-center gap-3 px-2 py-3 sm:gap-4 sm:px-3"
      >
        <span
          className={clsx(
            'w-8 shrink-0 text-right text-sm tabular-nums sm:w-10',
            isYou ? 'text-primary-700 font-semibold' : 'text-ink-400',
          )}
        >
          {entry.rank}
        </span>

        <Avatar username={entry.username} avatarUrl={entry.avatarUrl} size="sm" noLink />

        <div className="min-w-0 flex-1">
          <Row className="items-baseline gap-2">
            <span className="text-ink-900 truncate text-sm font-medium">{entry.name}</span>
            {isYou && (
              <span className="text-primary-700 shrink-0 text-[11px] font-semibold uppercase tracking-wide">
                {t('leaderboard.you', 'You')}
              </span>
            )}
          </Row>
          {/* The bar lives under the name rather than in its own column so it can have the full width
              of the row on a phone, where a fourth column would be about twelve pixels wide. */}
          <div className="bg-canvas-200/60 mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={clsx(
                'h-full rounded-full',
                RANK_ACCENT[entry.rank]?.bar ?? 'bg-primary-400',
              )}
              style={{width: `${pct}%`}}
            />
          </div>
        </div>

        <span className="text-ink-900 shrink-0 text-sm font-semibold tabular-nums">
          {entry.direct.toLocaleString()}
        </span>
      </Link>
    </li>
  )
}

/** The board as seen by someone who is not on it — an invitation, not an empty table. */
function EmptyBoard({signedOut}: {signedOut: boolean}) {
  const t = useT()
  return (
    <Panel>
      <p className="text-ink-900 font-medium">
        {signedOut
          ? t('leaderboard.signed_out.title', 'Anyone here can be on this board')
          : t('leaderboard.empty.title', 'You are not on the board yet')}
      </p>
      <p className="text-ink-600 mt-2 max-w-lg text-sm leading-relaxed">
        {signedOut
          ? t(
              'leaderboard.signed_out.body',
              'Every name above is a member who invited someone. Join, share your link, and the first person you bring puts you here.',
            )
          : t(
              'leaderboard.empty.body',
              'One person is enough to appear here — and the people you bring tend to bring the people you would never have met on your own.',
            )}
      </p>
    </Panel>
  )
}

function Panel({children}: {children: ReactNode}) {
  return (
    <div className="border-canvas-200/70 bg-canvas-50/60 mt-10 rounded-2xl border border-dashed px-5 py-6">
      {children}
    </div>
  )
}
