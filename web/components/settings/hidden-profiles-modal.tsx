import {useEffect, useMemo, useState} from 'react'
import {Modal, MODAL_CLASS, SCROLLABLE_MODAL_CLASS} from 'web/components/layout/modal'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {Title} from 'web/components/widgets/title'
import {Avatar} from 'web/components/widgets/avatar'
import {Button} from 'web/components/buttons/button'
import {api} from 'web/lib/api'
import toast from 'react-hot-toast'
import {useT} from 'web/lib/locale'
import clsx from "clsx";
import Link from "next/link";
import {CompassLoadingIndicator} from "web/components/widgets/loading-indicator";

type HiddenUser = {
  id: string
  name: string
  username: string
  avatarUrl?: string | null
  createdTime?: string
}

export function HiddenProfilesModal(props: {
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const {open, setOpen} = props
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hidden, setHidden] = useState<HiddenUser[] | null>(null)
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({})

  const empty = useMemo(() => (hidden ? hidden.length === 0 : false), [hidden])

  useEffect(() => {
    if (!open) return
    let alive = true
    setLoading(true)
    setError(null)
    api('get-hidden-profiles', {limit: 200, offset: 0})
      .then((res) => {
        if (!alive) return
        setHidden(res.hidden)
      })
      .catch((e) => {
        console.error('Failed to load hidden profiles', e)
        if (!alive) return
        setError(t('settings.hidden_profiles.load_error', 'Failed to load hidden profiles.'))
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [open])

  const unhide = async (userId: string) => {
    if (busyIds[userId]) return
    setBusyIds((b) => ({...b, [userId]: true}))
    try {
      await api('unhide-profile', {hiddenUserId: userId})
      setHidden((list) => (list ? list.filter((u) => u.id !== userId) : list))
    } catch (e) {
      console.error('Failed to unhide profile', e)
      toast.error(t('settings.hidden_profiles.unhide_failed', 'Failed to unhide'))
    } finally {
      setBusyIds((b) => ({...b, [userId]: false}))
    }
  }

  return (
    <Modal open={open} setOpen={setOpen} size="lg">
      <Col className={clsx(MODAL_CLASS, 'mx-0 sm:mx-24')}>
        <Title className="mb-2">
          {t('settings.hidden_profiles.title', "Profiles you've hidden")}
        </Title>
        {!loading && hidden && hidden.length > 0 && <p>
          {t('settings.hidden_profiles.description', "These people don't appear in your search results.")}
        </p>}
        {loading && <CompassLoadingIndicator/>}
        {error && <div className="text-red-500 py-2">{error}</div>}
        {!loading && hidden && hidden.length > 0 && (
          <Col className={clsx("divide-y divide-canvas-300 w-full pr-4", SCROLLABLE_MODAL_CLASS)}>
            {hidden.map((u) => (
              <Row key={u.id} className="items-center justify-between py-2 gap-2">
                <Link
                  className="w-full rounded-md hover:bg-canvas-100 p-2"
                  href={'/' + u.username}
                >
                  <Row className="items-center gap-3">
                    <Avatar size="md" username={u.username} avatarUrl={u.avatarUrl ?? undefined}/>
                    <Col>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-ink-500 text-sm">@{u.username}</div>
                    </Col>
                  </Row>
                </Link>
                <Button
                  size="sm"
                  color="gray-outline"
                  onClick={() => unhide(u.id)}
                  disabled={busyIds[u.id]}
                >
                  {busyIds[u.id]
                    ? t('settings.hidden_profiles.unhiding', 'Unhiding...')
                    : t('settings.hidden_profiles.unhide', 'Unhide')}
                </Button>
              </Row>
            ))}
          </Col>
        )}
        {!loading && empty && (
          <div className="text-ink-500 py-6 text-center">
            {t(
              'settings.hidden_profiles.empty',
              "You haven't hidden any profiles."
            )}
          </div>
        )}
      </Col>
    </Modal>
  )
}

export default HiddenProfilesModal
