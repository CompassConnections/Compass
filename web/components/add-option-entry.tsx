import clsx from 'clsx'
import {debug} from 'common/logger'
import {OptionTableKey} from 'common/profiles/constants'
import {ProfileWithoutUser} from 'common/profiles/profile'
import {invert} from 'lodash'
import {Col} from 'web/components/layout/col'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {useLocale} from 'web/lib/locale'
import {colClassName, labelClassName} from 'web/pages/signup'

export function AddOptionEntry(props: {
  title?: string
  choices: {[key: string]: string}
  setChoices: (choices: any) => void
  profile: ProfileWithoutUser
  setProfile: <K extends keyof ProfileWithoutUser>(key: K, value: ProfileWithoutUser[K]) => void
  label: OptionTableKey
}) {
  const {profile, setProfile, label, choices, setChoices, title} = props
  const {locale} = useLocale()
  const sortedChoices = Object.fromEntries(
    Object.entries(invert(choices)).sort((a, b) => a[0].localeCompare(b[0], locale)),
  )
  return (
    // Several of these sections sit in the same form and share option labels (a member can add
    // "Chess" as both a work area and an interest), so the test id is what lets a locator say
    // *which* section's "Search or add" field or option chip it means.
    <Col className={clsx(colClassName)} data-testid={`option-entry-${label}`}>
      {title && <label className={clsx(labelClassName)}>{title}</label>}
      <MultiCheckbox
        choices={sortedChoices}
        selected={(profile[label] ?? []).map((s) => String(s))}
        onChange={(selected) => setProfile(label, selected as string[] | undefined)}
        addOption={(v: string) => {
          debug(`Adding ${label}:`, v)
          setChoices((prev: string[]) => ({...prev, [v]: v}))
          setProfile(label, [...(profile[label] ?? []), v])
          return {key: v, value: v}
        }}
      />
    </Col>
  )
}
