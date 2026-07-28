import clsx from 'clsx'

/**
 * The outlets that have covered Compass, and the one place their logos are described.
 *
 * Extracted out of `pages/about.tsx` because `/press` needs the same four marks — once beside the
 * article that each one published, and once as the strip at the top of the page. Two copies of the
 * per-logo height tuning is exactly the kind of thing that drifts.
 *
 * All four logos show in their real, native color at all times — no grayscale/invert treatment. The tile
 * uses the page's own surface tokens (`bg-canvas-100`) rather than a hardcoded white, so it sits quietly on
 * the card in either theme instead of punching a bright rectangle into a dark page, and each logo's own
 * colors (DH's navy and red, RCF's orange, L’Avenir and Matélé's green) provide their own contrast against
 * that neutral tile without needing to be forced into a silhouette.
 *
 * All four files are downloaded from each outlet's own official site (not a logo-aggregator or a Wikipedia
 * fair-use scan) and live in `web/public/images/press/`.
 */

export type OutletId = 'rcf' | 'dh' | 'lavenir' | 'matele'

export type Outlet = {
  name: string
  src: string
  /** Per-logo height. The marks have wildly different aspect ratios — L’Avenir is a wordmark, DH a
   *  square icon — so a single height would make one of them a stamp and another a hairline. */
  className: string
}

export const OUTLETS: Record<OutletId, Outlet> = {
  rcf: {name: 'RCF', src: '/images/press/rcf-logo.png', className: 'h-9'},
  // Hand-vectorized recreation of DH's square icon mark (navy + red tiles) — see the comment in the
  // `<svg>` file itself for why it's a recreation rather than a traced official asset.
  dh: {name: 'La DH', src: '/images/press/la-dh-logo.svg', className: 'h-12'},
  lavenir: {name: 'L’Avenir', src: '/images/press/lavenir-logo.svg', className: 'h-5'},
  matele: {name: 'Matélé', src: '/images/press/matele-logo.png', className: 'h-10'},
}

/** Oldest outlet first is meaningless here; this is the order the strip reads best in. */
export const OUTLET_ORDER: OutletId[] = ['rcf', 'dh', 'lavenir', 'matele']

/**
 * One logo on its neutral tile. `size` exists because the same mark appears as the lead visual of a
 * featured article and as a small identifier on the rows below it, and scaling the tile without scaling
 * the logo inside it leaves the mark marooned in whitespace.
 */
export function OutletLogo({
  outlet,
  size = 'md',
  className,
}: {
  outlet: OutletId
  size?: 'sm' | 'md'
  className?: string
}) {
  const {name, src, className: logoClass} = OUTLETS[outlet]

  return (
    <div
      className={clsx(
        'flex flex-shrink-0 items-center justify-center rounded-xl bg-canvas-100 ring-1 ring-canvas-200',
        size === 'md' ? 'h-16 w-32 p-4' : 'h-12 w-24 p-3',
        className,
      )}
    >
      <img
        src={src}
        alt={name}
        className={clsx(logoClass, size === 'sm' && 'scale-75', 'w-auto object-contain')}
      />
    </div>
  )
}

/** The four marks in a row — the "as seen in" strip on `/about` and at the top of `/press`. */
export function PressLogos({className}: {className?: string}) {
  return (
    <div className={clsx('flex flex-wrap items-center gap-4', className)}>
      {OUTLET_ORDER.map((id) => (
        <OutletLogo
          key={id}
          outlet={id}
          className="transition-all duration-200 hover:shadow-md hover:ring-primary-200"
        />
      ))}
    </div>
  )
}
