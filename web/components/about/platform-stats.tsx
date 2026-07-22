import clsx from 'clsx'
import {ReactNode} from 'react'
import {eyebrow} from 'web/components/widgets/surface'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useT} from 'web/lib/locale'

/**
 * The live number band at the top of the about page (A5 in docs/marketing-visuals.md).
 *
 * It opens the page with something that is not a card — ten of the page's blocks are the same bordered
 * tile, which is what made it read as flat.
 *
 * The country breakdown that used to sit beside it now lives on /stats
 * (`widgets/country-spread.tsx`): it is a distribution readout for someone who came to read numbers,
 * and this page only needed one claim about reach, which the member count already makes.
 *
 * **Never hardcoded.** Same reasoning as `MemberGrowth`: a number that quietly goes stale on a page
 * arguing for transparency is the failure worth engineering against. And for the same reason it
 * renders *nothing* on an empty or failed response rather than a zero or a skeleton — an empty frame
 * claims more than it shows.
 *
 * Deliberately kept away from the vote tally further down the page. Twelve voters next to a large
 * member count is the turnout tension A1 was placed on this page to manage, not to advertise.
 */

function formatCount(n: number) {
  return n >= 10000 ? `${Math.floor(n / 1000)}k` : n.toLocaleString('en-US')
}

function Stat({value, label}: {value: ReactNode; label: string}) {
  return (
    <div className="flex-1 min-w-[110px]">
      <div className="font-heading text-[clamp(30px,4vw,46px)] font-bold text-ink-900 leading-none tracking-tight tabular-nums">
        {value}
      </div>
      <div className={clsx(eyebrow, 'text-ink-700 mt-2.5')}>{label}</div>
    </div>
  )
}

/**
 * A rule-bounded band rather than a row of cards. The point is to break the card rhythm, so borrowing
 * the card treatment would defeat it.
 */
export function StatBand() {
  const t = useT()
  const {data} = useAPIGetter('stats', {})

  if (!data?.profiles) return null

  return (
    <div className="border-y border-canvas-200 py-8 flex flex-wrap gap-x-10 gap-y-7">
      <Stat value={formatCount(data.profiles)} label={t('about.stat.members', 'Members')} />
      {data.countryCount > 1 && (
        <Stat
          value={formatCount(data.countryCount)}
          label={t('about.stat.countries', 'Countries')}
        />
      )}
      {data.conversations > 0 && (
        <Stat
          value={formatCount(data.conversations)}
          label={t('about.stat.conversations', 'Conversations')}
        />
      )}
      {/* Not a queried number, and deliberately so: it is the one claim here that is a policy rather
          than a measurement, and it is the whole argument of the "Completely Free" card. */}
      <Stat
        value={t('about.stat.price_value', '$0')}
        label={t('about.stat.price', 'Cost to use')}
      />
    </div>
  )
}
