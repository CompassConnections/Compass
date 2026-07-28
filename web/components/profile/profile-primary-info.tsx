import clsx from 'clsx'
import {convertGender, Gender} from 'common/gender'
import {getLocationText} from 'common/geodb'
import {Profile} from 'common/profiles/profile'
import {buildArray} from 'common/util/array'
import {capitalize} from 'lodash'
import React from 'react'
import {useT} from 'web/lib/locale'

import {ProfileLocation} from './profile-location'

/**
 * Place, age, gender as one editorial line separated by hairline slashes.
 *
 * The icons this used to carry were doing no work — nobody needs a pictogram to parse "32" as an age
 * once it sits in this sequence — and four of them turned the line under the name into visual clutter
 * at exactly the point the eye should be moving fastest.
 */
export default function ProfilePrimaryInfo(props: {
  profile: Profile
  short?: boolean
  /** Small, uppercase and tracked, for the line sitting above the name in the hero. */
  eyebrow?: boolean
}) {
  const {profile, short = false, eyebrow = false} = props
  const t = useT()

  const parts = buildArray<React.ReactNode>(
    // Checked here rather than left to ProfileLocation: a component that renders null still counts as
    // an entry, which would leave the line starting on a stray separator.
    !!getLocationText(profile) && <ProfileLocation profile={profile} hideIcon />,
    profile.age && String(profile.age),
    // Height is not here: it lives in the Details rail, where a number people filter on belongs.
    // In this line it read as a headline fact and pushed the eye past the gender that follows it.
    !short &&
      profile.gender &&
      capitalize(t(`profile.gender.${profile.gender}`, convertGender(profile.gender as Gender))),
  )

  if (parts.length === 0) return null

  return (
    <div
      className={clsx(
        'text-ink-500 flex flex-wrap items-center',
        eyebrow && 'font-dm-sans uppercase',
      )}
      data-testid="profile-gender-location-height-inches"
      style={eyebrow ? {fontSize: '11px', letterSpacing: '0.16em'} : {fontSize: '15px'}}
    >
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span
              aria-hidden
              className={clsx('text-ink-400 select-none', eyebrow ? 'px-2.5' : 'px-3.5')}
            >
              /
            </span>
          )}
          <span>{part}</span>
        </React.Fragment>
      ))}
    </div>
  )
}
