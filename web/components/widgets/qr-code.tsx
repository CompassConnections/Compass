import qrcode from 'qrcode-generator'
import {useMemo} from 'react'

/**
 * A QR code, drawn here rather than fetched as a PNG from someone else's server.
 *
 * **Why it stopped being an `<img>`.** This used to be a nine-line wrapper around
 * `api.qrserver.com`, which had three problems and no upside. It put the encoded URL on a third
 * party's servers — and on `/referrals` that URL carries the member's own username, which is not a
 * thing a site whose whole argument is transparency should be quietly shipping to goqr.me. It
 * needed the network, so the code was a broken image inside the native app, which is exactly where
 * someone is most likely to be showing their phone to another person. And it was a flat raster with
 * nothing to style. Generating the matrix locally costs ~12KB gzipped and fixes all three.
 *
 * **The design constraints are not negotiable, and they're why this looks the way it does:**
 * - **Error correction H.** A logo over the middle destroys codewords; level H tolerates ~30% loss,
 *   the default L tolerates 7% and would simply stop scanning.
 * - **The logo covers ~10% of the code's area** (a square 32% of the side). Comfortably inside H's
 *   budget, and centred — never over the three finder eyes or the timing runs between them.
 * - **A four-module quiet zone.** Part of the spec, routinely lost to someone tightening padding,
 *   and its absence is the single most common reason a nice-looking code won't scan.
 * - **Dark-on-light in both themes.** Inverting for dark mode is legal in the spec and unreliable
 *   in the wild, so the plate stays light and the modules stay navy no matter what the page does.
 *   These are the two colours here not taken from the theme tokens, deliberately.
 * - **Navy modules, not amber.** Brand amber on white measures about 3:1, which is where cheap
 *   scanners in bad light start failing. The favicon's navy is ~11:1. The amber lives in the logo.
 *
 * **Every styling choice here was decoded before it shipped**, by rasterising the rendered SVG and
 * running OpenCV's detector over it at 96/120/144/180/360/720px. That is a stricter reader than a
 * phone camera, so passing it is margin rather than proof — but two of the three "obviously fine"
 * decorative choices failed it outright, which is the whole reason the geometry below looks
 * conservative. See the notes on the finder eyes and on the module shape.
 *
 * One measured limit worth knowing: at this URL length the code is version 5 (37 modules), and
 * below about 144px it stops resolving cleanly no matter how it's styled — roughly 3px per module
 * is the floor. `/referrals` renders at 144 and `/download` at 180, so both clear it, but don't
 * shrink either without re-running the check. A shorter URL is the real lever if you ever need a
 * smaller code: fewer characters means a lower version means fatter modules.
 */

/** Modules of clear space around the code. Four is the spec minimum. */
const QUIET = 4

/** Side of the logo knockout, as a fraction of the code's side — so it occludes ~10% of the code's
 *  area, against level H's ~30% budget. This is the largest value that still decoded at every test
 *  size; the mark is barely legible below it, and past it the margin stops being comfortable. */
const LOGO_FRACTION = 0.32

/** From `web/public/favicon.svg` — the same navy the mark itself is drawn in. */
const MODULE_COLOR = '#1d384b'

/** Corner radius of a data module, in module units. 0.5 would be a circle; 0.4 is as soft as this
 *  survived decoding at 96px in testing, and 0.5 did not. */
const MODULE_RADIUS = 0.4

export function QRCode(props: {
  url: string
  className?: string
  width?: number
  height?: number
  /** Set false for a code that has to survive being printed small, or scanned in poor light. */
  logo?: boolean
}) {
  const {url, className, width = 200, height = 200, logo = true} = props

  const {count, modules} = useMemo(() => {
    // qrcode-generator's default byte encoder is Latin-1, so a non-ASCII character would be
    // encoded as a single byte and come back mangled from any scanner decoding UTF-8. Percent-
    // encoding first sidesteps that and is what a URL should look like anyway — but only when
    // there is something to encode, or an already-escaped URL would get its `%`s doubled.
    const payload = /[^\x20-\x7e]/.test(url) ? encodeURI(url) : url

    const qr = qrcode(0, 'H')
    qr.addData(payload)
    qr.make()

    const n = qr.getModuleCount()
    const dark: [number, number][] = []
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (qr.isDark(row, col)) dark.push([row, col])
      }
    }
    return {count: n, modules: dark}
  }, [url])

  const size = count + QUIET * 2

  // The three 7×7 finder patterns, drawn by hand below so they can have their own geometry.
  const isFinder = (row: number, col: number) =>
    (row < 7 && col < 7) || (row < 7 && col >= count - 7) || (row >= count - 7 && col < 7)

  // Half-side of the knockout in module units, plus a half-module so no data dot pokes out from
  // under the plate's edge.
  const knockout = (count * LOGO_FRACTION) / 2 + 0.5
  const centre = count / 2
  const underLogo = (row: number, col: number) =>
    logo && Math.abs(row + 0.5 - centre) < knockout && Math.abs(col + 0.5 - centre) < knockout

  const plate = count * LOGO_FRACTION
  const mark = plate * 0.74

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={`QR code for ${url}`}
      shapeRendering="geometricPrecision"
    >
      {/* The quiet zone is this rect's margin, so it has to be painted — a transparent code on a
          tinted card has no quiet zone at all, whatever the maths says. */}
      <rect width={size} height={size} fill="#ffffff" rx={1.5} />

      <g fill={MODULE_COLOR}>
        {/* Full-size modules with rounded corners, NOT inset dots. Shrinking a module to 0.88 to
            get separated dots is the prettier idea and it measurably costs decoding: the inset
            version failed to decode at 720px in testing, where this one reads at every size from
            144px up. Rounding alone is free — adjacent modules still touch, so runs merge into
            soft-cornered blobs and the code keeps its ink. */}
        {modules.map(([row, col]) =>
          isFinder(row, col) || underLogo(row, col) ? null : (
            <rect
              key={`${row}-${col}`}
              x={QUIET + col}
              y={QUIET + row}
              width={1}
              height={1}
              rx={MODULE_RADIUS}
            />
          ),
        )}

        {/* Finder eyes: a square 7×7 ring with a 3×3 centre, drawn as two rects instead of 33
            individual modules so the corners stay crisp.

            **The outer ring is square on purpose and must stay square.** Rounding it is the single
            most tempting change on this component and the one that breaks it: detection scans lines
            across these three patterns looking for a 1:1:3:1:1 dark-light ratio, and off-centre
            scan lines through a rounded ring return the wrong ratio. Measured, at four render
            sizes — a 1.75-module corner radius (which is what "make it look like a modern QR"
            produces) failed to decode at every size tested; 1.0 failed at three of four; 0.5 failed
            at one; only 0 decoded everywhere. The inner dot is off the critical path, so it gets
            the softening instead. */}
        {(
          [
            [0, 0],
            [0, count - 7],
            [count - 7, 0],
          ] as const
        ).map(([row, col]) => (
          <g key={`eye-${row}-${col}`} transform={`translate(${QUIET + col} ${QUIET + row})`}>
            <rect
              x={0.5}
              y={0.5}
              width={6}
              height={6}
              fill="none"
              stroke={MODULE_COLOR}
              strokeWidth={1}
            />
            <rect x={2} y={2} width={3} height={3} rx={0.6} />
          </g>
        ))}
      </g>

      {logo && (
        <>
          {/* A light plate under the mark: the app icon is cream-on-navy and would otherwise sit
              directly against data modules with nothing separating the two. */}
          <rect
            x={QUIET + centre - plate / 2}
            y={QUIET + centre - plate / 2}
            width={plate}
            height={plate}
            rx={plate * 0.22}
            fill="#ffffff"
          />
          <image
            href="/icons/icon-192x192.png"
            x={QUIET + centre - mark / 2}
            y={QUIET + centre - mark / 2}
            width={mark}
            height={mark}
            preserveAspectRatio="xMidYMid meet"
            // A bundled asset, so it resolves inside the native app's static export too — which is
            // the one place the old remote-PNG version rendered nothing at all.
            clipPath="url(#qr-mark-clip)"
          />
          <defs>
            <clipPath id="qr-mark-clip">
              <rect
                x={QUIET + centre - mark / 2}
                y={QUIET + centre - mark / 2}
                width={mark}
                height={mark}
                rx={mark * 0.22}
              />
            </clipPath>
          </defs>
        </>
      )}
    </svg>
  )
}
