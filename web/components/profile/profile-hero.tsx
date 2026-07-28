import {EyeSlashIcon, LockClosedIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {Profile} from 'common/profiles/profile'
import {User, UserActivity} from 'common/user'
import Link from 'next/link'
import React from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import ProfileGallery from 'web/components/profile/profile-gallery'
import {ProfileConnectionGoals} from 'web/components/profile-about'
import {linkClass} from 'web/components/widgets/site-link'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {capitalizePure} from 'web/lib/util/time'

import ProfilePrimaryInfo from './profile-primary-info'

/**
 * The first screen of a profile: photos, identity, connection goals, tagline.
 *
 * These are the things a visitor decides on before reading anything else, so they share one band at the
 * top instead of being spread across the page. Everything ranked below them lives in `ProfileContent`.
 *
 * No call to action here on purpose: reaching out belongs to the top bar (always reachable) and the
 * Connect section at the end, not to the moment someone is still deciding who they are looking at.
 */
export default function ProfileHero(props: {
  user: User
  profile: Profile
  userActivity?: UserActivity
  simpleView?: boolean
  isHiddenFromMe: boolean | undefined
}) {
  const {user, profile, isHiddenFromMe, simpleView} = props
  const currentUser = useUser()
  const isCurrentUser = currentUser?.id === user.id
  const t = useT()

  const name = (
    <span
      className="font-heading text-ink-1000 font-normal"
      style={{
        fontSize: 'clamp(2.75rem, 4.4vw, 4.25rem)',
        lineHeight: '1.02',
        letterSpacing: '-0.02em',
      }}
    >
      {user.name}
    </span>
  )

  return (
    <Col className="gap-5">
      {currentUser && !isCurrentUser && isHiddenFromMe && (
        <Notice icon={<EyeSlashIcon className="h-4 w-4 flex-none" />}>
          {t(
            'profile_grid.hidden_notice',
            "You hid this person, so they don't appear in your search results.",
          )}
        </Notice>
      )}
      {currentUser && isCurrentUser && profile.disabled && (
        <Notice icon={<LockClosedIcon className="h-4 w-4 flex-none" />} tone="danger">
          {t(
            'profile.header.disabled_notice',
            'You disabled your profile, so no one else can access it.',
          )}
        </Notice>
      )}

      <div className="flex flex-col gap-10 md:flex-row md:items-start md:gap-16">
        <ProfileGallery profile={profile} />

        <Col className="min-w-0 flex-1 gap-7">
          <Col className="gap-3">
            <div data-testid="profile-display-name-age">
              {simpleView ? (
                <Link className={linkClass} href={`/${user.username}`}>
                  {name}
                </Link>
              ) : (
                name
              )}
            </div>
            <ProfilePrimaryInfo profile={profile} />
          </Col>

          {/* Outlined rather than filled, squared rather than pill: five filled pills read as five
              buttons. These are labels, and the eye should pass over them on the way to the tagline. */}
          {profile.keywords && profile.keywords.length > 0 && (
            <Row className="max-w-3xl flex-wrap gap-2" data-testid="profile-keywords">
              {profile.keywords.map(capitalizePure).map((tag, i) => (
                <span
                  key={i}
                  className="border-canvas-300 text-primary-800 font-dm-sans rounded-[3px] border uppercase"
                  style={{
                    padding: '6px 11px',
                    fontSize: '11px',
                    fontWeight: '400',
                    letterSpacing: '0.13em',
                  }}
                >
                  {tag.trim()}
                </span>
              ))}
            </Row>
          )}

          {/* The tagline is the one thing on this page written to be read as a voice, so it gets the
              serif italic at display size instead of a quoted aside pinned behind a rule. */}
          {profile.headline && (
            <div
              className="font-heading text-primary-900 max-w-[38ch] italic sm:max-w-[52ch]"
              data-testid="profile-headline"
              style={{
                fontSize: 'clamp(1.15rem, 1.5vw, 1.5rem)',
                lineHeight: '1.5',
                fontWeight: 400,
              }}
            >
              “{profile.headline}”
            </div>
          )}

          <ProfileConnectionGoals profile={profile} />
        </Col>
      </div>
    </Col>
  )
}

function Notice(props: {
  icon: React.ReactNode
  tone?: 'default' | 'danger'
  children: React.ReactNode
}) {
  const {icon, tone = 'default', children} = props
  return (
    <div
      className={clsx(
        'flex w-fit items-center gap-2 rounded-lg px-4 py-3 text-sm',
        tone === 'danger' ? 'bg-red-50 text-red-700' : 'bg-canvas-200 text-primary-800',
      )}
    >
      {icon}
      {children}
    </div>
  )
}
