import { Row } from 'web/components/layout/row'
import { Checkbox } from 'web/components/widgets/checkbox'
import clsx from "clsx";

export const MultiCheckbox = (props: {
  choices: { [key: string]: string }
  selected: string[]
  onChange: (selected: string[]) => void
  className?: string
}) => {
  const { choices, selected, onChange,  className } = props
  return (
    <Row className={clsx('flex-wrap', className)}>
      {Object.entries(choices).map(([key, value]) => (
        <Checkbox
          key={key}
          label={key}
          checked={selected.includes(value)}
          toggle={(checked: boolean) => {
            if (checked) {
              onChange([...selected, value])
            } else {
              onChange(selected.filter((s) => s !== value))
            }
          }}
        />
      ))}
    </Row>
  )
}
