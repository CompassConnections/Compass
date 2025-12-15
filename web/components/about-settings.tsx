import {WithPrivateUser} from "web/components/user/with-user"
import {PrivateUser} from "common/user"
import {Col} from "web/components/layout/col"
import {HOSTING_ENV, IS_VERCEL} from "common/hosting/constants"
import {Capacitor} from "@capacitor/core"
import {LiveUpdate} from "@capawesome/capacitor-live-update"
import {useEffect, useState} from "react"
import {App} from "@capacitor/app"
import {api} from "web/lib/api"
import {githubRepo} from "common/constants"
import {CustomLink} from "web/components/links"
import {Button} from "web/components/buttons/button"

export type WebBuild = {
  gitSha?: string
  gitMessage?: string
  deploymentId?: string
  environment?: string
}

export type LiveUpdateInfo = {
  bundleId?: string | null
  commitSha?: string
  commitMessage?: string
}

export type Android = {
  appVersion?: string
  buildNumber?: string
  liveUpdate?: LiveUpdateInfo
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
  web?: WebBuild,
  android?: Android
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
              ? 'android'
              : HOSTING_ENV
        }
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
        const bundle = await LiveUpdate.getCurrentBundle().catch(() => {return {bundleId: null}})
        diagnostics.android = {
          appVersion: appInfo.version,
          buildNumber: appInfo.build,
          liveUpdate: {
            bundleId: bundle.bundleId,
            commitSha: process.env.CAPAWESOME_BUILD_GIT_COMMIT_SHA || 'N/A',
            commitMessage: process.env.CAPAWESOME_BUILD_GIT_COMMIT_MESSAGE || 'N/A',
          }
        }
      }

      const backend = await api('health').catch(() => null)
      if (backend) {
        diagnostics.backend = {
          version: backend.version,
          gitSha: backend.git?.revision,
          gitMessage: backend.git?.message,
          commitDate: backend.git?.commitDate
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
    .replace(/["{}\[\]]/g, '')
    .replace(/^[ \t]*\n/gm, '')
    .replace(/,\n/g, '\n')
    .trim()
}


export const AboutSettings = () => (
  <WithPrivateUser>
    {user => <LoadedAboutSettings privateUser={user}/>}
  </WithPrivateUser>
)

const LoadedAboutSettings = (props: {
  privateUser: PrivateUser,
}) => {
  const {} = props

  const [copyFeedback, setCopyFeedback] = useState('')

  const diagnostics = useDiagnostics()
  if (!diagnostics) return null

  const handleCopy = async () => {
    if (!diagnostics) return
    await navigator.clipboard.writeText(diagnosticsToText(diagnostics))
    setCopyFeedback('Copied!')
    setTimeout(() => {
      setCopyFeedback('')
    }, 2000)
  }

  return <Col className={''}>
    <WebBuildInfo info={diagnostics.web}/>
    <AndroidInfo info={diagnostics.android}/>
    <BackendInfo info={diagnostics.backend}/>
    <RuntimeInfo info={diagnostics.runtime}/>
    <Button
      onClick={handleCopy}
      className="w-fit mt-4"
    >
      {copyFeedback || 'Copy Info'}
    </Button>
  </Col>
}

const WebBuildInfo = (props: {info?: WebBuild}) => {
  const {info} = props
  if (!info) return
  const env = info.environment
  const gitMessage = info.gitMessage
  const sha = info.gitSha
  const deploymentId = info.deploymentId
  const url = `${githubRepo}/commit/${sha}`
  return <Col className={'custom-link'}>
    <h3>Web build (Vercel)</h3>
    <p>Commit SHA: <CustomLink href={url}>{sha}</CustomLink></p>
    <p>Commit message: {gitMessage}</p>
    <p>Vercel deployment ID: {deploymentId}</p>
    <p>Environment: {env}</p>
  </Col>
}

const AndroidInfo = (props: {info?: Android}) => {
  const {info} = props
  if (!info) return
  return <Col className={'custom-link'}>
    <h3>Android (Capacitor / Capawesome)</h3>
    <p>App version (Android): {info.appVersion}</p>
    <p>Native build number (Android): {info.buildNumber}</p>
    <p>Live update build ID (Capawesome): {info.liveUpdate?.bundleId}</p>
    <p>Live update commit (Capawesome): {JSON.stringify(info.liveUpdate)}</p>
  </Col>
}

const BackendInfo = (props: {info?: Backend}) => {
  const {info} = props
  if (!info) return
  const sha = info.gitSha
  const commitDate = info.commitDate
  const commitMessage = info.gitMessage
  const url = `${githubRepo}/commit/${sha}`
  return <Col className={'custom-link'}>
    <h3>Backend</h3>
    <p>API version: {info.version}</p>
    {sha && <p>API commit SHA: <CustomLink href={url}>{sha}</CustomLink></p>}
    {commitMessage && <p>API commit message: {commitMessage}</p>}
    {commitDate && <p>API commit date: {commitDate}</p>}
  </Col>
}

const RuntimeInfo = (props: {info?: Runtime}) => {
  const {info} = props
  if (!info) return
  return <Col className={'custom-link'}>
    <h3>Runtime</h3>
    <p>Platform: {info.platform}</p>
    <p>Env: {JSON.stringify(Object.fromEntries(Object.entries(process.env).sort()), null, 2)}</p>
  </Col>
}
