import {RefObject, useState} from 'react'

import {useSafeLayoutEffect} from './use-safe-layout-effect'

export type ElementSize = {width: number; height: number}

/**
 * Live border-box size of an element, or null until it has been laid out.
 *
 * Layout effect so the first paint after mount already has the real numbers: callers use this to
 * size a sibling, and a frame at the fallback size reads as a flicker.
 */
export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<ElementSize | null>(null)

  useSafeLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const {width, height} = el.getBoundingClientRect()
      if (!width && !height) return
      setSize((prev) =>
        prev && Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
          ? prev
          : {width, height},
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return size
}
