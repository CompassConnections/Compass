import clsx from 'clsx'
import {INVERTED_RELATIONSHIP_CHOICES, RELATIONSHIP_CHOICES} from 'common/choices'
import {Profile} from 'common/profiles/profile'
import {CheckIcon, InfoIcon, SparklesIcon} from 'lucide-react'
import {useEffect, useState} from 'react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {SendMessageButton} from 'web/components/messaging/send-message-button'
import {Tooltip} from 'web/components/widgets/tooltip'
import {shortenName} from 'web/components/widgets/user-link'
import {useProfile} from 'web/hooks/use-profile'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {User} from 'web/lib/firebase/users'
import {useT} from 'web/lib/locale'

export function ConnectActions(props: {profile: Profile; user: User}) {
  const {profile, user} = props
  const currentUser = useUser()
  const currentProfile = useProfile()
  const t = useT()
  const isCurrentUser = currentUser?.id === user.id

  const soughtConnections = currentProfile?.pref_relation_styles
  const targetSoughtConnections = profile.pref_relation_styles

  const [interests, setInterests] = useState<string[]>([])
  const [targetInterests, setTargetInterests] = useState<string[]>([])

  const matches = interests.filter((interest) => targetInterests.includes(interest))

  const tips = t(
    'profile.connect.tips',
    `
  - You choose the type of connection you're open to. 
  - They won’t see it until you both choose the same type.
  - You’re both notified.
  `,
  )
  const [showHelp, setShowHelp] = useState<boolean>(false)

  const loadPreferences = async () => {
    try {
      const result = await api('get-connection-interests', {
        targetUserId: user.id,
      })
      // debug('Preferences:', result)
      setInterests(result.interests)
      setTargetInterests(result.targetInterests)
    } catch (e) {
      console.error('Error loading preferences:', e)
      toast.error(t('profile.connect.load_preferences_failed', 'Failed to load preferences'))
    }
  }

  // Load user preferences
  useEffect(() => {
    if (!currentUser || isCurrentUser) return
    loadPreferences()
  }, [currentUser, user.id, isCurrentUser])

  const handleInterestChange = async (connectionType: string, checked: boolean) => {
    if (!currentUser || isCurrentUser) return

    try {
      await api('update-connection-interest', {
        targetUserId: user.id,
        connectionType,
        seeking: checked,
      })

      // Reload preferences to get updated data
      setInterests((prev) =>
        checked ? [...prev, connectionType] : prev.filter((e) => e !== connectionType),
      )
      if (checked) await loadPreferences()
    } catch (error) {
      console.error('Error updating preference:', error)
      toast.error(t('profile.connect.update_preference_failed', 'Failed to update preference'))
    }
  }

  if (isCurrentUser || !currentUser) return null

  const isTypeDisabled = (type: string) =>
    !(targetSoughtConnections?.includes(type) || (targetSoughtConnections ?? []).length === 0) ||
    !soughtConnections?.includes(type)

  const connectionTypes = Object.entries(RELATIONSHIP_CHOICES)
  const noSharedTypes = connectionTypes.every(([, type]) => isTypeDisabled(type))
  const hasSignalControls = !!profile.allow_interest_indicating && !noSharedTypes

  return (
    <Col className="w-full gap-8">
      {profile.allow_direct_messaging || matches.length > 0 ? (
        <SendMessageButton
          toUser={user}
          profile={profile}
          text={t('messaging.send_thoughtful_message', 'Send them a thoughtful message')}
        />
      ) : (
        <p className="text-ink-500 text-sm">
          {t('profile.connect.direct_messaging_disabled', '{user} turned off direct messaging', {
            user: user.name,
          })}
        </p>
      )}

      {/* No surface at all. The chips are pills, and a pill is already this page's signal for "you can
          click this" — the card was restating it in a heavier way, and it made this block outweigh the
          two actions above it, which are boxless despite being just as actionable. Nothing on this page
          is a card now; affordance is carried by the controls themselves. */}
      <div>
        <Row className="items-baseline justify-between gap-3">
          <h3
            className="text-ink-400 font-dm-sans uppercase"
            style={{fontSize: '10px', letterSpacing: '0.18em'}}
          >
            {t('profile.connect.private_connection_signal', 'Private connection signal')}
          </h3>
          {/* Explaining the mechanism is only worth the row when the mechanism is available. */}
          {hasSignalControls && (
            <button
              className="text-ink-500 hover:text-primary-600 flex flex-none items-center gap-1 text-xs transition-colors"
              onClick={() => setShowHelp(!showHelp)}
              aria-expanded={showHelp}
            >
              <InfoIcon className="h-3.5 w-3.5" />
              {t('profile.connect.how_this_works', 'How this works')}
            </button>
          )}
        </Row>

        {profile.allow_interest_indicating ? (
          <>
            {hasSignalControls && (
              <p className="text-ink-500 mt-2 text-sm">
                {t(
                  'profile.wont_be_notified_unless_mutual',
                  'They won’t be notified unless the interest is mutual.',
                )}
              </p>
            )}

            {showHelp && (
              <div className="border-canvas-200 text-ink-500 mt-4 rounded-xl border border-dashed px-4 py-3 text-sm [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-4">
                <ReactMarkdown>{tips}</ReactMarkdown>
              </div>
            )}

            {/* Every option locked means the chips can only say "no" three times over, in a shape that
                still looks pressable. Say it once instead, and give back the height. */}
            {noSharedTypes ? (
              <p className="text-ink-500 mt-3 text-sm">
                {t(
                  'profile.connect.no_shared_types',
                  "You and {name} aren't open to the same kind of connection.",
                  {name: shortenName(user.name)},
                )}
              </p>
            ) : (
              <Row className="mt-4 flex-wrap gap-2.5">
                {connectionTypes.map(([label, type]) => {
                  const isSelected = interests.includes(type)
                  const isMutual = isSelected && targetInterests.includes(type)
                  const isDisabled = isTypeDisabled(type)

                  return (
                    <Tooltip
                      key={'connection-type-key-' + type}
                      className={isDisabled ? 'cursor-not-allowed' : undefined}
                      text={
                        isDisabled &&
                        t('profile.not_both_open_to_type', 'You are not both open to a {type}', {
                          type: t(`profile.relationship.${type}`, label).toLowerCase(),
                        })
                      }
                    >
                      <button
                        disabled={isDisabled}
                        onClick={() => handleInterestChange(type, !isSelected)}
                        aria-pressed={isSelected}
                        className={clsx(
                          'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all',
                          // A muted, unmistakably inert style rather than a faded copy of the live one:
                          // 30% opacity reads as a rendering fault, not as "not available to you".
                          isDisabled
                            ? 'border-canvas-200 bg-canvas-100 text-ink-300 pointer-events-none'
                            : isMutual
                              ? 'border-primary-500 bg-primary-200 text-primary-900 font-medium shadow-sm'
                              : isSelected
                                ? 'border-primary-400 bg-primary-100 text-primary-800'
                                : 'border-canvas-300 bg-canvas-50 text-ink-700 hover:border-primary-400 hover:bg-primary-50',
                        )}
                      >
                        {/* No lock glyph: the muted style already says inert, and the tooltip says why.
                          Repeating a padlock on every unavailable option was heavier than the labels. */}
                        {isSelected && <CheckIcon className="h-3.5 w-3.5 flex-none" />}
                        {t(`profile.relationship.${type}`, label)}
                        {isMutual && (
                          <span className="bg-primary-500 ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white">
                            {t('profile.mutual', 'Mutual')}
                          </span>
                        )}
                      </button>
                    </Tooltip>
                  )
                })}
              </Row>
            )}

            {matches.length > 0 && (
              <Row className="border-primary-300 bg-primary-50 text-primary-800 mt-4 items-start gap-2 rounded-xl border px-4 py-3 text-sm">
                <SparklesIcon className="mt-0.5 h-4 w-4 flex-none" />
                <span>
                  {t(
                    'profile.mutual_interests',
                    'You both have mutual interests: {matches}. Contact them above to connect!',
                    {
                      matches: matches
                        .map((m) =>
                          t(
                            `profile.relationship.${m}`,
                            INVERTED_RELATIONSHIP_CHOICES[m],
                          ).toLowerCase(),
                        )
                        .join(', '),
                    },
                  )}
                </span>
              </Row>
            )}
          </>
        ) : (
          <p className="text-ink-500 mt-2 text-sm">
            {t('profile.turned_off_interest_indicators', '{user} turned off interest indicators', {
              user: user.name,
            })}
          </p>
        )}
      </div>
    </Col>
  )
}
