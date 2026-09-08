import clsx from 'clsx'
import {OptionTableKey} from 'common/profiles/constants'
import {MAX_OPTION_NAME_LENGTH, normalizeOptionName} from 'common/profiles/option-name'
import {OptionNameVerdict, OPTIONS_PAGE_SIZE, OptionSummary} from 'common/profiles/options'
import {debounce} from 'lodash'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {Row} from 'web/components/layout/row'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {ShowMoreOptions} from 'web/components/widgets/show-more-options'
import {useChoicesContext} from 'web/hooks/use-choices'
import {api} from 'web/lib/api'
import {useLocale, useT} from 'web/lib/locale'

/**
 * The picker for the three user-creatable taxonomies (`interests`, `causes`, `work`).
 *
 * Two things separate it from the plain `MultiCheckbox` the fixed choice fields use.
 *
 * **Search is remote and ranked.** The browser holds only the popular slice of the table, and the
 * server ranks by (match tier, then popularity) across names, translations and aliases. The old
 * picker did `String.includes` over a client-side copy of every option sorted alphabetically, which
 * could not find "Programming" for "computer programming", could not find "Artificial intelligence"
 * for "AI", and put "Runcorn history" above "Running" for "run".
 *
 * **Creating is the last resort, not a peer of searching.** The "Add" button used to sit next to the
 * search box at equal weight and fire instantly, so the cheapest way to answer the field was always
 * to type something new — which is how a taxonomy ends up with "Gaming", "PC Gaming" and "Video
 * games". Now a typed name goes to `check-option-name` first, and when something existing means the
 * same thing the reader is asked about it, with the existing option as the primary action.
 *
 * Nothing here writes to the database. A name the reader insists on is held in the form exactly as
 * before and created by `setProfileOptions` on save, so abandoning the form leaves no trace.
 */
export function OptionPicker(props: {
  label: OptionTableKey
  /** Selected values: option ids, or — for a name the reader just created — the name itself. */
  selected: string[]
  onChange: (selected: string[] | null) => void
  /** Off on the filter rail: filtering by an option nobody holds can only ever return nothing. */
  allowCreate?: boolean
  className?: string
  optionsClassName?: string
}) {
  const {label, selected, onChange, allowCreate, className, optionsClassName} = props
  const t = useT()
  const {locale} = useLocale()
  const {tables} = useChoicesContext()
  const {entry, searchChoices, loadMore, hydrate} = tables[label]

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OptionSummary[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [verdict, setVerdict] = useState<OptionNameVerdict | null>(null)

  // Labels for ticked options that are too rare to appear on the popular first page. Without this,
  // moving off the full-table fetch would make a selected chip render as a bare id.
  //
  // Keyed on the ids themselves: callers rebuild `selected` on every render (`filters[label] ?? []`),
  // so depending on the array identity would re-run this on every render for no reason.
  const selectedIds = selected.filter((value) => /^\d+$/.test(value)).join(',')
  useEffect(() => {
    if (selectedIds) hydrate(selectedIds.split(','))
  }, [selectedIds, hydrate])

  const runSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        if (!q.trim()) {
          setResults(null)
          setSearching(false)
          return
        }
        try {
          setResults(await searchChoices(q))
        } finally {
          setSearching(false)
        }
      }, 250),
    [searchChoices],
  )

  // A late response to an abandoned query must not overwrite the current one.
  useEffect(() => () => runSearch.cancel(), [runSearch])

  const onSearchChange = useCallback(
    (q: string) => {
      setQuery(q)
      setVerdict(null)
      if (q.trim()) setSearching(true)
      runSearch(q)
    },
    [runSearch],
  )

  /**
   * label -> value, in the order they should be shown: search results while the reader is typing,
   * otherwise the default page in the server's popularity order.
   *
   * Built from the ordered `defaults` array rather than from the id-keyed label map, because a JS
   * object with numeric-string keys iterates numerically and would quietly re-sort the ranking.
   * Insertion order is preserved here since every key is a non-numeric label.
   */
  const choices = useMemo(() => {
    const source = query.trim() && results ? results : entry.defaults
    const base: Record<string, string> = {}
    for (const option of source) base[option.name] = option.id
    // A name the reader created this session is held by name until the profile is saved, so it has
    // no id to look up and has to carry its own chip.
    for (const value of selected) {
      if (!/^\d+$/.test(value) && !Object.values(base).includes(value)) base[value] = value
    }
    return base
  }, [query, results, entry.defaults, selected])

  const selectedLabels = useMemo(
    () =>
      Object.fromEntries(selected.map((value) => [value, entry.choices[value] ?? value])) as Record<
        string,
        string
      >,
    [selected, entry.choices],
  )

  const select = (value: string) => {
    if (!selected.includes(value)) onChange([...selected, value])
    setVerdict(null)
    setQuery('')
    setResults(null)
  }

  /**
   * Asks the server what the typed name is before anything is added.
   *
   * Returning `null` hands control back to this component's footer — which is how the "did you mean"
   * panel gets a chance to appear instead of a new option appearing.
   */
  const addOption = async (raw: string) => {
    const {verdict} = await api('check-option-name', {table: label, name: raw, locale})
    if (verdict.status === 'existing') {
      select(verdict.option.id)
      return null
    }
    if (verdict.status === 'new') {
      setVerdict(null)
      return {key: verdict.name, value: verdict.name}
    }
    setVerdict(verdict)
    return null
  }

  const createAnyway = (name: string) => {
    select(normalizeOptionName(name))
  }

  const hasMore = !query.trim() && entry.defaults.length < entry.total

  return (
    <MultiCheckbox
      className={className}
      optionsClassName={optionsClassName}
      choices={choices}
      selected={selected}
      onChange={onChange}
      addOption={allowCreate ? addOption : undefined}
      searchable
      // The server already ranked these; filtering them again in the browser would drop every match
      // that is not a literal substring, which is most of the point of asking the server.
      filterLocally={false}
      searchValue={query}
      onSearchChange={onSearchChange}
      pinSelected
      selectedLabels={selectedLabels}
      searchFooter={
        <VerdictPanel
          verdict={verdict}
          searching={searching}
          hasQuery={!!query.trim()}
          resultCount={results?.length ?? 0}
          allowCreate={!!allowCreate}
          onPick={select}
          onCreateAnyway={createAnyway}
        />
      }
      trailing={
        hasMore ? (
          <ShowMoreOptions
            // Deliberately another page, not the whole table: loading all of it would just rebuild
            // the wall of chips this replaced, one click later. Past a page or two the honest answer
            // is to type, and search is now good enough to be the long-tail path.
            label={t('option-picker.show_more', 'Show more')}
            onClick={() => loadMore(entry.defaults.length, OPTIONS_PAGE_SIZE)}
          />
        ) : undefined
      }
    />
  )
}

/**
 * The interstitial between typing a name and creating it.
 *
 * Deliberately shaped so the existing option is the easy action and creating is the deliberate one —
 * that asymmetry is the only part of this work that changes what a hurried reader actually does.
 */
function VerdictPanel(props: {
  verdict: OptionNameVerdict | null
  searching: boolean
  hasQuery: boolean
  resultCount: number
  allowCreate: boolean
  onPick: (value: string) => void
  onCreateAnyway: (name: string) => void
}) {
  const {verdict, searching, hasQuery, resultCount, allowCreate, onPick, onCreateAnyway} = props
  const t = useT()

  if (searching) {
    return <div className="px-2 text-sm text-ink-500">{t('common.searching', 'Searching…')}</div>
  }

  if (!verdict) {
    if (hasQuery && resultCount === 0) {
      return (
        <div className="px-2 text-sm text-ink-500">
          {allowCreate
            ? t('multi-checkbox.no_matching_options', 'No matching options, feel free to add it.')
            : t('option-picker.no_matches', 'No matching options.')}
        </div>
      )
    }
    return null
  }

  if (verdict.status === 'invalid') {
    return (
      <div className="rounded-lg border border-canvas-300 bg-canvas-50 px-3 py-2 text-sm">
        <span className="text-error">{invalidMessage(verdict, t)}</span>
        {verdict.parts && verdict.parts.length > 1 && (
          <Row className="mt-2 flex-wrap gap-2">
            {verdict.parts.map((part) => (
              <Button
                key={part}
                size="2xs"
                color="gray-outline"
                onClick={() => onCreateAnyway(part)}
              >
                {t('option-picker.add_part', 'Add "{part}"').replace('{part}', part)}
              </Button>
            ))}
          </Row>
        )}
      </div>
    )
  }

  if (verdict.status !== 'suggestion') return null

  return (
    <div className="rounded-lg border border-canvas-300 bg-canvas-50 px-3 py-2">
      <div className="text-sm text-ink-700">
        {t('option-picker.did_you_mean', 'Did you mean one of these?')}
      </div>
      <Row className="mt-2 flex-wrap gap-2">
        {verdict.candidates.map((candidate) => (
          <Button
            key={candidate.id}
            size="xs"
            color="primary"
            onClick={() => onPick(candidate.id)}
            className={clsx('whitespace-nowrap')}
          >
            {candidate.name}
            {candidate.usageCount > 0 && (
              <span className="ml-1.5 opacity-75">
                {t('option-picker.used_by', '· used by {count}').replace(
                  '{count}',
                  String(candidate.usageCount),
                )}
              </span>
            )}
          </Button>
        ))}
      </Row>
      {allowCreate && (
        <button
          type="button"
          className="mt-2 text-xs text-ink-500 underline-offset-2 hover:text-ink-700 hover:underline"
          onClick={() => onCreateAnyway(verdict.name)}
        >
          {t('option-picker.add_anyway', 'No, add "{name}" as a new option').replace(
            '{name}',
            verdict.name,
          )}
        </button>
      )}
    </div>
  )
}

function invalidMessage(
  verdict: Extract<OptionNameVerdict, {status: 'invalid'}>,
  t: ReturnType<typeof useT>,
) {
  switch (verdict.problem) {
    case 'too_long':
      return t(
        'option-picker.too_long',
        'That is longer than {max} characters — try the shortest name for it.',
      ).replace('{max}', String(MAX_OPTION_NAME_LENGTH))
    case 'multiple':
      return t('option-picker.multiple', 'Add these one at a time so each can be searched for.')
    case 'no_letter':
      return t('option-picker.no_letter', 'An option needs at least one letter.')
    default:
      return t('multi-checkbox.enter_value', 'Please enter a value.')
  }
}
