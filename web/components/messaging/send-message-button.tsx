import clsx from 'clsx'
import {MAX_COMMENT_LENGTH} from 'common/comment'
import {Profile} from 'common/profiles/profile'
import {User} from 'common/user'
import {findKey} from 'lodash'
import {useRouter} from 'next/router'
import React, {useEffect, useState} from 'react'
import {BiEnvelope} from 'react-icons/bi'
import {Button, buttonClass} from 'web/components/buttons/button'
import {CommentInputTextArea} from 'web/components/comments/comment-input'
import {Col} from 'web/components/layout/col'
import {Modal, MODAL_CLASS} from 'web/components/layout/modal'
import {EmailVerificationPrompt} from 'web/components/messaging/email-verification-prompt'
import {useTextEditor} from 'web/components/widgets/editor'
import {Tooltip} from 'web/components/widgets/tooltip'
import {useFirebaseUser} from 'web/hooks/use-firebase-user'
import {useSortedPrivateMessageMemberships} from 'web/hooks/use-private-messages'
import {usePrivateUser, useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {firebaseLogin} from 'web/lib/firebase/users'
import {useT} from 'web/lib/locale'

export const SendMessageButton = (props: {
  toUser: User
  profile: Profile
  includeLabel?: boolean
  circleButton?: boolean
  text?: string
  tooltipText?: string
  className?: string
  disabled?: boolean
  accentIfMessaged?: boolean
  onPointerDown?: () => void
  size?: string
}) => {
  const {
    toUser,
    profile,
    includeLabel,
    circleButton,
    text,
    tooltipText,
    disabled,
    onPointerDown,
    className,
    size = 'h-6 w-6',
    accentIfMessaged,
  } = props
  const firebaseUser = useFirebaseUser()
  const router = useRouter()
  const privateUser = usePrivateUser()
  const currentUser = useUser()
  const channelMemberships = useSortedPrivateMessageMemberships(currentUser?.id)
  const {memberIdsByChannelId} = channelMemberships
  const t = useT()

  const [openComposeModal, setOpenComposeModal] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const previousDirectMessageChannel = findKey(
    memberIdsByChannelId,
    (dm) => dm.includes(toUser.id) && dm.length === 1,
  )

  const previousChannelId =
    previousDirectMessageChannel !== undefined ? previousDirectMessageChannel : undefined

  const putAccent = previousChannelId !== undefined && accentIfMessaged

  const messageButtonClicked = async () => {
    if (disabled) return
    if (!currentUser) return firebaseLogin()
    if (previousChannelId) router.push(`/messages/${previousChannelId}`)
    else setOpenComposeModal(true)
  }
  const editor = useTextEditor({
    key: `compose-new-message-${toUser.id}`,
    size: 'sm',
    max: MAX_COMMENT_LENGTH,
    placeholder: t(
      'send_message.placeholder',
      `What genuinely resonated with you in {name}'s profile? What would you like to explore together?`,
      {name: toUser.name},
    ),
    className: 'min-h-[150px]',
    nRowsMin: 3,
  })

  useEffect(() => {
    if (openComposeModal && editor) {
      // Focus the editor after a short delay to ensure the modal is fully rendered
      setTimeout(() => {
        editor.commands.focus()
      }, 100)
    }
  }, [openComposeModal, editor])

  const sendMessage = async () => {
    if (!editor) return
    setSubmitting(true)
    const res = await api('create-private-user-message-channel', {
      userIds: [toUser.id],
    }).catch((e) => {
      setError(e.message)
      setSubmitting(false)
      return
    })
    if (!res) return

    const msgRes = await api('create-private-user-message', {
      channelId: res.channelId,
      content: editor.getJSON(),
    }).catch((e: any) => {
      setError(e.message)
      setSubmitting(false)
      return
    })
    if (!msgRes) return

    router.push(`/messages/${res.channelId}`)
  }

  const [insertedChips, setInsertedChips] = useState<string[]>([])

  const toggleChip = (label: string) => {
    if (!editor) return

    const alreadyInserted = insertedChips.includes(label)

    if (alreadyInserted) {
      // remove the token from the editor text
      const current = editor.getText()
      const cleaned = current.replace(new RegExp(`\\s?${label}`, 'gi'), '').trim()
      editor.commands.setContent(cleaned)
      setInsertedChips((prev) => prev.filter((c) => c !== label))
    } else {
      // append at cursor (or end)
      editor.chain().focus().insertContent(` ${label}`).run()
      setInsertedChips((prev) => [...prev, label])
    }
  }

  const MIN_CHARS = 200

  const charCount = editor?.getText().trim().length ?? 0
  const pct = Math.min((charCount / MIN_CHARS) * 100, 100)
  // Smooth color transition from red (0%) to green (100%)
  const r = pct < 50 ? 255 : Math.round(((100 - pct) / 50) * 255)
  const g = pct < 50 ? Math.round((pct / 50) * 255) : 255
  const b = Math.round(0)
  const barColor = `rgb(${r}, ${g}, ${b})`

  if (privateUser?.blockedByUserIds.includes(toUser.id)) return null

  return (
    <>
      <Tooltip
        text={
          tooltipText ||
          (putAccent ? t('send_message.', 'Follow Up') : t('send_message.button_label', 'Message'))
        }
        noTap
      >
        {text ? (
          <Button
            className={clsx('h-fit gap-1', disabled && 'opacity-50 cursor-not-allowed')}
            color={'primary'}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault()
              onPointerDown?.()
              messageButtonClicked()
            }}
            onPointerDown={onPointerDown}
            disabled={disabled}
          >
            {text}
          </Button>
        ) : circleButton ? (
          <button
            className={clsx(
              'h-7 w-7 rounded-full transition-colors',
              disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-900 hover:bg-primary-600',
            )}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault()
              onPointerDown?.()
              messageButtonClicked()
            }}
            onPointerDown={onPointerDown}
            disabled={disabled}
          >
            <BiEnvelope
              className={clsx('m-auto h-5 w-5 text-white drop-shadow', includeLabel && 'mr-2')}
            />
          </button>
        ) : (
          <button
            onPointerDown={onPointerDown}
            disabled={disabled}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault()
              onPointerDown?.()
              messageButtonClicked()
            }}
            className={clsx(
              'relative border border-canvas-200',
              buttonClass('xs', 'none'),
              disabled && 'opacity-50 cursor-not-allowed',
              className,
              putAccent
                ? 'bg-green-200 border-green-500 !text-green-500'
                : 'bg-canvas-50 border-canvas-300 text-ink-500 hover:border-primary-400 hover:bg-primary-50',
            )}
          >
            {putAccent && (
              <span className="absolute top-[3px] right-[3px] w-[7px] h-[7px] rounded-full bg-green-500 border-[1.5px] border-canvas-50" />
            )}
            <BiEnvelope className={clsx(size, includeLabel && 'mr-2')} />{' '}
            {includeLabel && <>{t('send_message.button_label', 'Message')}</>}
          </button>
        )}
      </Tooltip>

      <Modal open={openComposeModal} setOpen={setOpenComposeModal}>
        <Col className={MODAL_CLASS}>
          <Col className={'w-full mb-2'}>
            <p className={'font-cormorant text-3xl font-medium text-ink-900 mb-2'}>
              {t('send_message.title', 'Start a meaningful conversation')}
            </p>
            <p className={'text-ink-500 text-sm leading-relaxed'}>
              {t(
                'send_message.guidance',
                'Compass is about depth. Take a moment to write something genuine.',
              )}
            </p>
          </Col>

          {firebaseUser?.emailVerified ? (
            <>
              {!!profile.keywords?.length && (
                <div className={'w-full bg-canvas-50 border border-canvas-200 rounded-xl p-3'}>
                  <p className={'text-ink-500 mb-2 text-xs font-medium'}>
                    {t(
                      'send_message.keywords_hint',
                      `Insert some of {name}'s topics in your message`,
                      {name: toUser.name},
                    )}
                  </p>
                  <div className={'flex flex-wrap gap-2'}>
                    {profile.keywords.map((k) => (
                      <button
                        key={k}
                        type={'button'}
                        onClick={() => toggleChip(k)}
                        className={clsx(
                          'text-xs px-3 py-1 rounded-full transition-colors border',
                          insertedChips.includes(k)
                            ? 'bg-primary-50 border-primary-300 text-primary-700'
                            : 'bg-canvas-100 border-canvas-200 text-ink-500 hover:border-primary-300 hover:bg-primary-50',
                        )}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <CommentInputTextArea
                editor={editor}
                user={currentUser}
                submit={sendMessage}
                isSubmitting={!editor || submitting}
                isDisabled={charCount < MIN_CHARS}
                submitOnEnter={false}
              />

              <p className="text-ink-500 text-xs text-center leading-relaxed">
                {t(
                  'send_message.min_chars_hint',
                  'Write at least {count} characters to unlock the send button',
                  {count: MIN_CHARS},
                )}
              </p>

              {/* quality meter */}
              <div className={'mt-3 w-full flex items-center gap-3'}>
                <div
                  className={
                    'h-2 flex-1 rounded-full bg-canvas-100 border border-canvas-200 overflow-hidden'
                  }
                >
                  <div
                    className={'h-full rounded-full transition-all duration-300'}
                    style={{backgroundColor: barColor, width: `${pct}%`}}
                  />
                </div>
                <span className={'tabular-nums text-ink-500 text-xs shrink-0'}>
                  {charCount < MIN_CHARS
                    ? `${charCount}`
                    : t('send_message.ready', 'Ready to send')}
                </span>
              </div>
            </>
          ) : (
            <EmailVerificationPrompt t={t} className="max-w-xl" />
          )}
          {error && (
            <span
              className={
                'text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm mt-2'
              }
            >
              {error}
            </span>
          )}
        </Col>
      </Modal>
    </>
  )
}
