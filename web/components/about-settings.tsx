import {App} from '@capacitor/app'
import {Capacitor} from '@capacitor/core'
import {githubRepo} from 'common/constants'
import {HOSTING_ENV, IS_VERCEL} from 'common/hosting/constants'
import {PrivateUser} from 'common/user'
import {useEffect, useRef, useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {CustomLink} from 'web/components/links'
import {WithPrivateUser} from 'web/components/user/with-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {nativePlatform} from 'web/lib/util/webview'

export type WebBuild = {
  gitSha?: string
  gitMessage?: string
  deploymentId?: string
  environment?: string
}

export type NativeApp = {
  /** 'ios' | 'android' — which shell this is, so the labels can say so. */
  platform: string
  appVersion?: string
  buildNumber?: string
}

export type Backend = {
  version?: string
  gitSha?: string
  gitMessage?: string
  commitDate?: string
}

export type Runtime = {
  platform: string
}

export type Diagnostics = {
  web?: WebBuild
  native?: NativeApp
  backend?: Backend
  runtime: Runtime
}

function useDiagnostics() {
  const [data, setData] = useState<Diagnostics | null>(null)

  useEffect(() => {
    const load = async () => {
      const diagnostics: Diagnostics = {
        runtime: {
          platform: IS_VERCEL
            ? 'web'
            : Capacitor.isNativePlatform()
              ? nativePlatform()
              : HOSTING_ENV,
        },
      }

      if (IS_VERCEL) {
        diagnostics.web = {
          environment: process.env.NEXT_PUBLIC_VERCEL_ENV,
          gitSha: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
          gitMessage: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE,
          deploymentId: process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID,
        }
      }

      if (Capacitor.isNativePlatform()) {
        const appInfo = await App.getInfo()
        diagnostics.native = {
          platform: nativePlatform(),
          appVersion: appInfo.version,
          buildNumber: appInfo.build,
        }
      }

      const backend = await api('health').catch(() => null)
      if (backend) {
        diagnostics.backend = {
          version: backend.version,
          gitSha: backend.git?.revision,
          gitMessage: backend.git?.message,
          commitDate: backend.git?.commitDate,
        }
      }

      setData(diagnostics)
    }

    load()
  }, [])

  return data
}

function diagnosticsToText(d: Diagnostics): string {
  const replacer = (key: string, value: any) => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    return value
  }

  return JSON.stringify(d, replacer, 2)
    .replace(/ {2}"/g, '')
    .replace(/["{}[\]]/g, '')
    .replace(/^[ \t]*\n/gm, '')
    .replace(/,\n/g, '\n')
    .trim()
}

export const AboutSettings = () => (
  <WithPrivateUser>{(user) => <LoadedAboutSettings privateUser={user} />}</WithPrivateUser>
)

const LoadedAboutSettings = (_props: {privateUser: PrivateUser}) => {
  const [copyFeedback, setCopyFeedback] = useState('')
  const [localStorageFeedback, setLocalStorageFeedback] = useState('')
  const t = useT()
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)

  const diagnostics = useDiagnostics()
  if (!diagnostics) return null

  const handleCopy = async () => {
    if (!diagnostics) return
    await navigator.clipboard.writeText(diagnosticsToText(diagnostics))
    setCopyFeedback(t('about.settings.copied', 'Copied!'))
    setTimeout(() => {
      setCopyFeedback('')
    }, 2000)
  }

  const handleHeroClick = () => {
    clickCountRef.current++

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0
    }, 500)

    if (clickCountRef.current === 3) {
      // Triple click detected
      const localStorageContents = JSON.stringify(localStorage)

      navigator.clipboard.writeText(localStorageContents)
      setLocalStorageFeedback(t('about.settings.local_storage_copied', 'LocalStorage copied!'))

      setTimeout(() => {
        setLocalStorageFeedback('')
      }, 2000)

      clickCountRef.current = 0
    }
  }

  return (
    <Col className={''}>
      <div
        className="w-fit bg-gradient-to-br from-primary-100 to-canvas-50 rounded-2xl p-6 mt-4"
        onClick={handleHeroClick}
      >
        <p className="text-ink-600 text-sm">
          {localStorageFeedback ||
            t('about.settings.description', 'View app version and diagnostic information')}
        </p>
      </div>
      <RuntimeInfo info={diagnostics.runtime} />
      <WebBuildInfo info={diagnostics.web} />
      <NativeAppInfo info={diagnostics.native} />
      <BackendInfo info={diagnostics.backend} />
      <Button onClick={handleCopy} className="w-fit mt-4">
        {copyFeedback || t('about.settings.copy_info', 'Copy Info')}
      </Button>
    </Col>
  )
}

const WebBuildInfo = (props: {info?: WebBuild}) => {
  const {info} = props
  if (!info) return
  const env = info.environment
  const gitMessage = info.gitMessage
  const sha = info.gitSha
  const deploymentId = info.deploymentId
  const url = `${githubRepo}/commit/${sha}`
  return (
    <Col className={'custom-link'}>
      <h3>Web build (Vercel)</h3>
      <p>
        Commit SHA: <CustomLink href={url}>{sha}</CustomLink>
      </p>
      <p>Commit message: {gitMessage}</p>
      <p>Vercel deployment ID: {deploymentId}</p>
      <p>Environment: {env}</p>
    </Col>
  )
}

const NativeAppInfo = (props: {info?: NativeApp}) => {
  const {info} = props
  if (!info) return
  // The same shell ships on both stores, so the label follows the device rather than being baked in.
  const name = info.platform === 'ios' ? 'iOS' : 'Android'
  return (
    <Col className={'custom-link'}>
      <h3>{name} (Capacitor)</h3>
      <p>
        App version ({name}): {info.appVersion}
      </p>
      <p>
        Native build number ({name}): {info.buildNumber}
      </p>
    </Col>
  )
}

const BackendInfo = (props: {info?: Backend}) => {
  const {info} = props
  if (!info) return
  const sha = info.gitSha
  const commitDate = info.commitDate
  const commitMessage = info.gitMessage
  const url = `${githubRepo}/commit/${sha}`
  return (
    <Col className={'custom-link'}>
      <h3>Backend</h3>
      <p>API version: {info.version}</p>
      {sha && (
        <p>
          API commit SHA: <CustomLink href={url}>{sha}</CustomLink>
        </p>
      )}
      {commitMessage && <p>API commit message: {commitMessage}</p>}
      {commitDate && <p>API commit date: {commitDate}</p>}
    </Col>
  )
}

const RuntimeInfo = (props: {info?: Runtime}) => {
  const {info} = props
  if (!info) return
  return (
    <Col className={'custom-link'}>
      <h3>Runtime</h3>
      <p>Platform: {info.platform}</p>
    </Col>
  )
}
