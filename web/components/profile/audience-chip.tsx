import clsx from 'clsx'
import {type Audience, AUDIENCES} from 'common/profiles/visibility'
import {Check, ChevronDown, Globe, Lock, type LucideIcon, UserCheck, Users} from 'lucide-react'
import {useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Modal} from 'web/components/layout/modal'
import {CustomizeableDropdown} from 'web/components/widgets/customizeable-dropdown'
import {useIsMobile} from 'web/hooks/use-is-mobile'
import {useT} from 'web/lib/locale'

export const AUDIENCE_ICONS: Record<Audience, LucideIcon> = {
  public: Globe,
  member: Users,
  connected: UserCheck,
  only_me: Lock,
}

/** The label and the one-line explanation of each audience, in the reader's language. */
export function useAudienceText() {
  const t = useT()
  const labels: Record<Audience, string> = {
    public: t('profile.audience.public', 'Everyone'),
    member: t('profile.audience.member', 'Members'),
    connected: t('profile.audience.connected', 'My circle'),
    only_me: t('profile.audience.only_me', 'Only me'),
  }
  const descriptions: Record<Audience, string> = {
    public: t('profile.audience.public_desc', 'Anyone on the web, signed in or not'),
    member: t('profile.audience.member_desc', 'People signed in to Compass'),
    connected: t('profile.audience.connected_desc', 'Only members you added to your circle'),
    // Kept short on purpose. Compass administrators can still read these fields to moderate; that
    // is spelled out in the privacy policy ("Who sees your profile") rather than here.
    only_me: t('profile.audience.only_me_desc', 'Nobody else.'),
  }
  return {labels, descriptions}
}

/**
 * The control that says who sees a profile field, and changes it (docs/profile-visibility.md).
 *
 * One component for a single field and for a section heading — a section passes `mixed` when its
 * fields disagree. On `sm` and up it is an icon and a label opening a dropdown; below that it
 * collapses to the icon in a 44px tap target and opens a bottom sheet, so a long translated label
 * never pushes the field's own label onto two lines and the words live where there is room for them.
 *
 * `quiet` is a field that simply follows the profile-wide setting. It draws without a fill, so
 * scanning the form for exceptions is a matter of looking for filled chips. State is never colour
 * alone: every audience has its own icon, and the button names the field and the audience.
 */
export function AudienceChip(props: {
  /** The audience in effect, or `mixed` for a section whose fields differ. */
  value: Audience | 'mixed'
  onChange: (audience: Audience) => void
  /** What is being set, e.g. "Gender" — for the sheet's title and the accessible name. */
  subject: string
  /** Text before the value on wide screens, e.g. "Whole section". */
  prefix?: string
  /** The same, for narrow screens, e.g. "All". */
  shortPrefix?: string
  quiet?: boolean
  className?: string
}) {
  const {value, onChange, subject, prefix, shortPrefix, quiet, className} = props
  const t = useT()
  const isMobile = useIsMobile()
  const [sheetOpen, setSheetOpen] = useState(false)
  const {labels} = useAudienceText()

  const valueLabel = value === 'mixed' ? t('profile.audience.mixed', 'Mixed') : labels[value]
  const Icon = value === 'mixed' ? undefined : AUDIENCE_ICONS[value]
  const accessibleName = t('profile.audience.who_can_see', 'Who can see {subject}: {audience}', {
    subject,
    audience: valueLabel,
  })

  const face = (
    <span
      className={clsx(
        'inline-flex min-h-[44px] items-center sm:min-h-0',
        // The visible pill is smaller than the tap target around it.
      )}
    >
      <span
        className={clsx(
          'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs',
          quiet
            ? 'text-ink-600 hover:text-ink-900 border-transparent hover:border-canvas-300'
            : 'bg-primary-50 text-primary-800 border-primary-200',
        )}
      >
        {prefix && <span className="hidden sm:inline">{prefix}:</span>}
        {shortPrefix && <span className="sm:hidden">{shortPrefix}</span>}
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden strokeWidth={2} />}
        <span className={clsx(Icon && 'hidden sm:inline')}>{valueLabel}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      </span>
    </span>
  )

  const options = (close: () => void) => (
    <AudienceOptions
      value={value}
      onPick={(audience) => {
        onChange(audience)
        close()
      }}
    />
  )

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          aria-label={accessibleName}
          aria-haspopup="dialog"
          onClick={() => setSheetOpen(true)}
          className={clsx(
            'focus-visible:ring-primary-500 shrink-0 rounded-full focus:outline-none focus-visible:ring-2',
            className,
          )}
        >
          {face}
        </button>
        <Modal open={sheetOpen} setOpen={setSheetOpen} className="!min-h-0">
          <Col className="bg-canvas-50 gap-3 rounded-t-xl px-4 pb-6 pt-5">
            <h2 className="text-ink-900 !m-0 text-base font-semibold">
              {t('profile.audience.sheet_title', 'Who can see {subject}?', {subject})}
            </h2>
            {options(() => setSheetOpen(false))}
          </Col>
        </Modal>
      </>
    )
  }

  return (
    <CustomizeableDropdown
      className={clsx('shrink-0', className)}
      buttonClass="focus-visible:ring-primary-500 rounded-full focus:outline-none focus-visible:ring-2"
      menuWidth="w-72"
      buttonContent={() => (
        <>
          <span className="sr-only">{accessibleName}</span>
          <span aria-hidden>{face}</span>
        </>
      )}
      dropdownMenuContent={(close) => options(close)}
    />
  )
}

/**
 * The audiences as a radio group: icon, name, one line of what it means, a tick on the chosen one.
 *
 * Used two ways, so the choice looks the same wherever it is made. As the `list` inside a chip's
 * dropdown or sheet, with all four audiences; and as `cards` for the profile-wide default in the
 * form, with the two it can take ("Everyone", "Members") side by side and outlined, since there the
 * options are the control itself rather than the contents of a menu.
 */
export function AudienceOptions(props: {
  value: Audience | 'mixed'
  onPick: (audience: Audience) => void
  audiences?: readonly Audience[]
  layout?: 'list' | 'cards'
  className?: string
}) {
  const {value, onPick, audiences = AUDIENCES, layout = 'list', className} = props
  const {labels, descriptions} = useAudienceText()
  const cards = layout === 'cards'

  return (
    <div
      className={clsx(
        cards ? 'grid w-full gap-2 sm:grid-cols-2' : 'flex flex-col gap-1',
        className,
      )}
      role="radiogroup"
    >
      {audiences.map((audience) => {
        const Icon = AUDIENCE_ICONS[audience]
        const selected = value === audience
        return (
          <button
            key={audience}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onPick(audience)}
            className={clsx(
              'flex w-full items-start gap-3 text-left',
              'focus-visible:ring-primary-500 focus:outline-none focus-visible:ring-2',
              cards
                ? clsx(
                    'rounded-lg border px-3 py-2.5',
                    selected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-canvas-300 hover:border-primary-400',
                  )
                : clsx('hover:bg-canvas-100 rounded-md px-2 py-2', selected && 'bg-canvas-100'),
            )}
          >
            <Icon className="text-ink-800 mt-0.5 h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
            <span className="min-w-0 flex-1">
              <span className="text-ink-900 block text-sm font-medium">{labels[audience]}</span>
              <span className="text-ink-800 block text-xs">{descriptions[audience]}</span>
            </span>
            {selected && <Check className="text-primary-700 mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
          </button>
        )
      })}
    </div>
  )
}
