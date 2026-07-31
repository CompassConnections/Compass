import clsx from 'clsx'
import Link from 'next/link'
import {Fragment} from 'react'
import {internalPathOf} from 'web/lib/util/link'

import {linkClass} from './site-link'

// Return a JSX span, linkifying @username, and https://...
export function Linkify(props: {text: string; className?: string}) {
  const {text, className} = props

  // Handle undefined/null text
  if (!text) {
    return <span className={clsx(className, 'break-anywhere')}></span>
  }
  // Replace "m1234" with "ϻ1234"
  // const mRegex = /(\W|^)m(\d+)/g
  // text = text.replace(mRegex, (_, pre, num) => `${pre}ϻ${num}`)

  // Find instances of @username, #hashtag, and https://...
  const regex =
    /(?:^|\s)(?:@[a-z0-9_]+|https?:\/\/[-A-Za-z0-9+&@#/%?=~_()|!:,.;]*[-A-Za-z0-9+&@#/%=~_|])/gi
  const matches = text.match(regex) || []
  const links = matches.map((match) => {
    // Matches are in the form: " @username" or "https://example.com"
    const whitespace = match.match(/^\s/)
    const symbol = match.trim().substring(0, 1)
    const tag = match.trim().substring(1)
    const rawHref =
      {
        '@': `/${tag}`,
      }[symbol] ?? match.trim()
    // A compassmeet.com URL routes client-side, so the app never hands it off to the OS browser.
    const href = internalPathOf(rawHref) ?? rawHref

    return (
      <>
        {whitespace}

        <Link
          target={getLinkTarget(href)}
          className={clsx(linkClass, 'text-primary-700')}
          href={href}
        >
          {symbol}
          {tag}
        </Link>
      </>
    )
  })
  return (
    <span className={clsx(className, 'break-anywhere')}>
      {text.split(regex).map((part, i) => (
        <Fragment key={i}>
          {part}
          {links[i]}
        </Fragment>
      ))}
    </span>
  )
}

export const getLinkTarget = (href: string, newTab?: boolean) => {
  // mailto:/tel: keep the caller's default — only a genuine off-site page wants a new tab.
  if (/^https?:\/\//i.test(href) && !internalPathOf(href)) return '_blank'
  return newTab ? '_blank' : '_self'
}
