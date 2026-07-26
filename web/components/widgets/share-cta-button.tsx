import {CheckIcon, ShareIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {useState} from 'react'
import {copyToClipboard} from 'web/lib/util/copy'
import {nativeShare} from 'web/lib/util/share'

/**
 * Primary-CTA share button, shared between the /about closing block and anywhere else a share action
 * should read as the loudest thing on screen rather than a secondary icon button.
 *
 * Opens the OS share sheet first (phones can pick WhatsApp, Messages, ...), falling back to copying the
 * link — with a "Copied!" confirmation — when no sheet appears: desktop, a browser without the Web Share
 * API, or the sheet being dismissed. `nativeShare` is probed at click time, so there's no SSR/first-paint
 * branch to get wrong, and it's what makes the Android app work: its WebView has no `navigator.share`, so
 * a bare Web Share API check would silently degrade the app to copy-the-link.
 */
export function ShareCTAButton(props: {
  url: string
  shareTitle: string
  shareText: string
  label: string
  copiedLabel: string
  className?: string
}) {
  const {url, shareTitle, shareText, label, copiedLabel, className} = props
  const [copied, setCopied] = useState(false)

  const onClick = async () => {
    // The user dismissing the share sheet also reports false; re-copying the link is a harmless outcome.
    const shared = await nativeShare({title: shareTitle, text: shareText, url})
    if (shared) return

    copyToClipboard(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold',
        'transition-all duration-200 ease-out',
        'bg-cta text-white border-cta hover:bg-cta-hover',
        'shadow-[0_6px_20px_-6px_rgba(193,127,62,0.6)]',
        className,
      )}
    >
      {copied ? (
        <CheckIcon className="h-[1.05rem] w-[1.05rem]" strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <ShareIcon className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} aria-hidden="true" />
      )}
      {copied ? copiedLabel : label}
    </button>
  )
}
