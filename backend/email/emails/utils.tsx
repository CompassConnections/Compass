import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import React, {type CSSProperties, type ReactNode} from 'react'
import {createT} from 'shared/locale'

/**
 * The shared design system for every Compass email.
 *
 * It is the mail-safe translation of `web/components/widgets/surface.tsx` and the tokens in
 * `web/styles/globals.css`: same warm canvas, same amber accent, same Newsreader/DM Sans pairing, same
 * one-card-treatment rule. Templates should compose the components below rather than re-typing inline
 * styles — the reason the old templates drifted (an olive `#dee5b2` border in a palette with no olive in
 * it, three different quote treatments, boxes nested inside boxes) is that every one of them specced its
 * own chrome from scratch.
 *
 * Mail constraints that shape all of this:
 *  - Inline styles only. Class names exist solely as hooks for the dark-mode media query below.
 *  - No flexbox, no gradients that need to survive Outlook, no box-shadow worth relying on. Depth comes
 *    from a hairline border and a lighter/darker fill, which is what the web cards reduce to anyway.
 *  - One level of nesting, maximum. A card inside a card inside the page sheet reads as a stack of
 *    unrelated rectangles; see `Quote`, which replaces the inner box with a rule.
 */

// ─── Tokens ───────────────────────────────────────────────────────────────────

/**
 * Light-theme values from `web/styles/globals.css`. Names match the Tailwind tokens one-for-one so a
 * change on the site can be mirrored here by search rather than by eye.
 */
export const palette = {
  canvas0: '#ffffff',
  canvas50: '#f7f4ef', // cards / the email sheet
  canvas100: '#ede8e0', // page background
  canvas200: '#e8d5bc', // tags, borders
  canvas300: '#decbb2',
  canvas950: '#2c2416', // espresso
  ink500: '#8c8070', // muted
  ink600: '#6e6252', // body
  ink900: '#1e1a14', // headings
  primary50: '#faf3e9',
  primary100: '#f3e4ce',
  primary200: '#e8c99d',
  primary300: '#dcab71',
  primary500: '#c17f3e', // brand base
  primary600: '#a6682e', // = --color-cta; white on this is 4.52:1
  primary700: '#855022', // = --color-cta-hover; the eyebrow colour
  /** The ring on cards: canvas-200 at ~60% over the sheet, precomputed because mail has no alpha ring. */
  hairline: '#e6d9c4',
  /** The lighter divider used inside a card. */
  rule: '#ece7de',
} as const

/**
 * Newsreader for headings and DM Sans for everything else — the same pairing the site uses. Both are
 * requested in `EmailShell`'s <Head/>; the fallbacks matter more than the request does, since only Apple
 * Mail and a handful of others will actually fetch a webfont.
 *
 * Note this is a deliberate change from the old templates, which asked for Cormorant Garamond. The site
 * moved its headings to Newsreader (see the note in `web/pages/_document.tsx`) and kept Cormorant only
 * for the wordmark — which is exactly what `Wordmark` below still uses it for.
 */
export const fonts = {
  heading: "'Newsreader', Georgia, 'Times New Roman', Times, serif",
  body: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  wordmark: "'Cormorant Garamond', Georgia, serif",
} as const

// ─── Shell ────────────────────────────────────────────────────────────────────

export const main: CSSProperties = {
  backgroundColor: palette.canvas100,
  fontFamily: fonts.body,
  color: palette.ink600,
  margin: '0',
  padding: '0',
  wordSpacing: 'normal',
}

export const container: CSSProperties = {
  margin: '0 auto',
  maxWidth: '600px',
  width: '100%',
  padding: '32px 12px 8px 12px',
}

/**
 * The sheet every email's body sits on: canvas-50 on the canvas-100 page, exactly like a card on the
 * site. It carries the hairline and the radius so no template has to.
 */
export const content: CSSProperties = {
  backgroundColor: palette.canvas50,
  border: `1px solid ${palette.hairline}`,
  borderRadius: '20px',
  padding: '36px 32px 32px 32px',
}

interface ShellProps {
  /** The inbox preview line. */
  preview: string
  children: ReactNode
  unsubscribeUrl: string
  email?: string
  locale?: string
}

/**
 * Html + Head + Body + the sheet + the footer, in the one arrangement all of these emails want.
 *
 * Every template used to repeat this stack, which is how two of them ended up without the dark-mode
 * stylesheet and one ended up with a private copy of `main`/`container`/`content` that had drifted from
 * the shared one.
 */
export const EmailShell = ({preview, children, unsubscribeUrl, email, locale}: ShellProps) => (
  <Html>
    <Head>
      {/* Tells the client we have a real dark rendering, so it does not invent one by inverting ours. */}
      <meta name="color-scheme" content="light dark" />
      <meta name="supported-color-schemes" content="light dark" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Cormorant+Garamond:wght@500&display=swap"
      />
      <style>{RESPONSIVE_CSS}</style>
      <style>{DARK_MODE_CSS}</style>
    </Head>
    <Preview>{preview}</Preview>
    <Body style={main} className="cm-body">
      <Container style={container}>
        <Wordmark />
        <Section style={content} className="cm-sheet">
          {children}
        </Section>
        <Footer unsubscribeUrl={unsubscribeUrl} email={email} locale={locale} />
      </Container>
    </Body>
  </Html>
)

/**
 * The wordmark above the sheet. Text rather than an image on purpose: the site logo is an SVG, which
 * Gmail and Outlook will not render, and a raster fallback would be one more asset to keep in sync for a
 * line of type. Cormorant Garamond at 0.03em tracking is the same spec as `web/components/site-logo.tsx`.
 */
export const Wordmark = () => (
  <Section style={{textAlign: 'center' as const, padding: '0 0 18px 0'}}>
    <Link href={DEPLOYED_WEB_URL} style={{textDecoration: 'none'}}>
      <span
        className="cm-wordmark"
        style={{
          fontFamily: fonts.wordmark,
          fontSize: '22px',
          fontWeight: 500,
          letterSpacing: '0.03em',
          color: palette.ink900,
        }}
      >
        Compass
      </span>
    </Link>
  </Section>
)

// ─── Typography ───────────────────────────────────────────────────────────────

/** The one h1. Centred by default, because every one of these emails leads with a greeting. */
export const Heading = ({
  children,
  align = 'center',
  style,
}: {
  children: ReactNode
  align?: 'left' | 'center'
  style?: CSSProperties
}) => (
  <Text
    className="cm-heading"
    style={{
      fontFamily: fonts.heading,
      fontSize: '30px',
      fontWeight: 600,
      color: palette.ink900,
      letterSpacing: '-0.01em',
      lineHeight: '1.15',
      textAlign: align,
      margin: '0 0 14px 0',
      ...style,
    }}
  >
    {children}
  </Text>
)

/** The sentence under the heading: the one line that says what happened. */
export const Lead = ({
  children,
  align = 'center',
  style,
}: {
  children: ReactNode
  align?: 'left' | 'center'
  style?: CSSProperties
}) => (
  <Text
    className="cm-lead"
    style={{
      fontFamily: fonts.heading,
      fontSize: '20px',
      fontWeight: 500,
      color: palette.ink900,
      lineHeight: '1.4',
      textAlign: align,
      margin: '0 0 24px 0',
      ...style,
    }}
  >
    {children}
  </Text>
)

export const paragraph: CSSProperties = {
  fontFamily: fonts.body,
  fontSize: '15px',
  lineHeight: '1.75',
  color: palette.ink600,
  margin: '0 0 16px 0',
}

export const Paragraph = ({children, style}: {children: ReactNode; style?: CSSProperties}) => (
  <Text className="cm-text" style={{...paragraph, ...style}}>
    {children}
  </Text>
)

/** Fine print: the daily-limit note, the community note, the "you can change your vote" line. */
export const Muted = ({
  children,
  align = 'center',
  style,
}: {
  children: ReactNode
  align?: 'left' | 'center'
  style?: CSSProperties
}) => (
  <Text
    className="cm-muted"
    style={{
      fontFamily: fonts.body,
      fontSize: '13px',
      lineHeight: '1.7',
      color: palette.ink500,
      textAlign: align,
      margin: '0',
      ...style,
    }}
  >
    {children}
  </Text>
)

export const link: CSSProperties = {
  color: palette.primary600,
  textDecoration: 'none',
  fontWeight: 600,
}

/**
 * The pill at the top of an event email — "New message", "Argument against". Same spec as the hero badge
 * on /home: canvas-200 fill, primary-300 ring, primary-700 text.
 */
export const Eyebrow = ({children}: {children: ReactNode}) => (
  <span
    className="cm-chip"
    style={{
      display: 'inline-block',
      backgroundColor: palette.canvas200,
      border: `1px solid ${palette.primary300}`,
      borderRadius: '9999px',
      padding: '6px 14px',
      fontFamily: fonts.body,
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '1.2px',
      textTransform: 'uppercase' as const,
      color: palette.primary700,
      lineHeight: '1.2',
    }}
  >
    {children}
  </span>
)

// ─── Surfaces ─────────────────────────────────────────────────────────────────

/**
 * Quoted text — a comment, an endorsement, a message.
 *
 * A rule and an indent rather than a filled box, which is the fix for the boxed-quote-inside-a-boxed-card
 * that these emails all had. Two nested rounded rectangles read as two separate things the reader has to
 * relate; a rule reads as "this part is someone else's words", which is the entire job. It also matches
 * the site, where `QuoteBlock` on /home is a single surface and never a box within one.
 */
export const Quote = ({children, style}: {children: ReactNode; style?: CSSProperties}) => (
  <div
    className="cm-quote"
    style={{
      borderLeft: `3px solid ${palette.primary300}`,
      padding: '2px 0 2px 20px',
      margin: '20px 0 24px 0',
      textAlign: 'left' as const,
      ...style,
    }}
  >
    <Text
      className="cm-heading"
      style={{
        fontFamily: fonts.heading,
        fontSize: '19px',
        lineHeight: '1.6',
        color: palette.ink900,
        margin: '0',
      }}
    >
      {children}
    </Text>
  </div>
)

export const Divider = ({style}: {style?: CSSProperties}) => (
  <hr
    style={{
      border: 'none',
      borderTop: `1px solid ${palette.rule}`,
      margin: '28px 0',
      ...style,
    }}
  />
)

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * The filled amber button. `--color-cta` (#a6682e), not the brand base — white on primary-500 is 3.30:1
 * and fails AA, which is the same reason the site's buttons use the cta token. See the note in
 * `web/tailwind.config.js`.
 */
export const button: CSSProperties = {
  backgroundColor: palette.primary600,
  borderRadius: '12px',
  color: '#ffffff',
  fontFamily: fonts.body,
  fontSize: '15px',
  fontWeight: 700,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 30px',
  margin: '0',
}

export const CTAButton = ({
  href,
  children,
  style,
}: {
  href?: string
  children: ReactNode
  style?: CSSProperties
}) => (
  <Button href={href} className="cm-cta" style={{...button, ...style}}>
    {children}
  </Button>
)

/** The quieter second action, matching the outline button on /home. */
export const OutlineButton = ({
  href,
  children,
  style,
}: {
  href?: string
  children: ReactNode
  style?: CSSProperties
}) => (
  <Button
    href={href}
    className="cm-outline"
    style={{
      backgroundColor: 'transparent',
      border: `2px solid ${palette.canvas200}`,
      borderRadius: '12px',
      color: palette.ink900,
      fontFamily: fonts.body,
      fontSize: '15px',
      fontWeight: 600,
      textDecoration: 'none',
      textAlign: 'center' as const,
      display: 'inline-block',
      padding: '12px 26px',
      margin: '0',
      ...style,
    }}
  >
    {children}
  </Button>
)

/** Centres an action (or a pair of them) with the rhythm the templates all want around it. */
export const Actions = ({children, style}: {children: ReactNode; style?: CSSProperties}) => (
  <Section style={{textAlign: 'center' as const, margin: '28px 0 4px 0', ...style}}>
    {children}
  </Section>
)

/** Martin's sign-off, identical across the three founder letters. */
export const Signature = ({title}: {title: string}) => (
  <Text style={{...paragraph, margin: '28px 0 0 0', color: palette.ink900}} className="cm-heading">
    Martin Braquet
    <br />
    <span className="cm-muted" style={{fontSize: '12px', color: palette.ink500}}>
      {title}
    </span>
  </Text>
)

// ─── Footer ───────────────────────────────────────────────────────────────────

interface Props {
  email?: string
  unsubscribeUrl: string
  locale?: string
}

/**
 * The footer icon row: where we are, then where we're funded. Each `path` is a redirect defined in
 * `web/next.config.ts`, so the destinations stay in one place rather than being baked into sent mail.
 * The images live in `web/public/images/` at 512px so they stay sharp on retina clients.
 */
const SOCIAL_LINKS = [
  {path: 'github', file: 'github-logo.png', alt: 'GitHub'},
  {path: 'discord', file: 'discord-logo.png', alt: 'Discord'},
  {path: 'x', file: 'x-logo.png', alt: 'X'},
  {path: 'instagram', file: 'instagram-logo.png', alt: 'Instagram'},
  {path: 'patreon', file: 'patreon-logo.png', alt: 'Patreon'},
  {path: 'paypal', file: 'paypal-logo.png', alt: 'PayPal'},
  {path: 'liberapay', file: 'liberapay-logo.png', alt: 'Liberapay'},
  {path: 'kofi', file: 'kofi-logo.png', alt: 'Ko-fi'},
]

export const Footer = ({email, unsubscribeUrl, locale}: Props) => {
  const t = createT(locale)
  return (
    <Section
      style={{
        margin: '0',
        textAlign: 'center' as const,
        padding: '28px 0 8px 0',
      }}
    >
      <Row>
        <Column align="center">
          {SOCIAL_LINKS.map(({path, file, alt}) => (
            <Link key={path} href={`${DEPLOYED_WEB_URL}/${path}`} target="_blank">
              <Img
                src={`${DEPLOYED_WEB_URL}/images/${file}`}
                width="22"
                height="22"
                alt={alt}
                style={{
                  display: 'inline-block',
                  margin: '0 6px',
                  opacity: '0.6',
                }}
              />
            </Link>
          ))}
        </Column>
      </Row>

      <Row>
        <Column align="center">
          <Text
            className="cm-muted"
            style={{
              fontSize: '12px',
              color: palette.ink500,
              margin: '20px 0 0 0',
              fontFamily: fonts.body,
              fontWeight: 400,
            }}
          >
            © {new Date().getFullYear()} Compass
          </Text>

          <Text
            className="cm-muted"
            style={{
              fontSize: '11px',
              color: palette.ink500,
              margin: '8px 0 0 0',
              lineHeight: '1.6',
              fontFamily: fonts.body,
            }}
          >
            {t(
              'email.footer.sent_to',
              'The email was sent to {email}. To no longer receive these emails, unsubscribe',
              {email},
            )}{' '}
            <Link href={unsubscribeUrl} style={link}>
              {t('email.footer.unsubscribe_link', 'here')}
            </Link>
            .
          </Text>
        </Column>
      </Row>
    </Section>
  )
}

// ─── Legacy style objects ─────────────────────────────────────────────────────
// Retained so nothing outside this package breaks, and retuned to the tokens above rather than left on
// the old blue-button / white-sheet values.

export const footer = {
  margin: '20px 0',
  textAlign: 'center' as const,
}

export const footerText = {
  fontSize: '11px',
  lineHeight: '22px',
  color: palette.ink500,
  fontFamily: fonts.body,
}

export const blackLinks = {
  color: palette.ink900,
}

// const footerLink = {
// color: 'inherit',
// textDecoration: 'none',
// }

export const logoContainer = {
  padding: '20px 0px 5px 0px',
  textAlign: 'center' as const,
  backgroundColor: palette.canvas50,
}

export const imageContainer = {
  textAlign: 'center' as const,
  margin: '20px 0',
}

export const profileImage = {
  // border: '1px solid #ec489a',
}

/**
 * The one responsive rule. The sheet's 32px inset is right on a desktop client and eats a fifth of the
 * line on a 320px phone, which is where most of this mail is actually opened.
 */
export const RESPONSIVE_CSS = `
  @media only screen and (max-width: 480px) {
    .cm-sheet { padding: 26px 20px 24px 20px !important; border-radius: 16px !important; }
  }
`

/**
 * Dark-mode overrides for email clients that honour `prefers-color-scheme` (Apple Mail, iOS Mail,
 * and Outlook.com among others). `EmailShell` drops it into every template's <Head/>.
 *
 * Emails are built from inline styles because that is what mail clients reliably support, and inline
 * styles beat a stylesheet — hence `!important` throughout. The hooks are the `cm-*` class names on
 * the handful of surfaces that actually carry colour; everything else inherits.
 *
 * Values are the `.dark` block of `web/styles/globals.css`, so the two themes stay one design rather
 * than two. Clients that ignore the media query keep the light email exactly as before.
 */
export const DARK_MODE_CSS = `
  @media (prefers-color-scheme: dark) {
    /* react-email's <Body> puts the page background on the <body> AND on a wrapper <td> it generates,
       and only the <body> gets the className — so the td needs a structural selector or the whole page
       stays cream behind a dark sheet. */
    body, .cm-body, .cm-body > table > tbody > tr > td { background-color: #1a1612 !important; }
    .cm-sheet { background-color: #231f1a !important; border-color: #3a332b !important; }
    /* Catch-all so any element that forgot its hook is still legible, then the hooks below override it.
       They are written doubled (\`.cm-heading.cm-heading\`) purely for specificity: a bare \`.cm-heading\`
       is 0-1-0 and would lose to the 0-1-1 of \`.cm-sheet p\`, which is how the previous version of this
       stylesheet ended up painting every heading in the body colour. */
    .cm-sheet p, .cm-sheet div, .cm-sheet td, .cm-sheet span { color: #baaa96 !important; }
    .cm-heading.cm-heading, .cm-heading.cm-heading p, .cm-heading.cm-heading span,
    .cm-lead.cm-lead, .cm-name.cm-name, .cm-wordmark.cm-wordmark { color: #f7f4ef !important; }
    .cm-text.cm-text { color: #baaa96 !important; }
    .cm-muted.cm-muted, .cm-muted.cm-muted span { color: #b0a08c !important; }
    .cm-chip.cm-chip, .cm-chip.cm-chip span {
      background-color: #443422 !important;
      border-color: #855022 !important;
      color: #dcab71 !important;
    }
    .cm-quote.cm-quote { border-color: #855022 !important; }
    /* The amber accent and the primary button already read correctly on a dark ground; leaving them
       alone keeps the brand colour identical in both modes. */
    .cm-accent.cm-accent { color: #d09352 !important; }
    /* Buttons wrap their label in a <span> for the Outlook padding hack, so the label needs naming
       explicitly or the catch-all above repaints it in the body colour. */
    .cm-outline.cm-outline, .cm-outline.cm-outline span { color: #f7f4ef !important; border-color: #443422 !important; }
    .cm-cta.cm-cta, .cm-cta.cm-cta span { color: #ffffff !important; }
    hr { border-color: #3a332b !important; }
  }
`
