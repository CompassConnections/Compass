import {CheckIcon} from '@heroicons/react/24/outline'
import {type JSONContent} from '@tiptap/core'
import {useEditorState} from '@tiptap/react'
import clsx from 'clsx'
import {MAX_COMMENT_LENGTH} from 'common/comment'
import {
  MIN_FIRST_MESSAGE_CHARS,
  ProfileGateIssues,
  profileVocabulary,
  referencesProfile,
} from 'common/moderation/first-message'
import {Profile} from 'common/profiles/profile'
import {User} from 'common/user'
import {isOwnImageUrl} from 'common/util/image-url'
import {richTextToString} from 'common/util/parse'
import {findKey} from 'lodash'
import {useRouter} from 'next/router'
import React, {useEffect, useMemo, useRef, useState} from 'react'
import {BiEnvelope} from 'react-icons/bi'
import {Button, buttonClass} from 'web/components/buttons/button'
import {CommentInputTextArea} from 'web/components/comments/comment-input'
import {linkifyUrls} from 'web/components/editor/autolink'
import {Col} from 'web/components/layout/col'
import {Modal, MODAL_CLASS} from 'web/components/layout/modal'
import {Row} from 'web/components/layout/row'
import {EmailVerificationPrompt} from 'web/components/messaging/email-verification-prompt'
import {usePrivateMessageMembershipsContext} from 'web/components/messaging/private-message-memberships-context'
import {
  AccountOnHoldNotice,
  isAutoBanUnderReviewError,
} from 'web/components/moderation/account-on-hold'
import {
  isOpenerReviewRejection,
  profileIncompleteIssues,
  ProfileIncompleteNotice,
} from 'web/components/moderation/profile-incomplete'
import {useTextEditor} from 'web/components/widgets/editor'
import {Tooltip} from 'web/components/widgets/tooltip'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useFirebaseUser} from 'web/hooks/use-firebase-user'
import {isBlocked, usePrivateUser, useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {skipEmailVerification} from 'web/lib/dev-flags'
import {useT} from 'web/lib/locale'
import {setPendingOpener} from 'web/lib/pending-openers'
import {promptSignIn} from 'web/lib/util/signup'

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
  const {memberIdsByChannelId} = usePrivateMessageMembershipsContext()
  const t = useT()

  const [openComposeModal, setOpenComposeModal] = useState(false)
  const [error, setError] = useState('')
  // Set instead of `error` when the new-conversation limit auto-banned them: that case gets the
  // full explanation panel rather than a one-line red error, since the outcome deserves context.
  const [onHold, setOnHold] = useState(false)
  // The sender's own profile is not written yet (no bio, too few compatibility answers). Also a
  // panel, with links to where that gets fixed. Asked the moment the composer opens (and again on
  // every open, since they may just have fixed it), so the panel replaces the editor before a word
  // is written rather than after. The API still refuses on send; that path only fills this in if
  // the preview and the real check disagree.
  const [profileIssues, setProfileIssues] = useState<ProfileGateIssues | null>(null)
  const {data: gate} = useAPIGetter(
    'get-profile-gate',
    openComposeModal && currentUser ? {} : undefined,
  )
  useEffect(() => {
    if (gate) setProfileIssues(gate.issues)
  }, [gate])
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
    if (!currentUser) return promptSignIn()
    if (previousChannelId) router.push(`/messages/${previousChannelId}`)
    else setOpenComposeModal(true)
  }
  const editor = useTextEditor({
    key: `compose-new-message-${toUser.id}`,
    size: 'sm',
    uploadFolder: 'messages',
    max: MAX_COMMENT_LENGTH,
    placeholder: t(
      'send_message.placeholder',
      `What genuinely resonated with you in {name}'s profile? What would you like to explore together?`,
      {name: toUser.name},
    ),
    // The editor sets an inline `min-height` from nRowsMin (editor.tsx), and inline style beats the
    // class below — so nRowsMin, not `min-h-[150px]`, is what actually decides the height. Five rows
    // gives a message with a 200-character minimum somewhere to live.
    // `!text-[1rem]`: 16px to match the sent bubble and avoid iOS Safari's focus zoom (see the
    // conversation composer in pages/messages/[channelId].tsx).
    className: 'min-h-[150px] !text-[1rem]',
    nRowsMin: 5,
  })

  // Deliberately NOT focusing the editor when the modal opens for now: on mobile, focusing it pops the
  // keyboard up immediately and hides most of the modal — the header, the topic chips and the
  // guidance — before the user has had a chance to read any of it. They tap into the editor
  // themselves when they're ready to write.
  // useEffect(() => {
  //   if (openComposeModal && editor) {
  //     // Focus the editor after a short delay to ensure the modal is fully rendered
  //     setTimeout(() => {
  //       editor.commands.focus()
  //     }, 100)
  //   }
  // }, [openComposeModal, editor])

  const scrollRef = useRef<HTMLDivElement>(null)
  const editorWrapRef = useRef<HTMLDivElement>(null)

  // The panel scrolls, and the editor grows with the message — so once the content outgrows the
  // panel, every new line would push the send button (and the line being typed) below the fold.
  // Pin the scroll to the bottom whenever the editor gets taller, so what's being written stays in
  // view and the header scrolls off the top instead. Only growth triggers it: on shrink, or when
  // the user scrolls up deliberately, we leave the position alone.
  useEffect(() => {
    const wrap = editorWrapRef.current
    const scroller = scrollRef.current
    if (!wrap || !scroller) return

    let lastHeight = wrap.getBoundingClientRect().height
    const observer = new ResizeObserver(([entry]) => {
      const height = entry.contentRect.height
      if (height > lastHeight) scroller.scrollTop = scroller.scrollHeight
      lastHeight = height
    })
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [openComposeModal, firebaseUser?.emailVerified])

  const sendMessage = async () => {
    if (!editor) return
    setSubmitting(true)
    const res = await api('create-private-user-message-channel', {
      userIds: [toUser.id],
    }).catch((e) => {
      const issues = profileIncompleteIssues(e)
      if (issues) setProfileIssues(issues)
      else if (isAutoBanUnderReviewError(e)) setOnHold(true)
      else setError(e.message)
      setSubmitting(false)
      return
    })
    if (!res) return

    linkifyUrls(editor)
    const content = editor.getJSON()
    const channelId = res.channelId
    // Optimistic: the message appears in the conversation at once, in the sender's bubble, while
    // the API runs the first-message checks behind it — the model review alone takes a few
    // seconds, and a send button that hangs for that long reads as broken. The conversation page
    // swaps the pending bubble for the stored message once the API accepts it, or shows why it was
    // refused; the recipient hears nothing until then. See `web/lib/pending-openers.ts`.
    setPendingOpener(channelId, {content, status: 'checking'})
    router.push(`/messages/${channelId}`)
    api('create-private-user-message', {channelId, content})
      .then(() => setPendingOpener(channelId, {content, status: 'sent'}))
      .catch((e: any) =>
        setPendingOpener(channelId, {
          content,
          status: 'rejected',
          reason: e?.message ?? String(e),
          // A copy-pasted or scam-flagged opener holds the account; there is nothing to resend.
          hold: isAutoBanUnderReviewError(e),
          reviewed: isOpenerReviewRejection(e),
        }),
      )
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

  const MIN_CHARS = MIN_FIRST_MESSAGE_CHARS

  // A card hands us the `card` projection — a truncated `bio_snippet`, no `bio` — and the live
  // "mention something from their profile" check below needs the whole bio, or it would refuse a
  // message about something further down than the snippet reaches. Fetched once the modal opens,
  // and only when the bio is missing: the profile page passes the full document already.
  const {data: fullProfile} = useAPIGetter(
    'get-profile',
    openComposeModal && profile.bio === undefined ? {username: toUser.username} : undefined,
  )
  const bioDoc = (profile.bio ?? fullProfile?.profile?.bio) as JSONContent | null | undefined
  // The same function the API runs (`common/moderation/first-message.ts`), on the same inputs, so
  // what unlocks here is what the server accepts.
  const vocabulary = useMemo(
    () =>
      profileVocabulary({
        name: toUser.name,
        username: toUser.username,
        headline: profile.headline,
        keywords: profile.keywords,
        bioText: bioDoc ? richTextToString(bioDoc) : profile.bio_snippet,
      }),
    [toUser.name, toUser.username, profile.headline, profile.keywords, bioDoc, profile.bio_snippet],
  )

  // Subscribe to the trimmed text; the editor no longer re-renders us per keystroke (see
  // editor.tsx), and this drives the live progress bar / unlock threshold below.
  const draft =
    useEditorState({
      editor,
      selector: ({editor}) => editor?.getText().trim() ?? '',
    }) ?? ''
  const charCount = draft.length
  const pct = Math.min((charCount / MIN_CHARS) * 100, 100)
  const longEnough = charCount >= MIN_CHARS
  // Advisory, not a gate: the word-matching check is too blunt to refuse a message on (a paraphrase
  // of the bio shares none of its words). Length alone unlocks the button; a message that picks up
  // nothing from the profile gets a warning beside it, and the API's model review has the last word.
  // Only shown once the button has unlocked, so it does not nag while the message is still short.
  const anchored = referencesProfile(draft, vocabulary)
  const isReady = longEnough
  const showReferenceWarning = longEnough && !anchored
  const firstName = toUser.name.split(' ')[0]
  // Amber while short, green once it unlocks — the design's signal that the threshold is met. The
  // green is the brand sage rather than the design's raw oklch, so it stays on-palette.
  const barColor = isReady ? '#6B8F71' : '#C17F3E'

  // Symmetric: previously this only checked `blockedByUserIds`, so after *you* blocked someone their
  // profile still offered a Message button that then 403'd from the server.
  if (isBlocked(privateUser, toUser.id)) return null

  return (
    <>
      {/* `w-fit`: Tooltip's reference element is a plain span, so in a flex column it stretched to the
          full width and armed the tooltip across all the empty space beside the button. */}
      <Tooltip
        className="w-fit"
        text={
          tooltipText ||
          (putAccent ? t('send_message.', 'Follow Up') : t('send_message.button_label', 'Message'))
        }
        noTap
      >
        {text ? (
          <Button
            // Solid fill, tight radius, an envelope leading the label: the one control in Connect
            // that should read as a button at a glance. The `cta` glow is dropped — at this size it
            // haloed the button against the page instead of sitting on it.
            className={clsx(
              'h-fit gap-2 !rounded-[10px] !px-5 !py-3 !text-[15px] font-semibold !shadow-none',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            // `cta`, not `primary`: `primary` is the *tinted secondary* pill (see button.tsx), which
            // in the dark ramp is brown-on-brown and read as disabled on the one control that is the
            // whole point of the Connect section.
            color={'cta'}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault()
              onPointerDown?.()
              messageButtonClicked()
            }}
            onPointerDown={onPointerDown}
            disabled={disabled}
          >
            <BiEnvelope className="h-[18px] w-[18px] flex-none" />
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

      {/* `!min-h-0` / `!h-auto` override the shared modal's fixed 60vh floor: this composer's content is
          short, and the forced height left roughly a third of the panel as empty canvas below the
          progress bar, which is what made it read as unfinished. */}
      {/* size="lg" (max-w-2xl) rather than the default md: this is the one modal in the app people
          actually compose long-form text in, and 200 characters minimum in a 448px column is a
          cramped place to do it. Mobile is unaffected — the panel is full-width there regardless. */}
      <Modal open={openComposeModal} setOpen={setOpenComposeModal} size="lg" className="!min-h-0">
        {/* `[&>*]:shrink-0` is load-bearing. This is a flex column, so by default a long message let
            flex compress the editor instead of overflowing the panel — and TextEditor's shell is
            `overflow-hidden`, so the compressed part was clipped with no way to scroll to it. That is
            why the top of a long message and the image/emoji toolbar became unreachable. Keeping
            children at their natural height makes the panel itself overflow, which `overflow-y-auto`
            then scrolls. */}
        <Col className={clsx(MODAL_CLASS, '!h-auto max-h-[85vh] overflow-hidden pb-5 !gap-0')}>
          {/* Split into a scrolling region and a pinned footer.
              Everything used to live in one scrolling column, so the progress bar and the send button
              — the two things telling you whether you may send yet — drifted off the bottom as soon as
              the message got long. They are now outside the scroller entirely and cannot move.
              `min-h-0` on the scroller is load-bearing: a flex child's default `min-height: auto`
              refuses to shrink below its content, so without it the region would grow past the panel
              and push the footer out again — the same class of bug as the `[&>*]:shrink-0` note. */}
          <Col
            ref={scrollRef}
            className={'w-full flex-1 min-h-0 overflow-y-auto gap-4 [&>*]:shrink-0'}
          >
            {/* Header. Follows the Compose Modal design: portrait, an uppercase "writing to" eyebrow,
              then the serif title and a hairline. The earlier full-bleed gradient band competed with
              the content it was introducing. */}
            <Col className={'w-full'}>
              <Row className={'items-center gap-3.5 mb-6'}>
                {/* A plain <img> loads straight from the viewer's browser, so only a photo we host. */}
                {isOwnImageUrl(profile.pinned_url) && (
                  <img
                    src={profile.pinned_url!}
                    alt=""
                    className={'h-13 w-13 rounded-full object-cover border border-canvas-200'}
                    style={{width: 52, height: 52}}
                  />
                )}
                <Col className={'gap-0.5'}>
                  <span
                    className={
                      'text-primary-700 text-[11px] font-semibold uppercase tracking-[0.09em]'
                    }
                  >
                    {t('send_message.writing_to', 'Writing to')}
                  </span>
                  <span className={'text-ink-900 text-[17px] font-semibold leading-tight'}>
                    {toUser.name}
                  </span>
                </Col>
              </Row>

              <h2
                className={
                  'font-heading text-[32px] font-medium leading-[1.15] text-ink-1000 !mt-0 mb-3'
                }
              >
                {t('send_message.title', 'Start a meaningful conversation')}
              </h2>
              <p className={'text-ink-500 text-[15px] leading-[1.55] max-w-[92%]'}>
                {/* The rules, not a mood. "Take a moment to write something genuine" was gentle
                    enough to ignore, and the reports showed it being ignored. Each clause here names
                    a consequence the server actually applies. */}
                {t(
                  'send_message.guidance.v2',
                  'Write about something {name} wrote: a value, a prompt answer, a cause. Not their looks, and not a message you’ve sent to anyone else. Copy-pasted openers put your account on hold, and accounts that comment on appearance are removed.',
                  {name: firstName},
                )}
              </p>
              <div className={'h-px bg-canvas-200 mt-6'} />
            </Col>

            {/* skipEmailVerification is dev-only and cannot be enabled in a production build; the API
              still rejects unverified senders. See web/lib/dev-flags.ts. */}
            {onHold ? (
              <AccountOnHoldNotice reason={'auto_rate_limit'} className="max-w-xl mt-2" />
            ) : profileIssues ? (
              <ProfileIncompleteNotice issues={profileIssues} className="max-w-xl mt-2" />
            ) : firebaseUser?.emailVerified || skipEmailVerification ? (
              <>
                {/* Topics box: a 40% tint rather than solid canvas-100. At full strength the fill sat a
                  whole step away from the modal's canvas-50 surface and read as a separate panel. The
                  border is what defines the box; the fill only needs to hint at it. Works in both
                  themes, since canvas-100 sits on the far side of canvas-50 either way. */}
                {!!profile.keywords?.length && (
                  <div
                    className={
                      'w-full bg-canvas-100/80 border border-canvas-200 rounded-2xl p-[18px]'
                    }
                  >
                    <p className={'text-primary-700 mb-3 text-[12.5px] font-semibold'}>
                      {t('send_message.keywords_hint', `Insert some of {name}'s topics`, {
                        name: firstName,
                      })}
                    </p>
                    <div className={'flex flex-wrap gap-[9px]'}>
                      {profile.keywords.map((k) => (
                        <button
                          key={k}
                          type={'button'}
                          onClick={() => toggleChip(k)}
                          // Same chip language as the filter rail, so selecting a topic here reads the
                          // same as narrowing a search there.
                          className={clsx(
                            'inline-flex items-center gap-1.5 text-[13.5px] font-medium px-[15px] py-2 rounded-full border transition-colors duration-150 whitespace-nowrap',
                            insertedChips.includes(k)
                              ? 'bg-cta border-cta text-white'
                              : 'bg-canvas-0 border-canvas-300 text-ink-700 hover:bg-primary-50 hover:border-primary-400',
                          )}
                        >
                          {insertedChips.includes(k) && (
                            <CheckIcon className={'h-3 w-3'} strokeWidth={3} />
                          )}
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* No wrapper here. TextEditor already draws its own bordered shell
                  (`border-ink-300 ... rounded-lg` in editor.tsx), so adding one produced two nested
                  outlines. Restyle that single shell instead — `!` because clsx just concatenates and
                  the base classes would otherwise win by stylesheet order. */}
                {/* Plain wrapper purely so the effect above has something whose height it can observe;
                  it stretches like any flex child, so it doesn't change the layout. */}
                <div ref={editorWrapRef} className={'w-full'}>
                  <CommentInputTextArea
                    editor={editor}
                    user={currentUser}
                    submit={sendMessage}
                    isSubmitting={!editor || submitting}
                    isDisabled={!isReady}
                    hideSubmitButton
                    submitOnEnter={false}
                    // max-h-none: let the editor grow and let the *modal* do the scrolling instead of
                    // trapping the message in a ~25vh inner scroller. That inner box made it awkward to
                    // scroll back to the top of a long message, and pushed the image/emoji toolbar —
                    // which sits below it — out of reach on shorter windows.
                    maxHeight={'max-h-none'}
                    className={
                      '!rounded-2xl !border-[1.5px] !border-canvas-200 !bg-canvas-0/50 !shadow-none focus-within:!border-primary-400 focus-within:!ring-0'
                    }
                  />
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

          {/* Pinned footer — outside the scroller, so it is visible no matter how long the message is.
            Hidden once the account is on hold: there is nothing left to send until we've reviewed it. */}
          {(firebaseUser?.emailVerified || skipEmailVerification) && !onHold && !profileIssues && (
            <Col className={'w-full shrink-0 gap-3.5 pt-4'}>
              {/* Progress toward the minimum length, with the count beside it. */}
              <div className={'w-full flex items-center gap-3.5'}>
                <div className={'h-[5px] flex-1 rounded-full bg-canvas-200 overflow-hidden'}>
                  <div
                    className={'h-full rounded-full transition-all duration-200 ease-out'}
                    style={{background: barColor, width: `${pct}%`}}
                  />
                </div>
                <span className={'tabular-nums text-ink-500 text-[12.5px] whitespace-nowrap'}>
                  {charCount} / {MIN_CHARS}
                </span>
              </div>

              {/* The brand amber ramp rather than Tailwind's amber-50: the ramp inverts in dark mode,
                  so the fill stays a tint of the surface and primary-700 stays legible on it. A raw
                  amber-50 fill under dark-mode ink was a cream box with near-white text. */}
              {showReferenceWarning && (
                <p
                  data-testid="send-message-reference-warning"
                  className={
                    'text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-sm'
                  }
                >
                  {t(
                    'send_message.reference_warning',
                    "This doesn't seem to mention anything from {name}'s profile. Openers that could be sent to anyone tend to go unanswered, and our review may hold it back.",
                    {name: firstName},
                  )}
                </p>
              )}
              <button
                type={'button'}
                data-testid="send-message-submit"
                onClick={sendMessage}
                disabled={!isReady || submitting}
                className={clsx(
                  'w-full rounded-[14px] px-5 py-[15px] text-[15px] font-semibold transition-colors duration-150',
                  isReady
                    ? 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
                    : 'bg-canvas-200 text-ink-400 cursor-not-allowed',
                )}
              >
                {isReady
                  ? t('send_message.send', 'Send message')
                  : t('send_message.unlock', 'Write {count} more characters to unlock', {
                      count: MIN_CHARS - charCount,
                    })}
              </button>
            </Col>
          )}
        </Col>
      </Modal>
    </>
  )
}
