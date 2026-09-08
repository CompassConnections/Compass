import clsx from 'clsx'
import {OptionTableKey} from 'common/profiles/constants'
import {ProfileWithoutUser} from 'common/profiles/profile'
import {Col} from 'web/components/layout/col'
import {OptionPicker} from 'web/components/option-picker'
import {colClassName, labelClassName} from 'web/pages/signup'

/**
 * One taxonomy section of the profile form.
 *
 * The search-and-add field, the ranking, the "did you mean" step and the popularity-ordered default
 * view all live in {@link OptionPicker}; this is only the label and the form binding. It used to
 * hold a copy of the whole option table, sort it alphabetically and hand it to `MultiCheckbox` —
 * see `OptionPicker` for why none of that survived.
 */
export function AddOptionEntry(props: {
  title?: string
  profile: ProfileWithoutUser
  setProfile: <K extends keyof ProfileWithoutUser>(key: K, value: ProfileWithoutUser[K]) => void
  label: OptionTableKey
}) {
  const {profile, setProfile, label, title} = props
  return (
    // Several of these sections sit in the same form and share option labels (a member can add
    // "Chess" as both a work area and an interest), so the test id is what lets a locator say
    // *which* section's "Search or add" field or option chip it means.
    <Col className={clsx(colClassName)} data-testid={`option-entry-${label}`}>
      {title && <label className={clsx(labelClassName)}>{title}</label>}
      <OptionPicker
        label={label}
        allowCreate
        selected={(profile[label] ?? []).map((s) => String(s))}
        onChange={(selected) => setProfile(label, selected as string[] | undefined)}
      />
    </Col>
  )
}
