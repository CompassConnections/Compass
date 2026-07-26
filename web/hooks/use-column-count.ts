import {clamp} from 'lodash'
import {RefObject, useEffect, useLayoutEffect, useState} from 'react'

/** Layout effect on the client so the first paint already has the right column count. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export type ColumnCountOptions = {
  /** Narrowest a card may get before dropping a column. Drives the reading measure. */
  minCardWidth: number
  maxColumns: number
  /** Gap between columns, so the fit accounts for it. */
  gap?: number
}

/**
 * Column count for JS-driven masonry layouts, measured from the container rather than the
 * viewport — the people page has a sidebar and an optional docked filter panel, so the same
 * viewport width can leave very different amounts of room for cards.
 */
export function useColumnCount(
  containerRef: RefObject<HTMLElement | null>,
  options: ColumnCountOptions,
) {
  const {minCardWidth, maxColumns, gap = 16} = options
  const [columnCount, setColumnCount] = useState(1)

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const measure = () => {
      const width = el.clientWidth
      if (!width) return
      // n columns fit when (width - gap * (n - 1)) / n >= minCardWidth.
      const fits = Math.floor((width + gap) / (minCardWidth + gap))
      setColumnCount(clamp(fits, 1, maxColumns))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef, minCardWidth, maxColumns, gap])

  return columnCount
}
