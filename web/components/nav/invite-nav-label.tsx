import {useEffect} from 'react'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

/** A week. The badge is a nudge, not a readout — a stale one is better than none, but not forever. */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

/**
 * The sidebar's "Invite" label, carrying the number of people the member has brought.
 *
 * The count is the whole point of putting this in the nav. A static "Invite" link is a tool, and a
 * tool gets used once; a number that has gone up since the last time you looked is a reason to click,
 * and clicking is the only way a member ever finds out that the four people they invited have since
 * become sixty.
 *
 * Being on every page, it has to be nearly free, and it is cheap in three separate ways because each
 * one covers a case the others do not:
 *
 *   * `get-my-referral-count` walks `profiles` alone and returns two integers. Asking
 *     `get-referral-tree` for the same number — which is what this used to do — meant joining every
 *     descendant against `users` and shipping up to two thousand rows of names and avatar URLs to
 *     render two characters.
 *   * the endpoint is `private, max-age=60`, so moving between pages inside a minute never reaches
 *     the network. `useAPIGetter`'s in-memory cache hides the *flicker* on navigation but still
 *     re-fires the request, which is the part that costs anything.
 *   * the last value is kept in localStorage, so on the first page of a new session the badge is
 *     already there instead of appearing a beat later. Keyed by user id — a shared browser must not
 *     show one person the other's tally — and given a TTL so a long-abandoned number expires rather
 *     than sitting there being wrong.
 */
export function InviteNavLabel() {
  const t = useT()
  const user = useUser()

  const [cached, setCached] = usePersistentLocalState<number | undefined>(
    undefined,
    `referral-count-${user?.id ?? 'anon'}-v1`,
    CACHE_TTL_MS,
  )

  const {data} = useAPIGetter('get-my-referral-count', user ? {} : undefined)

  useEffect(() => {
    if (data) setCached(data.total)
  }, [data?.total])

  const total = data?.total ?? cached ?? 0

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {t('nav.invite', 'Invite')}
      {total > 0 && (
        <span className="bg-primary-500/20 text-primary-500 rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums">
          {total}
        </span>
      )}
    </span>
  )
}
