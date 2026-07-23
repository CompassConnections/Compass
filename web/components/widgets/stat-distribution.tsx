import clsx from 'clsx'
import {
  EDUCATION_CHOICES,
  INVERTED_DIET_CHOICES,
  INVERTED_EDUCATION_CHOICES,
  INVERTED_GENDERS,
  INVERTED_LANGUAGE_CHOICES,
  INVERTED_MBTI_CHOICES,
  INVERTED_ORIENTATION_CHOICES,
  INVERTED_POLITICAL_CHOICES,
  INVERTED_RACE_CHOICES,
  INVERTED_RELATIONSHIP_CHOICES,
  INVERTED_RELATIONSHIP_STATUS_CHOICES,
  INVERTED_RELIGION_CHOICES,
  MBTI_TYPE_NAMES,
} from 'common/choices'
import {DemographicField, Distribution} from 'common/stats'
import {ComponentType, SVGProps} from 'react'
import {surface} from 'web/components/widgets/surface'

/**
 * A single profile-field breakdown as a ranked bar list — the building block of the "Who's on Compass"
 * section of /stats. Deliberately the same bar vocabulary as `country-spread.tsx`: a member scanning the
 * page reads one distribution the same way as the next, so education, religion and languages all share a
 * form and only the labels change.
 *
 * The raw stored values (`'bachelors'`, `'veg'`, `'intj'`) are turned into human labels here rather than
 * on the wire, so the payload stays small and the label maps live next to the rest of the choice tables.
 *
 * Percentages are always of `dist.base` — the members who answered the field — not of the whole platform.
 * For a multi-select field that base is the distinct answerers, so a member who picked three diets counts
 * once in the denominator; that is why the multi-select bars can each be large yet not sum to 100%, and
 * why the subtitle says so out loud.
 */

type IconType = ComponentType<SVGProps<SVGSVGElement>>

// value → English label, per field. Missing fields (age buckets are already human-readable) fall through
// to the raw value. Same maps the search filters use, so a label never disagrees between the two places.
const LABELS: Partial<Record<DemographicField, Record<string, string>>> = {
  gender: INVERTED_GENDERS,
  education_level: INVERTED_EDUCATION_CHOICES,
  political_beliefs: INVERTED_POLITICAL_CHOICES,
  religion: INVERTED_RELIGION_CHOICES,
  diet: INVERTED_DIET_CHOICES,
  ethnicity: INVERTED_RACE_CHOICES,
  orientation: INVERTED_ORIENTATION_CHOICES,
  pref_relation_styles: INVERTED_RELATIONSHIP_CHOICES,
  relationship_status: INVERTED_RELATIONSHIP_STATUS_CHOICES,
  languages: INVERTED_LANGUAGE_CHOICES,
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Education reads best in level order rather than by popularity — the levels are an ordinal ladder, so
// showing PhD above High school (the choices dict, reversed) is clearer than "whichever is most common
// first". Everything else keeps the count ranking the backend already sorted it into.
const EDUCATION_ORDER: string[] = Object.values(EDUCATION_CHOICES).reverse()

function orderItems(field: DemographicField, items: Distribution['items']): Distribution['items'] {
  if (field !== 'education_level') return items
  return [...items].sort(
    (a, b) => EDUCATION_ORDER.indexOf(a.value) - EDUCATION_ORDER.indexOf(b.value),
  )
}

function labelFor(field: DemographicField, value: string): string {
  // MBTI reads as the four-letter code plus its archetype — "INTJ" alone is jargon; "INTJ Architect"
  // tells the reader what it means without a second lookup.
  if (field === 'mbti') {
    const code = INVERTED_MBTI_CHOICES[value] ?? value.toUpperCase()
    const name = MBTI_TYPE_NAMES[code]
    return name ? `${code} · ${name}` : code
  }
  return LABELS[field]?.[value] ?? capitalize(value)
}

function DistRow({
  label,
  pct,
  widthPct,
  rank,
}: {
  label: string
  pct: number
  widthPct: number
  rank: number
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 shrink-0 truncate text-[13px] text-ink-700 sm:w-28" title={label}>
        {label}
      </div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas-200">
        <div
          className="h-full rounded-full bg-primary-500 transition-[width] duration-700 ease-out"
          // The bar shortens the ranking gently down the list — the top value stays full-strength amber
          // and each lower row loses a little, so the order reads even where two counts are close.
          style={{width: `${widthPct}%`, opacity: Math.max(0.45, 1 - rank * 0.11)}}
        />
      </div>
      <div className="w-9 shrink-0 text-right text-xs tabular-nums text-ink-500">{pct}%</div>
    </div>
  )
}

export function DistributionCard({
  field,
  title,
  icon: Icon,
  dist,
}: {
  field: DemographicField
  title: string
  icon: IconType
  dist: Distribution | undefined
}) {
  if (!dist || !dist.items.length) return null

  // Most fields arrive count-sorted from the backend; education is re-laid into level order here.
  const items = orderItems(field, dist.items)

  // Bar widths are relative to the largest bar, not to the base: against the base a field where the top
  // answer is only 20% would render as a row of stubs and the ranking would be unreadable. Percentages
  // (the number on the right) are still of the base — only the drawn width is normalised to the leader.
  // Taken as the true max, not items[0], because age buckets (and education) aren't ordered by size.
  const max = Math.max(...items.map((it) => it.count))

  return (
    <div className={clsx(surface, 'flex h-full flex-col p-5 sm:p-6')}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 ring-1 ring-primary-200">
          <Icon className="h-[18px] w-[18px] text-primary-600" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold leading-tight text-ink-900">{title}</h3>
          <p className="text-xs text-ink-500">
            {dist.multi
              ? `of ${dist.base.toLocaleString()} who shared`
              : `${dist.base.toLocaleString()} shared`}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {items.map((it, i) => (
          <DistRow
            key={it.value}
            label={labelFor(field, it.value)}
            pct={Math.max(1, Math.round((it.count / dist.base) * 100))}
            widthPct={Math.max(4, Math.round((it.count / max) * 100))}
            rank={i}
          />
        ))}
      </div>
    </div>
  )
}
