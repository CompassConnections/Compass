import {INVERTED_RELATIONSHIP_CHOICES, RELATIONSHIP_CHOICES} from 'common/choices'
import {Profile} from 'common/profiles/profile'
import {useEffect, useState} from 'react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {SendMessageButton} from 'web/components/messaging/send-message-button'
import {Subtitle} from 'web/components/widgets/profile-subtitle'
import {Tooltip} from 'web/components/widgets/tooltip'
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
  - They won’t see this unless they choose the same type with you. 
  - If you both choose the same type, you’re both notified.
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

  return (
    <Col className="w-full gap-6 rounded-xl shadow-sm">
      <div className="border-y border-canvas-200 p-2 pb-8">
        <Subtitle className="mb-4">{t('profile.connect.title', 'Connect')}</Subtitle>

        {/* Primary Action */}
        <div className="mb-6">
          {profile.allow_direct_messaging || matches.length > 0 ? (
            <SendMessageButton
              toUser={user}
              currentUser={currentUser}
              text={t('messaging.send_thoughtful_message', 'Send them a thoughtful message')}
            />
          ) : (
            <p className={'guidance'}>
              {t(
                'profile.connect.direct_messaging_disabled',
                '{user} turned off direct messaging',
                {user: user.name},
              )}
            </p>
          )}
        </div>

        {/* Interest Section */}
        <div className="prose prose-neutral dark:prose-invert">
          <div className="text-ink-700 font-medium text-lg">
            {t('profile.connect.private_connection_signal', 'Private connection signal')}
          </div>

          {profile.allow_interest_indicating ? (
            <>
              <Row className={'gap-2 my-4'}>
                <div className="text-ink-500">
                  {t(
                    'profile.wont_be_notified_unless_mutual',
                    'They won’t be notified unless the interest is mutual.',
                  )}
                </div>
                <button className="text-primary-600" onClick={() => setShowHelp(!showHelp)}>
                  {t('profile.connect.how_this_works', 'How this works')}
                </button>
              </Row>
              {showHelp && <ReactMarkdown>{tips}</ReactMarkdown>}
              <div className="flex flex-wrap gap-3">
                {Object.entries(RELATIONSHIP_CHOICES).map(([label, type]) => {
                  const isSelected = interests.includes(type)
                  const isMutual = interests.includes(type) && targetInterests.includes(type)

                  const isDisabled =
                    !(
                      targetSoughtConnections?.includes(type) ||
                      (targetSoughtConnections ?? []).length === 0
                    ) || !soughtConnections?.includes(type)

                  return (
                    <Tooltip
                      key={'connection-type-key-' + type}
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
                        className={`
                px-4 py-2 rounded-full text-sm font-medium transition
                border
                ${
                  isMutual
                    ? 'bg-primary-100 border-primary-500 border-2'
                    : isSelected
                      ? 'bg-primary-100 border-primary-300'
                      : 'bg-canvas-50 text-ink-700 border-ink-300'
                }
                ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:border-primary-400'}
              `}
                      >
                        {t(`profile.relationship.${type}`, label)}
                        {isMutual && ` • ${t('profile.mutual', 'Mutual')}`}
                      </button>
                    </Tooltip>
                  )
                })}
              </div>
              {matches.length > 0 && (
                <div className="my-4">
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
                </div>
              )}
            </>
          ) : (
            <p className={'guidance'}>
              {t(
                'profile.turned_off_interest_indicators',
                '{user} turned off interest indicators',
                {user: user.name},
              )}
            </p>
          )}
        </div>
      </div>
    </Col>
  )
}
