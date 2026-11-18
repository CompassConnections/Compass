import clsx from 'clsx'
import {type Profile, type ProfileWithoutUser} from 'common/profiles/profile'
import {
  type Audience,
  canViewerSeeField,
  effectiveAudience,
  parseFieldVisibility,
  PROFILE_FIELD_KEYS,
  type ProfileAccessEntry,
  profileAudience,
  type ProfileFieldKey,
} from 'common/profiles/visibility'
import {type User} from 'common/user'
import {Eye, type LucideIcon, UserCheck, X} from 'lucide-react'
import Link from 'next/link'
import {createContext, useContext, useEffect, useMemo, useState} from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Modal} from 'web/components/layout/modal'
import {Row} from 'web/components/layout/row'
import {AUDIENCE_ICONS} from 'web/components/profile/audience-chip'
import {Avatar} from 'web/components/widgets/avatar'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useProfile} from 'web/hooks/use-profile'
import {useViewAs, ViewAsContext} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'

type VisibilitySource = Pick<ProfileWithoutUser, 'visibility'> & {field_visibility?: unknown}

/** The name of each hideable field, as the profile form calls it. */
export function useFieldNames(): Record<ProfileFieldKey, string> {
  const t = useT()
  return {
    age: t('profile.field.age', 'Age'),
    gender: t('profile.field.gender', 'Gender'),
    location: t('profile.field.location', 'Location'),
    photos: t('profile.field.photos', 'Photos'),
    headline: t('profile.field.headline', 'Headline'),
    keywords: t('profile.field.keywords', 'Keywords'),
    bio: t('profile.field.bio', 'Bio'),
    pref_gender: t('profile.field.pref_gender', 'Who I want to meet'),
    pref_age: t('profile.field.pref_age', 'Age range I am looking for'),
    pref_max_distance: t('profile.field.pref_max_distance', 'Maximum distance'),
    pref_relation_styles: t('profile.field.pref_relation_styles', 'Connection type'),
    occupation: t('profile.field.occupation', 'Job title'),
    company: t('profile.field.company', 'Company'),
    work: t('profile.field.work', 'Work area'),
    education_level: t('profile.field.education_level', 'Education level'),
    university: t('profile.field.university', 'University'),
    relationship_status: t('profile.field.relationship_status', 'Relationship status'),
    orientation: t('profile.field.orientation', 'Orientation'),
    pref_romantic_styles: t('profile.field.pref_romantic_styles', 'Relationship style'),
    has_kids: t('profile.field.has_kids', 'Children'),
    wants_kids: t('profile.field.wants_kids', 'Wanting children'),
    political_beliefs: t('profile.field.political_beliefs', 'Political beliefs'),
    religion: t('profile.field.religion', 'Religious beliefs'),
    causes: t('profile.field.causes', 'Causes'),
    interests: t('profile.field.interests', 'Interests'),
    diet: t('profile.field.diet', 'Diet'),
    exercise: t('profile.field.exercise', 'Exercise'),
    smoking: t('profile.field.smoking', 'Smoking'),
    drinking: t('profile.field.drinking', 'Drinking'),
    psychedelics: t('profile.field.psychedelics', 'Psychedelics'),
    cannabis: t('profile.field.cannabis', 'Cannabis'),
    neurotype: t('profile.field.neurotype', 'Neurotype'),
    mbti: t('profile.field.mbti', 'MBTI'),
    big5: t('profile.field.big5', 'Big Five'),
    height: t('profile.field.height', 'Height'),
    ethnicity: t('profile.field.ethnicity', 'Ethnicity'),
    raised_in: t('profile.field.raised_in', 'Where I grew up'),
    languages: t('profile.field.languages', 'Languages'),
    links: t('profile.field.links', 'Links'),
    online_communities: t('profile.field.online_communities', 'Online communities'),
    accessibility_notes: t('profile.field.accessibility_notes', 'Accessibility'),
    answers: t('profile.field.answers', 'Compatibility answers'),
    endorsements: t('profile.field.endorsements', 'Endorsements'),
  }
}

/**
 * On your own profile: how the profile is set, how many fields have their own audience, and the
 * people you have approved. The preview of what each audience actually gets is `ViewAsBar`, at the
 * top of the page.
 */
export function OwnVisibilityNotice(props: {profile: VisibilitySource; className?: string}) {
  const {profile, className} = props
  const t = useT()
  const base = profileAudience(profile)
  const own = PROFILE_FIELD_KEYS.filter((field) => effectiveAudience(profile, field) !== base)
  const BaseIcon = AUDIENCE_ICONS[base]

  return (
    <Row
      className={clsx(
        'bg-canvas-200 text-primary-800 w-fit max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-4 py-3 text-sm',
        className,
      )}
    >
      <Row className="items-center gap-2">
        <BaseIcon className="h-4 w-4 flex-none" aria-hidden />
        <span>
          {base === 'public'
            ? t('profile.visibility_notice.public', 'Your profile is visible to everyone.')
            : t(
                'profile.visibility_notice.member',
                'Your profile is visible to members only.',
              )}{' '}
          {own.length > 0 &&
            t(
              'profile.visibility_notice.own_audience',
              '{count} of its fields have their own audience.',
              {count: own.length},
            )}
        </span>
      </Row>
      <Row className="items-center gap-4">
        <Link href="/profile" className="underline">
          {t('profile.visibility_notice.edit', 'Edit profile')}
        </Link>
        <ProfileAccessManager profile={profile} />
      </Row>
    </Row>
  )
}

export type ViewAsAudience = 'public' | 'member' | 'connected'
export const VIEW_AS_AUDIENCES: ViewAsAudience[] = ['public', 'member', 'connected']

/**
 * The reader a preview is looked at as, named one way everywhere "view as" appears — the "..." menu,
 * the bar above a running preview, and its banner: "A visitor", "A member", "Someone I approve".
 *
 * Singular and about a person on purpose, because it completes "View as …". It is deliberately not
 * the audience vocabulary of the settings ("Everyone", "Members", "People I approve"): a setting
 * names a set of people, a preview one kind of reader, and "View as Everyone" means nothing.
 */
export function useViewAsNames(): Record<ViewAsAudience, string> {
  const t = useT()
  return {
    public: t('profile.header.menu.view_as_visitor', 'A visitor'),
    member: t('profile.header.menu.view_as_member', 'A member'),
    connected: t('profile.header.menu.view_as_approved', 'Someone in my circle'),
  }
}

/**
 * How a profile page lets the owner start a preview from anywhere inside it: the page holds the
 * state and provides this, and the "..." menu in the profile's top bar reads it to offer "View as".
 * Absent wherever a profile is shown without that (beside a conversation, in a card).
 */
export const ViewAsControlContext = createContext<
  {setViewAs: (value: ViewAsAudience | undefined) => void} | undefined
>(undefined)
export const useViewAsControl = () => useContext(ViewAsControlContext)

/**
 * The switch shown above a "view as" preview: the other audiences, and "Me" to leave it. A preview
 * is started from the "..." menu in the profile's top bar; that menu is inside the preview once it
 * is running, and the preview is inert, so this is the way to change audience or get back out.
 */
export function ViewAsBar(props: {
  value: ViewAsAudience | undefined
  onChange: (value: ViewAsAudience | undefined) => void
  className?: string
}) {
  const {value, onChange, className} = props
  const t = useT()
  // Leaving is its own button — an X labelled "Exit preview" — and Escape, rather than a "Me" pill
  // sitting among the audiences: "Me" read as one more audience to look at, not as the way out.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onChange(undefined)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onChange])

  const viewerNames = useViewAsNames()
  const options: {key: ViewAsAudience; label: string; icon: LucideIcon}[] = VIEW_AS_AUDIENCES.map(
    (key) => ({key, label: viewerNames[key], icon: AUDIENCE_ICONS[key]}),
  )
  // One framed panel, tinted and dashed, so the preview's own controls cannot be mistaken for part of
  // the profile drawn under them: before, the pills and the one-line banner sat on the page
  // background in the same weight as the profile's own notices.
  return (
    <div className={className}>
      <div
        className="border-primary-500 bg-primary-50 rounded-xl border-2 border-dashed px-4 py-3 sm:px-5 sm:py-4"
        data-testid="view-as-bar"
      >
        <Row className="items-start justify-between gap-3">
          <Col className="min-w-0 gap-1">
            <Row className="text-primary-800 items-center gap-2 text-base font-semibold">
              <Eye className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2} />
              {t('profile.view_as.title', 'Preview mode')}
            </Row>
          </Col>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className={clsx(
              'bg-cta hover:bg-cta-hover inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-white',
              'focus-visible:ring-primary-500 focus:outline-none focus-visible:ring-2',
            )}
          >
            <X className="h-3.5 w-3.5 shrink-0" aria-hidden strokeWidth={2.5} />
            {t('profile.view_as.exit', 'Exit preview')}
          </button>
        </Row>

        <Row
          className="mt-3 flex-wrap items-center gap-x-3 gap-y-2 text-sm"
          role="group"
          aria-label={t('profile.view_as.label', 'View profile as')}
        >
          <span className="text-ink-900">{t('profile.view_as.label', 'View profile as')}</span>
          <Row className="flex-wrap gap-1.5">
            {options.map(({key, label, icon: Icon}) => {
              const selected = value === key
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange(key)}
                  className={clsx(
                    'inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1',
                    'focus-visible:ring-primary-500 focus:outline-none focus-visible:ring-2',
                    selected
                      ? 'border-primary-700 bg-primary-200 text-primary-900 font-medium'
                      : 'border-primary-300 text-ink-900 hover:border-primary-500',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden strokeWidth={2} />
                  {label}
                </button>
              )
            })}
          </Row>
        </Row>
      </div>
    </div>
  )
}

/** A member who is not the owner, for the preview to be read as. Matches no real account. */
const PREVIEW_MEMBER = {
  id: '__preview__',
  name: '',
  username: '',
  avatarUrl: '',
  createdTime: 0,
} as unknown as User

/**
 * Your own profile, rendered as one audience receives it.
 *
 * The profile is fetched already redacted for that audience by the server (`get-profile` with
 * `viewAs`), so what is drawn is what would be sent — not the full row with parts hidden in the
 * browser. `ViewAsContext` then makes the ordinary profile components draw as that reader. The whole
 * preview is `inert`: its buttons would act as you, not as the reader being previewed.
 */
export function ProfilePreview(props: {
  username: string
  ownProfile: VisibilitySource
  viewAs: ViewAsAudience
  children: (preview: {user: User; profile: Profile}) => React.ReactNode
  /** Shown while the preview loads — the controls, so there is always a way out. */
  fallback?: React.ReactNode
}) {
  const {username, ownProfile, viewAs, children, fallback} = props
  const {data} = useAPIGetter('get-profile', {username, viewAs})

  const viewer =
    viewAs === 'public' ? {} : {id: PREVIEW_MEMBER.id, isConnected: viewAs === 'connected'}
  const state = useMemo(
    () => ({
      user: viewAs === 'public' ? null : PREVIEW_MEMBER,
      // Answers and endorsements are not on the profile row; the sections that show them are left
      // out when this audience would get an empty answer for them.
      hidden: new Set(
        (['answers', 'endorsements'] as const).filter(
          (field) => !canViewerSeeField(ownProfile, field, viewer),
        ),
      ),
    }),
    [viewAs, ownProfile.visibility, JSON.stringify(ownProfile.field_visibility ?? {})],
  )

  // No wrapper and no `inert` here: `ProfileInfo` makes its own parts inert while previewing and
  // leaves the preview's controls, which it places under its top bar, usable.
  return data?.user && data.profile ? (
    <ViewAsContext.Provider value={state}>
      {children({user: data.user, profile: {...data.profile, user: data.user}})}
    </ViewAsContext.Provider>
  ) : (
    <>{fallback}</>
  )
}

/**
 * The owner's approvals: who is waiting for an answer, and who has been approved. A link that opens
 * the list, so it can sit in the profile form and on the owner's own profile alike.
 */
export function ProfileAccessManager(props: {
  className?: string
  /**
   * The profile whose circle this is, as the caller currently has it — the form passes its unsaved
   * state, so the list of fields follows the chips as they are changed. Falls back to the cached
   * own profile.
   */
  profile?: VisibilitySource
}) {
  const {className} = props
  const t = useT()
  const ownProfile = useProfile()
  const profile = props.profile ?? (ownProfile as VisibilitySource | null | undefined)
  const fieldNames = useFieldNames()
  // Exactly the fields a member of the circle gains: the ones set to it. In form order.
  const circleFields = profile
    ? PROFILE_FIELD_KEYS.filter((field) => effectiveAudience(profile, field) === 'connected')
    : []
  const [open, setOpen] = useState(false)
  const {data, refresh} = useAPIGetter('get-profile-access', {})
  const requests = data?.requests ?? []
  const approved = data?.approved ?? []

  const act = async (userId: string, action: 'approve' | 'revoke' | 'dismiss') => {
    try {
      await api('set-profile-access', {userId, action})
      await refresh()
    } catch {
      toast.error(t('profile.access.failed', 'That did not go through. Try again.'))
    }
  }

  return (
    <>
      <button
        type="button"
        className={clsx('inline-flex items-center gap-1.5 underline', className)}
        onClick={() => setOpen(true)}
      >
        <UserCheck className="h-4 w-4 flex-none" aria-hidden />
        {t('profile.access.manage', 'My circle')}
        {requests.length > 0 && (
          <span className="bg-cta rounded-full px-1.5 text-xs text-white no-underline">
            {requests.length}
          </span>
        )}
      </button>
      <Modal open={open} setOpen={setOpen} size="md" className="!min-h-0">
        <Col className="bg-canvas-50 gap-5 rounded-xl px-4 pb-6 pt-5 sm:px-6">
          <Col className="gap-1">
            <h2 className="text-ink-900 !m-0 text-lg font-semibold">
              {t('profile.access.manage', 'My circle')}
            </h2>
            {/* Which fields those are, by name: the sentence above is abstract until it says what
                someone actually gets to see by being added. */}
            {circleFields.length > 0 ? (
              // Not a `<ul>`: the global list styles draw a bullet on every `<li>`, which showed up
              // between the tags. The roles keep it a list for a screen reader.
              <>
                <p className="text-ink-800 text-sm">
                  {t(
                    'profile.access.explainer',
                    'Members in your circle see the fields you marked as sensitive:',
                  )}
                </p>
                <div
                  className="mt-2 flex flex-wrap gap-1.5"
                  role="list"
                  data-testid="circle-fields"
                >
                  {circleFields.map((field) => (
                    <span
                      key={field}
                      role="listitem"
                      className="bg-canvas-200 text-ink-900 rounded-full px-2.5 py-0.5 text-xs"
                    >
                      {fieldNames[field]}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-ink-800 mt-1 text-sm">
                {t(
                  'profile.access.no_fields',
                  'You have not yet set any field to “My circle” in the profile editor, so being in it shows nothing extra.',
                )}
              </p>
            )}
          </Col>

          {requests.length > 0 && (
            <Col className="gap-2">
              <h3 className="text-ink-900 !m-0 text-sm font-semibold">
                {t('profile.access.requests', 'Asking to join your circle')}
              </h3>
              {requests.map((entry) => (
                <AccessRow key={entry.id} entry={entry}>
                  <Button size="xs" color="cta" onClick={() => act(entry.id, 'approve')}>
                    {t('profile.access.approve', 'Add to my circle')}
                  </Button>
                  <Button size="xs" color="gray-outline" onClick={() => act(entry.id, 'dismiss')}>
                    {t('profile.access.ignore', 'Ignore')}
                  </Button>
                </AccessRow>
              ))}
            </Col>
          )}

          <Col className="gap-2">
            <h3 className="text-ink-900 !m-0 text-sm font-semibold">
              {t('profile.access.approved', 'In your circle')}
            </h3>
            {approved.length === 0 && (
              <p className="text-ink-800 text-sm">
                {t(
                  'profile.access.none',
                  'Nobody yet. You can add someone from their profile, or when they ask.',
                )}
              </p>
            )}
            {approved.map((entry) => (
              <AccessRow key={entry.id} entry={entry}>
                <Button size="xs" color="gray-outline" onClick={() => act(entry.id, 'revoke')}>
                  {t('profile.access.remove', 'Remove')}
                </Button>
              </AccessRow>
            ))}
          </Col>
        </Col>
      </Modal>
    </>
  )
}

function AccessRow(props: {entry: ProfileAccessEntry; children: React.ReactNode}) {
  const {entry, children} = props
  return (
    <Row className="items-center justify-between gap-3">
      <Row className="min-w-0 items-center gap-2">
        <Avatar size="sm" username={entry.username} avatarUrl={entry.avatarUrl} />
        <Link href={`/${entry.username}`} className="text-ink-900 truncate text-sm underline">
          {entry.name}
        </Link>
      </Row>
      <Row className="shrink-0 gap-2">{children}</Row>
    </Row>
  )
}

/**
 * On someone else's profile: everything about approvals between the two of you.
 *
 * - They asked you → approve or ignore, right where you can see who they are.
 * - You approved them → say so, with a way to take it back.
 * - You keep fields for approved people and have not approved them → offer to.
 * - They keep fields for approved people (`shares_more`) and have not approved you → one generic
 *   line and a request button. It never says which fields, or how many.
 */
export function ProfileAccessBar(props: {
  user: User
  profile: ProfileWithoutUser
  onChange?: () => void
}) {
  const {user, profile, onChange} = props
  const t = useT()
  const ownProfile = useProfile()
  const previewing = !!useViewAs()
  const {data, refresh} = useAPIGetter('get-profile-access', {userId: user.id})
  const [busy, setBusy] = useState(false)
  const pair = data?.pair

  const iKeepFields =
    !!ownProfile &&
    Object.values(parseFieldVisibility((ownProfile as VisibilitySource).field_visibility)).some(
      (audience: Audience) => audience === 'connected',
    )

  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true)
    try {
      await fn()
      await refresh()
      onChange?.()
      if (done) toast.success(done)
    } catch {
      toast.error(t('profile.access.failed', 'That did not go through. Try again.'))
    } finally {
      setBusy(false)
    }
  }
  const setAccess = (action: 'approve' | 'revoke' | 'dismiss', done?: string) =>
    run(() => api('set-profile-access', {userId: user.id, action}), done)

  if (!pair) return null

  const showRequest = !!profile.shares_more && pair.myRequest !== 'approved'
  // Never in a "view as" preview: there the reader is a stand-in, and the offer is the owner's own.
  const showOffer =
    !previewing && iKeepFields && pair.canAdd && !pair.approvedByMe && !pair.requestedOfMe
  if (!pair.requestedOfMe && !pair.approvedByMe && !showRequest && !showOffer) return null

  const lineClass =
    'bg-canvas-200 text-primary-800 w-fit max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-4 py-3 text-sm'

  return (
    <Col className="gap-2">
      {pair.requestedOfMe && (
        <Row className={lineClass}>
          <span>
            {t(
              'profile.access.asked_you',
              '{name} asked to join your circle, to see the parts of your profile you keep for it.',
              {name: user.name},
            )}
          </span>
          <Row className="gap-2">
            <Button
              size="xs"
              color="cta"
              disabled={busy}
              onClick={() =>
                setAccess('approve', t('profile.access.approved_toast', 'Added to your circle'))
              }
            >
              {t('profile.access.approve', 'Add to my circle')}
            </Button>
            <Button
              size="xs"
              color="gray-outline"
              disabled={busy}
              onClick={() => setAccess('dismiss')}
            >
              {t('profile.access.ignore', 'Ignore')}
            </Button>
          </Row>
        </Row>
      )}

      {pair.approvedByMe && (
        <Row className={lineClass}>
          <Row className="items-center gap-2">
            <UserCheck className="h-4 w-4 flex-none" aria-hidden />
            <span>
              {t(
                'profile.access.you_approved',
                '{name} is in your circle and can see the parts of your profile you keep for it.',
                {name: user.name},
              )}
            </span>
          </Row>
          <button
            type="button"
            className="underline"
            disabled={busy}
            onClick={() => setAccess('revoke')}
          >
            {t('profile.access.stop_sharing', 'Remove from my circle')}
          </button>
        </Row>
      )}

      {showOffer && (
        <Row className={lineClass}>
          <button
            type="button"
            className="inline-flex items-center gap-2 underline"
            disabled={busy}
            onClick={() =>
              setAccess('approve', t('profile.access.approved_toast', 'Added to your circle'))
            }
          >
            <UserCheck className="h-4 w-4 flex-none" aria-hidden />
            {t('profile.access.offer', 'Add {name} to my circle', {
              name: user.name,
            })}
          </button>
        </Row>
      )}

      {showRequest && (
        <Row className={lineClass}>
          <span>
            {t('profile.access.shares_more', '{name} shares more with their circle.', {
              name: user.name,
            })}
          </span>
          {pair.myRequest === 'requested' ? (
            <span className="text-ink-800">{t('profile.access.requested', 'Asked')}</span>
          ) : !pair.canRequest ? (
            // That something is kept back is said plainly; what is withheld is the button, until
            // the two of them are actually talking.
            <span className="text-ink-800">
              {t(
                'profile.access.not_yet',
                'You can ask to join it once the two of you have a conversation going.',
              )}
            </span>
          ) : (
            <Button
              size="xs"
              color="cta"
              disabled={busy}
              onClick={() =>
                run(
                  () => api('request-profile-access', {userId: user.id}),
                  t('profile.access.request_sent', 'Request sent'),
                )
              }
            >
              {t('profile.access.request', 'Ask to join their circle')}
            </Button>
          )}
        </Row>
      )}
    </Col>
  )
}
