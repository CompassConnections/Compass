import {IS_LOCAL} from 'common/hosting/constants'

const IS_NATIVE = !!process.env.NEXT_PUBLIC_WEBVIEW

/**
 * Whether Sentry's session replay may run at all, before consent is even considered.
 *
 * Shared by `instrumentation-client.ts`, which decides at load, and `startConsentedTracking()`, which
 * decides when the banner is accepted mid-session. The two have to agree, or accepting the banner in
 * the native shell would start a recorder that the cold-start path deliberately never starts.
 */
export const SENTRY_REPLAY_ENABLED = !IS_LOCAL && !IS_NATIVE
