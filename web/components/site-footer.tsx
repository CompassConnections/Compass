import clsx from 'clsx'
import {
  discordLink,
  githubRepo,
  instagramLink,
  mastodonLink,
  supportEmail,
  xLink,
} from 'common/constants'
import {IS_WEBVIEW} from 'common/hosting/constants'
import Link from 'next/link'
import {ComponentType, useEffect, useState} from 'react'
import {FaDiscord, FaGithub, FaInstagram, FaMastodon} from 'react-icons/fa'
import {FaXTwitter} from 'react-icons/fa6'
import {LanguagePicker} from 'web/components/language/language-picker'
import SiteLogo from 'web/components/site-logo'
import {DOWNLOAD_PAGE} from 'web/hooks/use-app-download'
import {useT} from 'web/lib/locale'
import {isNativeApp} from 'web/lib/util/webview'

/**
 * A footer link. `key` and `name` follow the sidebar's `Item` shape so the two can share translation
 * keys: a page named "What's new" in the rail is "What's new" down here too, in every language.
 */
export type FooterLink = {
  key: string
  name: string
  href: string
}

export type FooterColumn = {
  key: string
  name: string
  links: FooterLink[]
}

/**
 * The footer's link map, in reading order.
 *
 * Kept as data rather than JSX so a test can check every internal `href` against `web/pages` — a
 * footer is the one place on the site that links to the long tail of pages (financials, constitution,
 * delete-account) that nothing else links to, which is exactly where a route can be renamed without
 * anything visibly breaking.
 *
 * What is deliberately *not* here: anything that depends on who is looking (profile, messages,
 * referrals). The footer is the same for everyone, so it renders identically on the server and
 * never has to wait for auth to resolve.
 */
export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    key: 'footer.explore',
    name: 'Explore',
    links: [
      {key: 'nav.people', name: 'People', href: '/'},
      {key: 'nav.about', name: 'About', href: '/about'},
      {key: 'nav.faq', name: 'FAQ', href: '/faq'},
      {key: 'footer.compatibility', name: 'Compatibility questions', href: '/compatibility'},
      {key: 'nav.blog', name: 'Blog', href: '/blog'},
      {key: 'nav.news', name: "What's new", href: '/news'},
      {key: 'footer.stats', name: 'Statistics', href: '/stats'},
      {key: 'download.cta.generic', name: 'Get the app', href: DOWNLOAD_PAGE},
    ],
  },
  {
    key: 'footer.community',
    name: 'Community',
    links: [
      {key: 'social.discord', name: 'Discord', href: discordLink},
      {key: 'nav.vote', name: 'Vote', href: '/vote'},
      {key: 'nav.social', name: 'Socials', href: '/social'},
      {key: 'footer.press', name: 'Press', href: '/press'},
      {key: 'footer.donate', name: 'Donate', href: '/donate'},
      {key: 'footer.source_code', name: 'Source code', href: githubRepo},
    ],
  },
  {
    key: 'footer.organization',
    name: 'Organization',
    links: [
      {key: 'nav.organization', name: 'Organization', href: '/organization'},
      {key: 'footer.financials', name: 'Financials', href: '/financials'},
      {key: 'footer.values', name: 'Our values', href: '/values'},
      {key: 'footer.constitution', name: 'Constitution', href: '/constitution'},
      {key: 'footer.safety', name: 'Safety guide', href: '/safety'},
      {key: 'footer.security', name: 'Security', href: '/security'},
    ],
  },
  {
    key: 'footer.support',
    name: 'Support & legal',
    links: [
      {key: 'footer.help', name: 'Help & support', href: '/help'},
      {key: 'nav.contact', name: 'Contact', href: '/contact'},
      {key: 'footer.privacy', name: 'Privacy policy', href: '/privacy'},
      {key: 'footer.terms', name: 'Terms of service', href: '/terms'},
      {key: 'footer.delete_account', name: 'Delete your account', href: '/delete-account'},
    ],
  },
]

/**
 * Where Compass lives elsewhere. The icons and the "Discord" / "Source code" rows above overlap on
 * purpose: the row is for someone reading the columns, the icons for someone scanning for a logo.
 */
export const FOOTER_SOCIALS: {
  key: string
  name: string
  href: string
  icon: ComponentType<{className?: string}>
  // `me` is what lets Mastodon verify that this site and the account belong to the same owner.
  rel?: string
}[] = [
  {key: 'social.discord', name: 'Discord', href: discordLink, icon: FaDiscord},
  {key: 'social.github', name: 'GitHub', href: githubRepo, icon: FaGithub},
  {key: 'social.x', name: 'X / Twitter', href: xLink, icon: FaXTwitter},
  {key: 'social.mastodon', name: 'Mastodon', href: mastodonLink, icon: FaMastodon, rel: 'me'},
  {key: 'social.instagram', name: 'Instagram', href: instagramLink, icon: FaInstagram},
]

export const isExternalHref = (href: string) =>
  /^(https?:)?\/\//.test(href) || href.startsWith('mailto:')

/**
 * Whether we're inside the native shell, settled in two steps so the server and the first client
 * render agree. `IS_WEBVIEW` is the build-time answer and is what the app's static export is built
 * with, so in production the footer is simply never in the app's markup. `isNativeApp()` is the
 * runtime answer, which additionally covers the dev mode where the shell loads the dev server over
 * the LAN: there the prerendered HTML says "web", and reading Capacitor during render would make the
 * hydration disagree with it. Reading it in an effect instead means that one mode shows the footer
 * for a frame and then drops it, which is the harmless version of the mismatch.
 */
function useIsNativeApp() {
  const [isApp, setIsApp] = useState(IS_WEBVIEW)
  useEffect(() => {
    setIsApp(isNativeApp())
  }, [])
  return isApp
}

/** The home strip's ring, with the offset matched to the espresso so it stays visible here. */
const focusRingDark =
  'rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-950'

const linkClass = clsx(
  'text-body text-white/70 transition-colors duration-150 hover:text-white',
  focusRingDark,
)

function FooterAnchor(props: {href: string; className?: string; children: React.ReactNode}) {
  const {href, className, children} = props
  if (isExternalHref(href))
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

/**
 * The site-wide footer: the long tail of pages, the places Compass lives off-site, and the legal
 * links, on the same espresso as the sidebar rail so the two read as one frame around the page.
 *
 * Web only. In the native apps the bottom of every page is the tab bar, the store listings carry the
 * legal links, and App Review does not love "download the app" rows inside the app.
 */
export function SiteFooter(props: {className?: string}) {
  const {className} = props
  const t = useT()
  const isApp = useIsNativeApp()

  if (isApp) return null

  const year = new Date().getFullYear()

  return (
    <footer
      data-testid="site-footer"
      // `sidebar-nav` for the same serif the rail uses, so the frame is set in one face.
      className={clsx(
        'sidebar-nav bg-canvas-950 text-white/70 border-t border-white/[0.06]',
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-[1.6fr_repeat(4,1fr)]">
          {/* Brand column: full width on phones, where five columns would be unreadable, then its own
              wider column from lg. */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 flex flex-col gap-4">
            <SiteLogo
              className={clsx('text-black invert !pb-0 !pt-0 sm:!pt-0 w-fit', focusRingDark)}
            />
            <p className="max-w-xs text-body text-white/70">
              {t(
                'footer.tagline',
                'The free directory to find your people, searchable by values and demographics. No ads, no swipes.',
              )}
            </p>
            <ul
              className="m-0 flex list-none flex-wrap gap-1 p-0"
              aria-label={t('footer.socials', 'Compass elsewhere')}
            >
              {FOOTER_SOCIALS.map(({key, name, href, icon: Icon, rel}) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel={rel ? `${rel} noopener noreferrer` : 'noopener noreferrer'}
                    aria-label={t(key, name)}
                    title={t(key, name)}
                    className={clsx(
                      'flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors duration-150 hover:bg-white/[0.08] hover:text-white',
                      focusRingDark,
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.key} aria-labelledby={`${column.key}-heading`} className="min-w-0">
              <h2
                id={`${column.key}-heading`}
                className="sidebar-text mb-3 text-body font-semibold"
              >
                {t(column.key, column.name)}
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {column.links.map((link) => (
                  <li key={link.key}>
                    <FooterAnchor href={link.href} className={linkClass}>
                      {t(link.key, link.name)}
                    </FooterAnchor>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 text-caption text-white/60">
            <p>
              {t('footer.copyright', '© {year} Compass. All rights reserved.', {year})}{' '}
              {t('footer.open_source', 'Free and open source under the AGPL-3.0 license.')}
            </p>
            <p>
              {t('footer.contact_line', 'Questions? Write to')}{' '}
              <a
                href={`mailto:${supportEmail}`}
                className={clsx('text-white/70 hover:text-white', focusRingDark)}
              >
                {supportEmail}
              </a>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="footer-locale-picker" className="text-caption text-white/60">
              {t('footer.language', 'Language')}
            </label>
            <LanguagePicker
              id="footer-locale-picker"
              className={
                // eslint-disable-next-line no-restricted-syntax -- always-dark footer band, same as the sidebar rail
                'bg-transparent border-canvas-900 pr-9 sidebar-text hover:text-primary-600 focus:border-primary-400'
              }
            />
          </div>
        </div>
      </div>
    </footer>
  )
}
