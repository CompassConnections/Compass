import clsx from 'clsx'
import {useEffect, useRef, useState} from 'react'
import toast from 'react-hot-toast'
import {Row} from 'web/components/layout/row'
import {surface} from 'web/components/widgets/surface'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'

export type VoteChoice = 'for' | 'abstain' | 'against'

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

function VoteButton(props: {
  choice: VoteChoice
  count: number
  title: string
  disabled?: boolean
  onClick?: () => void
}) {
  const {choice, count, title, disabled, onClick} = props
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-3 xs:px-4 py-2 text-sm font-medium',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        CHOICE_COLOR[choice],
      )}
    >
      <span className="font-semibold">{count}</span>
      <span>{title}</span>
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
  onVoted?: () => void | Promise<void>
  className?: string
  disabled?: boolean
}) {
  const {voteId, counts, onVoted, className, disabled: disabledProp} = props
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
        disabled={disabled}
        onClick={() => handleVote('abstain')}
      />
      <VoteButton
        choice="against"
        count={counts.against}
        title={t('vote.against', 'Against')}
        disabled={disabled}
        onClick={() => handleVote('against')}
      />
    </Row>
  )
}
