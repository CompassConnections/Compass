import clsx from 'clsx'
import {IS_LOCAL} from 'common/hosting/constants'
import {OPTION_TABLES, OptionTableKey} from 'common/profiles/constants'
import {OptionSummary} from 'common/profiles/options'
import {useMemo, useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {NoSEO} from 'web/components/NoSEO'
import {PageBase} from 'web/components/page-base'
import {ChoicesToggleGroup} from 'web/components/widgets/choices-toggle-group'
import {Input} from 'web/components/widgets/input'
import {Title} from 'web/components/widgets/title'
import {useAdmin} from 'web/hooks/use-admin'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {api} from 'web/lib/api'

type AdminOption = OptionSummary & {aliases: string[]}

/**
 * Merging duplicate options, and curating the aliases that keep them merged.
 *
 * The alternative was raw SQL, and a merge is only correct if the holders move, the old name becomes
 * an alias, and the row is deleted — in that order, in one transaction. A hand-written version that
 * skips the alias produces a merge the next person to type the dead name silently undoes, which is
 * precisely what happened to the 2026-08-07 merge script.
 *
 * The whole table is listed at once rather than paged. Finding a duplicate means noticing that two
 * rows are the same thing, and a page boundary is exactly what hides such a pair from whoever is
 * looking for it.
 */
export default function AdminOptions() {
  const isAdmin = useAdmin()

  const [table, setTable] = useState<OptionTableKey>('interests')
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState<AdminOption | null>(null)
  const [busy, setBusy] = useState(false)
  /** The one open inline field: which option, whether it renames or adds an alias, and its text. */
  const [editing, setEditing] = useState<{id: string; mode: 'alias' | 'rename'} | null>(null)
  const [editText, setEditText] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {data, refresh} = useAPIGetter('get-options-admin', {table})
  const options = (data?.options ?? []) as AdminOption[]

  // Matches aliases as well as names, so searching a dead name finds the option that swallowed it.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) => o.name.toLowerCase().includes(q) || o.aliases.some((a) => a.toLowerCase().includes(q)),
    )
  }, [options, query])

  const act = async (run: () => Promise<string>) => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      setMessage(await run())
      refresh()
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setBusy(false)
    }
  }

  const merge = (into: AdminOption) => {
    if (!from) return
    // The one destructive action on the page, and it cannot be undone from here — the losing row is
    // gone afterwards and only its alias remains. The count is in the prompt because "12 profiles"
    // and "0 profiles" deserve different amounts of thought.
    const ok = confirm(
      `Merge "${from.name}" (${from.usageCount} profiles) into "${into.name}" (${into.usageCount} profiles)?\n\n` +
        `"${from.name}" will stop existing. Everyone holding it will hold "${into.name}" instead, and ` +
        `the name "${from.name}" will resolve to "${into.name}" from now on.`,
    )
    if (!ok) return

    act(async () => {
      const result = await api('merge-options', {table, fromId: from.id, intoId: into.id})
      setFrom(null)
      return `Merged "${from.name}" into "${into.name}" — ${result.moved} profiles gained it, ${result.alreadyHad} already had it. Aliases now resolving: ${result.aliases.join(', ') || 'none'}.`
    })
  }

  const remove = (option: AdminOption) => {
    // Deliberately harder to walk into than merge. Merge moves people to something that means the
    // same thing; this takes the tag off every profile holding it and gives them nothing back, so the
    // cost is spelled out and the alternative is named.
    const ok = confirm(
      option.usageCount > 0
        ? `Delete "${option.name}"?\n\n` +
            `${option.usageCount} profile(s) hold it and will simply lose it — they get nothing in its ` +
            `place, and a search for it will no longer find them.\n\n` +
            `If another option means the same thing, cancel and merge into it instead.`
        : `Delete "${option.name}"? Nobody holds it.`,
    )
    if (!ok) return

    act(async () => {
      const result = await api('delete-option', {
        table,
        optionId: option.id,
        expectedUsageCount: option.usageCount,
      })
      if (from?.id === option.id) setFrom(null)
      return `Deleted "${result.name}" — removed from ${result.removedFrom} profile(s). Its aliases went with it, so those names can be created again.`
    })
  }

  const openEditor = (option: AdminOption, mode: 'alias' | 'rename') => {
    const open = editing?.id === option.id && editing.mode === mode
    setEditing(open ? null : {id: option.id, mode})
    // A rename starts from the current name, since most renames are edits of it rather than
    // replacements; an alias starts empty, because it is a different name by definition.
    setEditText(open || mode === 'alias' ? '' : option.name)
  }

  const submitEditor = (option: AdminOption) => {
    const value = editText.trim()
    if (!value || !editing) return

    if (editing.mode === 'alias') {
      return act(async () => {
        await api('set-option-alias', {table, optionId: option.id, alias: value})
        setEditing(null)
        return `"${value}" now resolves to "${option.name}".`
      })
    }

    return act(async () => {
      const result = await api('rename-option', {table, optionId: option.id, name: value})
      setEditing(null)
      return result.aliased
        ? `Renamed to "${result.name}". "${result.aliased}" still resolves here, so nobody typing it creates a duplicate.`
        : `Renamed to "${result.name}".`
    })
  }

  const removeAlias = (option: AdminOption, alias: string) =>
    act(async () => {
      await api('set-option-alias', {table, optionId: option.id, alias, remove: true})
      return `"${alias}" no longer resolves to "${option.name}".`
    })

  if (!(isAdmin || IS_LOCAL)) return <p>Not authorized</p>

  return (
    <PageBase className="p-2 sm:pt-0">
      <NoSEO />
      <Col className="text-ink-900 mx-4 my-4 gap-4">
        <Title>Options</Title>
        <p className="text-ink-600 text-sm">
          Members create these themselves, so near-duplicates and awkward wording accumulate.
          Merging one into another moves everyone holding it; renaming fixes the wording in place.
          Both keep the old name as an alias, so typing it lands here instead of creating the
          duplicate again. Deleting keeps nothing — holders lose the tag outright, so merge instead
          wherever something means the same thing.
        </p>

        <Row className="flex-wrap items-center gap-3">
          <ChoicesToggleGroup
            currentChoice={table}
            choicesMap={Object.fromEntries(
              OPTION_TABLES.map((t) => [t.charAt(0).toUpperCase() + t.slice(1), t]),
            )}
            setChoice={(choice) => {
              setTable(choice as OptionTableKey)
              setFrom(null)
            }}
          />
          <Input
            value={query}
            placeholder="Search names and aliases"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="h-10 w-64"
            searchIcon
          />
          <span className="text-ink-500 text-sm">
            {visible.length} of {options.length}
          </span>
        </Row>

        {from && (
          <Row className="border-primary-400 bg-primary-50 items-center gap-3 rounded-lg border px-3 py-2">
            <span className="text-sm">
              Merging <b>{from.name}</b> ({from.usageCount}) — now pick what it should become.
            </span>
            <Button size="2xs" color="gray-outline" onClick={() => setFrom(null)}>
              Cancel
            </Button>
          </Row>
        )}

        {message && <div className="text-sm text-teal-600">{message}</div>}
        {error && <div className="text-error text-sm">{error}</div>}

        <Col className="gap-1">
          {visible.map((option) => (
            <Row
              key={option.id}
              className={clsx(
                'border-canvas-300 items-start justify-between gap-3 rounded-lg border px-3 py-2',
                from?.id === option.id && 'border-primary-400 bg-primary-50',
              )}
            >
              <Col className="min-w-0 gap-0.5">
                <Row className="items-baseline gap-2">
                  <span className="font-medium">{option.name}</span>
                  <span className="text-ink-500 text-xs">
                    {option.usageCount} {option.usageCount === 1 ? 'profile' : 'profiles'}
                  </span>
                </Row>
                {editing?.id === option.id && (
                  <Row className="items-center gap-2 py-1">
                    <Input
                      autoFocus
                      value={editText}
                      placeholder={
                        editing.mode === 'rename'
                          ? 'New name'
                          : `A name that should resolve to "${option.name}"`
                      }
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditText(e.target.value)
                      }
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          submitEditor(option)
                        }
                        if (e.key === 'Escape') setEditing(null)
                      }}
                      className="h-8 w-72 text-sm"
                    />
                    <Button size="2xs" disabled={busy} onClick={() => submitEditor(option)}>
                      {editing.mode === 'rename' ? 'Rename' : 'Add'}
                    </Button>
                    <Button size="2xs" color="gray-outline" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </Row>
                )}
                {editing?.id === option.id && editing.mode === 'rename' && (
                  <span className="text-ink-500 text-xs">
                    &ldquo;{option.name}&rdquo; will keep resolving here, so nobody typing it
                    creates a duplicate.
                  </span>
                )}
                {!!option.aliases.length && (
                  <Row className="flex-wrap items-center gap-1.5">
                    {option.aliases.map((alias) => (
                      <button
                        key={alias}
                        type="button"
                        title="Remove this alias"
                        disabled={busy}
                        onClick={() => removeAlias(option, alias)}
                        className="bg-canvas-100 text-ink-600 hover:text-error rounded px-1.5 py-0.5 text-xs"
                      >
                        {alias} ×
                      </button>
                    ))}
                  </Row>
                )}
              </Col>

              <Row className="shrink-0 gap-2">
                <Button
                  size="2xs"
                  color="gray-outline"
                  disabled={busy}
                  onClick={() => openEditor(option, 'rename')}
                >
                  Rename
                </Button>
                <Button
                  size="2xs"
                  color="gray-outline"
                  disabled={busy}
                  onClick={() => openEditor(option, 'alias')}
                >
                  Alias
                </Button>
                {from && from.id !== option.id ? (
                  <Button size="2xs" color="red" disabled={busy} onClick={() => merge(option)}>
                    Merge into this
                  </Button>
                ) : (
                  !from && (
                    <>
                      <Button
                        size="2xs"
                        color="gray-outline"
                        disabled={busy}
                        onClick={() => setFrom(option)}
                      >
                        Merge away
                      </Button>
                      <Button
                        size="2xs"
                        color="red-outline"
                        disabled={busy}
                        onClick={() => remove(option)}
                      >
                        Delete
                      </Button>
                    </>
                  )
                )}
              </Row>
            </Row>
          ))}
        </Col>
      </Col>
    </PageBase>
  )
}
