import {TrashIcon} from '@heroicons/react/24/outline'
import {
  AdminDonation,
  formatDonationAmount,
  MAX_DONATION_NOTE_LENGTH,
  MAX_DONATION_USD,
  sumPastYearCents,
} from 'common/donations'
import {IS_LOCAL} from 'common/hosting/constants'
import {groupBy, sortBy} from 'lodash'
import {useState} from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {NoSEO} from 'web/components/NoSEO'
import {PageBase} from 'web/components/page-base'
import {Avatar} from 'web/components/widgets/avatar'
import {DonorBadge} from 'web/components/widgets/donor-badge'
import {Input} from 'web/components/widgets/input'
import {useAdmin} from 'web/hooks/use-admin'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {api} from 'web/lib/api'

/**
 * The ledger behind the supporter badge.
 *
 * Admins only (see `throwErrorIfNotAdmin`). Three parts, in the order they are used: record a
 * donation (find the member, type the amount), the past-year total per member — which is exactly
 * what each of their badges says right now — and the full list, newest first, with an undo.
 *
 * Nothing here is automatic. There is no payment webhook; a row exists because somebody looked at a
 * receipt and typed it in, which is also why every row remembers which admin did.
 */
export default function AdminDonations() {
  const isAdmin = useAdmin()
  const {data, refresh} = useAPIGetter('get-donations-admin', {})

  if (!(isAdmin || IS_LOCAL)) return <p>Not authorized</p>

  const donations = data?.donations ?? []
  const byUser = groupBy(donations, 'userId')
  const totals = sortBy(
    Object.values(byUser).map((rows) => ({
      donor: rows[0],
      pastYearCents: sumPastYearCents(rows),
      allTimeCents: rows.reduce((sum, d) => sum + d.amountCents, 0),
    })),
    (t) => -t.pastYearCents,
  )

  return (
    <PageBase className="col-span-10 p-2 sm:pt-0">
      <NoSEO />
      <Col className="text-ink-900 mx-4 my-4 gap-8">
        <Col className="gap-1">
          <Row className="items-baseline gap-3">
            <div className="text-primary-700 text-2xl">Donations</div>
            <div className="text-ink-500 text-sm">
              {donations.length} recorded · {totals.filter((t) => t.pastYearCents > 0).length} with
              a badge today
            </div>
            <button className="text-ink-500 text-xs underline" onClick={refresh}>
              refresh
            </button>
          </Row>
          <div className="text-ink-500 max-w-3xl text-sm">
            A member’s profile shows a supporter badge with the sum of what they gave over the past
            365 days. The badge appears as soon as a row is saved, so check with the donor before
            recording a gift they may not want shown — they can also hide it themselves from
            Settings → Data &amp; Privacy.
          </div>
        </Col>

        <RecordDonation onCreated={refresh} />

        <Col className="gap-3">
          <div>
            <div className="text-ink-900 text-lg font-semibold">Past-year totals</div>
            <div className="text-ink-500 text-sm">
              What each badge reads right now. A member drops off this list a year after their last
              gift, without anyone doing anything.
            </div>
          </div>
          {totals.length === 0 ? (
            <div className="text-ink-500 text-sm">No donations recorded yet.</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {totals.map(({donor, pastYearCents, allTimeCents}) => (
                <Row
                  key={donor.userId}
                  className="border-canvas-200 items-center gap-3 rounded-lg border p-3"
                >
                  <Avatar username={donor.username} avatarUrl={donor.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">
                      {donor.name}{' '}
                      <a
                        className="text-primary-700 text-sm font-normal underline"
                        href={`/${donor.username}`}
                      >
                        @{donor.username}
                      </a>
                    </div>
                    <div className="text-ink-500 text-sm">
                      {formatDonationAmount(allTimeCents)} all time
                    </div>
                  </div>
                  {pastYearCents > 0 ? (
                    <DonorBadge amountCents={pastYearCents} className="px-2 py-1 text-xs" />
                  ) : (
                    <span className="text-ink-300 text-xs">no badge</span>
                  )}
                </Row>
              ))}
            </div>
          )}
        </Col>

        <Col className="gap-3">
          <div>
            <div className="text-ink-900 text-lg font-semibold">
              Every donation{' '}
              <span className="text-ink-500 text-sm font-normal">({donations.length})</span>
            </div>
            <div className="text-ink-500 text-sm">
              Newest first. Deleting is for typos; it takes the amount off the badge straight away.
            </div>
          </div>
          {donations.map((d) => (
            <DonationRow key={d.id} donation={d} onChanged={refresh} />
          ))}
        </Col>
      </Col>
    </PageBase>
  )
}

/** Today as the `<input type="date">` wants it, in the admin's own timezone. */
const todayInputValue = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Find the member, type the amount, save.
 *
 * The member is picked from `search-users` rather than typed as free text: the badge lives on a
 * profile, so a donation has to belong to an account, and a name typed by hand is how a gift ends
 * up credited to the wrong one of two people with the same first name.
 */
function RecordDonation({onCreated}: {onCreated: () => void}) {
  const [term, setTerm] = useState('')
  const [picked, setPicked] = useState<{
    id: string
    name: string
    username: string
    avatarUrl?: string | null
  } | null>(null)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayInputValue)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const query = term.trim()
  const {data: matches} = useAPIGetter(
    'search-users',
    !picked && query.length >= 2 ? {term: query, limit: 8, page: 0} : undefined,
  )

  const amountUsd = Number(amount)
  const amountOk = Number.isFinite(amountUsd) && amountUsd > 0 && amountUsd <= MAX_DONATION_USD
  const canSave = !!picked && amountOk && !busy

  const save = async () => {
    if (!picked) return
    setBusy(true)
    try {
      await api('create-donation', {
        userId: picked.id,
        amountUsd,
        // Midday local rather than midnight: a date typed as "today" must not land on yesterday
        // once the API's UTC clock looks at it.
        donatedAt: date ? new Date(`${date}T12:00:00`) : undefined,
        note: note.trim() || null,
      })
      toast.success(
        `Recorded ${formatDonationAmount(Math.round(amountUsd * 100))} from ${picked.name}`,
      )
      setAmount('')
      setNote('')
      setPicked(null)
      setTerm('')
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not record that donation')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Col className="border-canvas-200 gap-3 rounded-lg border p-4">
      <div className="text-ink-900 text-lg font-semibold">Record a donation</div>

      {picked ? (
        <Row className="items-center gap-3">
          <Avatar username={picked.username} avatarUrl={picked.avatarUrl} size="sm" noLink />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{picked.name}</div>
            <div className="text-ink-500 truncate text-sm">@{picked.username}</div>
          </div>
          <Button color="gray-outline" size="xs" onClick={() => setPicked(null)}>
            Change
          </Button>
        </Row>
      ) : (
        <Col className="gap-2">
          <Input
            className="w-full"
            placeholder="Member’s name or username"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            autoFocus
          />
          {query.length >= 2 && (
            <Col className="gap-1">
              {(matches ?? []).length === 0 ? (
                <div className="text-ink-500 text-sm">
                  {matches ? 'Nobody by that name.' : 'Searching…'}
                </div>
              ) : (
                (matches ?? []).map((u) => (
                  <button
                    key={u.id}
                    className="hover:bg-canvas-100 flex items-center gap-3 rounded p-2 text-left"
                    onClick={() => setPicked(u)}
                  >
                    <Avatar username={u.username} avatarUrl={u.avatarUrl} size="xs" noLink />
                    <span className="font-medium">{u.name}</span>
                    <span className="text-ink-500 text-sm">@{u.username}</span>
                  </button>
                ))
              )}
            </Col>
          )}
        </Col>
      )}

      <Row className="flex-wrap gap-2">
        <label className="flex flex-1 items-center gap-2">
          <span className="text-ink-500 text-sm">$</span>
          <Input
            className="flex-1"
            type="number"
            inputMode="decimal"
            min={0.01}
            max={MAX_DONATION_USD}
            step="0.01"
            placeholder="Amount in US dollars"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <Input
          className="flex-1"
          type="date"
          max={todayInputValue()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Row>
      <Input
        className="w-full"
        placeholder="Note for admins only, e.g. “Stripe, monthly” (optional)"
        maxLength={MAX_DONATION_NOTE_LENGTH}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Row className="items-center gap-3">
        <Button color="indigo" size="xs" disabled={!canSave} loading={busy} onClick={save}>
          Save donation
        </Button>
        <span className="text-ink-500 text-xs">
          {!picked
            ? 'Pick a member first.'
            : !amountOk
              ? 'Enter a positive dollar amount.'
              : `Their badge will read ${formatDonationAmount(Math.round(amountUsd * 100))} plus anything else from the past year.`}
        </span>
      </Row>
    </Col>
  )
}

function DonationRow({donation: d, onChanged}: {donation: AdminDonation; onChanged: () => void}) {
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    setBusy(true)
    try {
      await api('delete-donation', {id: d.id})
      toast.success(`Removed ${formatDonationAmount(d.amountCents)} from ${d.name}`)
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete that donation')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Row className="border-canvas-200 items-center gap-3 rounded-lg border p-3">
      <div className="text-ink-500 w-24 shrink-0 text-sm tabular-nums">
        {new Date(d.donatedAt).toLocaleDateString()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate">
          <span className="font-semibold">{d.name}</span>{' '}
          <a className="text-primary-700 text-sm underline" href={`/${d.username}`}>
            @{d.username}
          </a>
        </div>
        {d.note && <div className="text-ink-500 truncate text-sm">{d.note}</div>}
      </div>
      <div className="font-semibold tabular-nums">{formatDonationAmount(d.amountCents)}</div>
      <Button
        color="gray-outline"
        size="xs"
        disabled={busy}
        onClick={remove}
        aria-label="Delete donation"
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </Row>
  )
}
