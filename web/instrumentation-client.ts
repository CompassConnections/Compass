// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import {IS_LOCAL, SENTRY_DSN} from 'common/hosting/constants'
import {getConsent} from 'web/lib/consent'
import {SENTRY_REPLAY_ENABLED} from 'web/lib/sentry-config'

Sentry.init({
  // Skip tunneling in native app context
  dsn: SENTRY_DSN,

  enabled: !IS_LOCAL,

  // Error reporting starts unconditionally — it keeps the app fixable and puts nothing persistent on
  // the visitor's device. Session replay is the part that needs permission (it records the page), so
  // it only joins if a previous visit already granted it; otherwise the consent banner adds it later
  // via `startConsentedTracking()`. See web/lib/consent.ts.
  integrations:
    SENTRY_REPLAY_ENABLED && getConsent() === 'granted' ? [Sentry.replayIntegration()] : [],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
