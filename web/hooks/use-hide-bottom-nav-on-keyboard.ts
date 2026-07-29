import {useEffect} from 'react'

/**
 * Hides the mobile bottom nav bar while the on-screen keyboard is open, for as long as the calling
 * component is mounted.
 *
 * On a page whose composer is pinned to the bottom (private messages), the nav bar gets pushed up by
 * the keyboard and wedges itself between the keyboard and the input — eating a row of screen height
 * for navigation nobody is using mid-message.
 *
 * The keyboard state itself is tracked in `_app.tsx`, which toggles `keyboard-open` on `<body>` from
 * the Capacitor keyboard events; the rules live in `globals.css` so showing/hiding costs no re-render.
 * Zeroing `--bnv` there also reclaims the bar's height for the page below it.
 */
export const useHideBottomNavOnKeyboard = () => {
  useEffect(() => {
    document.body.classList.add('hide-bottom-nav')
    return () => document.body.classList.remove('hide-bottom-nav')
  }, [])
}
