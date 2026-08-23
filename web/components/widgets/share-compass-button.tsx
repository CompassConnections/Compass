import {ShareIcon} from '@heroicons/react/24/outline'
import {getLinkedInShareCompassUrl, getXShareCompassUrl} from 'common/socials'
import {SHARE_CTA_BUTTON_CLASS} from 'web/components/widgets/share-cta-button'
import {SharePanel} from 'web/components/widgets/share-panel'
import {useT} from 'web/lib/locale'

/**
 * The "Share Compass" CTA on /about and /referrals: the same panel the profile pages' share button
 * opens, wearing the filled amber CTA instead of the outlined icon button.
 *
 * It used to go straight to the OS share sheet and fall back to copying the bare link — which meant
 * desktop, where most of these shares are actually written, got a naked URL and none of the message
 * the sheet would have carried. The panel gives every route its own row: the link alone for a chat
 * that's already happening, the ready-made blurb for an email or DM, and the two networks where a
 * post about Compass has somewhere to land.
 *
 * The copy is held here rather than at each call site because both pages want the identical message —
 * only the URL differs, carrying the sharer's `?referrer=` tag.
 */
export function ShareCompassButton(props: {
  /** The link to share — pass the referrer-tagged one so the share is credited to the sharer. */
  url: string
  /** Trigger label. Defaults to "Share Compass". */
  label?: string
  /** Layout classes for the trigger's wrapper — the CTA's own styling is fixed. */
  className?: string
}) {
  const {url, label, className} = props
  const t = useT()

  return (
    <SharePanel
      className={className}
      triggerClassName={SHARE_CTA_BUTTON_CLASS}
      url={url}
      copyMessage={getShareCompassText(t)}
      xShareUrl={getXShareCompassUrl(t, url)}
      linkedinUrl={getLinkedInShareCompassUrl(t, url)}
      eventTrackingName="sharecompass"
      shareData={{
        title: t('about.share.title', 'Compass — Find your people'),
        text: getShareCompassText(t),
      }}
    >
      <ShareIcon className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} aria-hidden="true" />
      {label ?? t('about.share.button_cta', 'Share Compass')}
    </SharePanel>
  )
}

/**
 * The referral message itself — what the OS share sheet carries, and what "Copy message" puts on the
 * clipboard.
 *
 * Two paragraphs, and long for a share sheet, deliberately: this is the message a person sends their
 * friends, so it carries the same three beats as /about's ShareStrip — what Compass is, how it works,
 * and why bringing someone is in the sharer's own interest, not a favour. The closing line is mutual on
 * purpose: the receiver reads it, but the sender has to feel it too.
 */
const getShareCompassText = (t: ReturnType<typeof useT>) =>
  t(
    'about.share.text',
    "Hi! Reaching out about something I care about: Compass, a free directory for finding your people — fully searchable by values, interests, and demographics. No ads, no swiping, no dubious algorithm.\n\nIt gets better with every person who joins. Even if a friend isn't who you're looking for, they bring their world with them — their circles, the thoughtful people you'd never have met otherwise. So whether you join or simply pass it along, you're widening the circle for both of us.",
  )
