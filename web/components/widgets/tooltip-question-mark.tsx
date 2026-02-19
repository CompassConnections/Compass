import {flip, offset, shift, useFloating} from '@floating-ui/react-dom'
import {QuestionMarkCircleIcon} from '@heroicons/react/outline'
import {useState} from 'react'

export function QuestionMarkTooltip(props: {text: string | any}) {
  // Work like Tooltip but also gets triggered upon click and not just highlight (which is necessary for mobile)
  // Use QuestionMarkTooltip for question marks (no click, no button)
  // Use Tooltip for buttons (star, message, etc.)
  // Seems like tooltip without noTap works
  const {text} = props
  const [open, setOpen] = useState(false)
  const {y, refs, strategy} = useFloating({
    placement: 'bottom', // place below the trigger
    middleware: [
      offset(8), // small gap between ? and box
      flip(),
      shift({padding: 8}), // prevent viewport clipping
    ],
  })

  return (
    <>
      <span
        className="inline-flex align-middle"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        ref={refs.setReference}
      >
        <QuestionMarkCircleIcon className="w-5 h-5 inline-flex align-middle" />
      </span>

      {open && (
        <div
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: '50%',
            transform: `translateX(-50%)`,
          }}
          className="p-3 bg-canvas-50 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 transition-opacity w-72 max-w-[calc(100vw-1rem)] whitespace-normal break-words"
        >
          <p className="text-sm text-gray-800 dark:text-gray-100">{text}</p>
        </div>
      )}
    </>
  )
}
