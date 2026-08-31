'use client'

import clsx from 'clsx'
import Link from 'next/link'
import {useEffect, useState} from 'react'
import {Consent, getConsent, recordConsent} from 'web/lib/consent'
import {useT} from 'web/lib/locale'
import {consentRequired, startConsentedTracking} from 'web/lib/service/analytics'

/**
 * The analytics consent prompt.
 *
 * Deliberately a small corner card rather than the full-width bar the pattern usually gets: nothing
 * here is blocking, the page underneath stays entirely usable, and a policy of "no ads, no selling
 * data" does not need a modal to explain itself. It is also the only honest way to run PostHog — see
 * `/privacy#cookies-and-local-storage`, which is what this replaced the admission in.
 *
 * **The two answers are deliberately not equal here.** "Allow" is the primary CTA and declining sits
 * one click away behind "Other options" — a product decision, taken knowingly. It is worth recording
 * what that trades away: asymmetry between accepting and refusing is the specific thing the EDPB's
 * dark-pattern guidance names, and the CNIL's €150M/€60M fines against Google and Meta in 2022 were
 * for exactly this shape — accept in one click, refuse in more. The decline control is therefore kept
 * real: plainly labelled, one click, no extra dialog, and always in the DOM for assistive tech.
 *
 * Shown in the Android shell too. The app is this same web bundle in a WebView, so PostHog stores the
 * same ids on the same device there; skipping the prompt would leave the exact gap it exists to
 * close. Only Sentry's replay differs, and that is already off natively (see `sentry-config.ts`).
 *
 * **Not shown in the iOS shell**, where `consentRequired()` is false because PostHog is switched off
 * there entirely — App Review read this card as a custom prompt asking permission to track and
 * rejected 1.42.0 under guideline 5.1.2(i). Suppressing the banner while leaving PostHog running would
 * have been the worst of both: it would trade the App Store problem for a GDPR one, since the cookie
 * would then be set with no consent behind it. So the collection goes, and the question goes with it.
 */
export function ConsentBanner() {
  const t = useT()
  // Starts hidden and is only revealed from an effect: the cookie it depends on is unreadable during
  // the static render, so rendering it directly would either flash the banner at people who already
  // answered or trip a hydration mismatch.
  const [show, setShow] = useState(false)
  const [showDecline, setShowDecline] = useState(false)

  useEffect(() => {
    // `consentRequired()` is checked here rather than in the render body for the same reason `show`
    // starts false: it reads the Capacitor platform, which is not known during the static render.
    if (consentRequired() && !getConsent()) setShow(true)
  }, [])

  const choose = (consent: Consent) => {
    recordConsent(consent)
    if (consent === 'granted') startConsentedTracking()
    setShow(false)
  }

  if (!show) return null

  return (
    <section
      aria-label={t('consent.label', 'Analytics consent')}
      className={clsx(
        'fixed right-3 z-40 w-[min(21rem,calc(100vw-1.5rem))]',
        // Clears the mobile bottom nav (`--bnv`) and the device's own home indicator; on `lg` the nav
        // is gone, so it sits at the corner proper.
        'bottom-[calc(var(--bnv)+env(safe-area-inset-bottom)+0.75rem)] lg:bottom-4',
        'rounded-2xl bg-canvas-50 p-4 ring-1 ring-canvas-200',
        'shadow-[0_1px_2px_rgb(44_36_22/0.06),0_16px_40px_-20px_rgb(44_36_22/0.45)]',
        'dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]',
        // Slides up rather than appearing: at this size an element that simply exists on the next
        // frame reads as a rendering glitch in the corner of the eye.
        'motion-safe:animate-[consent-in_240ms_ease-out]',
      )}
    >
      <p className="m-0 text-[13px] leading-relaxed text-ink-700">
        {t(
          'consent.text',
          'May we count feature usage to see what is worth building? No ads, and nothing sold.',
        )}{' '}
        <Link
          href="/privacy#cookies-and-local-storage"
          className="font-medium text-primary-700 underline decoration-primary-500/35 underline-offset-2 transition-colors hover:decoration-primary-500"
        >
          {t('consent.details', 'What we store')}
        </Link>
      </p>
      {/* One row: the CTA takes the space it can, "Other options" sits beside it. `shrink-0` on the
          link and `min-w-0` on the button so a longer translation shortens the button rather than
          wrapping the link under it. */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => choose('granted')}
          className="min-w-0 flex-1 rounded-xl border border-cta bg-cta px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_6px_20px_-6px_rgba(193,127,62,0.6)] transition-colors hover:bg-cta-hover"
        >
          {t('consent.accept', 'Allow')}
        </button>

        <button
          type="button"
          onClick={() => setShowDecline((v) => !v)}
          aria-expanded={showDecline}
          aria-controls="consent-other-options"
          className="shrink-0 rounded px-1.5 py-1 text-left text-[12px] leading-tight text-ink-500 underline decoration-ink-300 underline-offset-2 transition-colors hover:text-ink-800"
        >
          {t('consent.other_options', 'Other options')}
        </button>
      </div>

      {/* Kept in the DOM and collapsed by height rather than unmounted, so the decline control is
          always present for a screen reader and for find-in-page — `inert` takes it out of the tab
          order while it is shut. Same `0fr → 1fr` grid trick the FAQ cards use. */}
      <div
        id="consent-other-options"
        className={clsx(
          'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
          showDecline ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div inert={!showDecline} className="pt-2">
            <button
              type="button"
              onClick={() => choose('denied')}
              className="w-full rounded-lg px-3 py-2 text-[13px] font-medium text-ink-600 ring-1 ring-canvas-200 transition-colors hover:bg-canvas-100"
            >
              {t('consent.decline', 'No thanks — do not count me')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
