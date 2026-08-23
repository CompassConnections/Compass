import {Popover, PopoverButton, PopoverPanel, Portal, Transition} from '@headlessui/react'
import {ArrowUpTrayIcon, ChatBubbleLeftRightIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {ComponentType, Fragment, ReactNode, SVGProps} from 'react'
import toast from 'react-hot-toast'
import {TbBrandLinkedin, TbBrandX} from 'react-icons/tb'
import {CopyLinkRow, shareOnLinkedIn, shareOnX} from 'web/components/buttons/copy-link-button'
import {useIsMobile} from 'web/hooks/use-is-mobile'
import {useCanNativeShare} from 'web/hooks/use-native-share'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'
import {copyToClipboard} from 'web/lib/util/copy'
import {nativeShare} from 'web/lib/util/share'

/**
 * The share affordance behind a single button: tapping it opens a small panel whose first row is the
 * bare link, ready to copy, and whose remaining rows are the "with our pitch attached" shares.
 *
 * The split exists because the two wants are genuinely different. Dropping a link into a conversation
 * that is already happening wants nothing but the URL; posting a profile to people who have never
 * heard of Compass wants the blurb. Going straight to the OS sheet — what this button used to do —
 * served only the second, and left the first unreachable on phones, since the copy fallback in
 * `CopyLinkOrShareButton` only fires when no sheet appears at all.
 *
 * `copyMessage` covers the third want, and is why this panel is worth having on desktop at all: the
 * ready-made blurb the OS sheet hands a phone, on a clipboard instead — for pasting into an email or a
 * DM on a machine that has no share sheet to open.
 *
 * The two lower blocks are alternatives, never both: where an OS share sheet exists it already lists
 * X, LinkedIn and everything else the phone has installed, so repeating two of them below it would be
 * a worse-looking subset of the row above. The named social rows are therefore the *fallback* — what
 * desktop gets in place of the sheet it cannot open.
 *
 * Top sheet under `sm`, popover anchored to the button above it. The sheet drops from the top rather
 * than rising from the bottom because the trigger lives in the page's top bar: the panel opens next to
 * the thumb's target instead of at the far end of the screen. The sheet is portalled to the document
 * body rather than left in place: its usual home is the profile page's sticky header, whose
 * `backdrop-blur` makes that bar the containing block for any `position: fixed` child (so the sheet
 * would hang off the header instead of the viewport) and whose `z-20` would bury it under the mobile
 * bottom nav.
 *
 * The desktop popover escapes its parent too, via Headless UI's `anchor` (which portals the panel and
 * positions it against the trigger with floating-ui). Plain `absolute` positioning was enough while the
 * trigger only ever sat in a profile header, but /about's closing block is a rounded `overflow-hidden`
 * slab, which cropped the panel to the part that fitted inside it. Anchoring also keeps the panel on
 * screen — `padding` holds it off the viewport edges, and it flips above the button when there's no
 * room below.
 */
export function SharePanel(props: {
  /** The link itself — copied bare, and handed to every share target below. */
  url: string
  /** Title/text for the OS share sheet. Never applied to the copied link. */
  shareData: {title: string; text: string}
  /** Ready-made message to copy verbatim (the link is appended). Omit to drop the row. */
  copyMessage?: string
  /** X intent URL (it carries its own text). Shown only where no OS sheet exists; omit to drop it. */
  xShareUrl?: string
  /** LinkedIn intent URL (it carries its own text too). Same fallback-only rule. */
  linkedinUrl?: string
  eventTrackingName?: string
  trackingProps?: Record<string, string>
  className?: string
  triggerClassName?: string
  /** Trigger contents — the button's icon and label. */
  children: ReactNode
}) {
  const {
    url,
    shareData,
    copyMessage,
    xShareUrl,
    linkedinUrl,
    eventTrackingName,
    trackingProps,
    className,
    triggerClassName,
    children,
  } = props
  const t = useT()
  const canNativeShare = useCanNativeShare()
  const isMobile = useIsMobile()

  const trackShare = (method: string) =>
    eventTrackingName && track(eventTrackingName, {...trackingProps, method})

  return (
    <Popover className={clsx('relative inline-block text-left', className)}>
      {({open, close}) => {
        const panel = (
          <>
            {/* Scrim. Dismissal is wired by hand for the same reason `useOutsideDismiss` exists:
                Headless UI's own outside-click opts out of its pointer path on touch and falls back
                to a handler that discards any gesture travelling more than ~30px, which a thumb tap
                routinely does. Leaving the sheet to that means a phone where the blurry area does
                nothing. Here the scrim is a childless sibling of the panel and the topmost thing
                under the finger, so a plain onClick on it is both reachable and unambiguous — a drag
                out of the panel lands its click on their common ancestor, not on this. */}
            {isMobile && (
              <Transition
                as={Fragment}
                show={open}
                enter="transition-opacity ease-out duration-200"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity ease-in duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div
                  // cursor-pointer is load-bearing, not decoration: iOS Safari only dispatches click
                  // on a non-interactive element that either carries an inline onclick or looks
                  // clickable, and React attaches its handlers at the root rather than the node — so
                  // without this the scrim is tappable everywhere except iOS.
                  className="bg-canvas-100/60 fixed inset-0 z-[55] cursor-pointer backdrop-blur-sm"
                  onClick={() => close()}
                  aria-hidden="true"
                />
              </Transition>
            )}

            <Transition
              as={Fragment}
              show={open}
              enter="transition ease-out duration-200"
              enterFrom={isMobile ? 'opacity-0 -translate-y-4' : 'opacity-0 scale-95'}
              enterTo={isMobile ? 'opacity-100 translate-y-0' : 'opacity-100 scale-100'}
              leave="transition ease-in duration-150"
              leaveFrom={isMobile ? 'opacity-100 translate-y-0' : 'opacity-100 scale-100'}
              leaveTo={isMobile ? 'opacity-0 -translate-y-4' : 'opacity-0 scale-95'}
            >
              <PopoverPanel
                static
                anchor={isMobile ? undefined : {to: 'bottom end', gap: 8, padding: 8}}
                className={clsx(
                  'bg-canvas-50 border-ink-200 focus:outline-none',
                  isMobile
                    ? // pt keeps the first row clear of the phone's status bar / notch.
                      'fixed inset-x-0 top-0 z-[60] rounded-b-2xl border-b p-3 pt-[calc(0.75rem+var(--tnh))] shadow-2xl'
                    : 'z-50 w-80 rounded-xl border p-2 shadow-lg',
                )}
              >
                <CopyLinkRow
                  url={url}
                  eventTrackingName={eventTrackingName ?? 'share'}
                  linkBoxClassName="w-full rounded-lg"
                  onCopied={() => {
                    trackShare('copy')
                    close()
                  }}
                />

                {(copyMessage || canNativeShare || xShareUrl || linkedinUrl) && (
                  <div className="mt-2 flex flex-col">
                    {copyMessage && (
                      <ShareRow
                        icon={ChatBubbleLeftRightIcon}
                        label={t('share_panel.copy_message', 'Copy message')}
                        onClick={() => {
                          close()
                          trackShare('copy-message')
                          copyToClipboard(`${copyMessage}\n\n${url}`)
                          toast.success(t('share_panel.message_copied', 'Message copied!'))
                        }}
                      />
                    )}
                    {canNativeShare ? (
                      <ShareRow
                        icon={ArrowUpTrayIcon}
                        label={t('share_panel.native', 'Share…')}
                        onClick={async () => {
                          close()
                          trackShare('native')
                          await nativeShare({...shareData, url})
                        }}
                      />
                    ) : (
                      <>
                        {xShareUrl && (
                          <ShareRow
                            icon={TbBrandX}
                            label={t('share_profile.on_x', 'Share on X')}
                            onClick={() => {
                              close()
                              trackShare('x')
                              shareOnX(xShareUrl)
                            }}
                          />
                        )}
                        {linkedinUrl && (
                          <ShareRow
                            icon={TbBrandLinkedin}
                            label={t('share_profile.on_linkedin', 'Share on LinkedIn')}
                            onClick={() => {
                              close()
                              trackShare('linkedin')
                              shareOnLinkedIn(linkedinUrl)
                            }}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Grabber: the one cue that says "this is a sheet, you can dismiss it". Sits at the
                    sheet's free edge — the bottom one, now that the sheet hangs from the top. */}
                {isMobile && <div className="bg-ink-300 mx-auto mt-3 h-1 w-10 rounded-full" />}
              </PopoverPanel>
            </Transition>
          </>
        )

        return (
          <>
            <PopoverButton className={triggerClassName}>{children}</PopoverButton>
            {isMobile ? <Portal>{panel}</Portal> : panel}
          </>
        )
      }}
    </Popover>
  )
}

const ShareRow = (props: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  onClick: () => void
}) => {
  const {icon: Icon, label, onClick} = props
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-ink-700 hover:bg-canvas-25 hover:text-ink-900 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
    >
      <Icon className="text-ink-500 h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
      {label}
    </button>
  )
}
