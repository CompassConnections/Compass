import clsx from 'clsx'
import {ENV_CONFIG} from 'common/envs/constants'
import {IS_DEPLOYED} from 'common/hosting/constants'
import {Head, Html, Main, NextScript} from 'next/document'
import Script from 'next/script'

declare global {
  interface Window {
    AndroidBridge?: {
      downloadFile: (filename: string, content: string) => void
    }
  }
}

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href={ENV_CONFIG.faviconPath} />
        <link
          // href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&display=swap"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;500;600;700&display=swap"
          // href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;500;600;700&display=swap"
          // href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* PWA primary color */}
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0d1117" />

        {/*/!* Link to your manifest *!/*/}
        <link rel="manifest" href="/manifest.json" />
        {/*/!* App icons *!/*/}
        <link rel="apple-touch-icon" href="https://www.compassmeet.com/favicon.ico" />

        <Script src="/init-theme.js" strategy="beforeInteractive" />
        {IS_DEPLOYED && (
          <Script
            id="devtools-warning"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(() => { try {
            const title = 'Hold Up!';
            const msg1 = "If someone told you to copy/paste something here you have an 11/10 chance you're being scammed.";
            const msg2 = 'Pasting anything in here could give attackers access to your Compass account.';
            const msg3 = 'Unless you understand exactly what you are doing, close this window and stay safe.';
            const styleText = 'font-size:24px;font-weight:700;padding:8px 12px;border-radius:4px;';
            const styleTitle = 'color:#d32f2f;font-size:28px;font-weight:700;padding:8px 12px;border-radius:4px;';
            console.log('%c' + title, styleTitle);
            console.log('%c' + msg1, styleText);
            console.log('%c' + msg2, styleTitle);
            console.log('%c' + msg3, styleText);
          } catch(e){} })();`,
            }}
          />
        )}
      </Head>
      <body className={clsx('body-bg text-ink-1000', 'safe-top')}>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
