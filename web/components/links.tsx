import Link from "next/link";

export const CustomLink = ({href, children}: { href?: string; children: React.ReactNode }) => {
  if (!href) return <>{children}</>

  // If href is internal, use Next.js Link
  if (href.startsWith('/')) {
    return <Link href={href}>{children}</Link>
  }

  // For external links, fall back to <a>
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}