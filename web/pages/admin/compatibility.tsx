import clsx from 'clsx'
import {CompatibilityRankingEntry} from 'common/api/types'
import {IS_LOCAL} from 'common/hosting/constants'
import {Profile} from 'common/profiles/profile'
import Link from 'next/link'
import {useState} from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {NoSEO} from 'web/components/NoSEO'
import {PageBase} from 'web/components/page-base'
import {CompatibilityBreakdownModal} from 'web/components/profile/compatibility-breakdown-modal'
import {Avatar} from 'web/components/widgets/avatar'
import {Input} from 'web/components/widgets/input'
import {linkClass} from 'web/components/widgets/site-link'
import {Title} from 'web/components/widgets/title'
import {useAdmin} from 'web/hooks/use-admin'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {api} from 'web/lib/api'

type PickedUser = {id: string; name: string; username: string; avatarUrl?: string | null}

const LIMIT = 100

/**
 * Pick a member, see who the algorithm puts first for them, and open any pair's breakdown — the
 * same modal members get, computed from the two full profiles plus the stored prompt score. For
 * checking that the score and the sort behave; nothing here writes.
 */
export default function AdminCompatibilityPage() {
  const isAdmin = useAdmin()
  const [picked, setPicked] = useState<PickedUser | null>(null)

  if (!(isAdmin || IS_LOCAL)) return <p>Not authorized</p>

  return (
    <PageBase trackPageView={false} className="p-4 sm:p-6">
      <NoSEO />
      <Title>Compatibility ranking</Title>
      <p className="text-ink-600 -mt-2 mb-4 text-sm">
        The {LIMIT} people the Compatible sort would show this member first, in that order: by the
        low end of the likely range, the point estimate breaking ties. Every stored pair counts,
        including members not currently looking for matches.
      </p>
      <Col className="gap-6">
        <UserPicker picked={picked} setPicked={setPicked} />
        {picked && <Ranking picked={picked} />}
      </Col>
    </PageBase>
  )
}

function UserPicker(props: {picked: PickedUser | null; setPicked: (u: PickedUser | null) => void}) {
  const {picked, setPicked} = props
  const [term, setTerm] = useState('')
  const query = term.trim()
  const {data: matches} = useAPIGetter(
    'search-users',
    !picked && query.length >= 2 ? {term: query, limit: 8, page: 0} : undefined,
  )

  return (
    <Col className="border-canvas-200 gap-3 rounded-lg border p-4">
      {picked ? (
        <Row className="items-center gap-3">
          <Avatar username={picked.username} avatarUrl={picked.avatarUrl} size="sm" noLink />
          <div className="min-w-0 flex-1">
            <Link
              href={`/${picked.username}`}
              target="_blank"
              className={clsx(linkClass, 'truncate font-medium')}
            >
              {picked.name}
            </Link>
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
    </Col>
  )
}

/** The full profile of a member, with `user` folded in, as the breakdown needs it. */
const loadProfile = async (username: string): Promise<Profile | null> => {
  const {user, profile} = await api('get-profile', {username})
  if (!user || !profile) return null
  return {...profile, user}
}

function Ranking(props: {picked: PickedUser}) {
  const {picked} = props
  const {data: entries} = useAPIGetter('get-compatibility-ranking', {
    userId: picked.id,
    limit: LIMIT,
  })
  // The picked member's full profile, loaded once; the other side of each pair, loaded on demand
  // and kept, so reopening a breakdown costs nothing.
  const {data: viewer} = useAPIGetter('get-profile', {username: picked.username})
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [openFor, setOpenFor] = useState<CompatibilityRankingEntry | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const viewerProfile: Profile | null =
    viewer?.user && viewer.profile ? {...viewer.profile, user: viewer.user} : null

  const openBreakdown = async (entry: CompatibilityRankingEntry) => {
    if (!profiles[entry.userId]) {
      setLoading(entry.userId)
      try {
        const profile = await loadProfile(entry.username)
        if (!profile) {
          toast.error(`Could not load ${entry.name}'s profile`)
          return
        }
        setProfiles((p) => ({...p, [entry.userId]: profile}))
      } finally {
        setLoading(null)
      }
    }
    setOpenFor(entry)
  }

  if (!entries) return <p className="text-ink-500 text-sm">Loading…</p>
  if (entries.length === 0) {
    return (
      <p className="text-ink-500 text-sm">
        No stored pairs for {picked.name}. Either every pair hits a dealbreaker, or the cache has
        not been rebuilt since they joined.
      </p>
    )
  }

  const other = openFor ? profiles[openFor.userId] : undefined

  return (
    <Col className="gap-1">
      <div className="text-ink-400 font-dm-sans grid grid-cols-[2rem_1fr_7rem_7rem_5rem_6rem] items-center gap-3 px-2 text-[11px] uppercase tracking-wider">
        <span>#</span>
        <span>Member</span>
        <span className="text-right">Overall</span>
        <span className="text-right">Prompts</span>
        <span className="text-right">Shared</span>
        <span />
      </div>
      {entries.map((entry, i) => (
        <div
          key={entry.userId}
          className="border-canvas-200 grid grid-cols-[2rem_1fr_7rem_7rem_5rem_6rem] items-center gap-3 rounded border px-2 py-1.5"
          data-testid="compatibility-ranking-row"
        >
          <span className="text-ink-400 tabular-nums">{i + 1}</span>
          <Row className="min-w-0 items-center gap-2">
            <Avatar username={entry.username} avatarUrl={entry.avatarUrl} size="xs" noLink />
            <Link
              href={`/${entry.username}`}
              target="_blank"
              className={clsx(linkClass, 'truncate font-medium')}
            >
              {entry.name}
            </Link>
          </Row>
          <ScoreCell score={entry.score} low={entry.low} high={entry.high} />
          {entry.prompt ? (
            <ScoreCell score={entry.prompt.score} low={entry.prompt.low} high={entry.prompt.high} />
          ) : (
            <span className="text-ink-400 text-right text-sm">—</span>
          )}
          <span className="text-ink-600 text-right text-sm tabular-nums">
            {entry.sharedAnswers ?? 0}
          </span>
          <Button
            color="gray-outline"
            size="2xs"
            loading={loading === entry.userId}
            disabled={!viewerProfile}
            onClick={() => openBreakdown(entry)}
          >
            Breakdown
          </Button>
        </div>
      ))}
      {openFor && other && viewerProfile && (
        <CompatibilityBreakdownModal
          open
          setOpen={(open) => !open && setOpenFor(null)}
          viewer={viewerProfile}
          profile={other}
          compatibility={openFor}
        />
      )}
    </Col>
  )
}

function ScoreCell(props: {score: number; low?: number; high?: number}) {
  const {score, low, high} = props
  const pct = (v: number) => Math.round(v * 100)
  return (
    <span className="text-right text-sm tabular-nums">
      <span className="text-ink-900 font-medium">{pct(score)}%</span>
      {low != null && high != null && (
        <span className="text-ink-400 text-xs">
          {' '}
          {pct(low)}–{pct(high)}
        </span>
      )}
    </span>
  )
}
