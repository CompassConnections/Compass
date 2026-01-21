import {ProfileWithoutUser} from "common/profiles/profile";
import {OptionTableKey} from "common/profiles/constants";
import {Col} from "web/components/layout/col";
import clsx from "clsx";
import {colClassName, labelClassName} from "web/pages/signup";
import {MultiCheckbox} from "web/components/multi-checkbox";

export function AddOptionEntry(props: {
  title?: string
  choices: { [key: string]: string }
  setChoices: (choices: any) => void
  profile: ProfileWithoutUser,
  setProfile: <K extends keyof ProfileWithoutUser>(key: K, value: ProfileWithoutUser[K]) => void
  label: OptionTableKey,
}) {
  const {profile, setProfile, label, choices, setChoices, title} = props
  return <Col className={clsx(colClassName)}>
    {title && <label className={clsx(labelClassName)}>{title}</label>}
    <MultiCheckbox
      choices={choices}
      selected={profile[label] ?? []}
      translationPrefix={`profile.${label}`}
      onChange={(selected) => setProfile(label, selected)}
      addOption={(v: string) => {
        console.log(`Adding ${label}:`, v)
        setChoices((prev: string[]) => ({...prev, [v]: v}))
        setProfile(label, [...(profile[label] ?? []), v])
        return {key: v, value: v}
      }}
    />
  </Col>
}