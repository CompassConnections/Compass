import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

/**
 * Three hopping dots in an incoming-message bubble, drawn where their next message will appear. The
 * animation lives in `globals.css` (`.typing-dot`).
 */
export function TypingIndicator(props: {names: string[]}) {
  const {names} = props
  const t = useT()
  const label =
    names.length === 1
      ? t('messages.typing_one', '{name} is typing…', {name: names[0]})
      : t('messages.typing_many', 'Several people are typing…')

  return (
    <Row className="mt-2 items-end" role="status">
      <div
        className="bg-canvas-50 flex h-9 items-center gap-1 rounded-3xl rounded-bl-none px-4"
        title={label}
      >
        {[0, 1, 2].map((i) => (
          <span key={i} aria-hidden className="typing-dot bg-ink-500 block h-2 w-2 rounded-full" />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </Row>
  )
}
