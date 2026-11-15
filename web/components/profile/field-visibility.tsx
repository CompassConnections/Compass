import clsx from 'clsx'
import {type ProfileWithoutUser} from 'common/profiles/profile'
import {
  type Audience,
  effectiveAudience,
  fieldsOfSection,
  isNarrowerThan,
  parseFieldVisibility,
  PROFILE_FIELDS,
  profileAudience,
  type ProfileFieldKey,
  type ProfileSection,
} from 'common/profiles/visibility'
import {uniq} from 'lodash'
import {createContext, type ReactNode, useContext} from 'react'
import {Row} from 'web/components/layout/row'
import {AudienceChip} from 'web/components/profile/audience-chip'
import {useT} from 'web/lib/locale'
import {labelClassName} from 'web/pages/signup'

type FieldVisibilityState = {
  profile: Pick<ProfileWithoutUser, 'visibility'> & {field_visibility?: unknown}
  /** Sets one audience on several fields at once — one field, or every field of a section. */
  setAudience: (fields: ProfileFieldKey[], audience: Audience) => void
}

const FieldVisibilityContext = createContext<FieldVisibilityState | null>(null)

/**
 * Gives the profile form's labels and section headings access to who-sees-what, so each can draw its
 * own chip without the form threading two props through every field.
 *
 * Only per-field choices are ever written. Picking the audience the whole profile already has removes
 * the field's entry, so the stored map holds exceptions only; a section control is nothing more than
 * `setAudience` called with all of that section's fields.
 */
export function FieldVisibilityProvider(props: {
  profile: FieldVisibilityState['profile']
  setFieldVisibility: (next: Record<string, Audience>) => void
  children: ReactNode
}) {
  const {profile, setFieldVisibility, children} = props

  const setAudience = (fields: ProfileFieldKey[], audience: Audience) => {
    const next = {...parseFieldVisibility(profile.field_visibility)}
    const base = profileAudience(profile)
    for (const field of fields) {
      if (audience === base) delete next[field]
      else next[field] = audience
    }
    setFieldVisibility(next)
  }

  return (
    <FieldVisibilityContext.Provider value={{profile, setAudience}}>
      {children}
    </FieldVisibilityContext.Provider>
  )
}

const useFieldVisibility = () => useContext(FieldVisibilityContext)

/** The chip for one field. Renders nothing outside a `FieldVisibilityProvider`. */
export function FieldAudienceChip(props: {
  field: ProfileFieldKey
  subject: string
  className?: string
}) {
  const {field, subject, className} = props
  const state = useFieldVisibility()
  if (!state) return null
  const base = profileAudience(state.profile)
  const value = effectiveAudience(state.profile, field)
  return (
    <AudienceChip
      value={value}
      quiet={value === base}
      subject={subject}
      onChange={(audience) => state.setAudience([field], audience)}
      className={className}
    />
  )
}

/**
 * A field's label with its audience chip on the same row, right-aligned to the edge of the form
 * column.
 *
 * In a section that holds a single field the chip is left to the section heading, which then *is*
 * that field's control — two identical chips stacked one above the other would only raise the
 * question of how they differ.
 */
export function FieldLabel(props: {
  field: ProfileFieldKey
  children: ReactNode
  /** Plain-text name of the field for the chip, when `children` is not a string. */
  subject?: string
  className?: string
}) {
  const {field, children, subject, className} = props
  const alone = fieldsOfSection(PROFILE_FIELDS[field].section).length === 1
  return (
    <Row className={clsx('w-full items-center justify-between gap-3', className)}>
      <label className={clsx(labelClassName, 'min-w-0')}>{children}</label>
      {!alone && (
        <FieldAudienceChip
          field={field}
          subject={subject ?? (typeof children === 'string' ? children : field)}
        />
      )}
    </Row>
  )
}

/**
 * The chip on a section heading. It stores nothing of its own: it shows the audience its fields
 * share (or "Mixed"), and picking one sets every field under it.
 */
export function SectionAudienceChip(props: {section: ProfileSection; subject: string}) {
  const {section, subject} = props
  const state = useFieldVisibility()
  const t = useT()
  if (!state) return null
  const fields = fieldsOfSection(section)
  if (!fields.length) return null
  const base = profileAudience(state.profile)
  const audiences = uniq(fields.map((field) => effectiveAudience(state.profile, field)))
  const value = audiences.length === 1 ? audiences[0] : 'mixed'
  const single = fields.length === 1
  return (
    <AudienceChip
      value={value}
      quiet={value === base}
      subject={subject}
      prefix={single ? undefined : t('profile.audience.whole_section', 'Whole section')}
      shortPrefix={single ? undefined : t('profile.audience.all', 'All')}
      onChange={(audience) => state.setAudience(fields, audience)}
    />
  )
}

/**
 * Whether any field of the section is shown to fewer people than the profile-wide setting. For the
 * form index, which marks those sections with a lock. A field set *wider* than the rest does not
 * count: the lock means "something here is kept back".
 */
export const useSectionNarrowed = (section: ProfileSection | undefined) => {
  const state = useFieldVisibility()
  if (!state || !section) return false
  const base = profileAudience(state.profile)
  return fieldsOfSection(section).some((field) =>
    isNarrowerThan(effectiveAudience(state.profile, field), base),
  )
}
