/** @jest-environment jsdom */
import {renderHook} from '@testing-library/react'
import {useStickyRail} from 'web/hooks/use-sticky-rail'

// jsdom has no layout: give the rail a height and the window a viewport by hand.
const VIEWPORT = 800

beforeAll(() => {
  ;(global as any).ResizeObserver = class {
    observe() {}
    disconnect() {}
  }
})

const setup = (railHeight: number) => {
  Object.defineProperty(window, 'innerHeight', {configurable: true, value: VIEWPORT})
  Object.defineProperty(window, 'scrollY', {configurable: true, writable: true, value: 0})
  const el = document.createElement('div')
  Object.defineProperty(el, 'offsetHeight', {configurable: true, value: railHeight})
  document.body.appendChild(el)
  const hook = renderHook(() => useStickyRail({current: el}, {top: 24, bottom: 24}))
  const scrollTo = (y: number) => {
    ;(window as any).scrollY = y
    window.dispatchEvent(new Event('scroll'))
  }
  return {el, hook, scrollTo}
}

describe('useStickyRail', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('pins a rail that fits the viewport at its top offset', () => {
    const {el, scrollTo} = setup(500)
    expect(el.style.top).toBe('24px')
    scrollTo(1000)
    expect(el.style.top).toBe('24px')
  })

  it('travels with the page until its bottom, then its top, is in view', () => {
    // Lowest top: 800 - 2000 - 24 = -1224.
    const {el, scrollTo} = setup(2000)
    expect(el.style.top).toBe('24px')

    scrollTo(500)
    expect(el.style.top).toBe('-476px')
    scrollTo(5000)
    expect(el.style.top).toBe('-1224px')

    // Scrolling back up moves it straight away, not only once the page is back at the rail's top.
    scrollTo(4900)
    expect(el.style.top).toBe('-1124px')
    scrollTo(0)
    expect(el.style.top).toBe('24px')
  })

  it('clears its top and stops listening on unmount', () => {
    const {el, hook, scrollTo} = setup(2000)
    hook.unmount()
    expect(el.style.top).toBe('')
    scrollTo(500)
    expect(el.style.top).toBe('')
  })
})
