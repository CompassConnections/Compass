import clsx from 'clsx'
import {BanReason, isPermanentBan} from 'common/moderation/ban'
import {User} from 'common/user'
import {ShieldAlert} from 'lucide-react'
import {useState} from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {api} from 'web/lib/api'

const REASON_LABEL: Record<BanReason, string> = {
  auto_rate_limit: 'Auto: started too many conversations in 24h',
  under_review: 'Held for review by a moderator',
  confirmed_abuse: 'Confirmed scam / spam / harassment',
}

/**
 * Moderator-only bar on the profile of a banned member.
 *
 * Banned profiles are a wall for everyone else, but a moderator has to be able to read the profile to
 * decide the case — that decision is the whole point of the provisional hold, and it can't be made
 * from a suspension notice. The two outcomes are here rather than buried in the options modal:
 * restore the account, or confirm the ban and switch the member's copy to the permanent wording.
 *
 * Deliberately not translated: mods work in English, and these strings must not drift from
 * BAN_REASONS.
 */
export function BannedUserModBar(props: {user: User; className?: string}) {
  const {user, className} = props
  const [reason, setReason] = useState<BanReason | null | undefined>(user.banReason)
  const [banned, setBanned] = useState(!!user.isBannedFromPosting)
  const [submitting, setSubmitting] = useState(false)

  const act = async (unban: boolean, newReason?: BanReason) => {
    setSubmitting(true)
    try {
      await toast.promise(api('ban-user', {userId: user.id, unban, reason: newReason}), {
        loading: unban ? 'Unbanning...' : 'Confirming ban...',
        success: unban ? 'Account restored' : 'Ban confirmed',
        error: 'Failed — try again',
      })
      setBanned(!unban)
      setReason(unban ? null : (newReason ?? null))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Col
      className={clsx(
        'gap-3 rounded-xl border border-yellow-400 bg-yellow-50 p-4 dark:bg-yellow-900/20',
        className,
      )}
    >
      <Row className="items-center gap-2">
        <ShieldAlert className="h-5 w-5 shrink-0 text-yellow-600" aria-hidden="true" />
        <span className="font-semibold text-ink-900">
          {banned ? 'Banned account — moderator view' : 'Account restored'}
        </span>
      </Row>
      <span className="text-sm text-ink-700">
        {banned
          ? `Reason: ${reason ? REASON_LABEL[reason] : 'unknown (banned before reasons were recorded)'}. Only moderators can see this profile.`
          : 'This member can use Compass again. Reload to see their profile as everyone else does.'}
      </span>
      {banned && (
        <>
          <span className="text-sm text-ink-700">
            {isPermanentBan(reason)
              ? 'They are told the account is permanently closed, with no review promised.'
              : 'They are told we are reviewing and will restore the account if it looks genuine — so decide before that promise goes stale.'}
          </span>
          <Row className="flex-wrap gap-2">
            <Button size="xs" color="green" disabled={submitting} onClick={() => act(true)}>
              Genuine — unban
            </Button>
            {!isPermanentBan(reason) && (
              <Button
                size="xs"
                color="red"
                disabled={submitting}
                onClick={() => act(false, 'confirmed_abuse')}
              >
                Confirm scam/abuse — make permanent
              </Button>
            )}
          </Row>
        </>
      )}
    </Col>
  )
}
