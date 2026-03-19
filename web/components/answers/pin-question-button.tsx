import {BookmarkIcon as PinOutline} from '@heroicons/react/24/outline'
import {BookmarkIcon as PinSolid} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import {Tooltip} from 'web/components/widgets/tooltip'
import {usePinnedQuestionIds} from 'web/hooks/use-pinned-question-ids'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'

interface PinQuestionButtonProps {
  questionId: number
  onPinChange?: (pinnedQuestionIds: number[]) => void
  className?: string
}

export function PinQuestionButton({questionId, onPinChange, className}: PinQuestionButtonProps) {
  const t = useT()
  const {pinnedQuestionIds, setPinnedQuestionIds, refreshPinnedQuestionIds} = usePinnedQuestionIds()
  const isPinned = (pinnedQuestionIds ?? []).includes(questionId)

  const handlePinToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    api('update-compatibility-question-pin', {
      questionId,
      pinned: !isPinned,
    })
      .then((res) => {
        refreshPinnedQuestionIds()
        setPinnedQuestionIds(res.pinnedQuestionIds ?? [])
        onPinChange?.(res.pinnedQuestionIds ?? [])
      })
      .catch((err) => {
        console.error(err)
        toast.error(err.message ?? t('answers.pinned.error', 'Error updating preference'))
      })
  }

  return (
    <Tooltip
      text={
        isPinned
          ? t('answers.pinned.unpin_tooltip', 'Unpin this question')
          : t('answers.pinned.pin_tooltip', 'Pin this question to see it first on profiles')
      }
    >
      <button
        className={clsx(
          'rounded transition-colors',
          isPinned ? 'text-primary-700' : 'text-ink-400 hover:text-ink-700',
          className,
        )}
        onClick={handlePinToggle}
        aria-label={
          isPinned
            ? t('answers.pinned.unpin_aria', 'Unpin question')
            : t('answers.pinned.pin_aria', 'Pin question')
        }
      >
        {isPinned ? (
          <PinSolid className="h-5 w-5 text-primary-600" />
        ) : (
          <PinOutline className="h-5 w-5 text-ink-500" />
        )}
      </button>
    </Tooltip>
  )
}
