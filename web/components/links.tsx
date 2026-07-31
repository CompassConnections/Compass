import Link from 'next/link'
import {internalPathOf} from 'web/lib/util/link'

export const CustomLink = ({
  href,
  children,
  className,
}: {
  href?: string
  children: React.ReactNode
  className?: string
}) => {
  if (!href) return <>{children}</>

  // If href points back into Compass — including as an absolute compassmeet.com URL, which is how a
  // shared link arrives in a chat message — route client-side instead of leaving the app.
  const path = internalPathOf(href)
  if (path) {
    return (
      <Link href={path} className={className}>
        {children}
      </Link>
    )
  }

  // For external links, fall back to <a>
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  )
}
