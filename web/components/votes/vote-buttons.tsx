import {Row} from 'web/components/layout/row'
import {Button} from 'web/components/buttons/button'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import {api} from 'web/lib/api'
import {useState} from 'react'
import {useUser} from "web/hooks/use-user";

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
      className={clsx('px-4 py-2 rounded-lg', color)}
      onClick={onClick}
      color={'gray-white'}
    >
      <div className="font-semibold mx-2">{count}</div>
      <div className="text-sm">{title}</div>
    </Button>
  )
}

const priorities = [
  {label: 'Urgent', value: 3},
  {label: 'High', value: 2},
  {label: 'Medium', value: 1},
  {label: 'Low', value: 0},
] as const

export function VoteButtons(props: {
  voteId: number
  counts: { for: number; abstain: number; against: number }
  onVoted?: () => void | Promise<void>
  className?: string
}) {
  const user = useUser()
  const {voteId, counts, onVoted, className} = props
  const [loading, setLoading] = useState<VoteChoice | null>(null)
  const [showPriority, setShowPriority] = useState(false)
  const disabled = loading !== null

  const sendVote = async (choice: VoteChoice, priority: number) => {
    try {
      setLoading(choice)
      if (!user) {
        toast.error('Please sign in to vote')
        return
      }
      await api('vote', {voteId, choice, priority})
      toast.success(`Voted ${choice}${choice === 'for' ? ` with priority ${priority}` : ''}`)
      await onVoted?.()
    } catch (e) {
      console.error(e)
      toast.error('Failed to vote — please try again')
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
    <Row className={clsx('gap-4 mt-2', className)}>
      <div className="relative">
        <VoteButton
          color={clsx('bg-green-700 text-white hover:bg-green-500')}
          count={counts.for}
          title={'For'}
          disabled={disabled}
          onClick={() => handleVote('for')}
        />
        {showPriority && (
          <div className={clsx(
            'absolute z-10 mt-2 w-40 rounded-md border border-ink-200 bg-white shadow-lg',
            'dark:bg-ink-900'
          )}>
            {priorities.map((p) => (
              <button
                key={p.value}
                className={clsx(
                  'w-full text-left px-3 py-2 text-sm hover:bg-ink-100',
                  'dark:hover:bg-ink-800'
                )}
                onClick={async () => {
                  setShowPriority(false)
                  await sendVote('for', p.value)
                }}
              >
                {p.label} priority
              </button>
            ))}
          </div>
        )}
      </div>
      <VoteButton
        color={clsx('bg-yellow-700 text-white hover:bg-yellow-500')}
        count={counts.abstain}
        title={'Abstain'}
        disabled={disabled}
        onClick={() => handleVote('abstain')}
      />
      <VoteButton
        color={clsx('bg-red-700 text-white hover:bg-red-500')}
        count={counts.against}
        title={'Against'}
        disabled={disabled}
        onClick={() => handleVote('against')}
      />
    </Row>
  )
}
