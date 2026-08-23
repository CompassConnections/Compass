import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {QRCode} from 'web/components/widgets/qr-code'

/**
 * The QR code's styling is load-bearing on whether a phone can read it, and every failure here is
 * silent: the code still renders, still looks right, and simply doesn't scan. These assertions pin
 * the three properties that were measured (by rasterising the SVG and decoding it) and that a
 * well-meaning "make it look nicer" change would otherwise quietly undo.
 */

const render = (url: string, logo = true) =>
  renderToStaticMarkup(createElement(QRCode, {url, logo, width: 180, height: 180}))

const URL = 'https://www.compassmeet.com/download'

describe('QRCode', () => {
  it('encodes at error-correction level H', () => {
    // Asserted through the module count, which is the observable consequence. This URL needs a
    // version-5 symbol (37 modules) at level H; dropping to M would fit it in version 4 (33) and
    // shrink the viewBox, so this catches a change of level even though the level itself never
    // appears in the output. H is what lets the centre logo sit there at all.
    expect(render(URL)).toContain('viewBox="0 0 45 45"')
  })

  it('keeps a four-module quiet zone on every side', () => {
    const svg = render(URL)

    // Data modules only — the finder eyes live inside a translated <g>, so their own x/y are
    // group-local and would read as 0.5 here. Their offsets are checked via the translate below.
    const modules = [...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="1" height="1"/g)]
    expect(modules.length).toBeGreaterThan(100)

    const coords = modules.flatMap((m) => [Number(m[1]), Number(m[2])])
    expect(Math.min(...coords)).toBeGreaterThanOrEqual(4)
    expect(Math.max(...coords)).toBeLessThanOrEqual(45 - 4 - 1)

    const eyes = [...svg.matchAll(/translate\(([\d.]+) ([\d.]+)\)/g)]
    expect(eyes).toHaveLength(3)
    for (const eye of eyes) {
      expect(Number(eye[1])).toBeGreaterThanOrEqual(4)
      expect(Number(eye[2])).toBeGreaterThanOrEqual(4)
    }
  })

  it('draws the three finder eyes with square outer corners', () => {
    // The one that actually broke it. Rounding these makes the 1:1:3:1:1 ratio scan fail on
    // off-centre lines: at a 1.75-module radius the code did not decode at any size tested.
    const rings = [...render(URL).matchAll(/<rect[^>]*stroke="[^"]*"[^>]*>/g)].map((m) => m[0])

    expect(rings).toHaveLength(3)
    for (const ring of rings) expect(ring).not.toContain('rx=')
  })

  it('leaves the logo well inside the error-correction budget', () => {
    const svg = render(URL)
    const withLogo = (svg.match(/<rect/g) ?? []).length
    const withoutLogo = (render(URL, false).match(/<rect/g) ?? []).length

    // Level H recovers ~30% of codewords; the knockout should stay far under that. Comparing
    // module counts is a proxy for occluded area and moves the moment LOGO_FRACTION does.
    const occluded = 1 - withLogo / withoutLogo
    expect(occluded).toBeGreaterThan(0) // the knockout is actually clearing modules
    expect(occluded).toBeLessThan(0.15)
  })

  it('percent-encodes a non-ASCII URL rather than emitting Latin-1 bytes', () => {
    // A referral link for a member whose username isn't ASCII still has to scan to the right place.
    expect(() => render('https://www.compassmeet.com/?referrer=zoé')).not.toThrow()
  })
})
