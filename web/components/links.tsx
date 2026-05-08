import Link from 'next/link'

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

  // If href is internal, use Next.js Link
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={className}>
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
