import clsx from 'clsx'
import {Check} from 'lucide-react'
import {useEffect, useRef, useState} from 'react'
import toast from 'react-hot-toast'
import {Row} from 'web/components/layout/row'
import {surface} from 'web/components/widgets/surface'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'

export type VoteChoice = 'for' | 'abstain' | 'against'

/** `vote_results.choice` is stored as 1 / 0 / -1; the buttons are keyed by name. */
export const choiceFromNumber = (choice: number | null | undefined): VoteChoice | undefined =>
  choice === 1 ? 'for' : choice === -1 ? 'against' : choice === 0 ? 'abstain' : undefined

// Solid pill per choice — outline-only would read as three identical buttons distinguished only by a
// label, which is easy to misclick. Filling them lets a voter recognize "for" vs "against" by color
// alone, the same way the priority menu below relies on shape rather than reading text under time
// pressure.
// `teal` is remapped in tailwind.config.js to the "yes" ramp, which is greyscale, not a color — using
// it here would render "for" as a grey button indistinguishable from a disabled one. `green` is the
// real green ramp.
const CHOICE_COLOR: Record<VoteChoice, string> = {
  for: 'bg-green-500 hover:bg-green-600 text-white',
  abstain: 'bg-yellow-400 hover:bg-yellow-500 text-ink-900',
  against: 'bg-red-500 hover:bg-red-600 text-white',
}

// The three pills are already saturated, so "this one is yours" can't be another fill — it has to sit
// outside the shape. A ring (offset from the card surface so it reads as a halo, not a border) plus a
// check mark says it twice, which matters because the ring alone would be the only cue and colored
// rings on colored pills are exactly what gets lost on a dim screen.
//
// Deliberately *not* done by fading the other two: white-on-green-500 and ink-900-on-yellow-400 are
// already near the AA floor at this size, and any opacity below 1 pushes them under it. The selected
// pill gets marked; the unselected ones stay legible.
const CHOICE_RING: Record<VoteChoice, string> = {
  for: 'ring-green-600 dark:ring-green-400',
  abstain: 'ring-yellow-500 dark:ring-yellow-300',
  against: 'ring-red-600 dark:ring-red-400',
}

function VoteButton(props: {
  choice: VoteChoice
  count: number
  title: string
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  const {choice, count, title, selected, disabled, onClick} = props
  const t = useT()
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      title={selected ? t('vote.your_vote', 'Your vote') : undefined}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-3 xs:px-4 py-2 text-sm font-medium',
        'transition-[box-shadow,background-color] disabled:cursor-not-allowed disabled:opacity-50',
        CHOICE_COLOR[choice],
        selected && clsx('ring-2 ring-offset-2 ring-offset-canvas-50', CHOICE_RING[choice]),
      )}
    >
      {selected && <Check className="h-4 w-4 shrink-0" aria-hidden />}
      <span className="font-semibold">{count}</span>
      <span>{title}</span>
      {selected && <span className="sr-only">— {t('vote.your_vote', 'Your vote')}</span>}
    </button>
  )
}

const priorities = [
  {key: 'vote.urgent', label: 'Urgent', value: 3},
  {key: 'vote.high', label: 'High', value: 2},
  {key: 'vote.medium', label: 'Medium', value: 1},
  {key: 'vote.low', label: 'Low', value: 0},
] as const

export function VoteButtons(props: {
  voteId: number
  counts: {for: number; abstain: number; against: number}
  /** The viewer's own recorded choice, if they've voted — highlighted so they can tell at a glance. */
  userChoice?: VoteChoice
  onVoted?: () => void | Promise<void>
  className?: string
  disabled?: boolean
}) {
  const {voteId, counts, userChoice, onVoted, className, disabled: disabledProp} = props
  const user = useUser()
  const [loading, setLoading] = useState<VoteChoice | null>(null)
  const [showPriority, setShowPriority] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const disabled = disabledProp || loading !== null
  const t = useT()

  // Close the dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!showPriority) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setShowPriority(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPriority(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showPriority])

  const sendVote = async (choice: VoteChoice, priority: number) => {
    try {
      setLoading(choice)
      if (!user) {
        toast.error(t('vote.sign_in_required', 'Please sign in to vote'))
        return
      }
      await api('vote', {voteId, choice, priority})
      const choiceLabel = t(
        `vote.${choice}`,
        choice === 'for' ? 'For' : choice === 'abstain' ? 'Abstain' : 'Against',
      )
      let votedMsg = `${t('vote.voted', 'Voted')} ${choiceLabel}`
      if (choice === 'for') {
        votedMsg += ` ${t('vote.with_priority', 'with priority')} ${priority}`
      }
      toast.success(votedMsg)
      await onVoted?.()
    } catch (e) {
      console.error(e)
      toast.error(t('vote.failed', 'Failed to vote — please try again'))
    } finally {
      setLoading(null)
    }
  }

  const handleVote = async (choice: VoteChoice) => {
    if (choice === 'for') {
      // Toggle the priority dropdown
      setShowPriority((v) => !v)
      return
    }
    // Default priority 0 for non-for choices
    await sendVote(choice, 0)
  }

  return (
    <Row className={clsx('gap-2 xs:gap-3 flex-wrap', className)}>
      <div className="relative" ref={containerRef}>
        <VoteButton
          choice="for"
          count={counts.for}
          title={t('vote.for', 'For')}
          selected={userChoice === 'for'}
          disabled={disabled}
          onClick={() => handleVote('for')}
        />
        {showPriority && (
          <div className={clsx(surface, 'absolute z-10 mt-2 w-44 overflow-hidden p-1')}>
            <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
              {t('vote.priority', 'Priority')}
            </div>
            {priorities.map((p) => (
              <button
                key={p.value}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-800 hover:bg-canvas-100"
                onClick={async () => {
                  setShowPriority(false)
                  await sendVote('for', p.value)
                }}
              >
                {t(p.key, p.label)}
              </button>
            ))}
          </div>
        )}
      </div>
      <VoteButton
        choice="abstain"
        count={counts.abstain}
        title={t('vote.abstain', 'Abstain')}
        selected={userChoice === 'abstain'}
        disabled={disabled}
        onClick={() => handleVote('abstain')}
      />
      <VoteButton
        choice="against"
        count={counts.against}
        title={t('vote.against', 'Against')}
        selected={userChoice === 'against'}
        disabled={disabled}
        onClick={() => handleVote('against')}
      />
    </Row>
  )
}
