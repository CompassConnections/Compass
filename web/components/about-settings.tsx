import {WithPrivateUser} from "web/components/user/with-user";
import {PrivateUser} from "common/user";
import {Col} from "web/components/layout/col";
import {HOSTING_ENV, IS_VERCEL} from "common/hosting/constants";
import {Capacitor} from "@capacitor/core";
import {LiveUpdate} from "@capawesome/capacitor-live-update";
import {useEffect, useState} from "react";
import {App} from "@capacitor/app";
import {api} from "web/lib/api";
import {githubRepo} from "common/constants";
import {CustomLink} from "web/components/links";

export const AboutSettings = () => (
  <WithPrivateUser>
    {user => <LoadedAboutSettings privateUser={user}/>}
  </WithPrivateUser>
)

const LoadedAboutSettings = (props: {
  privateUser: PrivateUser,
}) => {
  const {} = props

  return <Col className={'custom-link'}>
    {IS_VERCEL && <WebBuildInfo/>}
    {Capacitor.isNativePlatform() && <AndroidInfo/>}
    <BackendInfo/>
    <RuntimeInfo/>
  </Col>
}

const WebBuildInfo = () => {
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV
  const msg = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE
  const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
  const deploymentId = process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID
  const url = `${githubRepo}/commit/${sha}`
  return <Col>
    <h3>Web build (Vercel)</h3>
    <p>Commit SHA: <CustomLink href={url}>{sha}</CustomLink></p>
    <p>Commit message: {msg}</p>
    <p>Vercel deployment ID: {deploymentId}</p>
    <p>Environment: {env}</p>
  </Col>
}

const AndroidInfo = () => {
  const liveUpdateInfo = {
    commitSha: process.env.CAPAWESOME_BUILD_GIT_COMMIT_SHA || 'N/A',
    commitMessage: process.env.CAPAWESOME_BUILD_GIT_COMMIT_MESSAGE || 'N/A',
    gitRef: process.env.CAPAWESOME_BUILD_GIT_REF || 'N/A',
  };
  console.log(`Current Commit SHA: ${liveUpdateInfo.commitSha}`);
  const [liveUpdateBundleId, setLiveUpdateBundleId] = useState<string | null>(null)
  const [androidAppVersion, setAndroidAppVersion] = useState<string | null>(null)
  const [androidBuildNumber, setAndroidBuildNumber] = useState<string | null>(null)
  useEffect(() => {
    const load = async () => {
      const liveUpdateBundle = await LiveUpdate.getCurrentBundle()
      console.log('liveUpdateBundle', liveUpdateBundle)
      setLiveUpdateBundleId(liveUpdateBundle.bundleId)
      alert(liveUpdateBundle)

      const info = await App.getInfo()
      setAndroidAppVersion(info.version)
      setAndroidBuildNumber(info.build)
    }
    load()
  }, [])
  return <Col>
    <h3>Android (Capacitor / Capawesome)</h3>
    <p>App version (Android): {androidAppVersion}</p>
    <p>Native build number (Android): {androidBuildNumber}</p>
    <p>Live update build ID (Capawesome): {liveUpdateBundleId}</p>
    <p>Live update commit
      (Capawesome): {liveUpdateInfo.commitSha}, {liveUpdateInfo.commitMessage}, {liveUpdateInfo.gitRef}</p>
    <p>Env: {JSON.stringify(Object.fromEntries(Object.entries(process.env).sort()), null, 2)}</p>
  </Col>
}

const BackendInfo = () => {
  const [info, setInfo] = useState<any>({})
  useEffect(() => {
    api('health').then(setInfo)
  }, [])
  console.log('Backend info', info)
  const gitInfo = info.git || {}
  const sha = gitInfo.revision
  const commitDate = gitInfo.commitDate
  const commitMessage = gitInfo.message
  const url = `${githubRepo}/commit/${sha}`
  return <Col>
    <h3>Backend</h3>
    <p>API version: {info.version}</p>
    {sha && <p>API commit SHA: <CustomLink href={url}>{sha}</CustomLink></p>}
    {commitMessage && <p>API commit message: {commitMessage}</p>}
    {commitDate && <p>API commit date: {commitDate}</p>}
  </Col>
}

const RuntimeInfo = () => {
  return <Col>
    <h3>Runtime</h3>
    <p>Platform: {IS_VERCEL ? 'Web' : Capacitor.isNativePlatform() ? 'Android' : HOSTING_ENV}</p>
  </Col>
}
