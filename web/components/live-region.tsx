import {createContext, useCallback, useContext, useRef} from 'react'

interface LiveRegionContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null)

export function useLiveRegion() {
  const context = useContext(LiveRegionContext)
  if (!context) {
    return {announce: () => {}}
  }
  return context
}

export function LiveRegionProvider({children}: {children: React.ReactNode}) {
  const politeRef = useRef<HTMLDivElement>(null)
  const assertiveRef = useRef<HTMLDivElement>(null)

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const element = priority === 'assertive' ? assertiveRef.current : politeRef.current
    if (element) {
      element.textContent = ''
      setTimeout(() => {
        if (element) element.textContent = message
      }, 50)
    }
  }, [])

  return (
    <LiveRegionContext.Provider value={{announce}}>
      {children}
      <div ref={politeRef} aria-live="polite" aria-atomic="true" className="sr-only" />
      <div ref={assertiveRef} aria-live="assertive" aria-atomic="true" className="sr-only" />
    </LiveRegionContext.Provider>
  )
}
