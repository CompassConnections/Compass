import {ArrowLeftIcon} from '@heroicons/react/24/outline'
import Link from 'next/link'
import {PageBase} from 'web/components/page-base'
import {ReferralConstellation} from 'web/components/referrals/constellation'
import {SEO} from 'web/components/SEO'
import {LoadingIndicator} from 'web/components/widgets/loading-indicator'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useRedirectIfSignedOut} from 'web/hooks/use-redirect-if-signed-out'
import {useT} from 'web/lib/locale'

/**
 * The whole sky, given the whole screen.
 *
 * Split off from `/referrals` because the two want opposite things from a page. `/referrals` is a
 * page you act on — a link to copy, a QR code to show someone, a list of names — and it is laid out in
 * a readable column. The constellation wants the opposite: every pixel it can get, because what it is
 * showing is *extent*, and a sky drawn a few hundred pixels wide inside a text column shows none of
 * it. Sharing a route would have meant one of the two being wrong, so `/referrals` keeps the list and
 * sends people here.
 *
 * **Nothing on this page occupies vertical space except the sky.** The title and the hint are
 * absolutely positioned over it rather than stacked above and below, because anything in the normal
 * flow adds its own height to a frame that is already exactly the viewport, and the page starts to
 * scroll — which on a canvas you pan and zoom with the same gestures is worse than merely untidy. The
 * frame is `overflow-hidden` on top of that, so the rule holds even if something later slips in.
 */
export default function ConstellationPage() {
  const t = useT()
  useRedirectIfSignedOut()

  const {data} = useAPIGetter('get-referral-tree', {})

  const title = t('constellation.title', 'Your constellation')

  return (
    <PageBase
      trackPageView={'constellation'}
      className="col-span-10 min-h-0 overflow-hidden lg:!mt-0 xl:!px-0"
    >
      <SEO
        title={title}
        description={t(
          'constellation.seo',
          'Everyone who is on Compass because of you, and everyone they brought in turn.',
        )}
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {!data ? (
          <div className="flex h-full items-center justify-center">
            <LoadingIndicator />
          </div>
        ) : (
          <ReferralConstellation tree={data} fill />
        )}

        {/* Overlays. `pointer-events-none` on the containers so a drag that starts on the title
            still pans the sky underneath; the link opts back in. The gradient is a scrim, not a bar:
            text sitting directly on the sky lands on stars often enough to be hard to read, and a
            solid header would put back the horizontal band this layout exists to remove. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-baseline justify-between gap-3 bg-gradient-to-b from-white/70 via-white/40 to-transparent px-4 py-3 pb-8 dark:from-black/60 dark:via-black/30">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-ink-900 text-xl font-medium">{title}</h1>
            {data && data.stats.total > 0 && (
              <span className="text-ink-500 text-sm">
                {t(
                  'constellation.subtitle',
                  '{total} people, {direct} of them invited by you, across {generations} generations',
                  {
                    total: String(data.stats.total),
                    direct: String(data.stats.direct),
                    generations: String(data.stats.maxDepth),
                  },
                )}
              </span>
            )}
          </div>
          <Link
            href="/referrals"
            className="text-ink-500 hover:text-ink-800 pointer-events-auto flex shrink-0 items-center gap-1 text-sm"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {t('constellation.back', 'Invite someone')}
          </Link>
        </div>

        {data && (
          <div className="text-ink-400 pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-white/70 via-white/40 to-transparent px-4 pb-12 pt-10 text-center text-xs dark:from-black/60 dark:via-black/30">
            {data.stats.total === 0
              ? t(
                  'constellation.empty',
                  'One star so far — yours. Every person you invite lights another, and everyone they bring lights one further out.',
                )
              : t(
                  'constellation.hint',
                  'Tap a star for who it is. Scroll or pinch to zoom, drag to move around.',
                )}
            {data.stats.truncated &&
              ' ' +
                t(
                  'referrals.truncated',
                  'Your constellation is larger than this page can draw — the outermost generations are not all shown.',
                )}
          </div>
        )}
      </div>
    </PageBase>
  )
}
