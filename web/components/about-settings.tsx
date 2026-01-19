import {WithPrivateUser} from "web/components/user/with-user"
import {PrivateUser} from "common/user"
import {Col} from "web/components/layout/col"
import {HOSTING_ENV, IS_VERCEL} from "common/hosting/constants"
import {Capacitor} from "@capacitor/core"
import {useEffect, useState} from "react"
import {App} from "@capacitor/app"
import {api} from "web/lib/api"
import {githubRepo} from "common/constants"
import {CustomLink} from "web/components/links"
import {Button} from "web/components/buttons/button"
import {useT} from 'web/lib/locale'

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
  commitDate?: string
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
        // const bundle = await LiveUpdate.getCurrentBundle().catch(() => {
        //   return {bundleId: null}
        // })
        // const buildInfo = await getLiveUpdateInfo().catch(() => null)
        diagnostics.android = {
          appVersion: appInfo.version,
          buildNumber: appInfo.build,
          // liveUpdate: {
          //   bundleId: bundle?.bundleId,
          //   commitSha: buildInfo?.commitSha,
          //   commitMessage: buildInfo?.commitMessage,
          //   commitDate: buildInfo?.commitDate
          // }
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
    .replace(/ {2}"/g, '')
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
  const t = useT()

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

  return <Col className={''}>
    <RuntimeInfo info={diagnostics.runtime}/>
    <WebBuildInfo info={diagnostics.web}/>
    <AndroidInfo info={diagnostics.android}/>
    <BackendInfo info={diagnostics.backend}/>
    <Button
      onClick={handleCopy}
      className="w-fit mt-4"
    >
      {copyFeedback || t('about.settings.copy_info', 'Copy Info')}
    </Button>
  </Col>
}

const WebBuildInfo = (props: { info?: WebBuild }) => {
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

const AndroidInfo = (props: { info?: Android }) => {
  const {info} = props
  if (!info) return
  const sha = info.liveUpdate?.commitSha
  const url = `${githubRepo}/commit/${sha}`
  return <Col className={'custom-link'}>
    <h3>Android (Capacitor / Capawesome)</h3>
    <p>App version (Android): {info.appVersion}</p>
    <p>Native build number (Android): {info.buildNumber}</p>
    {info.liveUpdate &&
        <>
            <p>Live update build ID (Capawesome): {info.liveUpdate?.bundleId}</p>
            <p>Live update commit SHA (Capawesome): <CustomLink href={url}>{sha}</CustomLink></p>
            <p>Live update commit message (Capawesome): {info.liveUpdate?.commitMessage}</p>
            <p>Live update commit date (Capawesome): {info.liveUpdate?.commitDate}</p>
        </>
    }
  </Col>
}

const BackendInfo = (props: { info?: Backend }) => {
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

const RuntimeInfo = (props: { info?: Runtime }) => {
  const {info} = props
  if (!info) return
  return <Col className={'custom-link'}>
    <h3>Runtime</h3>
    <p>Platform: {info.platform}</p>
  </Col>
}
