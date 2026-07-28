import {convertGender, Gender} from 'common/gender'
import {getLocationText} from 'common/geodb'
import {Profile} from 'common/profiles/profile'
import {buildArray} from 'common/util/array'
import {capitalize} from 'lodash'
import React from 'react'
import {useMeasurementSystem} from 'web/hooks/use-measurement-system'
import {useT} from 'web/lib/locale'

import {formatProfileValue} from '../profile-about'
import {ProfileLocation} from './profile-location'

/**
 * Place, age, height, gender as one editorial line separated by hairline slashes.
 *
 * The icons this used to carry were doing no work — nobody needs a pictogram to parse "32" as an age
 * once it sits in this sequence — and four of them turned the line under the name into visual clutter
 * at exactly the point the eye should be moving fastest.
 */
export default function ProfilePrimaryInfo(props: {profile: Profile; short?: boolean}) {
  const {profile, short = false} = props
  const t = useT()
  const {measurementSystem} = useMeasurementSystem()

  const parts = buildArray<React.ReactNode>(
    // Checked here rather than left to ProfileLocation: a component that renders null still counts as
    // an entry, which would leave the line starting on a stray separator.
    !!getLocationText(profile) && <ProfileLocation profile={profile} hideIcon />,
    profile.age && String(profile.age),
    !short &&
      profile.height_in_inches != null &&
      formatProfileValue('height_in_inches', profile.height_in_inches, measurementSystem, t),
    !short &&
      profile.gender &&
      capitalize(t(`profile.gender.${profile.gender}`, convertGender(profile.gender as Gender))),
  )

  if (parts.length === 0) return null

  return (
    <div
      className="text-ink-500 flex flex-wrap items-center"
      data-testid="profile-gender-location-height-inches"
      style={{fontSize: '15px'}}
    >
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span aria-hidden className="text-ink-400 px-3.5 select-none">
              /
            </span>
          )}
          <span>{part}</span>
        </React.Fragment>
      ))}
    </div>
  )
}
