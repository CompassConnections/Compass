import clsx from 'clsx'
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
    <Col className={clsx(colClassName)}>
      {title && <label className={clsx(labelClassName)}>{title}</label>}
      <MultiCheckbox
        choices={sortedChoices}
        selected={(profile[label] ?? []).map((s) => String(s))}
        onChange={(selected) => setProfile(label, selected)}
        addOption={(v: string) => {
          console.log(`Adding ${label}:`, v)
          setChoices((prev: string[]) => ({...prev, [v]: v}))
          setProfile(label, [...(profile[label] ?? []), v])
          return {key: v, value: v}
        }}
      />
    </Col>
  )
}
