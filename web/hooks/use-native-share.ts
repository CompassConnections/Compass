import {useEffect, useState} from 'react'
import {canNativeShare} from 'web/lib/util/share'

/**
 * Whether this device can open an OS share sheet, resolved after mount.
 *
 * Starts `false` so the server render and the first client render agree — desktop, where there is no
 * sheet, is also the case where the answer never changes. Anything that gates *content* on this (the
 * "Share…" row in the share panel) therefore appears a tick late on phones, which is invisible inside
 * a panel that only opens on a tap.
 */
export function useCanNativeShare() {
  const [canShare, setCanShare] = useState(false)
  useEffect(() => setCanShare(canNativeShare()), [])
  return canShare
}
