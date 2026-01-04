import {Row} from 'web/components/layout/row'
import {Button} from 'web/components/buttons/button'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import {api} from 'web/lib/api'
import {useState, useEffect, useRef} from 'react'
import {useUser} from "web/hooks/use-user";
import {useT} from "web/lib/locale";

export type VoteChoice = 'for' | 'abstain' | 'against'

function VoteButton(props: {
  color: string
  count: number
  title: string
  disabled?: boolean
  onClick?: () => void
}) {
  const {color, count, title, disabled, onClick} = props
  return (
    <Button
      size="xs"
      disabled={disabled}
      className={clsx('px-2 xs:px-4 py-2 rounded-lg', color)}
      onClick={onClick}
      color={'gray-white'}
    >
      <div className="font-semibold mx-1 xs:mx-2">{count}</div>
      <div className="text-sm">{title}</div>
    </Button>
  )
}

const priorities = [
  {key: "vote.urgent", label: 'Urgent', value: 3},
  {key: "vote.high", label: 'High', value: 2},
  {key: "vote.medium", label: 'Medium', value: 1},
  {key: "vote.low", label: 'Low', value: 0},
] as const

export function VoteButtons(props: {
  voteId: number
  counts: { for: number; abstain: number; against: number }
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
        choice === 'for' ? 'For' : choice === 'abstain' ? 'Abstain' : 'Against'
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
    <Row className={clsx('gap-2 xs:gap-4 mt-2 flex-wrap', className)}>
      <div className="relative" ref={containerRef}>
        <VoteButton
          color={clsx('bg-green-700 text-white hover:bg-green-500')}
          count={counts.for}
          title={t('vote.for', 'For')}
          disabled={disabled}
          onClick={() => handleVote('for')}
        />
        {showPriority && (
          <div className={clsx(
            'absolute z-10 mt-2 w-40 rounded-md border border-ink-200 bg-canvas-50 shadow-lg',
            'dark:bg-ink-900'
          )}>
            <div className="px-3 py-2 text-sm font-semibold bg-canvas-25">{t("vote.priority", "Priority")}</div>
            {priorities.map((p) => (
              <button
                key={p.value}
                className={clsx(
                  'w-full text-left px-3 py-2 text-sm hover:bg-ink-100 bg-canvas-50',
                  'dark:hover:bg-canvas-100'
                )}
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
        color={clsx('bg-yellow-700 text-white hover:bg-yellow-500')}
        count={counts.abstain}
        title={t('vote.abstain', 'Abstain')}
        disabled={disabled}
        onClick={() => handleVote('abstain')}
      />
      <VoteButton
        color={clsx('bg-red-700 text-white hover:bg-red-500')}
        count={counts.against}
        title={t('vote.against', 'Against')}
        disabled={disabled}
        onClick={() => handleVote('against')}
      />
    </Row>
  )
}
