import {useEffect} from 'react'

const COUNT_PREFIX = /^\(\d+\+?\) /

// Prefixes the tab title with an unread count, e.g. "(3) Messages | Compass", so a new message is
// visible from a background tab. Pages own the title through next/head, which rewrites it on every
// navigation and head update, so a single write would be lost — instead we watch <head> and re-apply
// the prefix to whatever base title is current.
export function useUnseenCountTitle(count: number) {
  useEffect(() => {
    const prefix = count > 0 ? `(${count > 9 ? '9+' : count}) ` : ''
    const apply = () => {
      const next = prefix + document.title.replace(COUNT_PREFIX, '')
      if (document.title !== next) document.title = next
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.head, {subtree: true, childList: true, characterData: true})
    return () => {
      observer.disconnect()
      document.title = document.title.replace(COUNT_PREFIX, '')
    }
  }, [count])
}
