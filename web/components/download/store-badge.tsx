import clsx from 'clsx'
import {ANDROID_APP_URL, IOS_APP_URL} from 'common/constants'
import {FaApple, FaGooglePlay} from 'react-icons/fa'
import {AppStore} from 'web/hooks/use-app-download'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'

/**
 * The store lockup: small line above, store name below, glyph on the left.
 *
 * **Not the page's own button vocabulary.** Everything else here uses `surface` or the amber CTA,
 * and a store link deliberately doesn't: this is the one control on the site whose job is to be
 * instantly recognisable as *the thing you tap to install an app*, and that recognition lives in a
 * shape people have seen ten thousand times. Restyling it into a Compass-amber pill would be the
 * more coherent page and the worse button.
 *
 * `bg-ink-1000 text-canvas-0` rather than a literal black: those two tokens invert with the theme,
 * so this is black-on-white in light mode and a white badge in dark — which is what both vendors'
 * own guidelines ask for, and it costs nothing to get right by using the ramp instead of a hex.
 *
 * **Before launch**, swap the glyph + text for the official badge artwork (Apple's "Download on the
 * App Store" lockup, Google's "Get it on Google Play" PNG). Both vendors require their own asset
 * for this exact phrasing; this reproduction is dimensionally faithful but is not their file.
 */
export function StoreBadge(props: {store: AppStore; large?: boolean; className?: string}) {
  const {store, large, className} = props
  const t = useT()

  const isIos = store === 'ios'
  const Icon = isIos ? FaApple : FaGooglePlay

  return (
    <a
      href={isIos ? IOS_APP_URL : ANDROID_APP_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('download: store badge', {store})}
      className={clsx(
        'group inline-flex items-center gap-3 rounded-xl bg-ink-1000 text-canvas-0',
        'ring-1 ring-ink-1000/10 dark:ring-canvas-0/20',
        'transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5',
        'shadow-[0_2px_6px_rgb(44_36_22/0.10)] hover:shadow-[0_10px_28px_-12px_rgb(44_36_22/0.55)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        large ? 'px-6 py-3.5' : 'px-5 py-3',
        className,
      )}
    >
      <Icon className={clsx('flex-shrink-0', large ? 'h-8 w-8' : 'h-7 w-7')} aria-hidden />
      <span className="flex flex-col text-left leading-none">
        <span className={clsx('opacity-80', large ? 'text-[11px]' : 'text-[10px]')}>
          {isIos
            ? t('download.badge.ios.top', 'Download on the')
            : t('download.badge.android.top', 'Get it on')}
        </span>
        <span className={clsx('mt-1 font-semibold', large ? 'text-[19px]' : 'text-[17px]')}>
          {isIos
            ? t('download.badge.ios.name', 'App Store')
            : t('download.badge.android.name', 'Google Play')}
        </span>
      </span>
    </a>
  )
}
