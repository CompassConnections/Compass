import {ProfileRow} from 'common/profiles/profile'
import {useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {Input} from 'web/components/widgets/input'
import {api} from 'web/lib/api'

// Admin-only: run the search the way another member sees it when they tick "Who I'm looking for" —
// their connection type, age range and gender preference, and nothing else. Handy for checking what a
// member is actually shown when they report an empty or surprising result set.
// Deliberately not translated: it never renders for a non-admin.
export function SearchAsMemberFilter(props: {
  applyLookingForFilters: (profile: ProfileRow | undefined | null) => void
}) {
  const {applyLookingForFilters} = props
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [appliedFor, setAppliedFor] = useState<string | undefined>(undefined)

  const search = async () => {
    // Paste-friendly: accept "@name" and a trailing/leading space as the same thing as "name".
    const name = username.trim().replace(/^@/, '')
    if (!name || loading) return
    setLoading(true)
    setError(undefined)
    setAppliedFor(undefined)
    try {
      const {user, profile} = await api('get-user-and-profile', {username: name})
      if (!user) {
        setError(`No member with username "${name}"`)
      } else if (!profile) {
        setError(`${user.username} has no profile yet`)
      } else {
        applyLookingForFilters(profile)
        setAppliedFor(user.username)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Col className="gap-2">
      <Row className="gap-2">
        <Input
          className="h-10 grow"
          placeholder="username"
          value={username}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              search()
            }
          }}
        />
        <Button
          size="sm"
          color="indigo-outline"
          loading={loading}
          disabled={!username.trim()}
          onClick={search}
        >
          Apply
        </Button>
      </Row>
      {error && <span className="text-sm text-red-600">{error}</span>}
      {appliedFor && (
        <span className="text-sm text-ink-600">
          Searching as <span className="font-semibold">{appliedFor}</span> — their connection type,
          age range and gender preference replaced the current filters.
        </span>
      )}
    </Col>
  )
}
