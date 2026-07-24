import {useEffect, useState} from 'react'

/**
 * Resolves Tailwind colour CSS variables (e.g. `--color-primary-500`) to concrete `rgb(r g b)` strings,
 * and re-resolves when the theme flips — the app stamps `data-theme` / a class on `<html>`.
 *
 * Why it exists: recharts writes fills as SVG *presentation attributes*, which do not evaluate `var()`.
 * So a chart can't just reference `rgb(var(--color-primary-500))` the way normal CSS can; it needs the
 * value read out of the cascade. Raw SVG we render ourselves can use `var()` inline and doesn't need this.
 *
 * Runs entirely in an effect (no `getComputedStyle` on the server); components that use it for chart
 * fills should be client-only anyway. Before the first effect it returns `null`s, so guard on that.
 */
export function useThemeColors(varNames: string[]): (string | null)[] {
  const key = varNames.join(',')
  const [colors, setColors] = useState<(string | null)[]>(() => varNames.map(() => null))

  useEffect(() => {
    const names = key.split(',')
    const resolve = () => {
      const styles = getComputedStyle(document.documentElement)
      setColors(
        names.map((n) => {
          const v = styles.getPropertyValue(n).trim()
          return v ? `rgb(${v})` : null
        }),
      )
    }
    resolve()
    // The theme toggle mutates <html> rather than firing an event, so watch the attributes it touches.
    const observer = new MutationObserver(resolve)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    })
    return () => observer.disconnect()
  }, [key])

  return colors
}
