import clsx from 'clsx'
import TriangleDownFillIcon from 'web/lib/icons/triangle-down-fill-icon.svg'

export function ReplyToggle(props: {
  seeReplies: boolean
  numComments: number
  onSeeReplyClick?: () => void
}) {
  const {seeReplies, numComments, onSeeReplyClick} = props

  if (numComments === 0) return null

  return (
    <button
      className="text-ink-500 hover:text-primary-500 flex items-center gap-2 text-sm transition-colors"
      onClick={onSeeReplyClick}
    >
      <div className={clsx(numComments === 0 ? 'hidden' : 'flex select-none items-center gap-1')}>
        <TriangleDownFillIcon
          className={clsx('h-2 w-2 transition-transform', seeReplies ? '' : 'rotate-[-60deg]')}
        />
        {numComments} {numComments === 1 ? 'reply' : 'replies'}
      </div>
    </button>
  )
}
