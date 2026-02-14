import Link from 'next/link'
import {isNativeMobile} from "web/lib/util/webview";

interface NewTabLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function NewTabLink({href, children, className, onClick}: NewTabLinkProps) {
  // New tabs don't work on native apps
  const isNative = isNativeMobile()
  return (
    <Link href={href} onClick={onClick} target={isNative ? undefined : "_blank"} className={className}>
      {children}
    </Link>
  )
}
