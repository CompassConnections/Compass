import clsx from 'clsx'
import {PromptDegeneracy} from 'common/api/types'
import {IS_LOCAL} from 'common/hosting/constants'
import {presentCompatibilityCategories} from 'common/profiles/compatibility-categories'
import {formatPercent} from 'common/util/format'
import {sortBy} from 'lodash'
import {useMemo, useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {
  CompatibilityCategoryFilter,
  CompatibilityCategoryTag,
  matchesCategory,
} from 'web/components/compatibility/category'
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

/** Below this many answers a share is noise — 1 answer is always 100% — so it is shown greyed. */
const MIN_MEANINGFUL_ANSWERS = 20

/** Where a share stops being a healthy majority and starts meaning the item scores nothing. */
const CONCERNING = 0.7
const DEGENERATE = 0.85

type SortKey = 'choice' | 'prefs' | 'answers' | 'id'

const share = (count: number, total: number) => (total > 0 ? count / total : 0)

/**
 * Which compatibility prompts have stopped discriminating, and in which of the two ways.
 *
 * A prompt earns its slot by separating people; one everybody answers identically contributes the
 * same score to every pair while still costing a member the time to answer it. The two columns are
 * the two independent ways that happens, and they fail independently: a prompt can split cleanly on
 * self-report and still be dead because everyone accepts every option in a partner. Retirement
 * criteria and the guidelines these measure against are in `docs/compatibility-questions.md`.
 *
 * Deleting a prompt here leaves every cached pair score stale, deliberately: retiring questions is done
 * in batches, and a rebuild after each deletion is a rebuild whose result the next deletion invalidates.
 * The rebuild is the separate button at the top, pressed once when the batch is done.
 */
export default function AdminCompatibilityQuestions() {
  const isAdmin = useAdmin()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('choice')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  /** Set by any deletion this session, so the stale-cache warning appears only once it is true. */
  const [deletedSinceRebuild, setDeletedSinceRebuild] = useState(false)

  const {data, refresh} = useAPIGetter('get-compatibility-question-degeneracy', {})
  const questions = data?.questions ?? []

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

  const remove = (prompt: PromptDegeneracy) => {
    // The count is in the prompt because "312 answers" and "0 answers" deserve different amounts of
    // thought, and because it is what the server checks against — a page loaded ten minutes ago is
    // exactly the one that understates it.
    const ok = confirm(
      `Delete "${prompt.question}"?\n\n` +
        (prompt.answerCount > 0
          ? `${prompt.answerCount} answer(s) go with it, along with its translations and pins. ` +
            `Every pair who had answered it keeps a cached score that no longer reflects their answers ` +
            `until you rebuild.\n\n`
          : `Nobody has answered it.\n\n`) +
        `This cannot be undone.`,
    )
    if (!ok) return

    act(async () => {
      const result = await api('delete-compatibility-prompt', {
        questionId: prompt.id,
        expectedAnswerCount: prompt.answerCount,
      })
      setDeletedSinceRebuild(true)
      return `Deleted "${result.question}" — ${result.removedAnswers} answer(s) went with it. Cached scores are now stale; rebuild when you are done.`
    })
  }

  const rebuild = () => {
    const ok = confirm(
      `Rebuild the cached compatibility score of every pair?\n\n` +
        `Scores every pair from scratch and replaces the cache. Run this once, after you have finished ` +
        `adding and removing questions — it may take a while, so leave the tab open.`,
    )
    if (!ok) return

    act(async () => {
      const result = await api('recompute-all-compatibility-scores', {})
      setDeletedSinceRebuild(false)
      return `Rebuilt ${result.pairs} pair(s) across ${result.usersWithAnswers} member(s) with answers in ${result.seconds.toFixed(1)}s — the cache held ${result.previousPairs} before.`
    })
  }

  // Built from every question rather than the filtered list, so picking one domain does not remove
  // the others from the control you picked it in.
  const categories = useMemo(() => presentCompatibilityCategories(questions), [questions])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = questions.filter(
      (p) =>
        matchesCategory(p, category) &&
        (!q ||
          p.question.toLowerCase().includes(q) ||
          p.options.some((o) => o.toLowerCase().includes(q))),
    )

    // Ties on a share are broken by answer count, so the well-evidenced degenerate prompt sorts
    // above the one that looks identical off three answers.
    if (sort === 'answers') return sortBy(matched, (p) => [-p.answerCount, p.id])
    if (sort === 'id') return sortBy(matched, (p) => -p.id)
    const count = (p: PromptDegeneracy) => (sort === 'choice' ? p.topChoiceCount : p.topPrefsCount)
    return sortBy(matched, (p) => [-share(count(p), p.answerCount), -p.answerCount])
  }, [questions, query, category, sort])

  if (!(isAdmin || IS_LOCAL)) return <p>Not authorized</p>

  return (
    <PageBase className="p-2 sm:pt-0">
      <NoSEO />
      <Col className="text-ink-900 mx-4 my-4 gap-4">
        <Title>Compatibility question degeneration</Title>
        <p className="text-ink-600 max-w-3xl text-sm">
          A prompt only contributes to a compatibility score when two people answer it differently.
          These are the two independent ways that stops happening: everyone describing themselves
          the same way, and everyone accepting the same set in a partner. They fail separately — a
          prompt can split three ways on self-report and still be dead because nearly everyone
          accepts all three. Shares are over answers that actually score: skipped ones are excluded.
        </p>

        <Row className="flex-wrap items-center gap-3">
          <ChoicesToggleGroup
            currentChoice={sort}
            choicesMap={{
              'Top answer': 'choice',
              'Top accepted set': 'prefs',
              'Most answered': 'answers',
              Newest: 'id',
            }}
            setChoice={(choice) => setSort((choice as SortKey) ?? 'choice')}
          />
          <Input
            value={query}
            placeholder="Search questions and options"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="h-10 w-64"
            searchIcon
          />
          <CompatibilityCategoryFilter
            category={category}
            setCategory={setCategory}
            categories={categories}
          />
          <span className="text-ink-500 text-sm">
            {visible.length} of {questions.length}
          </span>
          <Button
            size="xs"
            color="gray-outline"
            disabled={busy}
            onClick={rebuild}
            className="ml-auto"
          >
            Rebuild all pair scores
          </Button>
        </Row>

        {deletedSinceRebuild && (
          <div className="border-amber-400 bg-amber-50 rounded-lg border px-3 py-2 text-sm text-amber-900">
            Questions were deleted this session. Cached pair scores still include the answers that
            went with them — rebuild when you are done making changes.
          </div>
        )}

        {message && <div className="text-sm text-teal-600">{message}</div>}
        {error && <div className="text-error text-sm">{error}</div>}

        {!data && <div className="text-ink-500 text-sm">Loading…</div>}

        <Col className="gap-1">
          {visible.map((prompt) => (
            <PromptRow
              key={prompt.id}
              prompt={prompt}
              busy={busy}
              onDelete={() => remove(prompt)}
            />
          ))}
        </Col>
      </Col>
    </PageBase>
  )
}

function PromptRow(props: {prompt: PromptDegeneracy; busy: boolean; onDelete: () => void}) {
  const {prompt, busy, onDelete} = props
  const {options, answerCount, topChoice, topPrefs} = prompt

  const choiceLabel = topChoice == null ? null : (options[topChoice] ?? `#${topChoice}`)
  // The fully-degenerate accepted set is "all of them", so it is worth naming as such rather than
  // listing every option back — that is the shape you are scanning for.
  const prefsLabel =
    topPrefs == null
      ? null
      : topPrefs.length === 0
        ? 'nothing'
        : topPrefs.length === options.length
          ? `all ${options.length}`
          : topPrefs.map((i) => options[i] ?? `#${i}`).join(' · ')

  return (
    <Col className="border-canvas-300 gap-1.5 rounded-lg border px-3 py-2">
      <Row className="items-baseline gap-2">
        {/* The stored id, because every other artefact refers to a prompt by it — the candidate
            sheet's `source_ids`, the delete endpoint, a hand-written SQL check. Selectable and in
            tabular numerals so a column of them can be scanned and copied. */}
        <span className="text-ink-400 shrink-0 select-all font-mono text-xs tabular-nums">
          #{prompt.id}
        </span>
        <span className="font-medium">{prompt.question}</span>
        <span className="text-ink-500 shrink-0 text-xs">
          {answerCount} {answerCount === 1 ? 'answer' : 'answers'}
        </span>
        {/* The same pill members see, rather than the raw stored value: a category that reads
            differently here from how it reads on /compatibility is a category you cannot trust. */}
        {prompt.category && <CompatibilityCategoryTag category={prompt.category} />}
        <Button
          size="2xs"
          color="red-outline"
          disabled={busy}
          onClick={onDelete}
          className="ml-auto shrink-0"
        >
          Delete
        </Button>
      </Row>
      <Row className="flex-wrap gap-x-6 gap-y-1">
        <Metric
          label="Top answer"
          value={choiceLabel}
          count={prompt.topChoiceCount}
          total={answerCount}
        />
        <Metric
          label="Top accepted set"
          value={prefsLabel}
          count={prompt.topPrefsCount}
          total={answerCount}
        />
      </Row>
    </Col>
  )
}

function Metric(props: {label: string; value: string | null; count: number; total: number}) {
  const {label, value, count, total} = props
  if (value == null) return <span className="text-ink-400 text-sm">{label}: no answers</span>

  const fraction = share(count, total)
  // Greyed rather than hidden below the threshold: a 100% share off four answers is still the only
  // thing known about the prompt, and hiding it would read as "fine".
  const provisional = total < MIN_MEANINGFUL_ANSWERS

  return (
    <Row className="items-baseline gap-1.5 text-sm">
      <span className="text-ink-500">{label}:</span>
      <span
        className={clsx(
          'font-medium tabular-nums',
          provisional
            ? 'text-ink-400'
            : fraction >= DEGENERATE
              ? 'text-scarlet-600'
              : fraction >= CONCERNING
                ? 'text-amber-600'
                : 'text-ink-700',
        )}
      >
        {formatPercent(fraction)}
      </span>
      <span className="text-ink-500">
        ({count}/{total})
      </span>
      <span className="text-ink-700">{value}</span>
    </Row>
  )
}
