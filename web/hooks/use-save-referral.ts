import {cleanUsername} from 'common/util/clean-username'
import Router from 'next/router'
import {useEffect, useRef} from 'react'
import {useDefinedSearchParams} from 'web/hooks/use-defined-search-params'
import {User, writeReferralInfo} from 'web/lib/firebase/users'

// Flips on the first client-side navigation. Until then, the page being rendered is the one the visitor
// landed on from outside the site.
let navigatedInApp = false
if (typeof window !== 'undefined') {
  Router.events.on('routeChangeStart', () => {
    navigatedInApp = true
  })
}

export const useSaveReferral = (
  user: User | null | undefined,
  options?: {
    defaultReferrerUsername?: string
    contractId?: string
  },
) => {
  const {searchParams} = useDefinedSearchParams()
  // The default referrer (the profile owner, on `/[username]`) is credited only when the visitor
  // landed on that page directly — a shared link. Reaching it by clicking around the site, e.g. a
  // home-page spotlight, is not a referral. Captured at mount, so a later `router.replace` on the
  // landing page doesn't revoke it.
  const landedHere = useRef(!navigatedInApp).current

  useEffect(() => {
    // Null on the first render of a statically-optimized page — the query is only readable once the
    // router is ready, which re-runs this effect. Don't blow up in between.
    if (!searchParams) return

    const referrer = searchParams.get('r')
      ? decodeBase64(searchParams.get('r') as string)
      : (searchParams.get('referrer') ?? undefined)

    const referrerOrDefault =
      referrer || (landedHere ? options?.defaultReferrerUsername : undefined)

    if (user === null && referrerOrDefault) {
      writeReferralInfo(referrerOrDefault, {
        contractId: options?.contractId,
        explicitReferrer: referrer,
      })
    }
  }, [user, searchParams, landedHere, JSON.stringify(options)])
}

const decodeBase64 = (base64: string) => {
  return Buffer.from(cleanUsername(base64), 'base64').toString()
}
